
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashToken } from '@/lib/tokens';
import { z } from 'zod';
import { isRequestAllowed } from '@/lib/rate-limiter';

const MAX_RATING_ATTEMPTS_PER_MINUTE = 3;

const ratingSchema = z.object({
    token: z.string().min(1),
    stars: z.number().int().min(1).max(5),
    comment: z.string().max(140).optional(),
});

export async function POST(
    request: Request,
    { params }: { params: { lessonId: string } }
) {
    const { lessonId } = params;
    try {
        // --- Rate Limiting Check (by lessonId to prevent spam) ---
        if (!isRequestAllowed(lessonId, MAX_RATING_ATTEMPTS_PER_MINUTE)) {
            return NextResponse.json({ message: 'Too Many Requests' }, { status: 429 });
        }
        // ---------------------------------------------------------

        const body = await request.json();
        const validation = ratingSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
        }
        
        const { token, stars, comment } = validation.data;
        const tokenHash = hashToken(token);
        
        const client = await pool.connect();
        try {
            // Find the token and associated lesson details
            const tokenRes = await client.query(
                `SELECT l.tutor_id FROM link_tokens ltok
                 JOIN lessons l ON ltok.lesson_id = l.id
                 WHERE ltok.token_hash = $1
                   AND ltok.purpose = 'rate'
                   AND l.id = $2
                   AND ltok.expires_at > NOW()
                   AND ltok.used_at IS NULL
                   AND l.status = 'completed'`,
                [tokenHash, lessonId]
            );

            if (tokenRes.rows.length === 0) {
                return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
            }
            const { tutor_id } = tokenRes.rows[0];

            await client.query('BEGIN');
            
            // 1. Insert the new rating
            await client.query(
                `INSERT INTO ratings (lesson_id, tutor_id, stars, comment) VALUES ($1, $2, $3, $4)`,
                [lessonId, tutor_id, stars, comment]
            );
            
            // 2. Invalidate the token
            await client.query(`UPDATE link_tokens SET used_at = NOW() WHERE token_hash = $1 AND purpose = 'rate'`, [tokenHash]);

            // 3. Recalculate and update the summary
            const summaryRes = await client.query(
                `SELECT AVG(stars) as avg_stars, COUNT(id) as rating_count FROM ratings WHERE tutor_id = $1`,
                [tutor_id]
            );
            const { avg_stars, rating_count } = summaryRes.rows[0];

            await client.query(
                `UPDATE tutor_rating_summary SET avg_stars = $1, rating_count = $2 WHERE tutor_id = $3`,
                [avg_stars, rating_count, tutor_id]
            );
            
            await client.query('COMMIT');

            return NextResponse.json({ message: 'Rating submitted successfully' }, { status: 200 });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Submit Rating Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
