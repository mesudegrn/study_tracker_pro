import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatTime, localDateString } from '@/lib/utils';
import { Play, Pause, RotateCcw, Timer, Clock, Plus, Minus, Save, CheckCircle2 } from 'lucide-react';

interface Props {
  courseId: string;
  courseName: string;
  onLogged: () => void;
  accentColor?: string;
}

type Mode = 'stopwatch' | 'pomodoro';

export default function PomodoroTimer({ courseId, courseName, onLogged, accentColor = '#22d3ee' }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('pomodoro');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [pomodoroWork, setPomodoroWork] = useState(25);
  const [pomodoroBreak, setPomodoroBreak] = useState(5);
  const [isBreak, setIsBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [sessionTitle, setSessionTitle] = useState('');
  const [logError, setLogError] = useState('');
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const runningRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const sessionTitleRef = useRef('');

  const totalSeconds = isBreak ? pomodoroBreak * 60 : pomodoroWork * 60;
  const remaining = mode === 'pomodoro' ? Math.max(0, totalSeconds - elapsed) : elapsed;
  const readElapsed = useCallback(() => (
    elapsedRef.current + (runningRef.current && startedAtRef.current !== null
      ? Math.floor((Date.now() - startedAtRef.current) / 1000)
      : 0)
  ), []);

  const logTime = useCallback(async (durationSeconds: number, logMode: Mode) => {
    if (!user || durationSeconds <= 0) return false;
    setSaving(true);
    try {
      const { error } = await supabase.from('study_logs').insert({
        user_id: user.id,
        course_id: courseId,
        log_date: localDateString(),
        minutes: Math.max(1, Math.round(durationSeconds / 60)),
        duration_seconds: durationSeconds,
        session_title: sessionTitleRef.current.trim() || null,
        mode: logMode,
      });
      if (error) {
        setLogError(error.message);
        return false;
      }
      setLogError('');
      onLogged();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save study time.';
      setLogError(message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, courseId, onLogged]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      if (!runningRef.current) return;
      const nextElapsed = readElapsed();
      if (mode === 'pomodoro' && nextElapsed >= totalSeconds) {
        elapsedRef.current = 0;
        startedAtRef.current = Date.now();
        setElapsed(0);
        if (!isBreak) {
          setCompletedSessions((count) => count + 1);
          setIsBreak(true);
          void logTime(totalSeconds, 'pomodoro');
        } else {
          setIsBreak(false);
        }
        return;
      }
      setElapsed(nextElapsed);
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, isBreak, totalSeconds, logTime, readElapsed]);

  const handleStop = async () => {
    const elapsedSeconds = readElapsed();
    runningRef.current = false;
    startedAtRef.current = null;
    setRunning(false);
    elapsedRef.current = elapsedSeconds;
    setElapsed(elapsedSeconds);
    const shouldLog = elapsedSeconds > 0 && (mode === 'stopwatch' || !isBreak);
    if (shouldLog) {
      const logged = await logTime(elapsedSeconds, mode);
      if (!logged) return;
    }
    elapsedRef.current = 0;
    startedAtRef.current = null;
    setElapsed(0);
    setIsBreak(false);
  };

  const toggle = () => {
    if (runningRef.current) {
      elapsedRef.current = readElapsed();
      startedAtRef.current = null;
      runningRef.current = false;
      setElapsed(elapsedRef.current);
    } else {
      startedAtRef.current = Date.now();
      runningRef.current = true;
    }
    setRunning(runningRef.current);
  };
  const reset = () => {
    runningRef.current = false;
    elapsedRef.current = 0;
    startedAtRef.current = null;
    setRunning(false);
    setElapsed(0);
    setIsBreak(false);
    setCompletedSessions(0);
  };

  const displayTime = mode === 'pomodoro' ? formatTime(remaining) : formatTime(elapsed);
  const progressPct = mode === 'pomodoro' ? (elapsed / totalSeconds) * 100 : 0;

  return (
    <div className="bg-[#16161f] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4" style={{ color: accentColor }} />
          <h3 className="text-sm font-semibold text-white">Productivity Timer</h3>
        </div>
        <div className="flex gap-1 bg-[#0a0a0f] rounded-lg p-0.5">
          {(['pomodoro', 'stopwatch'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { reset(); setMode(m); }}
              className={`px-3 py-1.5 text-xs rounded-md transition-all capitalize ${
                mode === m ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
              style={mode === m ? { backgroundColor: accentColor } : undefined}
            >
              {m === 'pomodoro' ? 'Pomodoro' : 'Stopwatch'}
            </button>
          ))}
        </div>
      </div>

      <label className="mb-2 block text-xs text-gray-500">
        Topic / task title (optional)
        <input
          type="text"
          maxLength={120}
          value={sessionTitle}
          onChange={(event) => {
            const title = event.target.value;
            sessionTitleRef.current = title;
            setSessionTitle(title);
          }}
          placeholder="e.g. Chapter 2 review"
          className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none"
          style={{ borderColor: `${accentColor}45` }}
        />
      </label>

      {/* Timer Display */}
      <div className="relative flex flex-col items-center py-6">
        {mode === 'pomodoro' && (
          <div className="w-48 h-48 relative">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke={isBreak ? '#34d399' : accentColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPct / 100)}`}
                className="transition-all duration-1000 ease-linear"
                style={{ filter: `drop-shadow(0 0 6px ${isBreak ? '#34d399' : accentColor}80)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-white tabular-nums">{displayTime}</p>
              <p className="text-xs text-gray-500 mt-1">{isBreak ? 'Break' : 'Focus'}</p>
            </div>
          </div>
        )}
        {mode === 'stopwatch' && (
          <div className="py-8">
            <p className="text-5xl font-bold text-white tabular-nums">{displayTime}</p>
            <p className="text-xs text-gray-500 mt-2">Counting up</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={toggle}
            style={{ backgroundColor: isBreak ? '#34d399' : accentColor, boxShadow: `0 0 18px ${isBreak ? '#34d399' : accentColor}50` }}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform"
          >
            {running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <button
            onClick={handleStop}
            disabled={saving}
            aria-label="Stop and log elapsed study time"
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-gray-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
            title="Stop & log time"
          >
            <Save className="h-4 w-4" />
            <span className="text-xs font-medium">{saving ? 'Saving...' : 'Stop & log'}</span>
          </button>
          <button
            onClick={reset}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {logError && <p role="alert" className="mt-3 text-center text-xs text-red-400">{logError}</p>}
        {mode === 'pomodoro' && (
          <div className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <span className="text-xs text-gray-400">Completed this session</span>
            </div>
            <span className="rounded-lg bg-emerald-300/10 px-2.5 py-1 text-sm font-bold tabular-nums text-emerald-200">{completedSessions}</span>
          </div>
        )}
      </div>

      {/* Settings */}
      {mode === 'pomodoro' && (
        <div className="border-t border-white/5 pt-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{ color: accentColor, borderColor: accentColor, boxShadow: `0 0 12px ${accentColor}35` }}
            className="flex items-center gap-2 rounded-lg border bg-white/[0.03] px-3 py-2 text-xs font-semibold transition-all hover:bg-white/[0.08] hover:text-white"
          >
            <Clock className="w-3.5 h-3.5" />
            Settings
          </button>
          {showSettings && (
            <div className="flex gap-4 mt-3">
              <div className="flex-1">
                <label className="block text-[10px] text-gray-500 mb-1">Work (min)</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPomodoroWork((w) => Math.max(1, w - 5))} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 flex items-center justify-center transition-all">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm text-white font-medium w-8 text-center">{pomodoroWork}</span>
                  <button onClick={() => setPomodoroWork((w) => w + 5)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 flex items-center justify-center transition-all">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-gray-500 mb-1">Break (min)</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPomodoroBreak((b) => Math.max(1, b - 1))} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 flex items-center justify-center transition-all">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm text-white font-medium w-8 text-center">{pomodoroBreak}</span>
                  <button onClick={() => setPomodoroBreak((b) => b + 1)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 flex items-center justify-center transition-all">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-gray-600 mt-3 text-center">Time logged automatically feeds into {courseName} analytics</p>
    </div>
  );
}
