import { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Course } from '@/types';
import { localDateString } from '@/lib/utils';

interface Props {
  courses: Course[];
  onLogged: () => void;
  initialCourseId?: string;
  accentColor?: string;
}

export default function ManualStudyEntry({ courses, onLogged, initialCourseId = '', accentColor = '#22d3ee' }: Props) {
  const { user } = useAuth();
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');
  const [sessionTitle, setSessionTitle] = useState('');
  const [courseId, setCourseId] = useState(initialCourseId);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || totalMinutes <= 0 || Number(minutes) < 0 || Number(minutes) > 59 || Number(hours) < 0) return;
    setBusy(true);
    setMessage('');
    try {
      const { error } = await supabase.from('study_logs').insert({
        user_id: user.id,
        course_id: courseId || null,
        log_date: localDateString(),
        minutes: totalMinutes,
        duration_seconds: totalMinutes * 60,
        session_title: sessionTitle.trim() || null,
        mode: 'manual',
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setHours('0');
      setMinutes('30');
      setSessionTitle('');
      setMessage('Study time added to your analytics.');
      onLogged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save study time.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="flex min-w-0 flex-col gap-4 rounded-2xl border border-white/5 bg-[#16161f] p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" style={{ color: accentColor }} />
        <div>
          <h2 className="text-sm font-semibold text-white">Log study time</h2>
          <p className="text-xs text-gray-500">Add a session manually to your global analytics</p>
        </div>
      </div>
      <label className="text-xs text-gray-500">Topic / task title (optional)
        <input type="text" maxLength={120} value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="e.g. Chapter 2 review" className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none" />
      </label>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_1fr_1.5fr_auto]">
        <label className="text-xs text-gray-500">Hours
          <input type="number" min="0" max="999" step="1" value={hours} onChange={(e) => setHours(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none" />
        </label>
        <label className="text-xs text-gray-500">Minutes
          <input type="number" min="0" max="59" step="1" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none" />
        </label>
        <label className="col-span-2 text-xs text-gray-500 md:col-span-1">Course
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none">
            <option value="">Unassigned study</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          </select>
        </label>
        <button type="submit" disabled={busy || totalMinutes <= 0} style={{ backgroundColor: accentColor }} className="col-span-2 flex items-center justify-center gap-2 self-end rounded-xl px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50 md:col-span-1">
          <Plus className="h-4 w-4" /> {busy ? 'Saving...' : 'Add time'}
        </button>
      </div>
      {message && <p role={message.startsWith('Study time') ? 'status' : 'alert'} className={`text-xs ${message.startsWith('Study time') ? 'text-emerald-400' : 'text-red-400'}`}>{message}</p>}
    </form>
  );
}
