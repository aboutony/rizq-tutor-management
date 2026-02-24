
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

-- ENUM Types for CHECK constraints for better management
CREATE TYPE lesson_category AS ENUM ('academic', 'language', 'music', 'fine_arts');
CREATE TYPE lesson_status AS ENUM ('requested', 'confirmed', 'completed', 'canceled', 'reschedule_requested', 'rescheduled');
CREATE TYPE payment_status AS ENUM ('paid', 'unpaid');
CREATE TYPE canceled_by_actor AS ENUM ('parent', 'tutor');
CREATE TYPE requested_by_actor AS ENUM ('parent', 'tutor');
CREATE TYPE reschedule_status AS ENUM ('pending', 'approved', 'declined');
CREATE TYPE token_purpose AS ENUM ('cancel', 'reschedule', 'rate');

-- 1. Tutors Table: Core tutor information
CREATE TABLE tutors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON tutors
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 2. Tutor Profiles Table: Additional public-facing tutor details
CREATE TABLE tutor_profiles (
    tutor_id UUID PRIMARY KEY REFERENCES tutors(id) ON DELETE CASCADE,
    bio TEXT,
    -- e.g., {'individual', 'group'}
    lesson_formats TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    -- e.g., {'Beginner', 'Intermediate', 'Advanced'}
    levels_supported TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
);

-- 3. Lesson Types Table: Defines the subjects a tutor teaches
CREATE TABLE lesson_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    category lesson_category NOT NULL,
    label TEXT NOT NULL,
    is_group_allowed BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true
);
CREATE INDEX idx_lesson_types_tutor_id ON lesson_types(tutor_id);

-- 4. Lesson Pricing Table: Pricing for different durations of a lesson type
CREATE TABLE lesson_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_type_id UUID NOT NULL REFERENCES lesson_types(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (30, 45, 60)),
    price_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    active BOOLEAN DEFAULT true
);
CREATE INDEX idx_lesson_pricing_lesson_type_id ON lesson_pricing(lesson_type_id);

-- 5. Tutor Availability Table: General weekly availability
CREATE TABLE tutor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time_local TIME NOT NULL,
    end_time_local TIME NOT NULL
);
CREATE INDEX idx_tutor_availability_tutor_id ON tutor_availability(tutor_id);

-- 6. Cancellation Policy Table: Tutor-defined cancellation rules
CREATE TABLE cancellation_policy (
    tutor_id UUID PRIMARY KEY REFERENCES tutors(id) ON DELETE CASCADE,
    cutoff_hours INTEGER NOT NULL DEFAULT 24,
    late_cancel_payable BOOLEAN NOT NULL DEFAULT true
);

-- 7. Lessons Table: The core table for all lesson interactions
CREATE TABLE lessons (
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
CREATE INDEX idx_lessons_tutor_id_status ON lessons(tutor_id, status);
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON lessons
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 8. Lesson Payments Table: Tracks payment status for each lesson (shadow accounting)
CREATE TABLE lesson_payments (
    lesson_id UUID PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON lesson_payments
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 9. Lesson Cancellations Table: Audit log for cancellations
CREATE TABLE lesson_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID UNIQUE NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    canceled_by canceled_by_actor NOT NULL,
    is_late BOOLEAN NOT NULL,
    note TEXT,
    canceled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Reschedule Requests Table: Audit log for reschedule requests
CREATE TABLE reschedule_requests (
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
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON reschedule_requests
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 11. Ratings Table: Stores ratings for completed lessons
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID UNIQUE NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment VARCHAR(140),
    is_hidden BOOLEAN DEFAULT false, -- For admin moderation
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ratings_tutor_id ON ratings(tutor_id);

-- 12. Tutor Rating Summary Table: Aggregated ratings for quick display
CREATE TABLE tutor_rating_summary (
    tutor_id UUID PRIMARY KEY REFERENCES tutors(id) ON DELETE CASCADE,
    avg_stars DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    rating_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON tutor_rating_summary
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 13. Link Tokens Table: Secure tokens for parent/student actions
CREATE TABLE link_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    purpose token_purpose NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
);
CREATE INDEX idx_link_tokens_hash ON link_tokens(token_hash);
