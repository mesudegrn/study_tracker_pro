-- Ensure grade_entries exists with the public API expected by the app and refresh
-- PostgREST's schema cache after the migration is applied.
CREATE TABLE IF NOT EXISTS public.grade_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'Other',
  title text NOT NULL DEFAULT '',
  score numeric(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
  weight numeric(5, 2) NOT NULL CHECK (weight > 0 AND weight <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_entries
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'grade_entries' AND column_name = 'assessment_type'
  ) THEN
    EXECUTE $update$
      UPDATE public.grade_entries
      SET type = COALESCE(type, assessment_type, 'Other')
      WHERE type IS NULL
    $update$;
  ELSE
    UPDATE public.grade_entries SET type = 'Other' WHERE type IS NULL;
  END IF;
END;
$$;

ALTER TABLE public.grade_entries
  ALTER COLUMN type SET DEFAULT 'Other',
  ALTER COLUMN type SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'grade_entries' AND column_name = 'assessment_type'
  ) THEN
    ALTER TABLE public.grade_entries ALTER COLUMN assessment_type SET DEFAULT 'Other';
  END IF;
END;
$$;

ALTER TABLE public.grade_entries DROP CONSTRAINT IF EXISTS grade_entries_type_check;
ALTER TABLE public.grade_entries
  ADD CONSTRAINT grade_entries_type_check CHECK (type IN ('Quiz', 'Midterm', 'Case', 'Homework', 'Other'));

CREATE INDEX IF NOT EXISTS idx_grade_entries_user_course ON public.grade_entries(user_id, course_id);
ALTER TABLE public.grade_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_grade_entries" ON public.grade_entries;
CREATE POLICY "select_own_grade_entries" ON public.grade_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_grade_entries" ON public.grade_entries;
CREATE POLICY "insert_own_grade_entries" ON public.grade_entries
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_grade_entries" ON public.grade_entries;
CREATE POLICY "update_own_grade_entries" ON public.grade_entries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_grade_entries" ON public.grade_entries;
CREATE POLICY "delete_own_grade_entries" ON public.grade_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- The calculator row stores the latest editable inputs; this table stores each
-- explicit Save Inputs action as an expandable calculation snapshot.
CREATE TABLE IF NOT EXISTS public.gpa_calculation_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  grading_system text NOT NULL CHECK (grading_system IN ('AA', 'A1', 'A')),
  previous_cgpa numeric(4, 3) NOT NULL CHECK (previous_cgpa >= 0 AND previous_cgpa <= 4),
  completed_credits numeric(8, 2) NOT NULL CHECK (completed_credits >= 0),
  courses jsonb NOT NULL CHECK (jsonb_typeof(courses) = 'array'),
  term_gpa numeric(5, 3) NOT NULL,
  new_cgpa numeric(5, 3) NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gpa_calculation_snapshots_user_saved
  ON public.gpa_calculation_snapshots(user_id, saved_at DESC);
ALTER TABLE public.gpa_calculation_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_gpa_calculation_snapshots" ON public.gpa_calculation_snapshots;
CREATE POLICY "select_own_gpa_calculation_snapshots" ON public.gpa_calculation_snapshots
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_gpa_calculation_snapshots" ON public.gpa_calculation_snapshots;
CREATE POLICY "insert_own_gpa_calculation_snapshots" ON public.gpa_calculation_snapshots
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_gpa_calculation_snapshots" ON public.gpa_calculation_snapshots;
CREATE POLICY "delete_own_gpa_calculation_snapshots" ON public.gpa_calculation_snapshots
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
