import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getTutorIdFromSession } from '@/lib/session';

/**
 * Safely execute a DELETE query inside a transaction.
 * Uses PostgreSQL SAVEPOINT to recover if the table doesn't exist,
 * keeping the surrounding transaction alive.
 */
async function safeDelete(client: any, sql: string, params: any[], label: string) {
    try {
        await client.query(`SAVEPOINT ${label}`);
        await client.query(sql, params);
        await client.query(`RELEASE SAVEPOINT ${label}`);
    } catch (err: unknown) {
        // Roll back to savepoint — this keeps the transaction alive
        await client.query(`ROLLBACK TO SAVEPOINT ${label}`);
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[Delete] ${label} skipped: ${msg}`);
    }
}

/**
 * DELETE /api/tutor/account
 * Permanently deletes all data associated with the tutor and clears session.
 */
export async function DELETE() {
    const tutorId = await getTutorIdFromSession();
    if (!tutorId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Cascade wipe — children first, parent last.
        // Each uses a SAVEPOINT so a missing table won't kill the transaction.
        await safeDelete(client,
            'DELETE FROM tutor_service_areas WHERE tutor_id = $1',
            [tutorId], 'sp_service_areas');

        await safeDelete(client,
            'DELETE FROM tutor_rating_summary WHERE tutor_id = $1',
            [tutorId], 'sp_rating_summary');

        await safeDelete(client,
            'DELETE FROM ratings WHERE tutor_id = $1',
            [tutorId], 'sp_ratings');

        await safeDelete(client,
            'DELETE FROM link_tokens WHERE lesson_id IN (SELECT id FROM lessons WHERE tutor_id = $1)',
            [tutorId], 'sp_link_tokens');

        await safeDelete(client,
            'DELETE FROM reschedule_requests WHERE lesson_id IN (SELECT id FROM lessons WHERE tutor_id = $1)',
            [tutorId], 'sp_reschedule');

        await safeDelete(client,
            'DELETE FROM lessons WHERE tutor_id = $1',
            [tutorId], 'sp_lessons');

        await safeDelete(client,
            'DELETE FROM lesson_pricing WHERE lesson_type_id IN (SELECT id FROM lesson_types WHERE tutor_id = $1)',
            [tutorId], 'sp_pricing');

        await safeDelete(client,
            'DELETE FROM lesson_types WHERE tutor_id = $1',
            [tutorId], 'sp_lesson_types');

        await safeDelete(client,
            'DELETE FROM tutor_availability WHERE tutor_id = $1',
            [tutorId], 'sp_availability');

        await safeDelete(client,
            'DELETE FROM tutor_profiles WHERE tutor_id = $1',
            [tutorId], 'sp_profiles');

        // Final: delete the tutor record itself
        await safeDelete(client,
            'DELETE FROM tutors WHERE id = $1',
            [tutorId], 'sp_tutors');

        await client.query('COMMIT');

        // Clear cookies
        const response = NextResponse.json({ success: true, message: 'Account deleted' });
        response.cookies.set('rizq_session', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });
        response.cookies.set('NEXT_LOCALE', '', { path: '/', maxAge: 0 });
        return response;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[Delete Account] Fatal error:', error);
        return NextResponse.json(
            { message: 'Failed to delete account' },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}
