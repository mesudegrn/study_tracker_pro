import { useState } from 'react';
import { useData } from '@/context/DataContext';
import type { ItemType } from '@/types';
import { ITEM_TYPE_COLORS, ITEM_TYPE_LABELS } from '@/types';
import { Plus, Check, Trash2, X, Calendar } from 'lucide-react';

interface TaskListProps {
  courseId?: string;
  title?: string;
  accentColor?: string;
}

export default function TaskList({ courseId, title = 'Master To-Do List', accentColor = '#22d3ee' }: TaskListProps) {
  const { tasks, courses, addTask, toggleTask, deleteTask } = useData();
  const [adding, setAdding] = useState(false);
  const [taskTitle, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  const filtered = courseId ? tasks.filter((t) => t.course_id === courseId) : tasks;

  const handleAdd = async () => {
    if (!taskTitle.trim()) return;
    await addTask({
      title: taskTitle.trim(),
      course_id: courseId ?? null,
      due_date: dueDate || null,
      item_type: 'task',
    });
    setTitle('');
    setDueDate('');
    setAdding(false);
  };

  const courseMap = new Map(courses.map((c) => [c.id, c]));

  return (
    <div className="bg-[#16161f] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <button
          onClick={() => setAdding(!adding)}
          style={{ color: accentColor }}
          className="flex items-center gap-1 text-xs transition-colors hover:brightness-125"
        >
          {adding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {adding ? 'Cancel' : 'Add Task'}
        </button>
      </div>

      {adding && (
        <div className="mb-4 space-y-2 bg-[#0a0a0f] rounded-xl p-3 border border-white/5">
          <input
            type="text"
            placeholder="Task title..."
            value={taskTitle}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
            autoFocus
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1 bg-[#16161f] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
            />
            <button
              onClick={handleAdd}
              style={{ backgroundColor: accentColor }}
              className="px-3 py-1.5 text-white text-xs rounded-lg transition-colors hover:brightness-110"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-600 text-center py-6">No tasks yet. Add one to get started!</p>
        )}
        {filtered.map((t) => {
          const course = t.course_id ? courseMap.get(t.course_id) : null;
          const typeColor = t.color ?? ITEM_TYPE_COLORS[t.item_type as ItemType] ?? ITEM_TYPE_COLORS.task;
          return (
            <div
              key={t.id}
              style={course && !t.completed ? { backgroundColor: `${course.color}1a` } : undefined}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                t.completed ? 'bg-emerald-500/5' : 'bg-white/[0.02] hover:bg-white/5'
              }`}
            >
              <button
                onClick={() => toggleTask(t.id, !t.completed)}
                style={!t.completed ? { borderColor: accentColor } : undefined}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                  t.completed
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-gray-600 hover:brightness-125'
                }`}
              >
                {t.completed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${t.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                  {t.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: typeColor }} />
                    {ITEM_TYPE_LABELS[t.item_type as ItemType] ?? 'Task'}
                  </span>
                  {!courseId && course && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: course.color }} />
                      {course.name}
                    </span>
                  )}
                  {t.due_date && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteTask(t.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
