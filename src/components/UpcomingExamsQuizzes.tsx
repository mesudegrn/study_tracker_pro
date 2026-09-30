import { useData } from '@/context/DataContext';
import type { ItemType } from '@/types';
import { ITEM_TYPE_COLORS, ITEM_TYPE_LABELS } from '@/types';
import { Clock, AlertCircle } from 'lucide-react';

export default function UpcomingExamsQuizzes() {
  const { tasks, courses } = useData();
  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const upcoming = tasks
    .filter((t) => (t.item_type === 'exam' || t.item_type === 'quiz') && t.due_date && t.due_date >= todayStr)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1));

  return (
    <div className="bg-[#16161f] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-4 h-4 text-red-400" />
        <h3 className="text-sm font-semibold text-white">Upcoming Exams & Quizzes</h3>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-6">No upcoming exams or quizzes. You're all caught up!</p>
      ) : (
        <div className="space-y-2">
          {upcoming.map((t) => {
            const type = t.item_type as ItemType;
            const color = t.color ?? ITEM_TYPE_COLORS[type];
            const course = t.course_id ? courseMap.get(t.course_id) : null;
            const dueDate = new Date(t.due_date! + 'T00:00:00');
            const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const isUrgent = diffDays <= 3;

            return (
              <div
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-lg border transition-all"
                style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <span className="text-[10px] font-bold" style={{ color }}>
                    {ITEM_TYPE_LABELS[type].slice(0, 1)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{t.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-medium" style={{ color }}>{ITEM_TYPE_LABELS[type]}</span>
                    {course && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: course.color }} />
                        {course.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`flex items-center gap-1 text-xs font-medium ${isUrgent ? 'text-red-400' : 'text-gray-400'}`}>
                    <Clock className="w-3 h-3" />
                    {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `${diffDays}d`}
                  </div>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
