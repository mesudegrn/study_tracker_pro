import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Course, StudyLog, Profile } from '@/types';

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async (): Promise<string | null> => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
      if (error) {
        console.error('Unable to load profile:', error.message);
        return error.message;
      }
      setProfile(data);
      return null;
    } catch (error) {
      console.error('Unable to load profile:', error);
      return error instanceof Error ? error.message : 'Unable to load profile.';
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refetch();
    const onProfileUpdated = () => { void refetch(); };
    window.addEventListener('study-tracker:profile-updated', onProfileUpdated);
    return () => window.removeEventListener('study-tracker:profile-updated', onProfileUpdated);
  }, [refetch]);
  return { profile, refetch, loading };
}

export function useCourses(userId: string | null) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setCourses([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('courses').select('*').eq('user_id', userId).order('created_at');
    if (error) console.error('Unable to load courses:', error.message);
    else setCourses(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { courses, refetch, loading };
}

export function useStudyLogs(userId: string | null) {
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setLogs([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('study_logs').select('*').eq('user_id', userId).order('log_date', { ascending: false });
    if (error) console.error('Unable to load study logs:', error.message);
    else setLogs(data ?? []);
    setLoading(false);
  }, [userId]);

  const deleteLog = useCallback(async (id: string): Promise<string | null> => {
    if (!userId) return 'You must be signed in to delete a study session.';

    setLogs((current) => current.filter((log) => log.id !== id));
    try {
      const { error } = await supabase
        .from('study_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) {
        console.error('Unable to delete study log:', error.message);
        await refetch();
        return error.message;
      }
      return null;
    } catch (error) {
      console.error('Unable to delete study log:', error);
      await refetch();
      return error instanceof Error ? error.message : 'Unable to delete study session.';
    }
  }, [userId, refetch]);

  useEffect(() => { refetch(); }, [refetch]);
  return { logs, refetch, deleteLog, loading };
}

export function useMaterials(courseId: string | null) {
  const [materials, setMaterials] = useState<import('@/types').Material[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!courseId) {
      setMaterials([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('materials').select('*').eq('course_id', courseId).order('week_number');
    if (error) console.error('Unable to load materials:', error.message);
    else setMaterials(data ?? []);
    setLoading(false);
  }, [courseId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { materials, refetch, loading };
}
