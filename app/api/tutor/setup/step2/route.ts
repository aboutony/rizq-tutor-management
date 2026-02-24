
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getTutorIdFromSession } from '@/lib/session';

type Price = {
  lessonTypeId: string;
  duration: number;
  amount: number;
};

export async function POST(request: Request) {
  const tutorId = await getTutorIdFromSession();
  if (!tutorId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { prices } = await request.json();

    if (!Array.isArray(prices)) {
      return NextResponse.json({ message: 'Pricing data is required' }, { status: 400 });
    }

    // Filter out prices that are zero or negative
    const validPrices = prices.filter(p => p.amount > 0);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clear existing pricing for the lesson types being updated
      const lessonTypeIds = Array.from(new Set(validPrices.map((p: Price) => p.lessonTypeId)));
      if (lessonTypeIds.length > 0) {
        // Security check: Ensure the tutor owns these lesson types
        const ownershipCheck = await client.query(
          'SELECT id FROM lesson_types WHERE id = ANY($1::uuid[]) AND tutor_id = $2',
          [lessonTypeIds, tutorId]
        );
        if (ownershipCheck.rowCount !== lessonTypeIds.length) {
          await client.query('ROLLBACK');
          return NextResponse.json({ message: 'Invalid lesson type ID' }, { status: 403 });
        }

        await client.query('DELETE FROM lesson_pricing WHERE lesson_type_id = ANY($1::uuid[])', [lessonTypeIds]);
      }

      // Insert new pricing
      for (const price of validPrices as Price[]) {
        await client.query(
          'INSERT INTO lesson_pricing (lesson_type_id, duration_minutes, price_amount, currency) VALUES ($1, $2, $3, $4)',
          [price.lessonTypeId, price.duration, price.amount, 'USD']
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({ message: 'Pricing updated successfully' }, { status: 200 });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Setup Step 2 Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
