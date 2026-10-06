import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Calendar, ChevronRight } from 'lucide-react';

export default function SemesterSetup({ onDone }: { onDone: () => Promise<void> | void }) {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!user) {
      const message = 'Your session is not ready. Please sign in again.';
      console.error(message);
      setError(message);
      return;
    }
    if (!date) {
      setError('Choose your semester start date to continue.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { error: saveError } = await supabase.from('profiles').upsert({
        user_id: user.id,
        full_name: typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name : null,
        semester_start_date: date,
        updated_at: new Date().toISOString(),
      });
      if (saveError) {
        console.error('Unable to save semester setup:', saveError.message);
        setError(`Could not save your semester settings: ${saveError.message}`);
        return;
      }
      await onDone();
    } catch (saveError) {
      console.error('Semester setup failed:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Could not save your semester settings.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-lg bg-[#16161f] border border-white/5 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Welcome! Let's set up your semester</h2>
            <p className="text-sm text-gray-500">Enter your semester start date to track your academic weeks</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Semester Start Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
          </div>

          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <button
            onClick={handleSave}
            disabled={busy || !date}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50"
          >
            {busy ? 'Saving...' : 'Start Tracking'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
