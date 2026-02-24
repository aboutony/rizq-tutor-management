
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getTutorIdFromSession } from '@/lib/session';
import { generateTokenAndHash } from '@/lib/tokens';

export async function POST(
  request: Request,
  { params }: { params: { lessonId: string } }
) {
  const tutorId = await getTutorIdFromSession();
  if (!tutorId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { lessonId } = params;

  const client = await pool.connect();
  try {
    // Verify the tutor owns this lesson and it is 'confirmed'
    const lessonCheck = await client.query(
        `SELECT id FROM lessons WHERE id = $1 AND tutor_id = $2 AND status = 'confirmed'`,
        [lessonId, tutorId]
    );

    if (lessonCheck.rows.length === 0) {
        return NextResponse.json({ message: 'Lesson not found or action not allowed' }, { status: 404 });
    }
    
    await client.query('BEGIN');
    
    // 1. Update lesson status
    await client.query(`UPDATE lessons SET status = 'completed' WHERE id = $1`, [lessonId]);
    
    // 2. Generate and store the rating token
    const rateToken = generateTokenAndHash();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Rating link is valid for 7 days

    await client.query(
        `INSERT INTO link_tokens (lesson_id, token_hash, purpose, expires_at) VALUES ($1, $2, 'rate', $3)`,
        [lessonId, rateToken.hash, expiresAt]
    );

    await client.query('COMMIT');
    
    // --- DEV ONLY: Log link to simulate sending to tutor to forward to parent ---
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log('--- RATING LINK (FOR PARENT) ---');
    console.log(`Rate Link: ${baseUrl}/l/${lessonId}/rate/${rateToken.token}`);
    console.log('---------------------------------');
    // -------------------------------------------------------------------------
    
    return NextResponse.json({ message: 'Lesson marked as complete.' }, { status: 200 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to mark lesson complete:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}
