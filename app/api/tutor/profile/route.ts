import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getTutorIdFromSession } from '@/lib/session';

/**
 * GET /api/tutor/profile
 * Returns the tutor's name, bio, and expertise (lesson_types).
 */
export async function GET() {
    const tutorId = await getTutorIdFromSession();
    if (!tutorId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await pool.connect();
        try {
            // Fetch tutor name
            const tutorRes = await client.query(
                'SELECT name FROM tutors WHERE id = $1',
                [tutorId]
            );
            const name = tutorRes.rows[0]?.name || '';

            // Fetch bio
            const profileRes = await client.query(
                'SELECT bio FROM tutor_profiles WHERE tutor_id = $1',
                [tutorId]
            );
            const bio = profileRes.rows[0]?.bio || '';

            // Fetch expertise (lesson_types)
            const expertiseRes = await client.query(
                'SELECT label, category FROM lesson_types WHERE tutor_id = $1 AND active = true ORDER BY label',
                [tutorId]
            );
            const expertise = expertiseRes.rows.map((row) => ({
                label: row.label,
                category: row.category,
            }));

            return NextResponse.json({ name, bio, expertise });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('[Profile API] Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
