import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Course, StudyLog, Profile } from '@/types';

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    setProfile(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { profile, refetch, loading };
}

export function useCourses(userId: string | null) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('courses').select('*').eq('user_id', userId).order('created_at');
    setCourses(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { courses, refetch, loading };
}

export function useStudyLogs(userId: string | null) {
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('study_logs').select('*').eq('user_id', userId).order('log_date', { ascending: false });
    setLogs(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { logs, refetch, loading };
}

export function useMaterials(courseId: string | null) {
  const [materials, setMaterials] = useState<import('@/types').Material[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!courseId) return;
    const { data } = await supabase.from('materials').select('*').eq('course_id', courseId).order('week_number');
    setMaterials(data ?? []);
    setLoading(false);
  }, [courseId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { materials, refetch, loading };
}
