import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Task } from '@/types/task';
import type { RecurrenceRule } from '@/types/task';

function addRecurrence(dueAt: string, rule: RecurrenceRule): string {
  const d = new Date(dueAt);
  if (rule === 'daily') d.setUTCDate(d.getUTCDate() + 1);
  else if (rule === 'weekly') d.setUTCDate(d.getUTCDate() + 7);
  else if (rule === 'monthly') d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString();
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_at', { ascending: true });
      if (error) throw error;
      setTasks((data as Task[]) || []);
    } catch (e) {
      console.error('Error fetching tasks:', e);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
        () => fetchTasks()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTasks]);

  const addTask = useCallback(
    async (params: { title: string; description?: string; due_at: string; recurrence_rule?: RecurrenceRule }) => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: params.title,
          description: params.description || null,
          due_at: params.due_at,
          recurrence_rule: params.recurrence_rule ?? 'none',
        })
        .select()
        .single();
      if (error) throw error;
      await fetchTasks();
      return data as Task;
    },
    [user, fetchTasks]
  );

  const toggleComplete = useCallback(
    async (task: Task) => {
      if (!user) return;
      const nextCompleted = !task.is_completed;
      const recurrence = (task.recurrence_rule || 'none') as RecurrenceRule;
      const dueAt = nextCompleted && recurrence !== 'none'
        ? addRecurrence(task.due_at, recurrence)
        : task.due_at;
      const { error } = await supabase
        .from('tasks')
        .update({
          is_completed: nextCompleted,
          completed_at: nextCompleted ? new Date().toISOString() : null,
          due_at: nextCompleted && recurrence !== 'none' ? dueAt : task.due_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);
      if (error) throw error;
      await fetchTasks();
    },
    [user, fetchTasks]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      await fetchTasks();
    },
    [user, fetchTasks]
  );

  return { tasks, loading, fetchTasks, addTask, toggleComplete, deleteTask };
}
