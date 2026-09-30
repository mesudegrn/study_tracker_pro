/*
# Study & Academic Progress Tracker — Full Schema

1. Purpose
   Multi-user academic tracker with auth. Each user has a profile (semester start date),
   courses, granular per-week materials, tasks, LMS-style announcements, and study logs
   (from Pomodoro / stopwatch timers) that feed analytics.

2. New Tables
   - profiles: user_id (PK, FK auth.users), semester_start_date (date), created_at
   - courses: id, user_id (FK auth.users), name, color, exam_date, created_at
   - materials: id, course_id (FK courses), week_number, title, total_pages, current_page, created_at
   - tasks: id, user_id, title, course_id (nullable FK), due_date (nullable), completed, created_at
   - announcements: id, user_id, title, body, course_id (nullable FK), deadline (nullable), created_at
   - study_logs: id, user_id, course_id (nullable FK), log_date (date), minutes (int), mode (text: pomodoro|stopwatch), created_at

3. Relationships
   - courses.user_id -> auth.users.id (CASCADE)
   - materials.course_id -> courses.id (CASCADE)
   - tasks.course_id -> courses.id (SET NULL)
   - announcements.course_id -> courses.id (SET NULL)
   - study_logs.course_id -> courses.id (SET NULL)
   - study_logs.user_id -> auth.users.id (CASCADE)
   - tasks.user_id -> auth.users.id (CASCADE)
   - announcements.user_id -> auth.users.id (CASCADE)
   - profiles.user_id -> auth.users.id (CASCADE)

4. Security
   - RLS enabled on every table.
   - profiles: owner-scoped CRUD (user_id = auth.uid()).
   - courses: owner-scoped CRUD.
   - materials: CRUD scoped through parent course ownership (EXISTS check against courses).
   - tasks: owner-scoped CRUD.
   - announcements: owner-scoped CRUD.
   - study_logs: owner-scoped CRUD.
   - All owner columns default to auth.uid() so client inserts that omit user_id succeed.

5. Indexes
   - materials by course_id
   - tasks by user_id
   - announcements by user_id
   - study_logs by user_id + log_date
   - courses by user_id
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  semester_start_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- courses
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#22d3ee',
  exam_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
DROP POLICY IF EXISTS "select_own_courses" ON courses;
CREATE POLICY "select_own_courses" ON courses FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_courses" ON courses;
CREATE POLICY "insert_own_courses" ON courses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_courses" ON courses;
CREATE POLICY "update_own_courses" ON courses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_courses" ON courses;
CREATE POLICY "delete_own_courses" ON courses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- materials
CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  week_number int NOT NULL,
  title text NOT NULL,
  total_pages int NOT NULL DEFAULT 1,
  current_page int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_materials_course_id ON materials(course_id);
DROP POLICY IF EXISTS "select_own_materials" ON materials;
CREATE POLICY "select_own_materials" ON materials FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM courses c WHERE c.id = materials.course_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_materials" ON materials;
CREATE POLICY "insert_own_materials" ON materials FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM courses c WHERE c.id = materials.course_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_materials" ON materials;
CREATE POLICY "update_own_materials" ON materials FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM courses c WHERE c.id = materials.course_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM courses c WHERE c.id = materials.course_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_materials" ON materials;
CREATE POLICY "delete_own_materials" ON materials FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM courses c WHERE c.id = materials.course_id AND c.user_id = auth.uid()));

-- tasks
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  due_date date,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks" ON tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks" ON tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- announcements
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  deadline date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_announcements_user_id ON announcements(user_id);
DROP POLICY IF EXISTS "select_own_announcements" ON announcements;
CREATE POLICY "select_own_announcements" ON announcements FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_announcements" ON announcements;
CREATE POLICY "insert_own_announcements" ON announcements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_announcements" ON announcements;
CREATE POLICY "update_own_announcements" ON announcements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_announcements" ON announcements;
CREATE POLICY "delete_own_announcements" ON announcements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- study_logs
CREATE TABLE IF NOT EXISTS study_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  minutes int NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'pomodoro',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_study_logs_user_date ON study_logs(user_id, log_date);
DROP POLICY IF EXISTS "select_own_study_logs" ON study_logs;
CREATE POLICY "select_own_study_logs" ON study_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_study_logs" ON study_logs;
CREATE POLICY "insert_own_study_logs" ON study_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_study_logs" ON study_logs;
CREATE POLICY "update_own_study_logs" ON study_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_study_logs" ON study_logs;
CREATE POLICY "delete_own_study_logs" ON study_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
