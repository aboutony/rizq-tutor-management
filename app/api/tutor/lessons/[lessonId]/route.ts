import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getTutorIdFromSession } from '@/lib/session';

/**
 * GET /api/tutor/lessons/[lessonId]
 * Returns detail for a single lesson owned by this tutor.
 */
export async function GET(
    _request: Request,
    { params }: { params: { lessonId: string } }
) {
    const tutorId = await getTutorIdFromSession();
    if (!tutorId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId } = params;
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT l.id, l.status, l.student_name, l.duration_minutes, l.price_amount,
              l.requested_start_at_utc, l.confirmed_start_at_utc, l.level,
              lt.label as lesson_label, lt.category
       FROM lessons l
       JOIN lesson_types lt ON l.lesson_type_id = lt.id
       WHERE l.id = $1 AND l.tutor_id = $2`,
            [lessonId, tutorId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ lesson: result.rows[0] });
    } catch (error) {
        console.error('[Lesson Detail]', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    } finally {
        client.release();
    }
}
