import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react';

const COLORS = ['#22d3ee', '#34d399', '#f59e0b', '#f472b6', '#a78bfa', '#fb7185', '#60a5fa', '#fbbf24'];

interface Props {
  userId: string;
  onDone: () => void;
  onCancel: () => void;
}

export default function CourseQuickAdd({ userId, onDone, onCancel }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [examDate, setExamDate] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await supabase.from('courses').insert({
      user_id: userId,
      name: name.trim(),
      color,
      exam_date: examDate || null,
    });
    setBusy(false);
    onDone();
  };

  return (
    <div className="bg-[#16161f] border border-cyan-500/20 rounded-2xl p-5 shadow-lg shadow-cyan-500/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Add New Course</h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Course name (e.g. Calculus I)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Color:</span>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#16161f]' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
          />
          <button
            onClick={save}
            disabled={busy || !name.trim()}
            className="px-5 py-2.5 bg-cyan-500 text-white text-sm font-medium rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50"
          >
            {busy ? '...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
