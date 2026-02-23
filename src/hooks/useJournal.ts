import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { JournalEntry, JournalEntryInsert, JournalEntryUpdate } from '@/types/journal';

const STORAGE_BUCKET = 'memory-journal';

export function useJournal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('memory_journal')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEntries((data as JournalEntry[]) || []);
    } catch (e) {
      console.error('Error fetching journal entries:', e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('journal-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memory_journal', filter: `user_id=eq.${user.id}` },
        () => fetchEntries()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchEntries]);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
    if (!urlData?.publicUrl) throw new Error('Failed to get image URL');
    return urlData.publicUrl;
  }, [user]);

  const uploadAudio = useCallback(async (file: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const fileExt = file.name.split('.').pop() || 'webm';
    const fileName = `${user.id}/audio/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
    if (!urlData?.publicUrl) throw new Error('Failed to get audio URL');
    return urlData.publicUrl;
  }, [user]);

  const addEntry = useCallback(
    async (params: JournalEntryInsert) => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('memory_journal')
        .insert({ ...params, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      await fetchEntries();
      return data as JournalEntry;
    },
    [user, fetchEntries]
  );

  const updateEntry = useCallback(
    async (id: string, updates: JournalEntryUpdate) => {
      if (!user) return;
      const { error } = await supabase
        .from('memory_journal')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await fetchEntries();
    },
    [user, fetchEntries]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!user) return;
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        if (entry.image_urls) {
          for (const url of entry.image_urls) {
            const path = url.split('/').slice(-2).join('/');
            await supabase.storage.from(STORAGE_BUCKET).remove([path]).catch(console.error);
          }
        }
        if (entry.audio_url) {
          const path = entry.audio_url.split('/').slice(-2).join('/');
          await supabase.storage.from(STORAGE_BUCKET).remove([path]).catch(console.error);
        }
      }
      const { error } = await supabase.from('memory_journal').delete().eq('id', id);
      if (error) throw error;
      await fetchEntries();
    },
    [user, entries, fetchEntries]
  );

  return {
    entries,
    loading,
    fetchEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    uploadImage,
    uploadAudio,
  };
}
