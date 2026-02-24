import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const locales = ['en', 'ar', 'fr'];
const defaultLocale = 'en';

// next-intl middleware for locale detection and routing
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
  localePrefix: 'always',
});

// Paths that require authentication (checked after locale prefix is stripped)
const PROTECTED_PATH_PREFIXES = ['/dashboard', '/tutor'];

// Paths that are public (no auth required)
const PUBLIC_PATHS = ['/auth/login', '/auth/verify', '/'];

function getPathnameWithoutLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.substring(locale.length + 1);
    }
    if (pathname === `/${locale}`) {
      return '/';
    }
  }
  return pathname;
}

function getLocaleFromPathname(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return defaultLocale;
}

/**
 * Computes the role-appropriate home dashboard URL for a given role and locale.
 */
function getRoleHomeUrl(role: string, locale: string): string {
  return role === 'TUTOR'
    ? `/${locale}/dashboard/tutor`
    : `/${locale}/dashboard/student`;
}

/**
 * Applies security headers to dashboard responses:
 * - Cache-Control: no-store → prevents browser from caching protected pages
 * - x-rizq-role → injects the user's role for client-side verification
 * - x-rizq-user-id → injects the user ID for audit trails
 */
function applySecurityHeaders(
  response: NextResponse,
  userRole: string,
  userId: string
): NextResponse {
  // Prevent browser from caching any dashboard page (back-button cache attack)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // Inject role for client-side RouteGuard verification
  response.headers.set('x-rizq-role', userRole);
  response.headers.set('x-rizq-user-id', userId);

  // Prevent embedding in iframes (clickjacking protection)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Skip API routes entirely ──
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // ── Skip static assets and Next.js internals ──
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // ── Skip the root landing page — it handles its own rendering ──
  if (pathname === '/') {
    return NextResponse.next();
  }

  // ── Apply next-intl locale routing first ──
  const intlResponse = intlMiddleware(request);

  // After intl routing, determine the effective locale and path
  const effectiveLocale = getLocaleFromPathname(
    intlResponse.headers.get('x-middleware-rewrite')
      ? new URL(intlResponse.headers.get('x-middleware-rewrite')!, request.url).pathname
      : pathname
  );
  const pathWithoutLocale = getPathnameWithoutLocale(pathname);

  // ── Public paths → allow through ──
  const isProtectedPath = PROTECTED_PATH_PREFIXES.some((prefix) =>
    pathWithoutLocale.startsWith(prefix)
  );

  if (!isProtectedPath) {
    return intlResponse;
  }

  // ── Authentication check for protected routes ──
  const sessionCookie = request.cookies.get('rizq_session');
  const locale = request.cookies.get('NEXT_LOCALE')?.value || effectiveLocale;

  if (!sessionCookie) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    const response = NextResponse.redirect(loginUrl);
    // Clear any stale session artifacts
    response.cookies.delete('rizq_session');
    return response;
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'default-secret-key-for-dev'
    );
    const { payload } = await jose.jwtVerify(sessionCookie.value, secret);

    const userRole = (payload.role as string) || 'TUTOR';
    const userId = (payload.userId as string) || (payload.tutorId as string) || 'unknown';
    const homeUrl = getRoleHomeUrl(userRole, locale);

    // ── RBAC Route Guarding: /dashboard/* ──
    if (pathWithoutLocale.startsWith('/dashboard')) {
      const isTutorRoute = pathWithoutLocale.startsWith('/dashboard/tutor');
      const isStudentRoute = pathWithoutLocale.startsWith('/dashboard/student');

      let isAllowed = false;

      if (userRole === 'TUTOR') {
        isAllowed = isTutorRoute;
      } else if (userRole === 'STUDENT_PARENT') {
        isAllowed = isStudentRoute;
      }

      if (!isAllowed && (isTutorRoute || isStudentRoute)) {
        // ── ACCESS VIOLATION: log, redirect, and prevent caching ──
        console.warn(
          JSON.stringify({
            level: 'SECURITY',
            event: 'ACCESS_VIOLATION',
            userId,
            role: userRole,
            attemptedPath: pathname,
            redirectedTo: homeUrl,
            timestamp: new Date().toISOString(),
            source: 'middleware',
          })
        );

        const response = NextResponse.redirect(new URL(homeUrl, request.url));
        applySecurityHeaders(response, userRole, userId);
        return response;
      }

      // If path is /dashboard without /tutor or /student suffix, redirect to home
      if (pathWithoutLocale === '/dashboard' || pathWithoutLocale === '/dashboard/') {
        return NextResponse.redirect(new URL(homeUrl, request.url));
      }

      // ── Allowed dashboard access: apply security headers ──
      applySecurityHeaders(intlResponse, userRole, userId);
    }

    // ── RBAC Route Guarding: Legacy /tutor/* routes ──
    // These routes are TUTOR-only. Non-tutors get hard-redirected to their home.
    if (pathWithoutLocale.startsWith('/tutor')) {
      if (userRole !== 'TUTOR') {
        console.warn(
          JSON.stringify({
            level: 'SECURITY',
            event: 'LEGACY_ROUTE_VIOLATION',
            userId,
            role: userRole,
            attemptedPath: pathname,
            redirectedTo: homeUrl,
            timestamp: new Date().toISOString(),
            source: 'middleware',
          })
        );

        const response = NextResponse.redirect(new URL(homeUrl, request.url));
        applySecurityHeaders(response, userRole, userId);
        return response;
      }

      // Allowed: apply security headers to legacy tutor routes
      applySecurityHeaders(intlResponse, userRole, userId);
    }

    return intlResponse;
  } catch (err) {
    // Token is invalid — clear cookie and redirect to login
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('rizq_session');
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
