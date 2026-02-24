import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getTutorIdFromSession } from '@/lib/session';

/**
 * GET /api/tutor/messages/[lessonId]
 * Returns chat messages for a lesson owned by this tutor.
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
        // Verify tutor owns the lesson
        const lessonCheck = await client.query(
            'SELECT id FROM lessons WHERE id = $1 AND tutor_id = $2',
            [lessonId, tutorId]
        );
        if (lessonCheck.rows.length === 0) {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        const result = await client.query(
            `SELECT id, sender, body, created_at
       FROM lesson_messages
       WHERE lesson_id = $1
       ORDER BY created_at ASC`,
            [lessonId]
        );

        return NextResponse.json({ messages: result.rows });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '';
        if (msg.includes('does not exist')) {
            return NextResponse.json({ messages: [] });
        }
        console.error('[Messages GET]', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    } finally {
        client.release();
    }
}

/**
 * POST /api/tutor/messages/[lessonId]
 * Send a chat message for a lesson.
 */
export async function POST(
    request: Request,
    { params }: { params: { lessonId: string } }
) {
    const tutorId = await getTutorIdFromSession();
    if (!tutorId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId } = params;
    const { body: messageBody } = await request.json();

    if (!messageBody || typeof messageBody !== 'string' || messageBody.trim().length === 0) {
        return NextResponse.json({ message: 'Message body required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        // Verify tutor owns the lesson
        const lessonCheck = await client.query(
            'SELECT id FROM lessons WHERE id = $1 AND tutor_id = $2',
            [lessonId, tutorId]
        );
        if (lessonCheck.rows.length === 0) {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        const result = await client.query(
            `INSERT INTO lesson_messages (lesson_id, sender, body) VALUES ($1, 'tutor', $2) RETURNING id, created_at`,
            [lessonId, messageBody.trim()]
        );

        return NextResponse.json({
            id: result.rows[0].id,
            created_at: result.rows[0].created_at,
        }, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '';
        if (msg.includes('does not exist')) {
            return NextResponse.json({ message: 'Chat not available yet. Please run init-db.' }, { status: 503 });
        }
        console.error('[Messages POST]', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    } finally {
        client.release();
    }
}
