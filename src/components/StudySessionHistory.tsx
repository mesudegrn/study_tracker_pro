import { useMemo, useState } from 'react';
import { BookOpen, Clock3, History, Trash2 } from 'lucide-react';
import type { StudyLog } from '@/types';

interface Props {
  logs: StudyLog[];
  onDelete: (logId: string) => Promise<string | null>;
  accentColor?: string;
}

function getDurationSeconds(log: StudyLog): number {
  return log.duration_seconds ?? log.minutes * 60;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  return `${remainingSeconds}s`;
}

export default function StudySessionHistory({ logs, onDelete, accentColor = '#22d3ee' }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const chronologicalLogs = useMemo(
    () => [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [logs],
  );
  const topicSummaries = useMemo(() => {
    const summaries = new Map<string, { title: string; seconds: number; sessions: number; pomodoros: number }>();
    for (const log of logs) {
      const title = log.session_title?.trim() || 'Untitled sessions';
      const key = title.toLocaleLowerCase();
      const summary = summaries.get(key) ?? { title, seconds: 0, sessions: 0, pomodoros: 0 };
      summary.seconds += getDurationSeconds(log);
      summary.sessions += 1;
      if (log.mode === 'pomodoro') summary.pomodoros += 1;
      summaries.set(key, summary);
    }
    return Array.from(summaries.values()).sort((a, b) => b.seconds - a.seconds);
  }, [logs]);

  const deleteSession = async (logId: string) => {
    setDeletingId(logId);
    setDeleteError('');
    const error = await onDelete(logId);
    setDeletingId(null);
    if (error) setDeleteError(error);
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-white/5 bg-[#16161f]">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-4">
        <History className="h-4 w-4" style={{ color: accentColor }} />
        <div>
          <h2 className="text-sm font-semibold text-white">Study Analytics &amp; History</h2>
          <p className="text-xs text-gray-500">Sessions and time by topic</p>
        </div>
      </div>

      {deleteError && <p role="alert" className="border-b border-red-500/15 bg-red-500/[0.06] px-4 py-2 text-xs text-red-300">{deleteError}</p>}

      {logs.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-600">Your study sessions will appear here.</p>
      ) : (
        <div className="divide-y divide-white/5">
          <div className="max-h-72 overflow-y-auto px-4 py-2">
            <h3 className="mb-1 flex items-center gap-2 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Clock3 className="h-3.5 w-3.5" /> Recent sessions
            </h3>
            {chronologicalLogs.map((log) => (
              <article key={log.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-gray-200">{log.session_title?.trim() || 'Untitled session'}</p>
                  <p className="mt-1 text-[10px] text-gray-600">
                    {new Date(log.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    {' · '}{log.mode === 'pomodoro' ? 'Pomodoro' : log.mode === 'stopwatch' ? 'Stopwatch' : 'Manual'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold tabular-nums" style={{ color: accentColor }}>
                    {formatDuration(getDurationSeconds(log))}
                  </span>
                  <button
                    type="button"
                    onClick={() => void deleteSession(log.id)}
                    disabled={deletingId !== null}
                    aria-label={`Delete study session ${log.session_title?.trim() || 'Untitled session'}`}
                    title="Delete session"
                    className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-wait disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="px-4 py-2">
            <h3 className="mb-1 flex items-center gap-2 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <BookOpen className="h-3.5 w-3.5" /> Time by topic
            </h3>
            {topicSummaries.map((summary) => (
              <article key={summary.title.toLocaleLowerCase()} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-gray-200">{summary.title}</p>
                  <p className="mt-1 text-[10px] text-gray-600">
                    {summary.pomodoros} Pomodoro{summary.pomodoros === 1 ? '' : 's'} · {summary.sessions} session{summary.sessions === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-300">
                  {formatDuration(summary.seconds)}
                </span>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
