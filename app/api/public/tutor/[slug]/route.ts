import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * GET /api/public/tutor/[slug]
 * Returns public tutor profile: name, bio, expertise, availability, and service districts.
 * No auth required — this is the student-facing discovery endpoint.
 */
export async function GET(
    _request: Request,
    { params }: { params: { slug: string } }
) {
    const { slug } = params;

    const client = await pool.connect();
    try {
        // 1. Tutor core
        const tutorRes = await client.query(
            `SELECT id, name, slug, bio, latitude, longitude
       FROM tutors WHERE slug = $1`,
            [slug]
        );
        if (tutorRes.rows.length === 0) {
            return NextResponse.json({ message: 'Tutor not found' }, { status: 404 });
        }
        const tutor = tutorRes.rows[0];

        // 2. Expertise (lesson_types)
        const expertiseRes = await client.query(
            `SELECT id, label, category FROM lesson_types WHERE tutor_id = $1 ORDER BY label`,
            [tutor.id]
        );

        // 3. Availability slots
        const availRes = await client.query(
            `SELECT day_of_week, start_time_local, end_time_local
       FROM tutor_availability WHERE tutor_id = $1
       ORDER BY day_of_week, start_time_local`,
            [tutor.id]
        );

        const slots: Record<string, boolean> = {};
        for (const row of availRes.rows) {
            const key = `${row.day_of_week}-${row.start_time_local.substring(0, 5)}`;
            slots[key] = true;
        }

        // 4. Existing sessions this week (to mark pending/confirmed)
        const sessionsRes = await client.query(
            `SELECT
         EXTRACT(DOW FROM requested_start_at_utc) as day_of_week,
         TO_CHAR(requested_start_at_utc, 'HH24:MI') as start_time,
         status
       FROM lessons
       WHERE tutor_id = $1
         AND status IN ('confirmed', 'requested')
         AND requested_start_at_utc >= date_trunc('week', NOW())
         AND requested_start_at_utc < date_trunc('week', NOW()) + interval '7 days'`,
            [tutor.id]
        );

        const booked: Record<string, string> = {};
        for (const row of sessionsRes.rows) {
            const key = `${row.day_of_week}-${row.start_time}`;
            booked[key] = row.status === 'confirmed' ? 'confirmed' : 'pending';
        }

        // 5. Service districts
        let districts: { district_id: string; district_label: string }[] = [];
        try {
            const distRes = await client.query(
                `SELECT district_id, district_label FROM tutor_service_areas WHERE tutor_id = $1`,
                [tutor.id]
            );
            districts = distRes.rows;
        } catch {
            // Table may not exist yet
        }

        // 6. Pricing
        const pricingRes = await client.query(
            `SELECT lp.lesson_type_id, lp.duration_minutes, lp.price_amount
       FROM lesson_pricing lp
       JOIN lesson_types lt ON lp.lesson_type_id = lt.id
       WHERE lt.tutor_id = $1 AND lp.active = true
       ORDER BY lp.duration_minutes`,
            [tutor.id]
        );

        // Group pricing by lesson_type_id
        const pricingMap: Record<string, { duration: number; price: string }[]> = {};
        for (const row of pricingRes.rows) {
            if (!pricingMap[row.lesson_type_id]) pricingMap[row.lesson_type_id] = [];
            pricingMap[row.lesson_type_id].push({
                duration: row.duration_minutes,
                price: row.price_amount,
            });
        }

        return NextResponse.json({
            tutor: {
                id: tutor.id,
                name: tutor.name,
                slug: tutor.slug,
                bio: tutor.bio,
            },
            expertise: expertiseRes.rows.map((e) => ({
                id: e.id,
                label: e.label,
                category: e.category,
                pricing: pricingMap[e.id] || [],
            })),
            slots,
            booked,
            districts,
        });
    } catch (error) {
        console.error('[Public Tutor] Error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    } finally {
        client.release();
    }
}
