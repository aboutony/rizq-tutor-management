import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isRequestAllowed } from '@/lib/rate-limiter';

const MAX_OTP_REQUESTS_PER_MINUTE = 5;

export async function POST(request: Request) {
  try {
    const { phone, role } = await request.json();

    if (!phone) {
      return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
    }

    // --- Rate Limiting Check ---
    if (!isRequestAllowed(phone, MAX_OTP_REQUESTS_PER_MINUTE)) {
      return NextResponse.json({ message: 'Too Many Requests' }, { status: 429 });
    }
    // -------------------------

    // For TUTOR role, check the tutors table
    if (role === 'TUTOR') {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query('SELECT id FROM tutors WHERE phone = $1', [phone]);
          if (result.rows.length === 0) {
            // Auto-create new tutor (sign-up flow)
            const slug = 'tutor-' + phone.replace(/\D/g, '').slice(-6) + '-' + Date.now().toString(36);
            await client.query(
              'INSERT INTO tutors (phone, name, slug) VALUES ($1, $2, $3)',
              [phone, 'New Tutor', slug]
            );
            console.log(`[OTP Send] Created new tutor for ${phone}`);
          }
        } finally {
          client.release();
        }
      } catch (dbError: unknown) {
        const errMsg = dbError instanceof Error ? dbError.message : String(dbError);
        console.error('[OTP Send] Database connection failed:', errMsg);
        return NextResponse.json(
          { message: `Database error: ${errMsg}` },
          { status: 503 }
        );
      }
    }
    // STUDENT_PARENT: In Sprint 1, we allow any phone number (demo mode)
    // No database required for this flow

    // --- OTP Generation and Sending ---
    // In a real application, you would generate a random code, store it with an expiry,
    // and use an SMS gateway (e.g., Twilio) to send it.
    const mockOtp = '123456';
    console.log(`[DEV ONLY] OTP for ${phone} (role: ${role || 'TUTOR'}): ${mockOtp}`);
    // ------------------------------------

    return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('OTP Send Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

