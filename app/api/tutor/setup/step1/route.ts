
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getTutorIdFromSession } from '@/lib/session';

type LessonType = {
  category: 'academic' | 'language' | 'music' | 'fine_arts';
  label: string;
};

export async function POST(request: Request) {
  const tutorId = await getTutorIdFromSession();
  if (!tutorId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, lessonTypes } = await request.json();

    if (!name || !Array.isArray(lessonTypes) || lessonTypes.length === 0) {
      return NextResponse.json({ message: 'Name and lesson types are required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Update tutor's name
      await client.query('UPDATE tutors SET name = $1 WHERE id = $2', [name, tutorId]);
      
      // 2. Clear existing lesson types for idempotency
      await client.query('DELETE FROM lesson_types WHERE tutor_id = $1', [tutorId]);

      // 3. Insert new lesson types and return their new IDs
      const insertedLessonTypes = [];
      for (const lt of lessonTypes as LessonType[]) {
        const res = await client.query(
          'INSERT INTO lesson_types (tutor_id, category, label, active) VALUES ($1, $2, $3, $4) RETURNING id, label',
          [tutorId, lt.category, lt.label, true]
        );
        insertedLessonTypes.push(res.rows[0]);
      }

      await client.query('COMMIT');
      
      return NextResponse.json({ lessonTypes: insertedLessonTypes }, { status: 200 });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Setup Step 1 Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
