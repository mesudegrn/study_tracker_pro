import { useState } from 'react';
import { useData } from '@/context/DataContext';
import type { ItemType } from '@/types';
import { ITEM_TYPE_COLORS, ITEM_TYPE_LABELS } from '@/types';
import { X } from 'lucide-react';

interface Props {
  date: string;
  onClose: () => void;
}

export default function CalendarAddModal({ date, onClose }: Props) {
  const { addTask, courses } = useData();
  const [title, setTitle] = useState('');
  const [itemType, setItemType] = useState<ItemType>('task');
  const [courseId, setCourseId] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    await addTask({
      title: title.trim(),
      due_date: date,
      course_id: courseId || null,
      item_type: itemType,
    });
    setBusy(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#16161f] border border-white/10 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-white">Add Calendar Item</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(ITEM_TYPE_COLORS) as ItemType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setItemType(t)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${
                    itemType === t
                      ? 'border-transparent bg-white/5'
                      : 'border-white/5 hover:border-white/10'
                  }`}
                  style={itemType === t ? { boxShadow: `0 0 10px ${ITEM_TYPE_COLORS[t]}40`, borderColor: `${ITEM_TYPE_COLORS[t]}60` } : {}}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ITEM_TYPE_COLORS[t] }} />
                  <span className={`text-[10px] font-medium ${itemType === t ? 'text-white' : 'text-gray-500'}`}>
                    {ITEM_TYPE_LABELS[t]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midterm Exam, Quiz 3, Read Chapter 5..."
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Course (optional)</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
            >
              <option value="">No course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Adding...' : 'Add to Calendar'}
          </button>
        </form>
      </div>
    </div>
  );
}
