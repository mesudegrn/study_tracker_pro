import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Task, Course, ItemType } from '@/types';
import { ITEM_TYPE_COLORS } from '@/types';

interface DataContextValue {
  tasks: Task[];
  courses: Course[];
  loadingTasks: boolean;
  loadingCourses: boolean;
  refetchTasks: () => void;
  refetchCourses: () => void;
  addTask: (input: { title: string; due_date?: string | null; course_id?: string | null; item_type?: ItemType }) => Promise<void>;
  toggleTask: (id: string, completed: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateCourse: (id: string, updates: Partial<Pick<Course, 'name' | 'color' | 'exam_date'>>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const refetchTasks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setTasks(data ?? []);
    setLoadingTasks(false);
  }, [user]);

  const refetchCourses = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('courses').select('*').eq('user_id', user.id).order('created_at');
    setCourses(data ?? []);
    setLoadingCourses(false);
  }, [user]);

  useEffect(() => { refetchTasks(); }, [refetchTasks]);
  useEffect(() => { refetchCourses(); }, [refetchCourses]);

  const addTask = useCallback(async (input: { title: string; due_date?: string | null; course_id?: string | null; item_type?: ItemType }) => {
    if (!user || !input.title.trim()) return;
    const itemType = input.item_type ?? 'task';
    await supabase.from('tasks').insert({
      user_id: user.id,
      title: input.title.trim(),
      course_id: input.course_id ?? null,
      due_date: input.due_date ?? null,
      item_type: itemType,
      color: ITEM_TYPE_COLORS[itemType],
    });
    refetchTasks();
  }, [user, refetchTasks]);

  const toggleTask = useCallback(async (id: string, completed: boolean) => {
    await supabase.from('tasks').update({ completed }).eq('id', id);
    refetchTasks();
  }, [refetchTasks]);

  const deleteTask = useCallback(async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    refetchTasks();
  }, [refetchTasks]);

  const updateCourse = useCallback(async (id: string, updates: Partial<Pick<Course, 'name' | 'color' | 'exam_date'>>) => {
    await supabase.from('courses').update(updates).eq('id', id);
    refetchCourses();
  }, [refetchCourses]);

  const deleteCourse = useCallback(async (id: string) => {
    await supabase.from('courses').delete().eq('id', id);
    refetchCourses();
  }, [refetchCourses]);

  return (
    <DataContext.Provider value={{ tasks, courses, loadingTasks, loadingCourses, refetchTasks, refetchCourses, addTask, toggleTask, deleteTask, updateCourse, deleteCourse }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
