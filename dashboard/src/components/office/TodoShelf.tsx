import { useState, useEffect } from 'react';
import { ContentShelf } from './ContentShelf';
import { TodoCard } from './TodoCard';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  notes: string | null;
  due: string | null;
  completed: boolean;
  subtasks: Subtask[];
}

interface TaskList {
  id: string;
  name: string;
  tasks: Task[];
}

interface TasksResponse {
  lists: TaskList[];
  meta: {
    count: number;
    fetchedAt: string;
  };
}

// Colors for different task lists
const LIST_COLORS: Record<string, string> = {
  Scales: '#1A73E8',   // Google Blue
  BODE: '#009688',     // Teal
};

const API_URL = import.meta.env.VITE_API_URL || '';

export function TodoShelf() {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`${API_URL}/api/tasks`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data: TasksResponse = await response.json();
        setTaskLists(data.lists);
        setError(null);
      } catch (err) {
        console.error('Tasks fetch error:', err);
        setError('Unable to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="mb-6 px-8">
        <div className="text-white/50 text-lg">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 px-8">
        <div className="text-white/50 text-lg">{error}</div>
      </div>
    );
  }

  // Render each task list as a separate shelf
  return (
    <>
      {taskLists.map((list) => (
        <ContentShelf key={list.id} title={list.name}>
          {list.tasks.length > 0 ? (
            list.tasks.map((task) => (
              <TodoCard
                key={task.id}
                title={task.title}
                due={task.due}
                notes={task.notes}
                subtasks={task.subtasks}
                listColor={LIST_COLORS[list.name] || '#4CAF50'}
              />
            ))
          ) : (
            <div className="netflix-card w-64 min-w-64 p-4 bg-white/5">
              <div className="text-white/40 text-center">No tasks</div>
            </div>
          )}
        </ContentShelf>
      ))}
    </>
  );
}
