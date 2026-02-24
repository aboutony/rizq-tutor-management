
import { unstable_noStore as noStore } from 'next/cache';
import pool from '@/lib/db';
import { hashToken } from './tokens';

export type TutorPublicProfile = {
  id: string;
  name: string;
  bio: string | null;
  avg_stars: number;
  rating_count: number;
  lesson_types: {
    id: string;
    label: string;
    pricing: {
      duration_minutes: number;
      price_amount: string;
    }[];
  }[];
};

export async function getTutorBySlug(slug: string): Promise<TutorPublicProfile | null> {
  noStore();
  
  const client = await pool.connect();
  try {
    const tutorRes = await client.query(
        `SELECT 
            t.id, t.name, tp.bio, trs.avg_stars, trs.rating_count
         FROM tutors t
         LEFT JOIN tutor_profiles tp ON t.id = tp.tutor_id
         LEFT JOIN tutor_rating_summary trs ON t.id = trs.tutor_id
         WHERE t.slug = $1 AND t.is_active = true`,
        [slug]
    );

    if (tutorRes.rows.length === 0) {
      return null;
    }
    const tutor = tutorRes.rows[0];

    const lessonTypesRes = await client.query(
        `SELECT 
            lt.id, lt.label, lp.duration_minutes, lp.price_amount
         FROM lesson_types lt
         JOIN lesson_pricing lp ON lt.id = lp.lesson_type_id
         WHERE lt.tutor_id = $1 AND lt.active = true AND lp.active = true
         ORDER BY lt.label, lp.duration_minutes`,
        [tutor.id]
    );

    const lessonTypesMap = new Map();
    for (const row of lessonTypesRes.rows) {
        if (!lessonTypesMap.has(row.id)) {
            lessonTypesMap.set(row.id, {
                id: row.id,
                label: row.label,
                pricing: [],
            });
        }
        lessonTypesMap.get(row.id).pricing.push({
            duration_minutes: row.duration_minutes,
            price_amount: row.price_amount,
        });
    }

    return {
        ...tutor,
        lesson_types: Array.from(lessonTypesMap.values()),
    };
  } catch (error) {
    console.error('Failed to fetch tutor by slug:', error);
    return null;
  } finally {
    client.release();
  }
}


export type LessonRequest = {
  id: string;
  student_name: string;
  duration_minutes: number;
  requested_start_at_utc: Date;
  created_at: Date;
  lesson_type_label: string;
}

export async function getLessonRequests(tutorId: string): Promise<LessonRequest[]> {
  noStore();
  
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT 
         l.id, l.student_name, l.duration_minutes, l.requested_start_at_utc, l.created_at, lt.label as lesson_type_label
       FROM lessons l
       JOIN lesson_types lt ON l.lesson_type_id = lt.id
       WHERE l.tutor_id = $1 AND l.status = 'requested'
       ORDER BY l.created_at ASC`,
       [tutorId]
    );
    return res.rows;
  } catch (error) {
    console.error('Failed to fetch lesson requests:', error);
    return [];
  } finally {
    client.release();
  }
}

export type LessonDetailsForParent = {
    lesson_id: string;
    student_name: string;
    lesson_label: string;
    tutor_name: string;
    // These fields are only present for specific token purposes
    confirmed_start_at_utc?: Date;
    cutoff_hours?: number;
};

export async function getLessonDetailsByToken(token: string, purpose: 'cancel' | 'reschedule' | 'rate'): Promise<LessonDetailsForParent | null> {
    noStore();
    const tokenHash = hashToken(token);
    
    // Define the valid statuses for each token purpose
    const validStatuses: Record<typeof purpose, string[]> = {
        cancel: ['confirmed', 'reschedule_requested'],
        reschedule: ['confirmed', 'reschedule_requested'],
        rate: ['completed'],
    };
    
    const client = await pool.connect();
    try {
        const res = await client.query(
            `SELECT
                l.id as lesson_id, l.student_name, lt.label as lesson_label, l.confirmed_start_at_utc, t.name as tutor_name, cp.cutoff_hours
             FROM link_tokens ltok
             JOIN lessons l ON ltok.lesson_id = l.id
             JOIN lesson_types lt ON l.lesson_type_id = lt.id
             JOIN tutors t ON l.tutor_id = t.id
             LEFT JOIN cancellation_policy cp ON t.id = cp.tutor_id
             WHERE ltok.token_hash = $1
               AND ltok.purpose = $2
               AND ltok.expires_at > NOW()
               AND ltok.used_at IS NULL
               AND l.status = ANY($3::lesson_status[])`,
            [tokenHash, purpose, validStatuses[purpose]]
        );

        return res.rows.length > 0 ? res.rows[0] : null;
    } catch (error) {
        console.error('Failed to fetch lesson details by token:', error);
        return null;
    } finally {
        client.release();
    }
}


export type RescheduleRequestDetails = {
    request_id: string;
    lesson_id: string;
    student_name: string;
    lesson_label: string;
    original_time_utc: Date;
    proposed_time_utc: Date;
};

export async function getRescheduleRequests(tutorId: string): Promise<RescheduleRequestDetails[]> {
    noStore();

    const client = await pool.connect();
    try {
        const res = await client.query(
           `SELECT
                rr.id as request_id,
                l.id as lesson_id,
                l.student_name,
                lt.label as lesson_label,
                l.confirmed_start_at_utc as original_time_utc,
                rr.proposed_start_at_utc as proposed_time_utc
            FROM reschedule_requests rr
            JOIN lessons l ON rr.lesson_id = l.id
            JOIN lesson_types lt ON l.lesson_type_id = lt.id
            WHERE l.tutor_id = $1
              AND rr.status = 'pending'
              AND l.status = 'reschedule_requested'
            ORDER BY rr.created_at ASC`,
            [tutorId]
        );
        return res.rows;
    } catch (error) {
        console.error('Failed to fetch reschedule requests:', error);
        return [];
    } finally {
        client.release();
    }
}

export type LessonLogItem = {
    id: string;
    student_name: string;
    lesson_label: string;
    confirmed_start_at_utc: Date;
    status: 'confirmed' | 'completed';
};

export async function getLessonLog(tutorId: string): Promise<LessonLogItem[]> {
    noStore();
    const client = await pool.connect();
    try {
        const res = await client.query(
           `SELECT
                l.id,
                l.student_name,
                lt.label as lesson_label,
                l.confirmed_start_at_utc,
                l.status
            FROM lessons l
            JOIN lesson_types lt ON l.lesson_type_id = lt.id
            WHERE l.tutor_id = $1
              AND l.status IN ('confirmed', 'completed')
            ORDER BY l.confirmed_start_at_utc DESC`,
            [tutorId]
        );
        return res.rows;
    } catch (error) {
        console.error('Failed to fetch lesson log:', error);
        return [];
    } finally {
        client.release();
    }
}
