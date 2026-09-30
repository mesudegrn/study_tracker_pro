import { useMemo, useState } from 'react';
import type { StudyLog, Course } from '@/types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { formatMinutes } from '@/lib/utils';

interface Props {
  logs: StudyLog[];
  courses: Course[];
}

const NEON_COLORS = ['#22d3ee', '#34d399', '#f59e0b', '#f472b6', '#a78bfa', '#fb7185', '#60a5fa', '#fbbf24'];

export default function StudyAnalytics({ logs, courses }: Props) {
  const [range, setRange] = useState(7);

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  const pieData = useMemo(() => {
    const byCourse = new Map<string, number>();
    for (const l of logs) {
      const key = l.course_id ?? 'none';
      byCourse.set(key, (byCourse.get(key) ?? 0) + l.minutes);
    }
    return Array.from(byCourse.entries())
      .filter(([, min]) => min > 0)
      .map(([cid, min], i) => ({
        name: cid === 'none' ? 'Unassigned' : (courseMap.get(cid)?.name ?? 'Unknown'),
        value: min,
        color: cid === 'none' ? '#64748b' : (courseMap.get(cid)?.color ?? NEON_COLORS[i % NEON_COLORS.length]),
      }));
  }, [logs, courseMap]);

  const barData = useMemo(() => {
    const days: { day: string; minutes: number; date: string }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: iso,
        minutes: 0,
      });
    }
    for (const l of logs) {
      const day = days.find((d) => d.date === l.log_date);
      if (day) day.minutes += l.minutes;
    }
    return days;
  }, [logs, range]);

  const totalMinutes = logs.reduce((s, l) => s + l.minutes, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-[#16161f] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Study Time by Course</h3>
          <span className="text-xs text-gray-500">{formatMinutes(totalMinutes)} total</span>
        </div>
        {pieData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-sm text-gray-600">
            No study sessions logged yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                paddingAngle={3}
                stroke="none"
                label={(props: { name?: string; value?: number }) => `${props.name ?? ''} (${formatMinutes(props.value ?? 0)})`}
                labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#0a0a0f',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  padding: '8px 12px',
                }}
                formatter={(v) => formatMinutes(Number(v))}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
        {pieData.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#16161f] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Study Hours per Day</h3>
          <div className="flex gap-1 bg-[#0a0a0f] rounded-lg p-0.5">
            {[7, 14, 30].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                  range === r ? 'bg-cyan-500 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={barData} barCategoryGap="20%" margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.floor(v / 60)}h`} width={45} />
            <Tooltip
              contentStyle={{
                background: '#0a0a0f',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '13px',
                padding: '8px 12px',
              }}
              cursor={{ fill: 'rgba(34,211,238,0.05)' }}
              formatter={(v) => formatMinutes(Number(v))}
            />
            <Bar dataKey="minutes" radius={[6, 6, 0, 0]} fill="#22d3ee" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
