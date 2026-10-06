import { useState } from 'react';
import { useData } from '@/context/DataContext';
import type { Course } from '@/types';
import { COURSE_COLORS } from '@/types';
import { Pencil, Trash2, X, Check } from 'lucide-react';

interface Props {
  course: Course;
  onDelete: () => void;
  accentColor?: string;
}

export default function CourseActions({ course, onDelete, accentColor = course.color }: Props) {
  const { updateCourse, deleteCourse } = useData();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(course.name);
  const [color, setColor] = useState(course.color);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveName = async () => {
    if (!name.trim()) {
      setEditing(false);
      return;
    }
    const { error } = await updateCourse(course.id, { name: name.trim(), color });
    if (error) {
      setError(error);
      return;
    }
    setError('');
    setEditing(false);
  };

  const handleDelete = async () => {
    await deleteCourse(course.id);
    onDelete();
  };

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-400">Delete this course?</span>
        <button
          onClick={handleDelete}
          className="px-2.5 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-400 transition-colors"
        >
          Yes, delete
        </button>
        <button
          onClick={() => setConfirmDelete(false)}
          className="px-2.5 py-1.5 bg-white/5 text-gray-400 text-xs rounded-lg hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="min-w-0 space-y-2 rounded-xl border border-white/10 bg-[#16161f] p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void saveName()}
            className="w-40 min-w-0 rounded-lg border border-white/10 bg-[#0a0a0f] px-3 py-1.5 text-sm text-white transition-all focus:border-cyan-500/50 focus:outline-none"
            aria-label="Course name"
            autoFocus
          />
          <button onClick={() => void saveName()} aria-label="Save course changes" className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400 transition-all hover:bg-emerald-500/20">
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setEditing(false); setName(course.name); setColor(course.color); setError(''); }}
            aria-label="Cancel editing"
            className="rounded-lg bg-white/5 p-1.5 text-gray-400 transition-all hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] text-gray-500">Color</span>
          {COURSE_COLORS.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={`Choose course color ${option}`}
              aria-pressed={color === option}
              onClick={() => setColor(option)}
              className={`h-5 w-5 rounded-full ${color === option ? 'ring-2 ring-white ring-offset-2 ring-offset-[#16161f]' : ''}`}
              style={{ backgroundColor: option }}
            />
          ))}
        </div>
        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => { setName(course.name); setColor(course.color); setEditing(true); }}
        className="p-1.5 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
        title="Edit course name and color"
      >
        <Pencil className="w-4 h-4" style={{ color: accentColor }} />
      </button>
      <button
        onClick={() => setConfirmDelete(true)}
        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        title="Delete course"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
