
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getTutorIdFromSession } from '@/lib/session';
import { generateTokenAndHash } from '@/lib/tokens';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

export async function POST(
  request: Request,
  { params }: { params: { lessonId: string } }
) {
  const tutorId = await getTutorIdFromSession();
  if (!tutorId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { lessonId } = params;
  if (!lessonId) {
    return NextResponse.json({ message: 'Lesson ID is required' }, { status: 400 });
  }

  // FIX: Declare body outside the try block to make it accessible in the catch block.
  let body;
  try {
    body = await request.json();
    const validation = actionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }
    const { action } = validation.data;

    const client = await pool.connect();
    try {
        // Verify tutor owns the lesson and it's in 'requested' state
        const lessonCheck = await client.query(
            `SELECT requested_start_at_utc FROM lessons WHERE id = $1 AND tutor_id = $2 AND status = 'requested'`,
            [lessonId, tutorId]
        );
        if (lessonCheck.rows.length === 0) {
            return NextResponse.json({ message: 'Lesson not found or action not allowed' }, { status: 404 });
        }
        
        await client.query('BEGIN');
        const requestedTime = lessonCheck.rows[0].requested_start_at_utc;

        if (action === 'accept') {
            await client.query(
                `UPDATE lessons SET status = 'confirmed', confirmed_start_at_utc = $1 WHERE id = $2`,
                [requestedTime, lessonId]
            );

            // Generate and store tokens for parent actions
            const cancelToken = generateTokenAndHash();
            const rescheduleToken = generateTokenAndHash();
            
            const expiresAt = requestedTime; // Tokens expire when the lesson is supposed to start

            await client.query(
                `INSERT INTO link_tokens (lesson_id, token_hash, purpose, expires_at) VALUES ($1, $2, 'cancel', $3), ($1, $4, 'reschedule', $3)`,
                [lessonId, cancelToken.hash, expiresAt, rescheduleToken.hash]
            );

            // --- DEV ONLY: Log links to simulate sending them to the parent ---
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            console.log('--- ACTION LINKS (FOR PARENT) ---');
            console.log(`Cancel Link: ${baseUrl}/l/${lessonId}/cancel/${cancelToken.token}`);
            console.log(`Reschedule Link: ${baseUrl}/l/${lessonId}/reschedule/${rescheduleToken.token}`);
            console.log('------------------------------------');
            // -----------------------------------------------------------------

        } else if (action === 'reject') {
            await client.query(
                `UPDATE lessons SET status = 'canceled' WHERE id = $1`,
                [lessonId]
            );
            await client.query(
                `INSERT INTO lesson_cancellations (lesson_id, canceled_by, is_late) VALUES ($1, 'tutor', false)`,
                [lessonId]
            );
        }
        
        await client.query('COMMIT');
        
        return NextResponse.json({ message: `Lesson ${action}ed successfully.` }, { status: 200 });

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
  } catch (error) {
    // FIX: Use a more generic error message that does not depend on the request body, which might be the cause of the error.
    console.error(`Failed to process lesson action:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
