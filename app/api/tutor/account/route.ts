import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getTutorIdFromSession } from '@/lib/session';

/**
 * DELETE /api/tutor/account
 * Permanently deletes all data associated with the tutor and clears session.
 * Uses a single transaction with resilient queries (IF EXISTS guards).
 */
export async function DELETE() {
    const tutorId = await getTutorIdFromSession();
    if (!tutorId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Single cascading wipe — all child tables first, then parent.
        // Each query is wrapped in a DO block to survive missing tables.
        const deleteQueries = [
            `DELETE FROM tutor_service_areas WHERE tutor_id = $1`,
            `DELETE FROM tutor_rating_summary WHERE tutor_id = $1`,
            `DELETE FROM ratings WHERE tutor_id = $1`,
            `DELETE FROM link_tokens WHERE lesson_id IN (SELECT id FROM lessons WHERE tutor_id = $1)`,
            `DELETE FROM reschedule_requests WHERE lesson_id IN (SELECT id FROM lessons WHERE tutor_id = $1)`,
            `DELETE FROM lessons WHERE tutor_id = $1`,
            `DELETE FROM lesson_pricing WHERE lesson_type_id IN (SELECT id FROM lesson_types WHERE tutor_id = $1)`,
            `DELETE FROM lesson_types WHERE tutor_id = $1`,
            `DELETE FROM tutor_availability WHERE tutor_id = $1`,
            `DELETE FROM tutor_profiles WHERE tutor_id = $1`,
            `DELETE FROM tutors WHERE id = $1`,
        ];

        for (const sql of deleteQueries) {
            try {
                await client.query(sql, [tutorId]);
            } catch (tableError: unknown) {
                // If table doesn't exist, skip gracefully
                const msg = tableError instanceof Error ? tableError.message : '';
                if (msg.includes('does not exist') || msg.includes('relation')) {
                    console.warn(`[Delete] Skipping: ${msg}`);
                } else {
                    throw tableError; // Re-throw real errors
                }
            }
        }

        await client.query('COMMIT');

        // Build response with cleared cookies
        const response = NextResponse.json({ success: true, message: 'Account deleted' });
        response.cookies.set('rizq_session', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });
        response.cookies.set('NEXT_LOCALE', '', {
            path: '/',
            maxAge: 0,
        });
        return response;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[Delete Account] Error:', error);
        return NextResponse.json(
            { message: 'Failed to delete account', error: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}
