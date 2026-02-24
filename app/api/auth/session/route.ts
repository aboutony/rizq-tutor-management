import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

/**
 * GET /api/auth/session
 * Returns the current user's session info for client-side role verification.
 * This is the real-time check endpoint that the RouteGuard polls on every navigation.
 */
export async function GET(request: NextRequest) {
    const sessionCookie = request.cookies.get('rizq_session');

    if (!sessionCookie) {
        return NextResponse.json(
            { authenticated: false, role: null, userId: null, locale: null },
            { status: 401 }
        );
    }

    try {
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || 'default-secret-key-for-dev'
        );
        const { payload } = await jose.jwtVerify(sessionCookie.value, secret);

        const userId = (payload.userId as string) || (payload.tutorId as string) || null;
        const role = (payload.role as string) || 'TUTOR';
        const locale = (payload.locale as string) || 'en';

        return NextResponse.json(
            {
                authenticated: true,
                role,
                userId,
                locale,
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                    'Pragma': 'no-cache',
                },
            }
        );
    } catch {
        return NextResponse.json(
            { authenticated: false, role: null, userId: null, locale: null },
            { status: 401 }
        );
    }
}
