import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { Calendar, ChevronRight } from 'lucide-react';

export default function SemesterSetup({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!user || !date) return;
    setBusy(true);
    await supabase.from('profiles').upsert({
      user_id: user.id,
      semester_start_date: date,
    });
    setBusy(false);
    onDone();
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
