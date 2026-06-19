// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { timingSafeEqual } from 'crypto';

const RESERVED_SUBDOMAINS = ['www', 'app', 'admin', 'api', 'mail', 'foodie'];

/** Roles ordenados por permissão (maior → menor). */
const ROLE_HIERARCHY = ['SUPER_ADMIN', 'ADMIN', 'GERENCIADOR', 'EQUIPE', 'CLIENTE'] as const;
type UserRole = (typeof ROLE_HIERARCHY)[number];

/** Nome do cookie que cacheia a role do usuario (evita query ao banco em todo request). */
const ROLE_COOKIE_NAME = 'foodie-role';
const ROLE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias (maxAge do cookie)
const ROLE_CACHE_MAX_AGE = 60; // 60s — janela de confiança da assinatura HMAC

let redisForRateLimit: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisForRateLimit) return redisForRateLimit;
  const url = process.env.REDIS_URL;
  const token = process.env.REDIS_TOKEN;
  if (!url || !token) return null;
  try {
    redisForRateLimit = new Redis({ url, token });
    return redisForRateLimit;
  } catch {
    return null;
  }
}

async function checkSentryTunnelRateLimit(request: NextRequest): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return true;

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const key = `ratelimit:sentry:${ip}:${Math.floor(Date.now() / 60000)}`;

  try {
    const current = await redis.incr(key);
    if (current === 1) await redis.expire(key, 60);
    return current <= 30;
  } catch {
    return true;
  }
}

function getCookieSecret(): string {
  const secret = process.env.COOKIE_SIGNING_SECRET;
  if (secret) return secret;
  const env = process.env.NODE_ENV as string;
  if (env === 'production' || env === 'staging' || env === 'preview') {
    throw new Error('COOKIE_SIGNING_SECRET environment variable is required in this environment');
  }
  if (env === 'test') return 'foodie-cookie-secret-test';
  return 'foodie-cookie-secret-dev'; // apenas localhost puro
}

async function getSigningKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const secret = getCookieSecret();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function signCookieValue(value: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = `${timestamp}.${value}`;
  const key = await getSigningKey();
  const encoder = new TextEncoder();
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return `${payload}.${bufferToHex(sig)}`;
}

async function verifyCookieValue(signed: string): Promise<string | null> {
  const parts = signed.split('.');
  if (parts.length < 3) return null;

  const hexSig = parts[parts.length - 1];
  const role = parts[parts.length - 2];
  const timestamp = parts.slice(0, parts.length - 2).join('.');

  const payload = `${timestamp}.${role}`;
  const key = await getSigningKey();
  const encoder = new TextEncoder();
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedHex = bufferToHex(sig);

  // Comparação time-safe para evitar timing oracle
  try {
    const expectedBuf = Buffer.from(expectedHex, 'hex');
    const actualBuf = Buffer.from(hexSig, 'hex');
    if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
      return null;
    }
  } catch {
    return null;
  }

  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (age > ROLE_CACHE_MAX_AGE) return null;

  return role;
}

/** Retorna true se userRole tiver permissão mínima necessária. */
function hasMinimumRole(userRole: string | null | undefined, minimumRole: UserRole): boolean {
  if (!userRole) return false;
  const userIndex = ROLE_HIERARCHY.indexOf(userRole as UserRole);
  const minIndex = ROLE_HIERARCHY.indexOf(minimumRole);
  return userIndex !== -1 && userIndex <= minIndex;
}

/** Le a role do cookie de cache. */
async function getCachedRole(request: NextRequest): Promise<string | null> {
  const cookie = request.cookies.get(ROLE_COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifyCookieValue(cookie.value);
}

/** Limpa o cookie de role no response. */
function clearRoleCookie(response: NextResponse): void {
  response.cookies.set(ROLE_COOKIE_NAME, '', {
    maxAge: 0,
    path: '/',
  });
}

/** Busca o role do usuario na tabela profiles via Supabase e cacheia em cookie. */
async function fetchUserRole(
  supabase: ReturnType<typeof createServerClient>,
  response: NextResponse
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    clearRoleCookie(response);
    return null;
  }

  // Prefer role from JWT app_metadata (set by Supabase custom_access_token_hook)
  const jwtRole = (user.app_metadata as Record<string, unknown> | undefined)?.role as
    | string
    | undefined;
  if (jwtRole && ROLE_HIERARCHY.includes(jwtRole as UserRole)) {
    response.cookies.set(ROLE_COOKIE_NAME, await signCookieValue(jwtRole), {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: ROLE_COOKIE_MAX_AGE,
      path: '/',
    });
    return jwtRole;
  }

  // Fallback: query profiles table (for existing sessions before the hook was deployed)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role ?? null;

  if (role) {
    // Cacheia a role em cookie para evitar query futura
    response.cookies.set(ROLE_COOKIE_NAME, await signCookieValue(role), {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: ROLE_COOKIE_MAX_AGE,
      path: '/',
    });
  } else {
    clearRoleCookie(response);
  }

  return role;
}

/** Obtem o role do usuario, priorizando cookie cacheado. */
async function getUserRole(
  request: NextRequest,
  supabase: ReturnType<typeof createServerClient>,
  response: NextResponse
): Promise<string | null> {
  const cachedRole = await getCachedRole(request);
  if (cachedRole && ROLE_HIERARCHY.includes(cachedRole as UserRole)) {
    return cachedRole;
  }
  return fetchUserRole(supabase, response);
}

function extractSubdomain(hostname: string, request: NextRequest): string | null {
  const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'foodie.app';

  if (hostname === APP_DOMAIN || hostname.startsWith('www.')) {
    return null;
  }

  if (hostname.endsWith('.' + APP_DOMAIN)) {
    const subdomain = hostname.replace('.' + APP_DOMAIN, '');
    if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain)) {
      return subdomain;
    }
  }

  if (process.env.NODE_ENV === 'development' && hostname.includes('localhost')) {
    const testSubdomain = request.nextUrl.searchParams.get('_subdomain');
    if (testSubdomain) {
      return testSubdomain;
    }
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/monitoring') {
    const allowed = await checkSentryTunnelRateLimit(request);
    if (!allowed) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }

  const hostname = request.headers.get('host') || '';
  const subdomain = extractSubdomain(hostname, request);

  if (subdomain) {
    const url = request.nextUrl.clone();
    url.pathname = `/r/${subdomain}`;
    url.searchParams.delete('_subdomain');
    return NextResponse.rewrite(url);
  }

  const isAdminRoute = pathname.startsWith('/admin');
  const isSuperAdminRoute = pathname.startsWith('/super-admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isDriverRoute = pathname.startsWith('/driver') && !pathname.startsWith('/driver/login');
  const isWaiterRoute = pathname.startsWith('/waiter') && !pathname.startsWith('/waiter/login');
  const isAuthRoute =
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/driver/login') ||
    pathname.startsWith('/waiter/login');
  const protectedRoutes = ['/profile', '/orders', '/addresses', '/cart', '/favorites', '/checkout'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  const needsAuth =
    isAdminRoute ||
    isSuperAdminRoute ||
    isDashboardRoute ||
    isDriverRoute ||
    isWaiterRoute ||
    isProtectedRoute ||
    isAuthRoute;

  if (!needsAuth) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Super Admin routes: require SUPER_ADMIN
  if (isSuperAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/sign-in';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
    const role = await getUserRole(request, supabase, supabaseResponse);
    if (!hasMinimumRole(role, 'SUPER_ADMIN')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // Admin routes: require ADMIN or GERENCIADOR
  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/sign-in';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
    const role = await getUserRole(request, supabase, supabaseResponse);
    if (!hasMinimumRole(role, 'GERENCIADOR')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // Dashboard routes: require ADMIN, GERENCIADOR or EQUIPE
  if (isDashboardRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/sign-in';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
    const role = await getUserRole(request, supabase, supabaseResponse);
    if (!hasMinimumRole(role, 'EQUIPE')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // Driver routes: require at least EQUIPE (staff)
  if (isDriverRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/sign-in';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
    const role = await getUserRole(request, supabase, supabaseResponse);
    if (!hasMinimumRole(role, 'EQUIPE')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // Waiter routes: require at least EQUIPE
  if (isWaiterRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/sign-in';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
    const role = await getUserRole(request, supabase, supabaseResponse);
    if (!hasMinimumRole(role, 'EQUIPE')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // Se o usuario nao esta logado mas o cookie de role existe, limpa-o
  if (!user && (await getCachedRole(request))) {
    clearRoleCookie(supabaseResponse);
  }

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|auth/callback|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|css)$).*)',
  ],
};
