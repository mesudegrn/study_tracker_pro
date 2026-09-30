import { LayoutDashboard, Grid3x3, GraduationCap, LogOut } from 'lucide-react';
import type { Page } from '@/types';
import { useAuth } from '@/context/AuthContext';
import type { Course } from '@/types';

interface SidebarProps {
  page: Page;
  navigate: (p: Page) => void;
  courses: Course[];
}

export default function Sidebar({ page, navigate, courses }: SidebarProps) {
  const { signOut, user } = useAuth();

  const isCoursePage = (p: Page): p is { type: 'course'; courseId: string } =>
    typeof p === 'object' && p !== null && 'type' in p;

  return (
    <aside className="w-64 shrink-0 bg-[#0e0e16] border-r border-white/5 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-white/5">
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

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <NavItem
          icon={<LayoutDashboard className="w-4 h-4" />}
          label="Dashboard"
          active={page === 'dashboard'}
          onClick={() => navigate('dashboard')}
        />
        <NavItem
          icon={<Grid3x3 className="w-4 h-4" />}
          label="Progress Matrix"
          active={page === 'matrix'}
          onClick={() => navigate('matrix')}
        />

        {courses.length > 0 && (
          <>
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-3 pt-5 pb-2">Courses</p>
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

      <div className="px-3 py-4 border-t border-white/5 space-y-3">
        <div className="px-3">
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
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
