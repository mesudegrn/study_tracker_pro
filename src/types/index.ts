export interface Profile {
  user_id: string;
  full_name: string | null;
  semester_start_date: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  name: string;
  color: string;
  exam_date: string | null;
  created_at: string;
}

export interface Material {
  id: string;
  course_id: string;
  week_number: number;
  title: string;
  total_pages: number;
  current_page: number;
  created_at: string;
}

export type ItemType = 'task' | 'exam' | 'quiz' | 'event';

export const ITEM_TYPE_COLORS: Record<ItemType, string> = {
  exam: '#f43f5e',
  quiz: '#fb923c',
  task: '#22d3ee',
  event: '#a78bfa',
};

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  exam: 'Exam',
  quiz: 'Quiz',
  task: 'Task',
  event: 'Event',
};

export interface Task {
  id: string;
  user_id: string;
  title: string;
  course_id: string | null;
  due_date: string | null;
  completed: boolean;
  item_type: ItemType;
  color: string | null;
  created_at: string;
}

export interface StudyLog {
  id: string;
  user_id: string;
  course_id: string | null;
  log_date: string;
  minutes: number;
  duration_seconds: number | null;
  session_title: string | null;
  mode: string;
  created_at: string;
}

export const COURSE_COLORS = [
  '#22d3ee', '#34d399', '#f59e0b', '#f472b6',
  '#a78bfa', '#fb7185', '#60a5fa', '#fbbf24',
  '#2dd4bf', '#c084fc', '#fb923c', '#4ade80',
];

export type Page = 'dashboard' | 'matrix' | 'grades' | { type: 'course'; courseId: string };
