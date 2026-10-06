-- Store academic grades and GPA calculator inputs per authenticated user.
CREATE TABLE IF NOT EXISTS grade_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  assessment_type text NOT NULL CHECK (assessment_type IN ('Quiz', 'Midterm', 'Case', 'Homework', 'Other')),
  score numeric(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
  weight numeric(5, 2) NOT NULL CHECK (weight > 0 AND weight <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grade_entries_user_course ON grade_entries(user_id, course_id);
ALTER TABLE grade_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_grade_entries" ON grade_entries;
CREATE POLICY "select_own_grade_entries" ON grade_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_grade_entries" ON grade_entries;
CREATE POLICY "insert_own_grade_entries" ON grade_entries FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.user_id = auth.uid())
);
DROP POLICY IF EXISTS "update_own_grade_entries" ON grade_entries;
CREATE POLICY "update_own_grade_entries" ON grade_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.user_id = auth.uid())
);
DROP POLICY IF EXISTS "delete_own_grade_entries" ON grade_entries;
CREATE POLICY "delete_own_grade_entries" ON grade_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS gpa_calculators (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  grading_system text NOT NULL DEFAULT 'AA' CHECK (grading_system IN ('AA', 'A1', 'A')),
  previous_cgpa numeric(4, 3) NOT NULL DEFAULT 0 CHECK (previous_cgpa >= 0 AND previous_cgpa <= 4),
  completed_credits numeric(8, 2) NOT NULL DEFAULT 0 CHECK (completed_credits >= 0),
  courses jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(courses) = 'array'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE gpa_calculators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_gpa_calculator" ON gpa_calculators;
CREATE POLICY "select_own_gpa_calculator" ON gpa_calculators FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_gpa_calculator" ON gpa_calculators;
CREATE POLICY "insert_own_gpa_calculator" ON gpa_calculators FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_gpa_calculator" ON gpa_calculators;
CREATE POLICY "update_own_gpa_calculator" ON gpa_calculators FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Carry the semester date supplied at signup into the owner-scoped profile.
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, semester_start_date)
  VALUES (NEW.id, NULLIF(NEW.raw_user_meta_data->>'semester_start_date', '')::date)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();
