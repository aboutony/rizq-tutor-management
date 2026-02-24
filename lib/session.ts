import { cookies } from 'next/headers';
import * as jose from 'jose';
import type { UserRole } from './rbac';

export interface SessionPayload {
  userId: string;
  role: UserRole;
  locale: string;
}

/**
 * Extracts and verifies the session from the rizq_session cookie.
 * Returns the decoded payload or null if invalid/missing.
 */
export async function getSessionFromCookie(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('rizq_session')?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'default-secret-key-for-dev'
    );
    const { payload } = await jose.jwtVerify(token, secret);

    // Support both legacy (tutorId) and new (userId + role) claims
    const userId =
      (payload.userId as string) || (payload.tutorId as string) || null;
    const role = (payload.role as UserRole) || 'TUTOR';
    const locale = (payload.locale as string) || 'en';

    if (!userId) {
      return null;
    }

    return { userId, role, locale };
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return null;
  }
}

/**
 * Legacy helper — returns tutorId for backward compatibility.
 */
export async function getTutorIdFromSession(): Promise<string | null> {
  const session = await getSessionFromCookie();
  if (!session || session.role !== 'TUTOR') {
    return null;
  }
  return session.userId;
}
