import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo, Loader2 } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import AddTaskDialog from './AddTaskDialog';
import TaskItem from './TaskItem';
import type { Task } from '@/types/task';
import { format, isToday, isPast, startOfDay } from 'date-fns';

function groupTasks(tasks: Task[]): { overdue: Task[]; today: Task[]; upcoming: Task[]; completed: Task[] } {
  const now = startOfDay(new Date());
  const overdue: Task[] = [];
  const today: Task[] = [];
  const upcoming: Task[] = [];
  const completed: Task[] = [];

  for (const task of tasks) {
    if (task.is_completed) {
      completed.push(task);
      continue;
    }
    const due = new Date(task.due_at);
    const dueStart = startOfDay(due);
    if (dueStart < now) overdue.push(task);
    else if (isToday(due)) today.push(task);
    else upcoming.push(task);
  }

  const sortByDue = (a: Task, b: Task) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  overdue.sort(sortByDue);
  today.sort(sortByDue);
  upcoming.sort(sortByDue);
  completed.sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());

  return { overdue, today, upcoming, completed };
}

export default function DailyTaskManager() {
  const { toast } = useToast();
  const { tasks, loading, addTask, toggleComplete, deleteTask } = useTasks();

  const { overdue, today, upcoming, completed } = useMemo(() => groupTasks(tasks), [tasks]);

  const handleAdd = async (params: Parameters<typeof addTask>[0]) => {
    try {
      await addTask(params);
      toast({ title: 'Task added', description: 'Your task has been added.' });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Could not add task',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (task: Task) => {
    const nextCompleted = !task.is_completed;
    try {
      await toggleComplete(task);
      toast({
        title: nextCompleted ? 'Task completed' : 'Task reopened',
        description: nextCompleted ? 'Great job!' : undefined,
      });
    } catch (e) {
      console.error(e);
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      toast({ title: 'Task deleted' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const renderSection = (label: string, list: Task[]) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="space-y-2">
          {list.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Daily tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAny = overdue.length > 0 || today.length > 0 || upcoming.length > 0 || completed.length > 0;

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Daily tasks
            </CardTitle>
            <CardDescription>
              Tasks and events with deadlines. Recurring tasks repeat after you complete them.
            </CardDescription>
          </div>
          <AddTaskDialog onAdd={handleAdd} triggerLabel="Add task" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasAny ? (
          <div className="text-center py-8 text-muted-foreground">
            <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No tasks yet</p>
            <p className="text-xs mt-2">Add a task or event with a deadline to get started</p>
            <AddTaskDialog onAdd={handleAdd} triggerLabel="Add your first task" />
          </div>
        ) : (
          <>
            {renderSection('Overdue', overdue)}
            {renderSection('Today', today)}
            {renderSection('Upcoming', upcoming)}
            {completed.length > 0 && renderSection('Completed', completed.slice(0, 5))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
