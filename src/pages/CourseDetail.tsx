import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useMaterials, useStudyLogs } from '@/hooks/useData';
import { useProfile } from '@/hooks/useData';
import { getCurrentWeek, materialProgress, weekProgress, formatMinutes } from '@/lib/utils';
import PomodoroTimer from '@/components/PomodoroTimer';
import StudyAnalytics from '@/components/StudyAnalytics';
import StudySessionHistory from '@/components/StudySessionHistory';
import TaskList from '@/components/TaskList';
import ManualStudyEntry from '@/components/ManualStudyEntry';
import CourseActions from '@/components/CourseActions';
import { ArrowLeft, Trash2, BookOpen, ChevronRight, ChevronDown, Sparkles, Plus } from 'lucide-react';
import type { Page, Course, Material } from '@/types';

interface Props {
  course: Course;
  navigate: (p: Page) => void;
}

export default function CourseDetail({ course, navigate }: Props) {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id ?? null);
  const { materials, refetch: refetchMaterials } = useMaterials(course.id);
  const { logs, refetch: refetchLogs, deleteLog } = useStudyLogs(user?.id ?? null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(() => new Set());
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ title: '', total: '', week: '' });

  const currentWeek = getCurrentWeek(profile?.semester_start_date ?? null);
  const courseLogs = logs.filter((l) => l.course_id === course.id);
  const totalMinutes = courseLogs.reduce((s, l) => s + l.minutes, 0);

  useEffect(() => {
    if (currentWeek > 0) {
      setExpandedWeeks((weeks) => weeks.has(currentWeek) ? weeks : new Set(weeks).add(currentWeek));
    }
  }, [currentWeek]);

  const allWeeks = Array.from(new Set(materials.map((m) => m.week_number))).sort((a, b) => a - b);

  const updateMaterial = useCallback(async (id: string, updates: Partial<Material>) => {
    await supabase.from('materials').update(updates).eq('id', id);
    refetchMaterials();
  }, [refetchMaterials]);

  const addMaterial = async () => {
    if (!newMaterial.title.trim() || !newMaterial.week) return;
    await supabase.from('materials').insert({
      course_id: course.id,
      week_number: parseInt(newMaterial.week),
      title: newMaterial.title.trim(),
      total_pages: parseInt(newMaterial.total) || 1,
      current_page: 0,
    });
    setNewMaterial({ title: '', total: '', week: '' });
    setShowAddMaterial(false);
    setExpandedWeeks((weeks) => new Set(weeks).add(parseInt(newMaterial.week)));
    refetchMaterials();
  };

  const deleteMaterial = async (id: string) => {
    await supabase.from('materials').delete().eq('id', id);
    refetchMaterials();
  };

  const examCountdown = course.exam_date
    ? Math.ceil((new Date(course.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <button
          onClick={() => navigate('dashboard')}
          style={{ color: course.color }}
          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color }} />
            <h1 className="text-2xl font-bold text-white tracking-tight">{course.name}</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {formatMinutes(totalMinutes)} studied
            {currentWeek > 0 && ` · Week ${currentWeek}`}
          </p>
        </div>
        <CourseActions course={course} onDelete={() => navigate('dashboard')} accentColor={course.color} />
        {examCountdown !== null && (
          <div className={`px-4 py-2.5 rounded-xl border ${
            examCountdown <= 7
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : examCountdown <= 30
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-cyan-500/10 border-cyan-500/20'
          }`}>
            <p className="text-xs opacity-70" style={examCountdown > 30 ? { color: course.color } : undefined}>Exam Countdown</p>
            <p className="text-lg font-bold" style={examCountdown > 30 ? { color: course.color } : undefined}>
              {examCountdown > 0 ? `${examCountdown} days` : examCountdown === 0 ? 'Today!' : 'Past'}
            </p>
          </div>
        )}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <StudyAnalytics logs={courseLogs} courses={[course]} hideCoursePie accentColor={course.color} />
          <div className="bg-[#16161f] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: course.color }} />
                <h3 className="text-sm font-semibold text-white">Material Tracking by Week</h3>
              </div>
              <button
                onClick={() => setShowAddMaterial(!showAddMaterial)}
                style={{ color: course.color }}
                className="flex items-center gap-1 text-xs transition-colors hover:brightness-125"
              >
                <Plus className="w-4 h-4" />
                Add Material
              </button>
            </div>

            {/* Add Material Form */}
            {showAddMaterial && (
              <div className="mb-4 space-y-2 bg-[#0a0a0f] rounded-xl p-3 border border-white/5">
                <input
                  type="text"
                  placeholder="Material name (e.g. Chapter 4 Slides)"
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Total pages"
                    min={1}
                    value={newMaterial.total}
                    onChange={(e) => setNewMaterial({ ...newMaterial, total: e.target.value })}
                    className="flex-1 bg-[#16161f] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Week #"
                    min={1}
                    value={newMaterial.week}
                    onChange={(e) => setNewMaterial({ ...newMaterial, week: e.target.value })}
                    className="w-20 bg-[#16161f] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none"
                  />
                  <button
                    onClick={addMaterial}
                    style={{ backgroundColor: course.color }}
                    className="px-3 py-1.5 text-xs text-white rounded-lg transition-colors hover:brightness-110"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {allWeeks.length === 0 && !showAddMaterial && (
              <p className="text-sm text-gray-600 text-center py-6">No materials yet. Click "Add Material" to get started!</p>
            )}

            <div className="space-y-2">
              {allWeeks.map((week) => {
                const weekMats = materials.filter((m) => m.week_number === week);
                const pct = weekProgress(materials, week);
                const isExpanded = expandedWeeks.has(week);
                const isCurrent = week === currentWeek;

                return (
                  <div
                    key={week}
                    className={`rounded-xl border transition-all ${
                      isCurrent
                        ? 'border-white/10'
                        : 'bg-white/[0.02] border-white/5'
                    }`}
                    style={isCurrent ? { backgroundColor: `${course.color}0d`, borderColor: `${course.color}35` } : undefined}
                  >
                    <button
                      onClick={() => setExpandedWeeks((weeks) => {
                        const next = new Set(weeks);
                        if (next.has(week)) next.delete(week);
                        else next.add(week);
                        return next;
                      })}
                      className="w-full flex items-center gap-3 px-4 py-3"
                    >
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-gray-500" />
                        : <ChevronRight className="w-4 h-4 text-gray-500" />}
                      <div className="flex-1 text-left">
                        <span className="text-sm font-medium text-white">Week {week}</span>
                        {isCurrent && <span className="ml-2 rounded px-1.5 py-0.5 text-[10px]" style={{ color: course.color, backgroundColor: `${course.color}1a` }}>Current</span>}
                      </div>
                      {pct >= 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct === 100 ? 'bg-emerald-400' : pct > 0 ? 'bg-amber-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium w-10 text-right ${
                            pct === 100 ? 'text-emerald-400' : pct > 0 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {pct}%
                          </span>
                        </div>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2">
                        {weekMats.length === 0 && (
                          <p className="text-xs text-gray-600 py-2">No materials for this week yet.</p>
                        )}
                        {weekMats.map((m) => {
                          const mp = materialProgress(m);
                          const isComplete = mp === 100;
                          return (
                            <div
                              key={m.id}
                              className={`group flex items-center gap-3 p-3 rounded-lg transition-all ${
                                isComplete
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                                  : 'bg-[#0a0a0f] border border-white/5'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-white truncate">{m.title}</p>
                                  {isComplete && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isComplete ? 'bg-emerald-400' : mp > 0 ? 'bg-amber-400' : 'bg-red-400'
                                      }`}
                                      style={{ width: `${mp}%` }}
                                    />
                                  </div>
                                  <span className={`text-xs font-medium ${isComplete ? 'text-emerald-400' : 'text-gray-400'}`}>
                                    {m.current_page}/{m.total_pages}
                                  </span>
                                </div>
                              </div>

                              {/* Direct number input */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <input
                                  type="number"
                                  min={0}
                                  max={m.total_pages}
                                  value={m.current_page}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    updateMaterial(m.id, {
                                      current_page: Math.max(0, Math.min(m.total_pages, val)),
                                    });
                                  }}
                                  className="w-14 bg-[#0a0a0f] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-cyan-500/50 transition-all"
                                />
                                <span className="text-xs text-gray-500">/ {m.total_pages}</span>
                                <button
                                  onClick={() => deleteMaterial(m.id)}
                                  className="ml-1 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 flex items-center justify-center transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <aside className="min-w-0 space-y-4">
          <PomodoroTimer courseId={course.id} courseName={course.name} onLogged={() => { void refetchLogs(); }} accentColor={course.color} />
          <ManualStudyEntry courses={[course]} initialCourseId={course.id} onLogged={() => { void refetchLogs(); }} accentColor={course.color} />
          <TaskList courseId={course.id} title={`${course.name} Tasks`} accentColor={course.color} />
          <StudySessionHistory logs={courseLogs} onDelete={deleteLog} accentColor={course.color} />
        </aside>
      </div>
    </div>
  );
}
