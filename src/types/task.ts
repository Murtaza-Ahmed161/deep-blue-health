export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_at: string;
  recurrence_rule: RecurrenceRule;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskInsert {
  user_id: string;
  title: string;
  description?: string | null;
  due_at: string;
  recurrence_rule?: RecurrenceRule;
  is_completed?: boolean;
  completed_at?: string | null;
}
