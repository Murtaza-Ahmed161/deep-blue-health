import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import type { RecurrenceRule } from '@/types/task';
import { format } from 'date-fns';

interface AddTaskDialogProps {
  onAdd: (params: {
    title: string;
    description?: string;
    due_at: string;
    recurrence_rule?: RecurrenceRule;
  }) => Promise<unknown>;
  disabled?: boolean;
  triggerLabel?: string;
}

const RECURRENCE_OPTIONS: { value: RecurrenceRule; label: string }[] = [
  { value: 'none', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function AddTaskDialog({
  onAdd,
  disabled,
  triggerLabel = 'Add task',
}: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [dueTime, setDueTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState<RecurrenceRule>('none');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const due_at = new Date(`${dueDate}T${dueTime}:00`).toISOString();
      await onAdd({ title: title.trim(), description: description.trim() || undefined, due_at, recurrence_rule: recurrence });
      setTitle('');
      setDescription('');
      setDueDate(format(new Date(), 'yyyy-MM-dd'));
      setDueTime('09:00');
      setRecurrence('none');
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add task or event</DialogTitle>
          <DialogDescription>
            Add a task with a deadline. Optionally set it to repeat daily, weekly, or monthly.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="e.g. Take medication, Doctor appointment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-desc">Description (optional)</Label>
            <Textarea
              id="task-desc"
              placeholder="Notes or details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-date">Due date</Label>
              <Input
                id="task-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-time">Time</Label>
              <Input
                id="task-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Repeats</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceRule)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Adding…' : 'Add task'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
