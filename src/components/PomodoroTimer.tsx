import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatTime } from '@/lib/utils';
import { Play, Pause, RotateCcw, Timer, Clock, Plus, Minus, Save } from 'lucide-react';

interface Props {
  courseId: string;
  courseName: string;
  onLogged: () => void;
}

type Mode = 'stopwatch' | 'pomodoro';

export default function PomodoroTimer({ courseId, courseName, onLogged }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('pomodoro');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [pomodoroWork, setPomodoroWork] = useState(25);
  const [pomodoroBreak, setPomodoroBreak] = useState(5);
  const [isBreak, setIsBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = isBreak ? pomodoroBreak * 60 : pomodoroWork * 60;
  const remaining = mode === 'pomodoro' ? Math.max(0, totalSeconds - elapsed) : elapsed;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          if (mode === 'pomodoro') {
            if (e + 1 >= totalSeconds) {
              // Session complete
              if (!isBreak) {
                logTime(pomodoroWork);
                setCompletedSessions((s) => s + 1);
                setIsBreak(true);
                setElapsed(0);
                return 0;
              } else {
                setIsBreak(false);
                setElapsed(0);
                return 0;
              }
            }
            return e + 1;
          }
          return e + 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, isBreak, totalSeconds, pomodoroWork]);

  const logTime = useCallback(async (minutes: number) => {
    if (!user || minutes <= 0) return;
    await supabase.from('study_logs').insert({
      user_id: user.id,
      course_id: courseId,
      log_date: new Date().toISOString().split('T')[0],
      minutes,
      mode: mode === 'pomodoro' ? 'pomodoro' : 'stopwatch',
    });
    onLogged();
  }, [user, courseId, mode, onLogged]);

  const handleStop = async () => {
    if (mode === 'stopwatch' && elapsed > 0) {
      const minutes = Math.max(1, Math.round(elapsed / 60));
      await logTime(minutes);
    }
    setRunning(false);
    setElapsed(0);
    setIsBreak(false);
  };

  const toggle = () => setRunning((r) => !r);
  const reset = () => { setRunning(false); setElapsed(0); setIsBreak(false); };

  const displayTime = mode === 'pomodoro' ? formatTime(remaining) : formatTime(elapsed);
  const progressPct = mode === 'pomodoro' ? (elapsed / totalSeconds) * 100 : 0;

  return (
    <div className="bg-[#16161f] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Productivity Timer</h3>
        </div>
        <div className="flex gap-1 bg-[#0a0a0f] rounded-lg p-0.5">
          {(['pomodoro', 'stopwatch'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); reset(); }}
              className={`px-3 py-1.5 text-xs rounded-md transition-all capitalize ${
                mode === m ? 'bg-cyan-500 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {m === 'pomodoro' ? 'Pomodoro' : 'Stopwatch'}
            </button>
          ))}
        </div>
      </div>

      {/* Timer Display */}
      <div className="relative flex flex-col items-center py-6">
        {mode === 'pomodoro' && (
          <div className="w-48 h-48 relative">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke={isBreak ? '#34d399' : '#22d3ee'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPct / 100)}`}
                className="transition-all duration-1000 ease-linear"
                style={{ filter: `drop-shadow(0 0 6px ${isBreak ? '#34d399' : '#22d3ee'}80)` }}
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
            className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 hover:scale-105 transition-transform"
          >
            {running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <button
            onClick={handleStop}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="Stop & log time"
          >
            <Save className="w-5 h-5" />
          </button>
          <button
            onClick={reset}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {completedSessions > 0 && mode === 'pomodoro' && (
          <p className="text-xs text-emerald-400 mt-3">
            {completedSessions} session{completedSessions > 1 ? 's' : ''} completed
          </p>
        )}
      </div>

      {/* Settings */}
      {mode === 'pomodoro' && (
        <div className="border-t border-white/5 pt-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
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
