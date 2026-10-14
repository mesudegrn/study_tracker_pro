import { useMemo, useState } from 'react';
import type { StudyLog, Course } from '@/types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatMinutes, localDateString } from '@/lib/utils';

interface Props {
  logs: StudyLog[];
  courses: Course[];
  hideCoursePie?: boolean;
  accentColor?: string;
}

const NEON_COLORS = ['#22d3ee', '#34d399', '#f59e0b', '#f472b6', '#a78bfa', '#fb7185', '#60a5fa', '#fbbf24'];
const UNASSIGNED_KEY = 'course:unassigned';
const UNKNOWN_KEY_PREFIX = 'course:unknown:';

function fallbackCourseColor(courseId: string) {
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = (hash * 31 + courseId.charCodeAt(i)) >>> 0;
  }
  return NEON_COLORS[hash % NEON_COLORS.length];
}

export default function StudyAnalytics({ logs, courses, hideCoursePie = false, accentColor = '#22d3ee' }: Props) {
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
        color: cid === 'none' ? '#64748b' : (courseMap.get(cid)?.color ?? fallbackCourseColor(cid || String(i))),
      }));
  }, [logs, courseMap]);

  const { barData, barSeries } = useMemo(() => {
    const days: ({ day: string; date: string } & Record<string, string | number>)[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = localDateString(d);
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: iso,
      });
    }
    const daysByDate = new Map(days.map((day) => [day.date, day]));
    const totalsByKey = new Map<string, number>();
    for (const l of logs) {
      const day = daysByDate.get(l.log_date);
      if (!day) continue;
      const key = l.course_id === null
        ? UNASSIGNED_KEY
        : courseMap.has(l.course_id)
          ? `course:${l.course_id}`
          : `${UNKNOWN_KEY_PREFIX}${l.course_id}`;
      day[key] = (Number(day[key]) || 0) + l.minutes;
      totalsByKey.set(key, (totalsByKey.get(key) ?? 0) + l.minutes);
    }

    const series = courses.flatMap((course) => {
      const key = `course:${course.id}`;
      return totalsByKey.has(key) ? [{ key, name: course.name, color: course.color }] : [];
    });
    if (totalsByKey.has(UNASSIGNED_KEY)) {
      series.push({ key: UNASSIGNED_KEY, name: 'Unassigned', color: '#64748b' });
    }
    for (const key of totalsByKey.keys()) {
      if (key.startsWith(UNKNOWN_KEY_PREFIX)) {
        const courseId = key.slice(UNKNOWN_KEY_PREFIX.length);
        series.push({ key, name: 'Unknown', color: fallbackCourseColor(courseId) });
      }
    }
    return { barData: days, barSeries: series };
  }, [logs, range, courses, courseMap]);

  const totalMinutes = logs.reduce((s, l) => s + l.minutes, 0);

  return (
    <div className={`grid min-w-0 gap-4 ${hideCoursePie ? 'grid-cols-1' : 'grid-cols-1 2xl:grid-cols-2'}`}>
      {!hideCoursePie && (
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
          <div className="h-[320px] min-h-[300px] min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
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
          </div>
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
      )}

      <div className={`min-w-0 bg-[#16161f] border border-white/5 rounded-2xl p-5 ${hideCoursePie ? 'w-full' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Study Hours per Day</h3>
          <div className="flex gap-1 bg-[#0a0a0f] rounded-lg p-0.5">
            {[7, 14, 30].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                  range === r ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
                style={range === r ? { backgroundColor: accentColor } : undefined}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>
        <div className="h-[320px] min-h-[300px] min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
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
            {barSeries.map((series) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.name}
                stackId="study-time"
                fill={series.color}
                radius={series === barSeries[barSeries.length - 1] ? [6, 6, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        </div>
        {barSeries.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3" aria-label="Study time by course legend">
            {barSeries.map((series) => (
              <div key={series.key} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
                {series.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
