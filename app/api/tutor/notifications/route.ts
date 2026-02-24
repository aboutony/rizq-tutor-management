import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getTutorIdFromSession } from '@/lib/session';

/**
 * GET /api/tutor/notifications
 * Returns the tutor's notifications, newest first.
 */
export async function GET() {
    const tutorId = await getTutorIdFromSession();
    if (!tutorId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT id, type, title, body, lesson_id, read, created_at
       FROM tutor_notifications
       WHERE tutor_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
            [tutorId]
        );

        const unreadCount = result.rows.filter((r) => !r.read).length;

        return NextResponse.json({
            notifications: result.rows,
            unreadCount,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '';
        if (msg.includes('does not exist')) {
            return NextResponse.json({ notifications: [], unreadCount: 0 });
        }
        console.error('[Notifications GET] Error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    } finally {
        client.release();
    }
}

/**
 * PATCH /api/tutor/notifications
 * Mark notifications as read. Body: { ids: string[] } or { all: true }
 */
export async function PATCH(request: Request) {
    const tutorId = await getTutorIdFromSession();
    if (!tutorId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const client = await pool.connect();
    try {
        if (body.all) {
            await client.query(
                'UPDATE tutor_notifications SET read = true WHERE tutor_id = $1',
                [tutorId]
            );
        } else if (Array.isArray(body.ids) && body.ids.length > 0) {
            await client.query(
                'UPDATE tutor_notifications SET read = true WHERE tutor_id = $1 AND id = ANY($2::uuid[])',
                [tutorId, body.ids]
            );
        }
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '';
        if (msg.includes('does not exist')) {
            return NextResponse.json({ success: true });
        }
        console.error('[Notifications PATCH] Error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    } finally {
        client.release();
    }
}
