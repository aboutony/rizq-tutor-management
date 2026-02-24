import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import type { UserRole } from '@/lib/rbac';

export async function POST(request: Request) {
  try {
    const { phone, code, role, locale } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ message: 'Phone and code are required' }, { status: 400 });
    }

    // --- OTP Verification ---
    // In a real application, you would check the code against the one stored in your DB/cache.
    const MOCK_OTP = '123456';
    if (code !== MOCK_OTP) {
      return NextResponse.json({ message: 'Invalid OTP' }, { status: 401 });
    }
    // ----------------------

    const userRole: UserRole = role === 'STUDENT_PARENT' ? 'STUDENT_PARENT' : 'TUTOR';
    const userLocale = locale || 'en';

    let userId: string;

    if (userRole === 'TUTOR') {
      // TUTOR: requires database lookup
      try {
        const client = await pool.connect();
        try {
          const result = await client.query('SELECT id FROM tutors WHERE phone = $1', [phone]);
          if (result.rows.length === 0) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
          }
          userId = result.rows[0].id;
        } finally {
          client.release();
        }
      } catch (dbError) {
        console.error('[OTP Verify] Database connection failed:', dbError);
        return NextResponse.json(
          { message: 'Database connection failed. Please check environment configuration.' },
          { status: 503 }
        );
      }
    } else {
      // STUDENT_PARENT: Sprint 1 demo mode — generate a deterministic demo ID
      // No database required
      userId = `student_${phone.replace(/\D/g, '').slice(-8)}`;
    }

    // --- Create Session Token (JWT) with role + locale ---
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'default-secret-key-for-dev'
    );
    const alg = 'HS256';

    const token = await new jose.SignJWT({
      userId,
      tutorId: userRole === 'TUTOR' ? userId : undefined, // Legacy compat
      role: userRole,
      locale: userLocale,
    })
      .setProtectedHeader({ alg })
      .setExpirationTime('24h')
      .setIssuedAt()
      .sign(secret);

    // Set secure encrypted session cookie
    cookies().set('rizq_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Save locale preference cookie
    cookies().set('NEXT_LOCALE', userLocale, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return NextResponse.json(
      {
        message: 'Login successful',
        role: userRole,
        locale: userLocale,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP Verify Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

