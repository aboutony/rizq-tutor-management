
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';
import { isRequestAllowed } from '@/lib/rate-limiter';

const MAX_REQUESTS_PER_MINUTE = 10;

const requestSchema = z.object({
  tutorId: z.string().uuid(),
  studentName: z.string().min(1, 'Student name is required'),
  lessonTypeId: z.string().uuid(),
  duration: z.number().int().positive(),
  requestedStartAt: z.string().datetime(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.issues }, { status: 400 });
    }

    const { tutorId, studentName, lessonTypeId, duration, requestedStartAt } = validation.data;

    // --- Rate Limiting Check (by tutorId to prevent spamming a single tutor) ---
    if (!isRequestAllowed(tutorId, MAX_REQUESTS_PER_MINUTE)) {
      return NextResponse.json({ message: 'Too Many Requests' }, { status: 429 });
    }
    // --------------------------------------------------------------------------

    const client = await pool.connect();
    try {
      // Security: Verify the price exists for the given tutor, lesson type, and duration
      const priceCheck = await client.query(
        `SELECT lp.price_amount FROM lesson_pricing lp
             JOIN lesson_types lt ON lp.lesson_type_id = lt.id
             WHERE lp.lesson_type_id = $1 AND lp.duration_minutes = $2 AND lt.tutor_id = $3 AND lp.active = true`,
        [lessonTypeId, duration, tutorId]
      );

      if (priceCheck.rows.length === 0) {
        return NextResponse.json({ message: 'Invalid lesson or pricing details provided.' }, { status: 400 });
      }
      const priceAmount = priceCheck.rows[0].price_amount;

      await client.query('BEGIN');

      // Insert into lessons table
      const newLesson = await client.query(
        `INSERT INTO lessons (tutor_id, lesson_type_id, student_name, duration_minutes, price_amount, requested_start_at_utc, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'requested') RETURNING id`,
        [tutorId, lessonTypeId, studentName, duration, priceAmount, requestedStartAt]
      );
      const lessonId = newLesson.rows[0].id;

      // Insert into lesson_payments table
      await client.query(
        `INSERT INTO lesson_payments (lesson_id, payment_status) VALUES ($1, 'unpaid')`,
        [lessonId]
      );

      await client.query('COMMIT');

      return NextResponse.json({ message: 'Lesson requested successfully' }, { status: 201 });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Lesson Request Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
