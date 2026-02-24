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

    const client = await pool.connect();
    try {
      // For TUTOR role, check the tutors table
      // For STUDENT_PARENT role, we accept any phone (Sprint 1 demo mode)
      if (role === 'TUTOR') {
        const result = await client.query('SELECT id FROM tutors WHERE phone = $1', [phone]);
        if (result.rows.length === 0) {
          return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
      }
      // STUDENT_PARENT: In Sprint 1, we allow any phone number (demo mode)
      // In production, this would check a students/parents table

      // --- OTP Generation and Sending ---
      // In a real application, you would generate a random code, store it with an expiry,
      // and use an SMS gateway (e.g., Twilio) to send it.
      const mockOtp = '123456';
      console.log(`[DEV ONLY] OTP for ${phone} (role: ${role || 'TUTOR'}): ${mockOtp}`);
      // ------------------------------------

      return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('OTP Send Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
