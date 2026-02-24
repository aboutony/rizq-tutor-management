
-- Clear existing data to ensure a clean slate
TRUNCATE tutors, tutor_profiles, lesson_types, lesson_pricing, tutor_availability, cancellation_policy, tutor_rating_summary RESTART IDENTITY CASCADE;

-- Create a sample tutor and capture the generated ID
WITH new_tutor AS (
  INSERT INTO tutors (name, phone, slug)
  VALUES ('Farah Al-Fayad', '+9613123456', 'farah-fayad')
  RETURNING id
),
-- Create the tutor's profile
profile AS (
  INSERT INTO tutor_profiles (tutor_id, bio, lesson_formats, levels_supported)
  SELECT id, 'Experienced and patient tutor specializing in Math and Music for all ages.', ARRAY['individual'], ARRAY['Beginner', 'Intermediate', 'Advanced']
  FROM new_tutor
),
-- Create the tutor's cancellation policy
policy AS (
  INSERT INTO cancellation_policy (tutor_id, cutoff_hours, late_cancel_payable)
  SELECT id, 24, true
  FROM new_tutor
),
-- Initialize the tutor's rating summary
rating_summary AS (
    INSERT INTO tutor_rating_summary(tutor_id)
    SELECT id from new_tutor
),
-- Create 'Math' lesson type
math_lesson AS (
  INSERT INTO lesson_types (tutor_id, category, label, active)
  SELECT id, 'academic', 'Math', true
  FROM new_tutor
  RETURNING id
),
-- Create 'Piano' lesson type
piano_lesson AS (
  INSERT INTO lesson_types (tutor_id, category, label, active)
  SELECT id, 'music', 'Piano', true
  FROM new_tutor
  RETURNING id
),
-- Add pricing for Math lessons
math_pricing AS (
  INSERT INTO lesson_pricing (lesson_type_id, duration_minutes, price_amount)
  VALUES
    ((SELECT id FROM math_lesson), 45, 20.00),
    ((SELECT id FROM math_lesson), 60, 25.00)
),
-- Add pricing for Piano lessons
piano_pricing AS (
  INSERT INTO lesson_pricing (lesson_type_id, duration_minutes, price_amount)
  VALUES
    ((SELECT id FROM piano_lesson), 30, 25.00),
    ((SELECT id FROM piano_lesson), 60, 45.00)
)
-- Add tutor availability
INSERT INTO tutor_availability (tutor_id, day_of_week, start_time_local, end_time_local)
VALUES
    ((SELECT id FROM new_tutor), 1, '16:00', '19:00'), -- Monday 4-7 PM
    ((SELECT id FROM new_tutor), 3, '15:00', '18:00'), -- Wednesday 3-6 PM
    ((SELECT id FROM new_tutor), 5, '14:00', '17:00'); -- Friday 2-5 PM

SELECT 'Seed data successfully inserted.' as status;
