import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * POST /api/setup/init-db
 * One-time endpoint to create the database schema and seed demo data.
 * This should be called once after connecting a fresh database.
 * 
 * SECURITY: This endpoint is idempotent — re-running it will reset all data.
 */
export async function POST() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── Step 1: Create schema ──
    await client.query(`
      -- Enable UUID generation
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- Auto-update updated_at timestamp function
      CREATE OR REPLACE FUNCTION trigger_set_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- ENUM Types
      DO $$ BEGIN
        CREATE TYPE lesson_category AS ENUM ('academic', 'language', 'music', 'fine_arts');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE lesson_status AS ENUM ('requested', 'confirmed', 'completed', 'canceled', 'reschedule_requested', 'rescheduled');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE payment_status AS ENUM ('paid', 'unpaid');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE canceled_by_actor AS ENUM ('parent', 'tutor');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE requested_by_actor AS ENUM ('parent', 'tutor');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE reschedule_status AS ENUM ('pending', 'approved', 'declined');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE token_purpose AS ENUM ('cancel', 'reschedule', 'rate');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // ── Step 2: Create tables ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS tutors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        latitude DECIMAL(10, 7),
        longitude DECIMAL(10, 7),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Add geo columns if table already exists without them
      ALTER TABLE tutors ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);
      ALTER TABLE tutors ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

      CREATE TABLE IF NOT EXISTS tutor_profiles (
        tutor_id UUID PRIMARY KEY REFERENCES tutors(id) ON DELETE CASCADE,
        bio TEXT,
        lesson_formats TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        levels_supported TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
      );

      CREATE TABLE IF NOT EXISTS lesson_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
        category lesson_category NOT NULL,
        label TEXT NOT NULL,
        is_group_allowed BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS lesson_pricing (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_type_id UUID NOT NULL REFERENCES lesson_types(id) ON DELETE CASCADE,
        duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (30, 45, 60)),
        price_amount DECIMAL(10, 2) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        active BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS tutor_availability (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        start_time_local TIME NOT NULL,
        end_time_local TIME NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cancellation_policy (
        tutor_id UUID PRIMARY KEY REFERENCES tutors(id) ON DELETE CASCADE,
        cutoff_hours INTEGER NOT NULL DEFAULT 24,
        late_cancel_payable BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
        lesson_type_id UUID NOT NULL REFERENCES lesson_types(id) ON DELETE CASCADE,
        student_name TEXT NOT NULL,
        level TEXT,
        duration_minutes INTEGER NOT NULL,
        price_amount DECIMAL(10, 2) NOT NULL,
        status lesson_status NOT NULL DEFAULT 'requested',
        requested_start_at_utc TIMESTAMPTZ NOT NULL,
        confirmed_start_at_utc TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS lesson_payments (
        lesson_id UUID PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
        payment_status payment_status NOT NULL DEFAULT 'unpaid',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS lesson_cancellations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID UNIQUE NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        canceled_by canceled_by_actor NOT NULL,
        is_late BOOLEAN NOT NULL,
        note TEXT,
        canceled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reschedule_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        requested_by requested_by_actor NOT NULL,
        status reschedule_status NOT NULL DEFAULT 'pending',
        proposed_start_at_utc TIMESTAMPTZ,
        reason_code TEXT,
        reason_text TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID UNIQUE NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
        stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
        comment VARCHAR(140),
        is_hidden BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tutor_rating_summary (
        tutor_id UUID PRIMARY KEY REFERENCES tutors(id) ON DELETE CASCADE,
        avg_stars DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
        rating_count INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS link_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        purpose token_purpose NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS tutor_service_areas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
        district_id TEXT NOT NULL,
        district_label TEXT NOT NULL,
        latitude DECIMAL(10, 7),
        longitude DECIMAL(10, 7),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(tutor_id, district_id)
      );
    `);

    // ── Step 3: Create indexes ──
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lesson_types_tutor_id ON lesson_types(tutor_id);
      CREATE INDEX IF NOT EXISTS idx_lesson_pricing_lesson_type_id ON lesson_pricing(lesson_type_id);
      CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor_id ON tutor_availability(tutor_id);
      CREATE INDEX IF NOT EXISTS idx_lessons_tutor_id_status ON lessons(tutor_id, status);
      CREATE INDEX IF NOT EXISTS idx_ratings_tutor_id ON ratings(tutor_id);
      CREATE INDEX IF NOT EXISTS idx_link_tokens_hash ON link_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_service_areas_tutor_id ON tutor_service_areas(tutor_id);
    `);

    // ── Step 4: Seed demo data ──
    // Check if data already exists
    const existing = await client.query('SELECT COUNT(*) FROM tutors');
    if (parseInt(existing.rows[0].count) === 0) {
      await client.query(`
        WITH new_tutor AS (
          INSERT INTO tutors (name, phone, slug, latitude, longitude)
          VALUES ('Farah Al-Fayad', '+9613123456', 'farah-fayad', 33.8938, 35.5018)
          RETURNING id
        ),
        profile AS (
          INSERT INTO tutor_profiles (tutor_id, bio, lesson_formats, levels_supported)
          SELECT id, 'Experienced and patient tutor specializing in Math and Music for all ages.', 
                 ARRAY['individual'], ARRAY['Beginner', 'Intermediate', 'Advanced']
          FROM new_tutor
        ),
        policy AS (
          INSERT INTO cancellation_policy (tutor_id, cutoff_hours, late_cancel_payable)
          SELECT id, 24, true FROM new_tutor
        ),
        rating_summary AS (
          INSERT INTO tutor_rating_summary(tutor_id, avg_stars, rating_count)
          SELECT id, 4.50, 12 FROM new_tutor
        ),
        -- Also update existing tutor geo (idempotent)
        update_geo AS (
          UPDATE tutors SET latitude = 33.8938, longitude = 35.5018
          WHERE slug = 'farah-fayad' AND latitude IS NULL
          RETURNING id
        ),
        rating_summary_dummy AS (
          INSERT INTO tutor_rating_summary(tutor_id)
          SELECT id FROM new_tutor
        ),
        math_lesson AS (
          INSERT INTO lesson_types (tutor_id, category, label, active)
          SELECT id, 'academic', 'Math', true FROM new_tutor
          RETURNING id
        ),
        piano_lesson AS (
          INSERT INTO lesson_types (tutor_id, category, label, active)
          SELECT id, 'music', 'Piano', true FROM new_tutor
          RETURNING id
        ),
        math_pricing AS (
          INSERT INTO lesson_pricing (lesson_type_id, duration_minutes, price_amount)
          VALUES
            ((SELECT id FROM math_lesson), 45, 20.00),
            ((SELECT id FROM math_lesson), 60, 25.00)
        ),
        piano_pricing AS (
          INSERT INTO lesson_pricing (lesson_type_id, duration_minutes, price_amount)
          VALUES
            ((SELECT id FROM piano_lesson), 30, 25.00),
            ((SELECT id FROM piano_lesson), 60, 45.00)
        )
        INSERT INTO tutor_availability (tutor_id, day_of_week, start_time_local, end_time_local)
        VALUES
          ((SELECT id FROM new_tutor), 1, '16:00', '19:00'),
          ((SELECT id FROM new_tutor), 3, '15:00', '18:00'),
          ((SELECT id FROM new_tutor), 5, '14:00', '17:00');
      `);
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully! Schema created and demo data seeded.',
    });
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[DB Init] Failed:', errMsg);
    return NextResponse.json(
      { success: false, message: `Database init failed: ${errMsg}` },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
