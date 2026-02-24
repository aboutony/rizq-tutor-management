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
  studentNote: z.string().max(500).optional(),
  studentDistrict: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.issues }, { status: 400 });
    }

    const { tutorId, studentName, lessonTypeId, duration, requestedStartAt, studentNote, studentDistrict } = validation.data;

    // Rate limiting
    if (!isRequestAllowed(tutorId, MAX_REQUESTS_PER_MINUTE)) {
      return NextResponse.json({ message: 'Too Many Requests' }, { status: 429 });
    }

    const client = await pool.connect();
    try {
      // Verify pricing exists
      const priceCheck = await client.query(
        `SELECT lp.price_amount FROM lesson_pricing lp
         JOIN lesson_types lt ON lp.lesson_type_id = lt.id
         WHERE lp.lesson_type_id = $1 AND lp.duration_minutes = $2 AND lt.tutor_id = $3 AND lp.active = true`,
        [lessonTypeId, duration, tutorId]
      );

      if (priceCheck.rows.length === 0) {
        return NextResponse.json({ message: 'Invalid lesson or pricing details.' }, { status: 400 });
      }
      const priceAmount = priceCheck.rows[0].price_amount;

      // Get lesson type label for notification
      const ltRes = await client.query('SELECT label FROM lesson_types WHERE id = $1', [lessonTypeId]);
      const lessonLabel = ltRes.rows[0]?.label || 'Lesson';

      await client.query('BEGIN');

      // Insert lesson
      const newLesson = await client.query(
        `INSERT INTO lessons (tutor_id, lesson_type_id, student_name, duration_minutes, price_amount, requested_start_at_utc, status, level)
         VALUES ($1, $2, $3, $4, $5, $6, 'requested', $7) RETURNING id`,
        [tutorId, lessonTypeId, studentName, duration, priceAmount, requestedStartAt, studentNote || null]
      );
      const lessonId = newLesson.rows[0].id;

      // Insert payment record
      await client.query(
        `INSERT INTO lesson_payments (lesson_id, payment_status) VALUES ($1, 'unpaid')`,
        [lessonId]
      );

      // Create notification for tutor
      try {
        await client.query('SAVEPOINT sp_notif');
        const startDate = new Date(requestedStartAt);
        const timeStr = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const districtInfo = studentDistrict ? ` · 📍 ${studentDistrict}` : '';

        await client.query(
          `INSERT INTO tutor_notifications (tutor_id, type, title, body, lesson_id)
           VALUES ($1, 'booking_request', $2, $3, $4)`,
          [
            tutorId,
            `📚 New request from ${studentName}`,
            `${lessonLabel} · ${dateStr} at ${timeStr}${districtInfo}`,
            lessonId,
          ]
        );
        await client.query('RELEASE SAVEPOINT sp_notif');
      } catch {
        await client.query('ROLLBACK TO SAVEPOINT sp_notif');
      }

      await client.query('COMMIT');

      return NextResponse.json({ message: 'Lesson requested successfully', lessonId }, { status: 201 });
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
