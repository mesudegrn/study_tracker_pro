-- Keep the existing minutes field for current dashboard and chart analytics,
-- while recording precise elapsed time and an optional topic for session history.
ALTER TABLE public.study_logs
  ADD COLUMN IF NOT EXISTS session_title text,
  ADD COLUMN IF NOT EXISTS duration_seconds integer;

UPDATE public.study_logs
SET duration_seconds = minutes * 60
WHERE duration_seconds IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'study_logs_duration_seconds_nonnegative'
      AND conrelid = 'public.study_logs'::regclass
  ) THEN
    ALTER TABLE public.study_logs
      ADD CONSTRAINT study_logs_duration_seconds_nonnegative
      CHECK (duration_seconds IS NULL OR duration_seconds >= 0);
  END IF;
END;
$$;
