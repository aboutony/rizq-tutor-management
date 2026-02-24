
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashToken } from '@/lib/tokens';
import { z } from 'zod';

const rescheduleSchema = z.object({
    token: z.string().min(1),
    proposedTime: z.string().datetime(),
});

export async function POST(
    request: Request,
    { params }: { params: { lessonId: string } }
) {
    const { lessonId } = params;
    try {
        const body = await request.json();
        const validation = rescheduleSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
        }
        
        const { token, proposedTime } = validation.data;
        const tokenHash = hashToken(token);
        
        const client = await pool.connect();
        try {
            // Find the token to authorize the action
            const tokenRes = await client.query(
                `SELECT lesson_id FROM link_tokens
                 WHERE token_hash = $1
                   AND purpose = 'reschedule'
                   AND lesson_id = $2
                   AND expires_at > NOW()
                   AND used_at IS NULL`,
                [tokenHash, lessonId]
            );

            if (tokenRes.rows.length === 0) {
                return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
            }
            
            await client.query('BEGIN');
            
            // 1. Update lesson status to show it's awaiting tutor approval
            await client.query(`UPDATE lessons SET status = 'reschedule_requested' WHERE id = $1 AND status = 'confirmed'`, [lessonId]);
            
            // 2. Log the reschedule request from the parent
            await client.query(
                `INSERT INTO reschedule_requests (lesson_id, requested_by, status, proposed_start_at_utc) VALUES ($1, 'parent', 'pending', $2)`,
                [lessonId, proposedTime]
            );
            
            // 3. Invalidate the token so it can't be used again
            await client.query(`UPDATE link_tokens SET used_at = NOW() WHERE token_hash = $1 AND purpose = 'reschedule'`, [tokenHash]);
            
            await client.query('COMMIT');

            return NextResponse.json({ message: 'Reschedule requested successfully' }, { status: 200 });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Reschedule Lesson Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
