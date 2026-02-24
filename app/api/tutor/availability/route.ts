import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import pool from "@/lib/db";
import { getSessionFromCookie } from "@/lib/session";

/**
 * GET /api/tutor/availability
 * Returns the tutor's current weekly availability and any sessions for this week.
 * FIREWALL: Only returns lesson_type_label + student_name — never student dashboard URLs.
 */
export async function GET(request: NextRequest) {
    const session = await getSessionFromCookie();
    if (!session || session.role !== "TUTOR") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tutorId = session.userId;
    if (!tutorId) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const client = await pool.connect();
    try {
        // 1. Get availability slots
        const availRes = await client.query(
            `SELECT day_of_week, start_time_local, end_time_local
             FROM tutor_availability
             WHERE tutor_id = $1
             ORDER BY day_of_week, start_time_local`,
            [tutorId]
        );

        // Convert to slot map: { "1-9:00": { available: true, logistics: "home" } }
        const slots: Record<string, { available: boolean; logistics: string }> = {};
        for (const row of availRes.rows) {
            const key = `${row.day_of_week}-${row.start_time_local.substring(0, 5)}`;
            slots[key] = { available: true, logistics: "home" };
        }

        // 2. Get sessions for current week (FIREWALL: only essential fields)
        const sessionsRes = await client.query(
            `SELECT
                l.id,
                l.status,
                lt.label as lesson_label,
                l.student_name,
                EXTRACT(DOW FROM l.requested_start_at_utc) as day_of_week,
                TO_CHAR(l.requested_start_at_utc, 'HH24:MI') as start_time
             FROM lessons l
             JOIN lesson_types lt ON l.lesson_type_id = lt.id
             WHERE l.tutor_id = $1
               AND l.status IN ('confirmed', 'requested')
               AND l.requested_start_at_utc >= date_trunc('week', NOW())
               AND l.requested_start_at_utc < date_trunc('week', NOW()) + interval '7 days'
             ORDER BY l.requested_start_at_utc`,
            [tutorId]
        );

        // Convert to sessions map
        const sessions: Record<string, { status: string; label: string }> = {};
        for (const row of sessionsRes.rows) {
            const key = `${row.day_of_week}-${row.start_time}`;
            sessions[key] = {
                status: row.status === "confirmed" ? "confirmed" : "pending",
                label: `${row.lesson_label} - ${row.student_name}`,
            };
        }

        // 3. Summary counts
        const confirmedCount = sessionsRes.rows.filter(
            (r: { status: string }) => r.status === "confirmed"
        ).length;
        const pendingCount = sessionsRes.rows.filter(
            (r: { status: string }) => r.status === "requested"
        ).length;

        return NextResponse.json({
            slots,
            sessions,
            summary: {
                confirmed: confirmedCount,
                pending: pendingCount,
                available: Object.keys(slots).length,
            },
        });
    } catch (error) {
        console.error("Failed to fetch availability:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}

/**
 * POST /api/tutor/availability
 * Upserts the tutor's weekly availability (replaces all existing slots).
 */
export async function POST(request: NextRequest) {
    const session = await getSessionFromCookie();
    if (!session || session.role !== "TUTOR") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tutorId = session.userId;
    if (!tutorId) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const { slots } = body as {
        slots: Record<string, { available: boolean; logistics: string }>;
    };

    if (!slots || typeof slots !== "object") {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        );
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Delete existing availability
        await client.query(
            "DELETE FROM tutor_availability WHERE tutor_id = $1",
            [tutorId]
        );

        // Insert new availability (only slots marked as available)
        const availableSlots = Object.entries(slots).filter(
            ([, data]) => data.available
        );

        for (const [key, _data] of availableSlots) {
            const [dayStr, time] = key.split("-");
            const dayOfWeek = parseInt(dayStr);

            if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) continue;
            if (!time || !time.match(/^\d{1,2}:\d{2}$/)) continue;

            // Calculate end time (1 hour slot)
            const startHour = parseInt(time.split(":")[0]);
            const endTime = `${startHour + 1}:00`;

            await client.query(
                `INSERT INTO tutor_availability (tutor_id, day_of_week, start_time_local, end_time_local)
                 VALUES ($1, $2, $3, $4)`,
                [tutorId, dayOfWeek, time, endTime]
            );
        }

        await client.query("COMMIT");

        return NextResponse.json({
            success: true,
            count: availableSlots.length,
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Failed to save availability:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}
