import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// // Define role-based access control
// const roleBasedRoutes: Record<string, string[]> = {
//     SUPER_ADMIN: ['/dashboard/super-admin'],
//     GEN_ADMIN: ['/dashboard/gen-admin'],
//     ORG_ADMIN: ['/dashboard/org-admin'],
//     THERAPIST: ['/dashboard/therapist'],
//     PATIENT: ['/dashboard/patient'],
// };

// // Public routes that don't require authentication
const publicRoutes = ['/', '/auth/login', '/auth/signup', '/auth/verify', '/auth/forgot-password'];

// // Get user role from token (simplified - in production, verify JWT)
// function getUserRole(request: NextRequest): string | null {
//     const token = request.cookies.get('token')?.value;
//     if (!token) {
//         // Try localStorage (client-side only)
//         return null;
//     }
// 
//     // In a real app, decode and verify JWT here
//     // For now, we'll rely on the role stored in localStorage
//     return null;
// }

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Check if route requires authentication
    const isDashboardRoute = pathname.startsWith('/dashboard');

    if (isDashboardRoute) {
        // Check for token in cookies
        const token = request.cookies.get('token')?.value;

        if (!token) {
            // Redirect to login if no token
            const url = request.nextUrl.clone();
            url.pathname = '/auth/login';
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }

        // In production, verify JWT and extract role
        // For now, we'll let the client-side handle role-based redirects
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
    ],
};
