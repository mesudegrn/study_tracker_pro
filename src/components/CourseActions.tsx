import { useState } from 'react';
import { useData } from '@/context/DataContext';
import type { Course } from '@/types';
import { Pencil, Trash2, X, Check } from 'lucide-react';

interface Props {
  course: Course;
  onDelete: () => void;
}

export default function CourseActions({ course, onDelete }: Props) {
  const { updateCourse, deleteCourse } = useData();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(course.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveName = async () => {
    if (!name.trim() || name.trim() === course.name) {
      setEditing(false);
      return;
    }
    await updateCourse(course.id, { name: name.trim() });
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
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && saveName()}
          className="bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-all w-48"
          autoFocus
        />
        <button
          onClick={saveName}
          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setEditing(false); setName(course.name); }}
          className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setEditing(true)}
        className="p-1.5 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
        title="Edit course name"
      >
        <Pencil className="w-4 h-4" />
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
