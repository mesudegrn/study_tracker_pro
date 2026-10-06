import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DataProvider, useData } from '@/context/DataContext';
import { useProfile } from '@/hooks/useData';
import Sidebar from '@/components/Sidebar';
import AuthScreen from '@/components/AuthScreen';
import Dashboard from '@/pages/Dashboard';
import ProgressMatrix from '@/pages/ProgressMatrix';
import CourseDetail from '@/pages/CourseDetail';
import Grades from '@/pages/Grades';
import SettingsModal from '@/components/SettingsModal';
import type { Page } from '@/types';

function AppContent() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const { courses } = useData();
  const { profile, refetch: refetchProfile } = useProfile(session?.user.id ?? null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  const navigate = (p: Page) => setPage(p);
  const isCoursePage = (p: Page): p is { type: 'course'; courseId: string } =>
    typeof p === 'object' && p !== null && 'type' in p;

  const activeCourse = isCoursePage(page) ? courses.find((c) => c.id === page.courseId) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col lg:flex-row">
      <Sidebar page={page} navigate={navigate} courses={courses} onOpenSettings={() => setShowSettings(true)} />
      <main className="flex-1 min-w-0">
        <header className="border-b border-white/5 px-4 py-3 sm:px-6">
          <p className="text-sm font-medium text-white">
            Welcome, {profile?.full_name ?? String(session.user.user_metadata?.full_name ?? session.user.email?.split('@')[0] ?? 'there')} 👋
          </p>
        </header>
        {isCoursePage(page) && activeCourse ? (
          <CourseDetail course={activeCourse} navigate={navigate} />
        ) : isCoursePage(page) ? (
          <div className="p-6">
            <p className="text-sm text-gray-500">Course not found.</p>
          </div>
        ) : page === 'matrix' ? (
          <ProgressMatrix navigate={navigate} />
        ) : page === 'grades' ? (
          <Grades />
        ) : (
          <Dashboard navigate={navigate} />
        )}
      </main>
      {showSettings && (
        <SettingsModal
          semesterStartDate={profile?.semester_start_date ?? null}
          onClose={() => setShowSettings(false)}
          onSaved={() => { void refetchProfile(); }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
