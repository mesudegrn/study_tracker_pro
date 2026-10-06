import { LayoutDashboard, Grid3x3, GraduationCap, LogOut, Settings, BarChart3 } from 'lucide-react';
import type { Page } from '@/types';
import { useAuth } from '@/context/AuthContext';
import type { Course } from '@/types';

interface SidebarProps {
  page: Page;
  navigate: (p: Page) => void;
  courses: Course[];
  onOpenSettings: () => void;
}

export default function Sidebar({ page, navigate, courses, onOpenSettings }: SidebarProps) {
  const { signOut, user } = useAuth();

  const isCoursePage = (p: Page): p is { type: 'course'; courseId: string } =>
    typeof p === 'object' && p !== null && 'type' in p;

  return (
    <aside className="sticky top-0 z-30 flex h-auto w-full shrink-0 flex-col border-b border-white/5 bg-[#0e0e16] lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="border-b border-white/5 px-4 py-3 sm:px-6 lg:py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <GraduationCap className="w-5 h-5 text-[#0a0a0f]" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">Study Tracker</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Academic Progress</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-row gap-1 overflow-x-auto px-3 py-2 lg:flex-1 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:py-4">
        <NavItem
          icon={<LayoutDashboard className="w-4 h-4" />}
          label="Dashboard"
          active={page === 'dashboard'}
          onClick={() => navigate('dashboard')}
        />
        <NavItem
          icon={<BarChart3 className="w-4 h-4" />}
          label="Grades & GPA"
          active={page === 'grades'}
          onClick={() => navigate('grades')}
        />
        <NavItem
          icon={<Grid3x3 className="w-4 h-4" />}
          label="Progress Matrix"
          active={page === 'matrix'}
          onClick={() => navigate('matrix')}
        />

        {courses.length > 0 && (
          <>
            <p className="hidden px-3 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-wider text-gray-600 lg:block">Courses</p>
            {courses.map((c) => (
              <NavItem
                key={c.id}
                icon={<span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />}
                label={c.name}
                active={isCoursePage(page) && page.courseId === c.id}
                onClick={() => navigate({ type: 'course', courseId: c.id })}
              />
            ))}
          </>
        )}
      </nav>

      <div className="flex items-center justify-between gap-2 border-t border-white/5 px-3 py-2 lg:block lg:space-y-3 lg:py-4">
        <div className="hidden px-3 lg:block">
          <p className="truncate text-xs text-gray-500">{user?.email}</p>
        </div>
        <button
          onClick={onOpenSettings}
          className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-400 transition-all hover:bg-white/5 hover:text-white lg:w-full"
        >
          <Settings className="h-4 w-4" /><span>Settings</span>
        </button>
        <button
          onClick={signOut}
          className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-400 transition-all hover:bg-red-500/5 hover:text-red-400 lg:w-full lg:gap-3"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-auto shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all lg:w-full lg:gap-3 ${
        active
          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
          : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
