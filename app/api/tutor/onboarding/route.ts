import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getTutorIdFromSession } from '@/lib/session';
import { getCategoryById } from '@/lib/curriculum-lb';

/**
 * POST /api/tutor/onboarding
 *
 * Saves the tutor's expertise profile from the onboarding wizard.
 * Body: { name: string, selections: { categoryId: string, subIds: string[], otherTexts: Record<string, string> }[] }
 */
export async function POST(request: Request) {
    const tutorId = await getTutorIdFromSession();
    if (!tutorId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, selections } = await request.json();

        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return NextResponse.json({ message: 'Name is required (min 2 characters)' }, { status: 400 });
        }

        if (!Array.isArray(selections) || selections.length === 0) {
            return NextResponse.json({ message: 'At least one category must be selected' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Update tutor name
            await client.query('UPDATE tutors SET name = $1 WHERE id = $2', [name.trim(), tutorId]);

            // 2. Delete existing lesson_types (idempotent re-onboard)
            await client.query('DELETE FROM lesson_types WHERE tutor_id = $1', [tutorId]);

            // 3. Build lesson_types from selections
            const expertiseLabels: string[] = [];

            for (const sel of selections) {
                const category = getCategoryById(sel.categoryId);
                if (!category) continue;

                const subIds: string[] = sel.subIds || [];
                const otherTexts: Record<string, string> = sel.otherTexts || {};

                for (const subId of subIds) {
                    const sub = category.subcategories.find((s) => s.id === subId);
                    if (!sub) continue;

                    // Determine label: for "other" entries, use the user-provided text
                    let label = sub.label;
                    if (sub.requiresInput && otherTexts[subId]) {
                        label = otherTexts[subId].trim() || sub.label;
                    }

                    // Build a descriptive label: "Category > Sub"
                    const fullLabel = `${category.label} > ${label}`;
                    expertiseLabels.push(fullLabel);

                    await client.query(
                        'INSERT INTO lesson_types (tutor_id, category, label, active) VALUES ($1, $2, $3, true)',
                        [tutorId, category.dbCategory, fullLabel]
                    );
                }
            }

            // 4. Update tutor_profiles with expertise summary
            const expertiseSummary = expertiseLabels.join(', ');
            await client.query(
                `INSERT INTO tutor_profiles (tutor_id, bio, lesson_formats, levels_supported)
         VALUES ($1, $2, ARRAY['individual'], ARRAY[]::TEXT[])
         ON CONFLICT (tutor_id) DO UPDATE SET bio = $2`,
                [tutorId, `Expert in: ${expertiseSummary}`]
            );

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Onboarding complete!',
                expertiseCount: expertiseLabels.length,
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('[Onboarding] Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
