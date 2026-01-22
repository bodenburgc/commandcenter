interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface TodoCardProps {
  title: string;
  due?: string | null;
  notes?: string | null;
  subtasks?: Subtask[];
  listColor?: string;
}

export function TodoCard({ title, due, notes, subtasks = [], listColor = '#4CAF50' }: TodoCardProps) {
  // Format due date if present
  const formatDue = (dueDate: string) => {
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) return 'Today';
    if (taskDate.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Check if overdue
  const isOverdue = due ? new Date(due) < new Date() : false;

  return (
    <div
      className="netflix-card w-72 min-w-72 p-4 bg-white/10 backdrop-blur-sm hover:bg-white/15 cursor-pointer"
      style={{ borderLeft: `4px solid ${listColor}` }}
    >
      {/* Task title */}
      <div className="text-base font-medium text-white mb-2 line-clamp-2">
        {title}
      </div>

      {/* Subtasks */}
      {subtasks.length > 0 && (
        <div className="mb-2 space-y-1">
          {subtasks.slice(0, 4).map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-2 text-sm text-white/70">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
              <span className="line-clamp-1">{subtask.title}</span>
            </div>
          ))}
          {subtasks.length > 4 && (
            <div className="text-xs text-white/40">+{subtasks.length - 4} more</div>
          )}
        </div>
      )}

      {/* Notes preview */}
      {notes && !subtasks.length && (
        <div className="text-sm text-white/60 mb-2 line-clamp-1">
          {notes}
        </div>
      )}

      {/* Due date */}
      {due && (
        <div className={`text-sm ${isOverdue ? 'text-red-400' : 'text-white/50'}`}>
          Due: {formatDue(due)}
        </div>
      )}
    </div>
  );
}
