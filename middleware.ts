// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const RESERVED_SUBDOMAINS = ['www', 'app', 'admin', 'api', 'mail', 'foodie']

/** Roles ordenados por permissão (maior → menor). */
const ROLE_HIERARCHY = ['ADMIN', 'GERENCIADOR', 'EQUIPE', 'CLIENTE'] as const
type UserRole = typeof ROLE_HIERARCHY[number]

/** Retorna true se userRole tiver permissão mínima necessária. */
function hasMinimumRole(userRole: string | null | undefined, minimumRole: UserRole): boolean {
    if (!userRole) return false
    const userIndex = ROLE_HIERARCHY.indexOf(userRole as UserRole)
    const minIndex = ROLE_HIERARCHY.indexOf(minimumRole)
    return userIndex !== -1 && userIndex <= minIndex
}

/** Busca o role do usuário na tabela profiles via Supabase. */
async function fetchUserRole(supabase: ReturnType<typeof createServerClient>): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    return profile?.role ?? null
}

function extractSubdomain(hostname: string, request: NextRequest): string | null {
    const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'foodie.app'

    if (hostname === APP_DOMAIN || hostname.startsWith('www.')) {
        return null
    }

    if (hostname.endsWith('.' + APP_DOMAIN)) {
        const subdomain = hostname.replace('.' + APP_DOMAIN, '')
        if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain)) {
            return subdomain
        }
    }

    if (process.env.NODE_ENV === 'development' && hostname.includes('localhost')) {
        const testSubdomain = request.nextUrl.searchParams.get('_subdomain')
        if (testSubdomain) {
            return testSubdomain
        }
    }

    return null
}

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || ''
    const subdomain = extractSubdomain(hostname, request)

    if (subdomain) {
        const url = request.nextUrl.clone()
        url.pathname = `/r/${subdomain}`
        url.searchParams.delete('_subdomain')
        return NextResponse.rewrite(url)
    }

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    const isAdminRoute = pathname.startsWith('/admin')
    const isDashboardRoute = pathname.startsWith('/dashboard')
    const isDriverRoute = pathname.startsWith('/driver')

    // Admin routes: require ADMIN or GERENCIADOR
    if (isAdminRoute) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/sign-in'
            url.searchParams.set('redirectTo', pathname)
            return NextResponse.redirect(url)
        }
        const role = await fetchUserRole(supabase)
        if (!hasMinimumRole(role, 'GERENCIADOR')) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }
    }

    // Dashboard routes: require ADMIN, GERENCIADOR or EQUIPE
    if (isDashboardRoute) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/sign-in'
            url.searchParams.set('redirectTo', pathname)
            return NextResponse.redirect(url)
        }
        const role = await fetchUserRole(supabase)
        if (!hasMinimumRole(role, 'EQUIPE')) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }
    }

    // Driver routes: require at least CLIENTE (authenticated)
    if (isDriverRoute) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/sign-in'
            url.searchParams.set('redirectTo', pathname)
            return NextResponse.redirect(url)
        }
        // Optional: restrict driver routes to EQUIPE+ roles
        const role = await fetchUserRole(supabase)
        if (!hasMinimumRole(role, 'EQUIPE')) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }
    }

    const protectedRoutes = [
        '/profile',
        '/orders',
        '/addresses',
        '/cart',
        '/favorites',
        '/checkout',
    ]
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname.startsWith(route)
    )

    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/sign-in'
        url.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(url)
    }

    const isAuthRoute =
        pathname.startsWith('/sign-in') ||
        pathname.startsWith('/sign-up')

    if (isAuthRoute && user) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!api|auth/callback|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|css)$).*)',
    ],
}