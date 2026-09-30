import type { Course, Material } from '@/types';

export function getCurrentWeek(semesterStart: string | null): number {
  if (!semesterStart) return 0;
  const start = new Date(semesterStart);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  const weeks = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(0, weeks);
}

export function materialProgress(m: Material): number {
  if (m.total_pages <= 0) return 0;
  return Math.min(100, Math.round((m.current_page / m.total_pages) * 100));
}

export function weekProgress(materials: Material[], week: number): number {
  const weekMaterials = materials.filter((m) => m.week_number === week);
  if (weekMaterials.length === 0) return -1;
  const total = weekMaterials.reduce((sum, m) => sum + materialProgress(m), 0);
  return Math.round(total / weekMaterials.length);
}

export function courseWeekProgress(course: Course, materials: Material[], week: number): number {
  return weekProgress(materials.filter((m) => m.course_id === course.id), week);
}

export function progressColor(pct: number): string {
  if (pct < 0) return 'bg-white/5 text-gray-600';
  if (pct === 0) return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (pct < 100) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
}

export function progressGlow(pct: number): string {
  if (pct === 100) return 'shadow-[0_0_12px_rgba(52,211,153,0.4)]';
  if (pct > 0) return 'shadow-[0_0_8px_rgba(251,191,36,0.2)]';
  return '';
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export function generateICS(tasks: { title: string; due_date: string | null }[], courses: Course[]): string {
  const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//StudyTracker//EN'];

  for (const t of tasks) {
    if (!t.due_date) continue;
    const date = new Date(t.due_date + 'T09:00:00');
    const dtstart = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtend = new Date(date.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${t.title}-${dtstart}@studytracker`);
    lines.push(`DTSTAMP:${dtstart}`);
    lines.push(`DTSTART:${dtstart}`);
    lines.push(`DTEND:${dtend}`);
    lines.push(`SUMMARY:${t.title}`);
    lines.push('END:VEVENT');
  }

  for (const c of courses) {
    if (!c.exam_date) continue;
    const date = new Date(c.exam_date + 'T09:00:00');
    const dtstart = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtend = new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${c.name}-exam-${dtstart}@studytracker`);
    lines.push(`DTSTAMP:${dtstart}`);
    lines.push(`DTSTART:${dtstart}`);
    lines.push(`DTEND:${dtend}`);
    lines.push(`SUMMARY:Exam - ${c.name}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
