import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useProfile } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { getCurrentWeek, courseWeekProgress, progressColor, progressGlow } from '@/lib/utils';
import { Grid3x3 } from 'lucide-react';
import type { Page } from '@/types';

interface Props {
  navigate: (p: Page) => void;
}

export default function ProgressMatrix({ navigate }: Props) {
  const { user } = useAuth();
  const { courses } = useData();
  const { profile } = useProfile(user?.id ?? null);
  const [view, setView] = useState<'last4' | 'all'>('all');

  const currentWeek = getCurrentWeek(profile?.semester_start_date ?? null);

  // Fetch all materials for all courses
  const [allMaterials, setAllMaterials] = useState<import('@/types').Material[]>([]);
  useEffect(() => {
    if (courses.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from('materials')
        .select('*')
        .in('course_id', courses.map((c) => c.id));
      setAllMaterials(data ?? []);
    })();
  }, [courses]);

  // Collect all week numbers
  const allWeeks = useMemo(() => {
    const weeks = new Set<number>();
    for (const m of allMaterials) weeks.add(m.week_number);
    if (currentWeek > 0) {
      weeks.add(currentWeek);
      weeks.add(currentWeek + 1);
    }
    return Array.from(weeks).sort((a, b) => a - b);
  }, [allMaterials, currentWeek]);

  const displayWeeks = view === 'last4' && currentWeek > 0
    ? allWeeks.filter((w) => w >= currentWeek - 3 && w <= currentWeek)
    : allWeeks;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Progress Matrix</h1>
          <p className="text-sm text-gray-500 mt-1">Course progress across all weeks</p>
        </div>
        <div className="flex gap-1 bg-[#16161f] border border-white/5 rounded-xl p-1">
          {(['last4', 'all'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                view === v ? 'bg-cyan-500 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {v === 'last4' ? 'Last 4 Weeks' : 'All Weeks'}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-red-500/30 bg-red-500/20" />
          <span className="text-gray-500">Not started (0%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-amber-500/30 bg-amber-500/20" />
          <span className="text-gray-500">In progress (1-99%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-emerald-500/30 bg-emerald-500/20" />
          <span className="text-gray-500">Complete (100%)</span>
        </div>
      </div>

      {/* Matrix */}
      <div className="bg-[#16161f] border border-white/5 rounded-2xl p-5 overflow-x-auto">
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Grid3x3 className="w-12 h-12 text-gray-700 mb-3" />
            <p className="text-sm text-gray-600">No courses yet. Add courses from the dashboard to see the matrix.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4 sticky left-0 bg-[#16161f]">Course</th>
                {displayWeeks.map((w) => (
                  <th
                    key={w}
                    className={`text-center text-xs font-medium pb-3 px-2 min-w-[64px] ${
                      w === currentWeek ? 'text-cyan-400' : 'text-gray-500'
                    }`}
                  >
                    Week {w}
                    {w === currentWeek && <span className="block text-[9px] text-cyan-500 mt-0.5">Current</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => {
                const courseMats = allMaterials.filter((m) => m.course_id === c.id);
                return (
                  <tr key={c.id} className="border-t border-white/5">
                    <td className="py-3 pr-4 sticky left-0 bg-[#16161f]">
                      <button
                        onClick={() => navigate({ type: 'course', courseId: c.id })}
                        className="flex items-center gap-2 group"
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors truncate max-w-[160px]">{c.name}</span>
                      </button>
                    </td>
                    {displayWeeks.map((w) => {
                      const pct = courseWeekProgress(c, courseMats, w);
                      return (
                        <td key={w} className="text-center py-3 px-2">
                          <div
                            className={`w-12 h-12 mx-auto rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${progressColor(pct)} ${progressGlow(pct)}`}
                          >
                            {pct >= 0 ? `${pct}%` : '—'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {courses.length > 0 && (
        <p className="text-xs text-gray-600 text-center">
          Click any course name to open its detail page and manage materials for each week.
        </p>
      )}
    </div>
  );
}
