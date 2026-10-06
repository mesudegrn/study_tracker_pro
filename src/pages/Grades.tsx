import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Calculator, Plus, Save, Trash2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { supabase } from '@/lib/supabase';

type AssessmentType = 'Quiz' | 'Midterm' | 'Case' | 'Homework' | 'Other';
type GradingSystem = 'AA' | 'A1' | 'A';

interface GradeEntry {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  type: AssessmentType;
  score: number;
  weight: number;
}

interface GpaSnapshot {
  id: string;
  grading_system: GradingSystem;
  previous_cgpa: number;
  completed_credits: number;
  courses: GpaCourseInput[];
  term_gpa: number;
  new_cgpa: number;
  saved_at: string;
}

interface GpaCourseInput {
  id: string;
  course: string;
  credits: string;
  grade: string;
  oldGrade: string;
}

const GRADE_POINTS: Record<GradingSystem, Record<string, number>> = {
  AA: { AA: 4, BA: 3.5, BB: 3, CB: 2.5, CC: 2, DC: 1.5, DD: 1, FD: 0.5, FF: 0 },
  A1: { A1: 4, A2: 3.75, A3: 3.5, B1: 3.25, B2: 3, B3: 2.75, C1: 2.5, C2: 2.25, C3: 2, D: 1.75, F: 0 },
  A: { 'A+': 4, A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, 'C-': 1.7, 'D+': 1.3, D: 1, 'D-': 0.7, F: 0 },
};
const ASSESSMENT_TYPES: AssessmentType[] = ['Quiz', 'Midterm', 'Case', 'Homework', 'Other'];

function newGpaCourse(): GpaCourseInput {
  return { id: crypto.randomUUID(), course: '', credits: '', grade: '', oldGrade: '' };
}

export default function Grades() {
  const { user } = useAuth();
  const { courses } = useData();
  const [entries, setEntries] = useState<GradeEntry[]>([]);
  const [gpaSnapshots, setGpaSnapshots] = useState<GpaSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState({ courseId: '', title: '', type: 'Quiz' as AssessmentType, score: '', weight: '' });
  const [gradingSystem, setGradingSystem] = useState<GradingSystem>('AA');
  const [pastCgpa, setPastCgpa] = useState('0');
  const [completedCredits, setCompletedCredits] = useState('0');
  const [gpaCourses, setGpaCourses] = useState<GpaCourseInput[]>([newGpaCourse()]);
  const [savingGpa, setSavingGpa] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [gradesResponse, gpaResponse, snapshotsResponse] = await Promise.all([
      supabase.from('grade_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('gpa_calculators').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('gpa_calculation_snapshots').select('*').eq('user_id', user.id).order('saved_at', { ascending: false }),
    ]);
    if (gradesResponse.error || gpaResponse.error || snapshotsResponse.error) {
      setError(gradesResponse.error?.message ?? gpaResponse.error?.message ?? snapshotsResponse.error?.message ?? 'Unable to load grades.');
    } else {
      setEntries((gradesResponse.data ?? []) as GradeEntry[]);
      setGpaSnapshots((snapshotsResponse.data ?? []) as GpaSnapshot[]);
      if (gpaResponse.data) {
        setGradingSystem(gpaResponse.data.grading_system as GradingSystem);
        setPastCgpa(String(gpaResponse.data.previous_cgpa));
        setCompletedCredits(String(gpaResponse.data.completed_credits));
        const savedCourses = gpaResponse.data.courses as GpaCourseInput[];
        setGpaCourses(Array.isArray(savedCourses) && savedCourses.length > 0 ? savedCourses : [newGpaCourse()]);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const gradesByCourse = useMemo(() => {
    const grouped = new Map<string, GradeEntry[]>();
    for (const entry of entries) grouped.set(entry.course_id, [...(grouped.get(entry.course_id) ?? []), entry]);
    return grouped;
  }, [entries]);

  const saveAssessment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !assessment.courseId) return;
    setNotice('');
    setSavingGrade(true);
    const score = Number(assessment.score);
    const weight = Number(assessment.weight);
    const usedWeight = (gradesByCourse.get(assessment.courseId) ?? []).reduce((sum, item) => sum + item.weight, 0);
    if (!assessment.title.trim() || !Number.isFinite(score) || score < 0 || score > 100 || !Number.isFinite(weight) || weight <= 0 || usedWeight + weight > 100.000001) {
      setSavingGrade(false);
      setError('Enter a title, a score from 0 to 100, and a weight that keeps the course total at or below 100%.');
      return;
    }
    setError('');
    const { data, error: insertError } = await supabase.from('grade_entries').insert({
      user_id: user.id,
      course_id: assessment.courseId,
      title: assessment.title.trim(),
      type: assessment.type,
      score,
      weight,
    }).select().single();
    if (insertError) {
      setSavingGrade(false);
      setError(insertError.message);
      return;
    }
    setSavingGrade(false);
    setEntries((current) => [...current, data as GradeEntry]);
    setAssessment((current) => ({ ...current, title: '', score: '', weight: '' }));
    setNotice('Grade entry saved.');
  };

  const removeAssessment = async (id: string) => {
    if (!user) return;
    const { error: deleteError } = await supabase.from('grade_entries').delete().eq('id', id).eq('user_id', user.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setEntries((current) => current.filter((entry) => entry.id !== id));
  };

  const gradedCourses = gpaCourses.filter((row) => row.grade && (Number(row.credits) || 0) > 0);
  const termCredits = gradedCourses.reduce((sum, row) => sum + Number(row.credits), 0);
  const termPoints = gradedCourses.reduce((sum, row) => sum + Number(row.credits) * GRADE_POINTS[gradingSystem][row.grade], 0);
  const termGpa = termCredits > 0 ? termPoints / termCredits : 0;
  const previousPoints = (Number(pastCgpa) || 0) * (Number(completedCredits) || 0);
  const updatedPoints = gradedCourses.reduce((sum, row) => {
    const credits = Number(row.credits) || 0;
    const currentPoints = GRADE_POINTS[gradingSystem][row.grade] ?? 0;
    const oldPoints = GRADE_POINTS[gradingSystem][row.oldGrade] ?? 0;
    return sum + credits * (currentPoints - (row.oldGrade ? oldPoints : 0));
  }, previousPoints);
  const addedCredits = gradedCourses.reduce((sum, row) => sum + (row.oldGrade ? 0 : Number(row.credits)), 0);
  const newCgpa = Number(completedCredits) + addedCredits > 0
    ? updatedPoints / (Number(completedCredits) + addedCredits)
    : 0;

  const saveGpaInputs = async () => {
    if (!user) return;
    const parsedCgpa = Number(pastCgpa);
    const parsedCredits = Number(completedCredits);
    if (!Number.isFinite(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 4 || !Number.isFinite(parsedCredits) || parsedCredits < 0) {
      setError('Past CGPA must be between 0 and 4, and completed credits cannot be negative.');
      return;
    }
    setSavingGpa(true);
    setError('');
    setNotice('');
    const savedAt = new Date().toISOString();
    const { error: saveError } = await supabase.from('gpa_calculators').upsert({
      user_id: user.id,
      grading_system: gradingSystem,
      previous_cgpa: parsedCgpa,
      completed_credits: parsedCredits,
      courses: gpaCourses,
      updated_at: savedAt,
    });
    if (saveError) {
      setSavingGpa(false);
      setError(saveError.message);
      return;
    }
    const { data: snapshot, error: snapshotError } = await supabase.from('gpa_calculation_snapshots').insert({
      user_id: user.id,
      grading_system: gradingSystem,
      previous_cgpa: parsedCgpa,
      completed_credits: parsedCredits,
      courses: gpaCourses,
      term_gpa: termGpa,
      new_cgpa: newCgpa,
      saved_at: savedAt,
    }).select().single();
    setSavingGpa(false);
    if (snapshotError) {
      setError(`Inputs were updated, but the saved calculation history could not be created: ${snapshotError.message}`);
      return;
    }
    setGpaSnapshots((current) => [snapshot as GpaSnapshot, ...current]);
    setNotice('GPA calculator inputs saved.');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Grades & GPA</h1>
        <p className="mt-1 text-sm text-gray-500">Track course grades, model what-if scores, and calculate your GPA.</p>
      </header>

      {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{notice}</p>}

      <section className="min-w-0 rounded-2xl border border-cyan-500/15 bg-[#16161f] p-4 sm:p-5">
        <div className="mb-5 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-cyan-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">Course grade analytics</h2>
            <p className="text-xs text-gray-500">Scores and weights are saved to your account; use entries to model what-if outcomes.</p>
          </div>
        </div>
        <form onSubmit={saveAssessment} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <select required value={assessment.courseId} onChange={(e) => setAssessment({ ...assessment, courseId: e.target.value })} className="rounded-xl border border-white/10 bg-[#0a0a0f] px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none sm:col-span-2 lg:col-span-1">
            <option value="">Select course</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          </select>
          <input required value={assessment.title} onChange={(e) => setAssessment({ ...assessment, title: e.target.value })} placeholder="Assessment name" className="rounded-xl border border-white/10 bg-[#0a0a0f] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none sm:col-span-2 lg:col-span-1" />
          <select value={assessment.type} onChange={(e) => setAssessment({ ...assessment, type: e.target.value as AssessmentType })} className="rounded-xl border border-white/10 bg-[#0a0a0f] px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none">
            {ASSESSMENT_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
          <input required type="number" min="0" max="100" step="0.01" value={assessment.score} onChange={(e) => setAssessment({ ...assessment, score: e.target.value })} placeholder="Score %" className="rounded-xl border border-white/10 bg-[#0a0a0f] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none" />
          <input required type="number" min="0.01" max="100" step="0.01" value={assessment.weight} onChange={(e) => setAssessment({ ...assessment, weight: e.target.value })} placeholder="Weight %" className="rounded-xl border border-white/10 bg-[#0a0a0f] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none" />
          <button type="submit" disabled={!courses.length || savingGrade} className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-400 disabled:opacity-40"><Plus className="h-4 w-4" /> {savingGrade ? 'Saving...' : 'Add grade'}</button>
        </form>

        {loading ? <p className="py-8 text-center text-sm text-gray-500">Loading grades...</p> : courses.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">Add a course before entering grades.</p>
        ) : (
          <div className="mt-5 min-w-0 space-y-4">
            {courses.map((course) => {
              const courseEntries = gradesByCourse.get(course.id) ?? [];
              const weightTotal = courseEntries.reduce((sum, item) => sum + item.weight, 0);
              const weightedPoints = courseEntries.reduce((sum, item) => sum + item.score * item.weight, 0);
              const average = weightTotal ? weightedPoints / weightTotal : null;
              const remaining = Math.max(0, 100 - weightTotal);
              const maxFinal = (weightedPoints + remaining * 100) / 100;
              const minFinal = weightedPoints / 100;
              return (
                <article key={course.id} className="min-w-0 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: course.color }} />
                      <h3 className="truncate text-sm font-semibold text-white">{course.name}</h3>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:min-w-[24rem] sm:grid-cols-3">
                      <GradeMetric label="Current average" value={average} tone="cyan" />
                      <GradeMetric label="Max final" value={average === null ? null : maxFinal} tone="emerald" />
                      <GradeMetric label="Min final" value={average === null ? null : minFinal} tone="amber" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-gray-400">{weightTotal.toFixed(1)}% graded</p>
                    <p className="text-xs text-gray-500">{remaining.toFixed(1)}% remaining</p>
                  </div>
                  {courseEntries.length > 0 && <div className="mt-3 divide-y divide-white/5">
                    {courseEntries.map((entry) => (
                      <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-200">{entry.title}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{entry.type}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-gray-300">Score: <strong className="font-semibold text-white">{entry.score}%</strong></span>
                            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-gray-300">Weight: <strong className="font-semibold text-white">{entry.weight}%</strong></span>
                          </div>
                          <button onClick={() => void removeAssessment(entry.id)} aria-label={`Delete ${entry.title}`} className="text-gray-600 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="min-w-0 rounded-2xl border border-fuchsia-500/15 bg-[#16161f] p-4 sm:p-5">
        <div className="mb-5 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-fuchsia-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">Multi-system GPA / CGPA calculator</h2>
            <p className="text-xs text-gray-500">Retake rows replace the old grade in CGPA without adding credits again.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-xs text-gray-500">Grading system
            <select value={gradingSystem} onChange={(e) => setGradingSystem(e.target.value as GradingSystem)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-3 py-2.5 text-sm text-white focus:border-fuchsia-500/50 focus:outline-none">
              <option value="AA">AA / BA / BB</option><option value="A1">A1 / A2 / A3</option><option value="A">A+ / A / A-</option>
            </select>
          </label>
          <label className="text-xs text-gray-500">Past CGPA (0-4)
            <input type="number" min="0" max="4" step="0.001" value={pastCgpa} onChange={(e) => setPastCgpa(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-3 py-2.5 text-sm text-white focus:border-fuchsia-500/50 focus:outline-none" />
          </label>
          <label className="text-xs text-gray-500">Previously completed credits
            <input type="number" min="0" step="0.5" value={completedCredits} onChange={(e) => setCompletedCredits(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-3 py-2.5 text-sm text-white focus:border-fuchsia-500/50 focus:outline-none" />
          </label>
        </div>
        <div className="mt-4 space-y-2">
          {gpaCourses.map((row, index) => (
            <div key={row.id} className="grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:grid-cols-5">
              <input value={row.course} onChange={(e) => setGpaCourses((all) => all.map((item) => item.id === row.id ? { ...item, course: e.target.value } : item))} placeholder={`Course ${index + 1}`} className="col-span-2 min-w-0 rounded-lg border border-white/10 bg-[#0a0a0f] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-fuchsia-500/50 focus:outline-none sm:col-span-1" />
              <input type="number" min="0.5" step="0.5" value={row.credits} onChange={(e) => setGpaCourses((all) => all.map((item) => item.id === row.id ? { ...item, credits: e.target.value } : item))} placeholder="Credits" className="min-w-0 rounded-lg border border-white/10 bg-[#0a0a0f] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-fuchsia-500/50 focus:outline-none" />
              <select value={row.grade} onChange={(e) => setGpaCourses((all) => all.map((item) => item.id === row.id ? { ...item, grade: e.target.value } : item))} className="min-w-0 rounded-lg border border-white/10 bg-[#0a0a0f] px-3 py-2 text-sm text-white focus:border-fuchsia-500/50 focus:outline-none">
                <option value="">Grade</option>{Object.keys(GRADE_POINTS[gradingSystem]).map((grade) => <option key={grade}>{grade}</option>)}
              </select>
              <select value={row.oldGrade} onChange={(e) => setGpaCourses((all) => all.map((item) => item.id === row.id ? { ...item, oldGrade: e.target.value } : item))} className="min-w-0 rounded-lg border border-white/10 bg-[#0a0a0f] px-3 py-2 text-sm text-white focus:border-fuchsia-500/50 focus:outline-none">
                <option value="">Old grade (not retake)</option>{Object.keys(GRADE_POINTS[gradingSystem]).map((grade) => <option key={grade}>{grade}</option>)}
              </select>
              <button onClick={() => setGpaCourses((all) => all.length === 1 ? [newGpaCourse()] : all.filter((item) => item.id !== row.id))} aria-label={`Remove course row ${index + 1}`} className="col-span-2 flex items-center justify-center rounded-lg border border-white/5 text-gray-500 hover:border-red-500/20 hover:text-red-400 sm:col-span-1"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setGpaCourses((all) => [...all, newGpaCourse()])} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:border-fuchsia-400/30 hover:text-white"><Plus className="h-4 w-4" /> Add course</button>
          <button onClick={() => void saveGpaInputs()} disabled={savingGpa} className="flex items-center gap-2 rounded-xl bg-fuchsia-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-fuchsia-400 disabled:opacity-50"><Save className="h-4 w-4" /> {savingGpa ? 'Saving...' : 'Save inputs'}</button>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <GpaResult label="Term GPA" value={termGpa} />
          <GpaResult label="New CGPA" value={newCgpa} />
          <div className="rounded-xl border border-fuchsia-500/15 bg-fuchsia-500/5 p-4"><p className="text-xs text-gray-500">Grade points</p><p className="mt-1 text-sm font-semibold text-fuchsia-200">{Object.entries(GRADE_POINTS[gradingSystem]).map(([grade, point]) => `${grade} ${point.toFixed(point % 1 ? 2 : 0)}`).join(' · ')}</p></div>
        </div>
        {gpaSnapshots.length > 0 && (
          <div className="mt-5 space-y-2">
            <h3 className="text-sm font-semibold text-white">Saved calculations</h3>
            {gpaSnapshots.map((snapshot) => (
              <details key={snapshot.id} className="group rounded-xl border border-white/10 bg-[#0a0a0f]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-gray-200">
                  <span>{new Date(snapshot.saved_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  <span className="flex items-center gap-3 text-xs text-gray-400">
                    <span>Term {Number(snapshot.term_gpa).toFixed(2)}</span>
                    <span>CGPA {Number(snapshot.new_cgpa).toFixed(2)}</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                <div className="border-t border-white/5 px-4 py-3 text-xs text-gray-400">
                  <p>{snapshot.grading_system} scale · previous CGPA {Number(snapshot.previous_cgpa).toFixed(2)} · {Number(snapshot.completed_credits)} completed credits</p>
                  <div className="mt-2 space-y-1">
                    {snapshot.courses.map((row) => (
                      <p key={row.id}>{row.course || 'Course'} · {row.credits || '0'} credits · {row.grade || 'No grade'}{row.oldGrade ? ` (replaces ${row.oldGrade})` : ''}</p>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function GradeMetric({ label, value, tone }: { label: string; value: number | null; tone: 'cyan' | 'emerald' | 'amber' }) {
  const styles = {
    cyan: 'border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-200',
    emerald: 'border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200',
    amber: 'border-amber-400/20 bg-amber-400/[0.07] text-amber-200',
  }[tone];

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${styles}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-xl font-bold leading-none tabular-nums">{value === null ? '—' : `${value.toFixed(1)}%`}</p>
    </div>
  );
}

function GpaResult({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-4"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-2xl font-bold text-cyan-300">{value.toFixed(2)}</p></div>;
}
