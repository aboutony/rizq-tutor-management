
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashToken } from '@/lib/tokens';

export async function POST(
    request: Request,
    { params }: { params: { lessonId: string } }
) {
    const { lessonId } = params;
    try {
        const { token } = await request.json();
        if (!token) {
            return NextResponse.json({ message: 'Token is required' }, { status: 400 });
        }
        
        const tokenHash = hashToken(token);
        
        const client = await pool.connect();
        try {
            // Find the token and associated lesson details
            const tokenRes = await client.query(
                `SELECT l.id, l.confirmed_start_at_utc, cp.cutoff_hours
                 FROM link_tokens ltok
                 JOIN lessons l ON ltok.lesson_id = l.id
                 JOIN cancellation_policy cp ON l.tutor_id = cp.tutor_id
                 WHERE ltok.token_hash = $1
                   AND ltok.purpose = 'cancel'
                   AND l.id = $2
                   AND ltok.expires_at > NOW()
                   AND ltok.used_at IS NULL
                   AND l.status = 'confirmed'`,
                [tokenHash, lessonId]
            );

            if (tokenRes.rows.length === 0) {
                return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
            }

            const { confirmed_start_at_utc, cutoff_hours } = tokenRes.rows[0];
            const hoursUntilLesson = (new Date(confirmed_start_at_utc).getTime() - new Date().getTime()) / (1000 * 60 * 60);
            const isLate = hoursUntilLesson < cutoff_hours;
            
            await client.query('BEGIN');
            
            // 1. Update lesson status
            await client.query(`UPDATE lessons SET status = 'canceled' WHERE id = $1`, [lessonId]);
            
            // 2. Log the cancellation
            await client.query(
                `INSERT INTO lesson_cancellations (lesson_id, canceled_by, is_late) VALUES ($1, 'parent', $2)`,
                [lessonId, isLate]
            );
            
            // 3. Invalidate the token
            await client.query(`UPDATE link_tokens SET used_at = NOW() WHERE token_hash = $1 AND purpose = 'cancel'`, [tokenHash]);
            
            await client.query('COMMIT');

            return NextResponse.json({ message: 'Lesson canceled successfully' }, { status: 200 });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Cancel Lesson Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
