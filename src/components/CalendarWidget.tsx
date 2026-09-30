import { useState } from 'react';
import { useData } from '@/context/DataContext';
import type { ItemType } from '@/types';
import { ITEM_TYPE_COLORS } from '@/types';
import { generateICS, downloadFile } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Download, Plus } from 'lucide-react';
import CalendarAddModal from '@/components/CalendarAddModal';

const TYPE_ORDER: ItemType[] = ['exam', 'quiz', 'task', 'event'];

export default function CalendarWidget() {
  const { tasks, courses } = useData();
  const [view, setView] = useState<'week' | 'month'>('month');
  const [cursor, setCursor] = useState(new Date());
  const [modalDate, setModalDate] = useState<string | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const items = [
    ...tasks.filter((t) => t.due_date).map((t) => ({
      date: t.due_date!,
      label: t.title,
      color: t.color ?? ITEM_TYPE_COLORS[t.item_type] ?? '#22d3ee',
      item_type: t.item_type,
    })),
  ];

  const exportICS = () => {
    const ics = generateICS(tasks, courses);
    downloadFile('study-tracker.ics', ics, 'text/calendar');
  };

  const sortedDayItems = (dateStr: string) =>
    items
      .filter((it) => it.date === dateStr)
      .sort((a, b) => TYPE_ORDER.indexOf(a.item_type) - TYPE_ORDER.indexOf(b.item_type));

  const renderMonth = () => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] text-gray-600 font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayItems = sortedDayItems(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <button
                key={i}
                onClick={() => setModalDate(dateStr)}
                className={`min-h-[52px] w-full rounded-lg p-1.5 border transition-all text-left group ${
                  isToday
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-white/[0.02] border-white/5 hover:border-cyan-500/30 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-[10px] font-medium ${isToday ? 'text-cyan-400' : 'text-gray-500'}`}>{day}</p>
                  <Plus className="w-2.5 h-2.5 text-gray-700 group-hover:text-cyan-400 transition-colors" />
                </div>
                {dayItems.slice(0, 2).map((it, j) => (
                  <div
                    key={j}
                    className="text-[9px] truncate px-1 py-0.5 rounded mb-0.5"
                    style={{ backgroundColor: `${it.color}20`, color: it.color }}
                  >
                    {it.label}
                  </div>
                ))}
                {dayItems.length > 2 && (
                  <p className="text-[9px] text-gray-600 px-1">+{dayItems.length - 2} more</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeek = () => {
    const weekStart = new Date(cursor);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const dateStr = d.toISOString().split('T')[0];
          const dayItems = sortedDayItems(dateStr);
          const isToday = dateStr === todayStr;
          return (
            <button
              key={i}
              onClick={() => setModalDate(dateStr)}
              className={`min-h-[80px] w-full rounded-lg p-2 border transition-all text-left group ${
                isToday ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/[0.02] border-white/5 hover:border-cyan-500/30 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className={`text-[10px] font-medium ${isToday ? 'text-cyan-400' : 'text-gray-500'}`}>
                  {d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                </p>
                <Plus className="w-2.5 h-2.5 text-gray-700 group-hover:text-cyan-400 transition-colors" />
              </div>
              {dayItems.map((it, j) => (
                <div
                  key={j}
                  className="text-[9px] truncate px-1 py-0.5 rounded mb-0.5"
                  style={{ backgroundColor: `${it.color}20`, color: it.color }}
                >
                  {it.label}
                </div>
              ))}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="bg-[#16161f] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">
              {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-1 bg-[#0a0a0f] rounded-lg p-0.5">
              {(['week', 'month'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all capitalize ${
                    view === v ? 'bg-cyan-500 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(cursor);
                if (view === 'week') d.setDate(d.getDate() - 7);
                else d.setMonth(d.getMonth() - 1);
                setCursor(d);
              }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCursor(new Date())}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => {
                const d = new Date(cursor);
                if (view === 'week') d.setDate(d.getDate() + 7);
                else d.setMonth(d.getMonth() + 1);
                setCursor(d);
              }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={exportICS}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-all border border-emerald-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              ICS
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {(['exam', 'quiz', 'task', 'event'] as ItemType[]).map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ITEM_TYPE_COLORS[t] }} />
              <span className="text-[10px] text-gray-500 capitalize">{t}</span>
            </div>
          ))}
        </div>

        {view === 'week' ? renderWeek() : renderMonth()}
        <p className="text-[10px] text-gray-600 mt-3 text-center">Click any date to add an item</p>
      </div>
      {modalDate && <CalendarAddModal date={modalDate} onClose={() => setModalDate(null)} />}
    </>
  );
}
