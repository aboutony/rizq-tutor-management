
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getTutorIdFromSession } from '@/lib/session';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum(['approve', 'decline']),
});

export async function POST(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  const tutorId = await getTutorIdFromSession();
  if (!tutorId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { requestId } = params;

  try {
    const body = await request.json();
    const validation = actionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }
    const { action } = validation.data;

    const client = await pool.connect();
    try {
        // Verify the tutor owns this reschedule request and it is pending
        const reqCheck = await client.query(
            `SELECT rr.lesson_id, rr.proposed_start_at_utc
             FROM reschedule_requests rr
             JOIN lessons l ON rr.lesson_id = l.id
             WHERE rr.id = $1 AND l.tutor_id = $2 AND rr.status = 'pending'`,
            [requestId, tutorId]
        );

        if (reqCheck.rows.length === 0) {
            return NextResponse.json({ message: 'Request not found or action not allowed' }, { status: 404 });
        }
        
        const { lesson_id, proposed_start_at_utc } = reqCheck.rows[0];

        await client.query('BEGIN');

        if (action === 'approve') {
            await client.query(`UPDATE reschedule_requests SET status = 'approved' WHERE id = $1`, [requestId]);
            await client.query(
                `UPDATE lessons SET status = 'confirmed', confirmed_start_at_utc = $1 WHERE id = $2`,
                [proposed_start_at_utc, lesson_id]
            );
        } else if (action === 'decline') {
            await client.query(`UPDATE reschedule_requests SET status = 'declined' WHERE id = $1`, [requestId]);
            // Revert lesson status back to confirmed with original time
            await client.query(`UPDATE lessons SET status = 'confirmed' WHERE id = $1`, [lesson_id]);
        }
        
        await client.query('COMMIT');
        
        return NextResponse.json({ message: `Request ${action}d successfully.` }, { status: 200 });
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
  } catch (error) {
    console.error('Failed to process reschedule request:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
