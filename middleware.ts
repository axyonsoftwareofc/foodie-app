// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const RESERVED_SUBDOMAINS = ['www', 'app', 'admin', 'api', 'mail', 'foodie']

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

    const isDashboardRoute =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/admin')

    if (isDashboardRoute && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/sign-in'
        url.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(url)
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