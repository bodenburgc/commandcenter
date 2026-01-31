import { useState, useEffect } from 'react';

interface Reminder {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null;
  priority: number;
  isCompleted: boolean;
  list: string;
}

interface RemindersResponse {
  reminders: Reminder[];
  meta: {
    count: number;
    lastUpdated: string | null;
    fetchedAt: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL || '';

// Priority colors
const getPriorityColor = (priority: number): string | null => {
  switch (priority) {
    case 1: return '#FF3B30';
    case 2: return '#FF9500';
    case 3: return '#007AFF';
    default: return null;
  }
};

// List/person colors (matches calendar colors)
const getListColor = (list: string): string => {
  switch (list.toUpperCase()) {
    case 'MCCOY': return '#4CAF50';  // Green (matches calendar)
    case 'KNOX': return '#00BFFF';   // Bright Blue (matches calendar)
    case 'RIPLEY': return '#9C27B0'; // Purple (matches calendar)
    case 'FAMILY': return '#EBAB21'; // Yellow (matches Home calendar)
    default: return '#8E8E93';       // Gray
  }
};

// Compact due date format
const formatDueDate = (dueDate: string): { text: string; isOverdue: boolean; isToday: boolean } => {
  const due = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const isOverdue = dueDay < today;
  const isToday = dueDay.getTime() === today.getTime();
  const isTomorrow = dueDay.getTime() === tomorrow.getTime();

  const hasTime = due.getHours() !== 0 || due.getMinutes() !== 0;
  const timeStr = hasTime
    ? due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : '';

  let text: string;
  if (isOverdue) {
    text = 'Overdue';
  } else if (isToday) {
    text = timeStr || 'Today';
  } else if (isTomorrow) {
    text = timeStr ? `Tom ${timeStr}` : 'Tomorrow';
  } else {
    text = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return { text, isOverdue, isToday };
};

export function KitchenReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const response = await fetch(`${API_URL}/api/reminders`);
        if (!response.ok) return;

        const data: RemindersResponse = await response.json();

        const activeReminders = data.reminders
          .filter(r => !r.isCompleted)
          .sort((a, b) => {
            // Sort by due date first (soonest first, no date last)
            if (a.dueDate && b.dueDate) {
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            // Then by priority
            const priorityA = a.priority || 4;
            const priorityB = b.priority || 4;
            return priorityA - priorityB;
          });

        setReminders(activeReminders);
        setLastUpdated(data.meta.lastUpdated);
      } catch (err) {
        console.error('Reminders fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
    const interval = setInterval(fetchReminders, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !lastUpdated || reminders.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 text-shadow border-b border-white/20 pb-2">
        <div className="text-xl font-semibold text-white">Reminders</div>
        <div className="text-sm text-white/40">{reminders.length}</div>
      </div>

      {/* Reminder list */}
      <div className="space-y-1">
        {reminders.slice(0, 8).map((reminder) => {
          const priorityColor = getPriorityColor(reminder.priority);
          const listColor = getListColor(reminder.list);
          const dueDateInfo = reminder.dueDate ? formatDueDate(reminder.dueDate) : null;

          return (
            <div
              key={reminder.id}
              className="glass rounded-lg px-3 py-1.5 flex items-center gap-2"
              style={{ borderLeft: `3px solid ${priorityColor || listColor}` }}
            >
              {/* List/Person badge */}
              <div
                className="text-xs font-semibold px-1.5 py-0.5 rounded shrink-0"
                style={{ backgroundColor: listColor, color: 'white' }}
              >
                {reminder.list === 'Family' ? 'FAM' : reminder.list.charAt(0)}
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0 text-base text-white font-medium truncate text-shadow">
                {reminder.title}
              </div>

              {/* Due date */}
              {dueDateInfo && (
                <div
                  className={`text-sm shrink-0 ${
                    dueDateInfo.isOverdue
                      ? 'text-red-400'
                      : dueDateInfo.isToday
                      ? 'text-yellow-400'
                      : 'text-white/50'
                  }`}
                >
                  {dueDateInfo.text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
