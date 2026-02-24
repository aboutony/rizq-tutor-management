import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getTutorIdFromSession } from '@/lib/session';

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

        // Delete in dependency order (children first)
        await client.query('DELETE FROM tutor_service_areas WHERE tutor_id = $1', [tutorId]);
        await client.query('DELETE FROM tutor_rating_summary WHERE tutor_id = $1', [tutorId]);

        // Delete ratings linked to this tutor
        await client.query('DELETE FROM ratings WHERE tutor_id = $1', [tutorId]);

        // Delete link_tokens for lessons owned by this tutor
        await client.query(
            'DELETE FROM link_tokens WHERE lesson_id IN (SELECT id FROM lessons WHERE tutor_id = $1)',
            [tutorId]
        );

        // Delete reschedule_requests for lessons owned by this tutor
        await client.query(
            'DELETE FROM reschedule_requests WHERE lesson_id IN (SELECT id FROM lessons WHERE tutor_id = $1)',
            [tutorId]
        );

        // Delete lessons
        await client.query('DELETE FROM lessons WHERE tutor_id = $1', [tutorId]);

        // Delete pricing (depends on lesson_types)
        await client.query(
            'DELETE FROM lesson_pricing WHERE lesson_type_id IN (SELECT id FROM lesson_types WHERE tutor_id = $1)',
            [tutorId]
        );

        // Delete lesson_types
        await client.query('DELETE FROM lesson_types WHERE tutor_id = $1', [tutorId]);

        // Delete availability
        await client.query('DELETE FROM tutor_availability WHERE tutor_id = $1', [tutorId]);

        // Delete profile
        await client.query('DELETE FROM tutor_profiles WHERE tutor_id = $1', [tutorId]);

        // Delete tutor record
        await client.query('DELETE FROM tutors WHERE id = $1', [tutorId]);

        await client.query('COMMIT');

        // Clear session cookies
        const response = NextResponse.json({ success: true, message: 'Account deleted' });
        response.cookies.set('rizq_session', '', { path: '/', maxAge: 0 });
        response.cookies.set('NEXT_LOCALE', '', { path: '/', maxAge: 0 });
        return response;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[Delete Account] Error:', error);
        return NextResponse.json({ message: 'Failed to delete account' }, { status: 500 });
    } finally {
        client.release();
    }
}
