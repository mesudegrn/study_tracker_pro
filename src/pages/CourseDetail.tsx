import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useMaterials, useStudyLogs } from '@/hooks/useData';
import { useProfile } from '@/hooks/useData';
import { getCurrentWeek, materialProgress, weekProgress, formatMinutes } from '@/lib/utils';
import PomodoroTimer from '@/components/PomodoroTimer';
import StudyAnalytics from '@/components/StudyAnalytics';
import TaskList from '@/components/TaskList';
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
  const { logs, refetch: refetchLogs } = useStudyLogs(user?.id ?? null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ title: '', total: '', week: '' });

  const currentWeek = getCurrentWeek(profile?.semester_start_date ?? null);
  const courseLogs = logs.filter((l) => l.course_id === course.id);
  const totalMinutes = courseLogs.reduce((s, l) => s + l.minutes, 0);

  useEffect(() => {
    if (currentWeek > 0 && expandedWeek === null) setExpandedWeek(currentWeek);
  }, [currentWeek, expandedWeek]);

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
    setExpandedWeek(parseInt(newMaterial.week));
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('dashboard')}
          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color }} />
            <h1 className="text-2xl font-bold text-white tracking-tight">{course.name}</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {formatMinutes(totalMinutes)} studied
            {currentWeek > 0 && ` · Week ${currentWeek}`}
          </p>
        </div>
        <CourseActions course={course} onDelete={() => navigate('dashboard')} />
        {examCountdown !== null && (
          <div className={`px-4 py-2.5 rounded-xl border ${
            examCountdown <= 7
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : examCountdown <= 30
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
          }`}>
            <p className="text-xs opacity-70">Exam Countdown</p>
            <p className="text-lg font-bold">
              {examCountdown > 0 ? `${examCountdown} days` : examCountdown === 0 ? 'Today!' : 'Past'}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Timer + Analytics + Tasks */}
        <div className="space-y-4">
          <PomodoroTimer courseId={course.id} courseName={course.name} onLogged={refetchLogs} />
          <StudyAnalytics logs={courseLogs} courses={[course]} />
          <TaskList courseId={course.id} title={`${course.name} Tasks`} />
        </div>

        {/* Right: Materials by week */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#16161f] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Material Tracking by Week</h3>
              </div>
              <button
                onClick={() => setShowAddMaterial(!showAddMaterial)}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
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
                    className="px-3 py-1.5 bg-cyan-500 text-white text-xs rounded-lg hover:bg-cyan-400 transition-colors"
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
                const isExpanded = expandedWeek === week;
                const isCurrent = week === currentWeek;

                return (
                  <div
                    key={week}
                    className={`rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-cyan-500/5 border-cyan-500/20'
                        : 'bg-white/[0.02] border-white/5'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedWeek(isExpanded ? null : week)}
                      className="w-full flex items-center gap-3 px-4 py-3"
                    >
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-gray-500" />
                        : <ChevronRight className="w-4 h-4 text-gray-500" />}
                      <div className="flex-1 text-left">
                        <span className="text-sm font-medium text-white">Week {week}</span>
                        {isCurrent && <span className="ml-2 text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">Current</span>}
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
      </div>
    </div>
  );
}
