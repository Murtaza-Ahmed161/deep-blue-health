import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Circle, Trash2, Calendar, Repeat } from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import type { Task } from '@/types/task';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
}

const RECURRENCE_LABELS: Record<string, string> = {
  none: '',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const due = new Date(task.due_at);
  const isOverdue = !task.is_completed && isPast(due) && !isToday(due);
  const recurrence = task.recurrence_rule && task.recurrence_rule !== 'none' ? task.recurrence_rule : null;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        task.is_completed ? 'bg-muted/50 border-muted' : 'bg-background border-border'
      } ${isOverdue ? 'border-destructive/50' : ''}`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-8 w-8 rounded-full"
        onClick={() => onToggle(task)}
        aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.is_completed ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium truncate ${
            task.is_completed ? 'text-muted-foreground line-through' : ''
          }`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(due, 'MMM d, h:mm a')}
          </span>
          {recurrence && (
            <Badge variant="secondary" className="text-xs font-normal gap-1">
              <Repeat className="h-3 w-3" />
              {RECURRENCE_LABELS[recurrence] || recurrence}
            </Badge>
          )}
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{task.title}&quot;. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(task.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
