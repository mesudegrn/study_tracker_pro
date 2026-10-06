-- Reconcile profile and grade schema across fresh installs and partially applied
-- earlier migrations. Signup metadata is copied into the owner-scoped profile.

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  semester_start_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS semester_start_date date,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.profiles AS p
SET full_name = COALESCE(NULLIF(p.full_name, ''), NULLIF(u.raw_user_meta_data->>'full_name', '')),
    semester_start_date = COALESCE(
      p.semester_start_date,
      NULLIF(u.raw_user_meta_data->>'semester_start_date', '')::date
    )
FROM auth.users AS u
WHERE u.id = p.user_id
  AND (
    p.full_name IS NULL OR p.full_name = ''
    OR p.semester_start_date IS NULL
  );

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_profile" ON public.profiles;
CREATE POLICY "delete_own_profile" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

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
    UPDATE public.grade_entries
    SET type = COALESCE(type, assessment_type, 'Other')
    WHERE type IS NULL;
    ALTER TABLE public.grade_entries ALTER COLUMN assessment_type SET DEFAULT 'Other';
    ALTER TABLE public.grade_entries ALTER COLUMN assessment_type DROP NOT NULL;
  ELSE
    UPDATE public.grade_entries SET type = 'Other' WHERE type IS NULL;
  END IF;
END;
$$;

ALTER TABLE public.grade_entries
  ALTER COLUMN type SET DEFAULT 'Other',
  ALTER COLUMN type SET NOT NULL;
ALTER TABLE public.grade_entries DROP CONSTRAINT IF EXISTS grade_entries_type_check;
ALTER TABLE public.grade_entries
  ADD CONSTRAINT grade_entries_type_check
  CHECK (type IN ('Quiz', 'Midterm', 'Case', 'Homework', 'Other'));

CREATE INDEX IF NOT EXISTS idx_grade_entries_user_course
  ON public.grade_entries(user_id, course_id);
ALTER TABLE public.grade_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_grade_entries" ON public.grade_entries;
CREATE POLICY "select_own_grade_entries" ON public.grade_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_grade_entries" ON public.grade_entries;
CREATE POLICY "insert_own_grade_entries" ON public.grade_entries
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "update_own_grade_entries" ON public.grade_entries;
CREATE POLICY "update_own_grade_entries" ON public.grade_entries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "delete_own_grade_entries" ON public.grade_entries;
CREATE POLICY "delete_own_grade_entries" ON public.grade_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, semester_start_date)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', '')
    ),
    NULLIF(NEW.raw_user_meta_data->>'semester_start_date', '')::date
  )
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
      semester_start_date = COALESCE(EXCLUDED.semester_start_date, public.profiles.semester_start_date),
      updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

NOTIFY pgrst, 'reload schema';
