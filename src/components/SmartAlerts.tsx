import type { Course, Material } from '@/types';
import { getCurrentWeek, courseWeekProgress } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  courses: Course[];
  materials: Material[];
  semesterStart: string | null;
}

export default function SmartAlerts({ courses, materials, semesterStart }: Props) {
  const currentWeek = getCurrentWeek(semesterStart);

  if (currentWeek === 0 || courses.length === 0) return null;

  const alerts = courses.map((c) => {
    const progress = courseWeekProgress(c, materials, currentWeek);
    return { course: c, progress };
  }).filter((a) => a.progress >= 0);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map(({ course, progress }) => {
        if (progress >= 100) {
          return (
            <div
              key={course.id}
              className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm text-emerald-300">
                  <span className="font-semibold">{course.name}</span> — You're ahead! Week {currentWeek} is 100% complete.
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
            </div>
          );
        }

        if (progress < 0 || progress < 50) {
          return (
            <div
              key={course.id}
              className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="text-sm text-red-300">
                  <span className="font-semibold">{course.name}</span> — You're behind for Week {currentWeek} ({Math.max(progress, 0)}% complete).
                </p>
              </div>
              <TrendingDown className="w-4 h-4 text-red-400 ml-auto shrink-0" />
            </div>
          );
        }

        return (
          <div
            key={course.id}
            className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl"
          >
            <TrendingUp className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm text-amber-300">
                <span className="font-semibold">{course.name}</span> — On track for Week {currentWeek} ({progress}% complete).
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
