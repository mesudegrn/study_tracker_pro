import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useProfile, useStudyLogs } from '@/hooks/useData';
import { getCurrentWeek } from '@/lib/utils';
import SemesterSetup from '@/components/SemesterSetup';
import TaskList from '@/components/TaskList';
import StudyAnalytics from '@/components/StudyAnalytics';
import CalendarWidget from '@/components/CalendarWidget';
import SmartAlerts from '@/components/SmartAlerts';
import UpcomingExamsQuizzes from '@/components/UpcomingExamsQuizzes';
import CourseQuickAdd from '@/components/CourseQuickAdd';
import { Calendar, BookOpen, Clock, Plus } from 'lucide-react';
import type { Page } from '@/types';

interface DashboardProps {
  navigate: (p: Page) => void;
}

export default function Dashboard({ navigate }: DashboardProps) {
  const { user } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile(user?.id ?? null);
  const { tasks, courses, refetchCourses } = useData();
  const { logs } = useStudyLogs(user?.id ?? null);
  const [showAddCourse, setShowAddCourse] = useState(false);

  if (!profile || !profile.semester_start_date) {
    return <SemesterSetup onDone={refetchProfile} />;
  }

  const currentWeek = getCurrentWeek(profile.semester_start_date);
  const todayMinutes = logs
    .filter((l) => l.log_date === new Date().toISOString().split('T')[0])
    .reduce((s, l) => s + l.minutes, 0);
  const pendingTasks = tasks.filter((t) => !t.completed).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {currentWeek > 0 ? `Week ${currentWeek} of your semester` : 'Semester not started yet'}
          </p>
        </div>
        <button
          onClick={() => setShowAddCourse(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      {showAddCourse && (
        <CourseQuickAdd
          userId={user!.id}
          onDone={() => { setShowAddCourse(false); refetchCourses(); }}
          onCancel={() => setShowAddCourse(false)}
        />
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Calendar className="w-5 h-5" />} label="Current Week" value={currentWeek > 0 ? `Week ${currentWeek}` : 'N/A'} color="cyan" />
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Courses" value={courses.length.toString()} color="emerald" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Today's Study" value={`${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`} color="amber" />
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Pending Tasks" value={pendingTasks.toString()} color="pink" />
      </div>

      {/* Smart Alerts */}
      <SmartAlerts courses={courses} materials={[]} semesterStart={profile.semester_start_date} />

      {/* Analytics */}
      <StudyAnalytics logs={logs} courses={courses} />

      {/* Calendar */}
      <CalendarWidget />

      {/* Tasks + Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TaskList />
        <UpcomingExamsQuizzes />
      </div>

      {/* Courses list */}
      <div className="bg-[#16161f] border border-white/5 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Your Courses</h3>
        {courses.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-6">No courses yet. Click "Add Course" to get started!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate({ type: 'course', courseId: c.id })}
                className="group flex items-center gap-3 p-4 bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${c.color}20` }}>
                  <BookOpen className="w-5 h-5" style={{ color: c.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.name}</p>
                  {c.exam_date && (
                    <p className="text-xs text-gray-500 mt-0.5">Exam: {new Date(c.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    pink: 'text-pink-400 bg-pink-500/10',
  };
  return (
    <div className="bg-[#16161f] border border-white/5 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
