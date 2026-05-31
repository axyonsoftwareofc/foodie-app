// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const RESERVED_SUBDOMAINS = ['www', 'app', 'admin', 'api', 'mail', 'foodie'];

/** Roles ordenados por permissão (maior → menor). */
const ROLE_HIERARCHY = ['ADMIN', 'GERENCIADOR', 'EQUIPE', 'CLIENTE'] as const;
type UserRole = (typeof ROLE_HIERARCHY)[number];

/** Nome do cookie que cacheia a role do usuario (evita query ao banco em todo request). */
const ROLE_COOKIE_NAME = 'foodie-role';
const ROLE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

function getCookieSecret(): string {
  const secret = process.env.COOKIE_SIGNING_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('COOKIE_SIGNING_SECRET environment variable is required in production');
  }
  return 'foodie-cookie-secret-dev';
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
  const key = await getSigningKey();
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return `${value}.${bufferToHex(signature)}`;
}

async function verifyCookieValue(signed: string): Promise<string | null> {
  const dotIndex = signed.lastIndexOf('.');
  if (dotIndex === -1) return null;
  const value = signed.substring(0, dotIndex);
  const expected = await signCookieValue(value);
  if (signed !== expected) return null;
  return value;
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
      secure: process.env.NODE_ENV === 'production',
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
  const hostname = request.headers.get('host') || '';
  const subdomain = extractSubdomain(hostname, request);

  if (subdomain) {
    const url = request.nextUrl.clone();
    url.pathname = `/r/${subdomain}`;
    url.searchParams.delete('_subdomain');
    return NextResponse.rewrite(url);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

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

  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isDriverRoute = pathname.startsWith('/driver');

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

  // Driver routes: require at least CLIENTE (authenticated)
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

  // Se o usuario nao esta logado mas o cookie de role existe, limpa-o
  if (!user && (await getCachedRole(request))) {
    clearRoleCookie(supabaseResponse);
  }

  const protectedRoutes = ['/profile', '/orders', '/addresses', '/cart', '/favorites', '/checkout'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  const isAuthRoute = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

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
