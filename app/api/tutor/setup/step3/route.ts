
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getTutorIdFromSession } from '@/lib/session';

type AvailabilitySlot = {
    day: number;
    time: string;
};

export async function POST(request: Request) {
  const tutorId = await getTutorIdFromSession();
  if (!tutorId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { availability } = await request.json();

    if (!Array.isArray(availability)) {
      return NextResponse.json({ message: 'Availability data is required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clear existing availability
      await client.query('DELETE FROM tutor_availability WHERE tutor_id = $1', [tutorId]);
      
      // Insert new availability
      // This logic assumes 1-hour slots. E.g., a slot for '16:00' on day 1 becomes 16:00-17:00.
      for (const slot of availability as AvailabilitySlot[]) {
        const startTime = `${slot.time}:00`;
        const endTime = `${parseInt(slot.time.split(':')[0]) + 1}:00`;
        
        await client.query(
          'INSERT INTO tutor_availability (tutor_id, day_of_week, start_time_local, end_time_local) VALUES ($1, $2, $3, $4)',
          [tutorId, slot.day, startTime, endTime]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({ message: 'Availability updated successfully' }, { status: 200 });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Setup Step 3 Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
