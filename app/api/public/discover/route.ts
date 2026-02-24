import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * GET /api/public/discover
 * Public endpoint — no auth required for browsing tutors.
 *
 * Query Params:
 *   lat, lng           – User coordinates for distance sort (Haversine)
 *   category           – lesson_category enum filter
 *   q                  – Name search (ILIKE)
 *   minRating          – Minimum avg_stars threshold
 *   sort               – price_asc | price_desc | rating | distance
 *   availableToday     – "true" to only show tutors with today's blue slots
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
    const category = searchParams.get('category');
    const q = searchParams.get('q');
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : null;
    const sort = searchParams.get('sort') || 'rating';
    const availableToday = searchParams.get('availableToday') === 'true';

    const conditions: string[] = ['t.is_active = true'];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    // ── Category filter ──
    if (category && ['academic', 'language', 'music', 'fine_arts'].includes(category)) {
        conditions.push(`lt.category = $${paramIndex}::lesson_category`);
        params.push(category);
        paramIndex++;
    }

    // ── Name search (ILIKE) ──
    if (q && q.trim().length > 0) {
        conditions.push(`t.name ILIKE $${paramIndex}`);
        params.push(`%${q.trim()}%`);
        paramIndex++;
    }

    // ── Rating filter ──
    if (minRating && minRating > 0) {
        conditions.push(`COALESCE(trs.avg_stars, 0) >= $${paramIndex}`);
        params.push(minRating);
        paramIndex++;
    }

    // ── Available Today filter (The Bridge) ──
    // Cross-reference with tutor_availability for current day_of_week
    if (availableToday) {
        // JavaScript: 0=Sunday matches PostgreSQL EXTRACT(DOW)
        conditions.push(`EXISTS (
      SELECT 1 FROM tutor_availability ta
      WHERE ta.tutor_id = t.id
        AND ta.day_of_week = EXTRACT(DOW FROM NOW())::INTEGER
    )`);
    }

    // ── Distance calculation (Haversine) ──
    let distanceSelect = 'NULL::DECIMAL AS distance_km';
    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
        distanceSelect = `
      CASE WHEN t.latitude IS NOT NULL AND t.longitude IS NOT NULL THEN
        ROUND((
          6371 * acos(
            cos(radians($${paramIndex})) * cos(radians(t.latitude))
            * cos(radians(t.longitude) - radians($${paramIndex + 1}))
            + sin(radians($${paramIndex})) * sin(radians(t.latitude))
          )
        )::DECIMAL, 1)
      ELSE NULL END AS distance_km`;
        params.push(lat, lng);
        paramIndex += 2;
    }

    // ── Sort order ──
    let orderBy = 'COALESCE(trs.avg_stars, 0) DESC'; // default: rating
    switch (sort) {
        case 'price_asc':
            orderBy = 'min_price ASC NULLS LAST';
            break;
        case 'price_desc':
            orderBy = 'min_price DESC NULLS LAST';
            break;
        case 'rating':
            orderBy = 'COALESCE(trs.avg_stars, 0) DESC, trs.rating_count DESC';
            break;
        case 'distance':
            orderBy = 'distance_km ASC NULLS LAST';
            break;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
    SELECT
      t.id, t.name, t.slug, t.latitude, t.longitude,
      tp.bio,
      COALESCE(trs.avg_stars, 0)::DECIMAL AS avg_stars,
      COALESCE(trs.rating_count, 0)::INTEGER AS rating_count,
      MIN(lp.price_amount)::DECIMAL AS min_price,
      MAX(lp.price_amount)::DECIMAL AS max_price,
      ${distanceSelect},
      -- Subjects as JSON array
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'label', lt.label,
            'category', lt.category
          )
        ) FILTER (WHERE lt.id IS NOT NULL), '[]'
      ) AS subjects,
      -- Availability today (for badge)
      EXISTS (
        SELECT 1 FROM tutor_availability ta
        WHERE ta.tutor_id = t.id
          AND ta.day_of_week = EXTRACT(DOW FROM NOW())::INTEGER
      ) AS available_today
    FROM tutors t
    LEFT JOIN tutor_profiles tp ON t.id = tp.tutor_id
    LEFT JOIN tutor_rating_summary trs ON t.id = trs.tutor_id
    LEFT JOIN lesson_types lt ON t.id = lt.tutor_id AND lt.active = true
    LEFT JOIN lesson_pricing lp ON lt.id = lp.lesson_type_id AND lp.active = true
    ${whereClause}
    GROUP BY t.id, t.name, t.slug, t.latitude, t.longitude, tp.bio, trs.avg_stars, trs.rating_count
    ORDER BY ${orderBy}
    LIMIT 50
  `;

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(query, params);
            return NextResponse.json({ tutors: result.rows });
        } finally {
            client.release();
        }
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[Discover API] Error:', errMsg);
        return NextResponse.json(
            { error: `Discovery query failed: ${errMsg}` },
            { status: 500 }
        );
    }
}
