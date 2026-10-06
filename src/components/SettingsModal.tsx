import { useEffect, useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface Props {
  semesterStartDate: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function SettingsModal({ semesterStartDate, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [date, setDate] = useState(semesterStartDate ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDate(semesterStartDate ?? '');
  }, [semesterStartDate]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const save = async () => {
    if (!user || !date) return;
    setBusy(true);
    setError('');
    const { error: saveError } = await supabase.from('profiles').upsert({
      user_id: user.id,
      semester_start_date: date,
    });
    setBusy(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    window.dispatchEvent(new Event('study-tracker:profile-updated'));
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="settings-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#16161f] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
              <Calendar className="h-5 w-5 text-cyan-400" />
            </span>
            <div>
              <h2 id="settings-title" className="text-lg font-semibold text-white">Settings</h2>
              <p className="text-xs text-gray-500">Update your semester dates</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close settings" className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <label htmlFor="semester-start" className="mb-1.5 block text-xs font-medium text-gray-400">Semester Start Date</label>
        <input
          id="semester-start"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
        />
        {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-400 hover:text-white">Cancel</button>
          <button onClick={save} disabled={busy || !date} className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-400 disabled:opacity-50">
            {busy ? 'Saving...' : 'Save'}
          </button>
        </div>
      </section>
    </div>
  );
}
