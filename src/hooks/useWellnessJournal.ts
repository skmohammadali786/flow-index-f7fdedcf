import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfDay, format } from 'date-fns';

export interface JournalEntry {
  id: string;
  date: string;
  mood_rating: number | null;
  gratitude: string | null;
  reflection: string | null;
  affirmation: string | null;
  energy_level: number | null;
  self_care_done: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function useWellnessJournal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('wellness_journal')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(90);

      if (error) throw error;
      setEntries((data as unknown as JournalEntry[]) || []);
    } catch (err) {
      console.error('Failed to fetch journal entries:', err);
    } finally {
      setIsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const getEntryForDate = useCallback((date: Date): JournalEntry | undefined => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    return entries.find(e => e.date === dateStr);
  }, [entries]);

  const saveEntry = useCallback(async (date: Date, data: Partial<Omit<JournalEntry, 'id' | 'created_at' | 'updated_at' | 'date'>>) => {
    if (!user) return;
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    const existing = entries.find(e => e.date === dateStr);

    try {
      if (existing) {
        const { error } = await supabase
          .from('wellness_journal')
          .update(data as any)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const insertData = { user_id: user.id, date: dateStr, ...data };
        const { error } = await supabase
          .from('wellness_journal')
          .insert(insertData as any);
        if (error) throw error;
      }
      await fetchEntries();
      toast.success('Journal entry saved');
    } catch (err) {
      console.error('Failed to save journal entry:', err);
      toast.error('Failed to save journal entry');
    }
  }, [user, entries, fetchEntries]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('wellness_journal')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Journal entry deleted');
    } catch (err) {
      console.error('Failed to delete journal entry:', err);
      toast.error('Failed to delete journal entry');
    }
  }, []);

  const getStreak = useCallback((): number => {
    if (entries.length === 0) return 0;
    let streak = 0;
    const today = startOfDay(new Date());
    for (let i = 0; i < entries.length; i++) {
      const entryDate = startOfDay(new Date(entries[i].date));
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      if (format(entryDate, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [entries]);

  return {
    entries,
    isLoaded,
    getEntryForDate,
    saveEntry,
    deleteEntry,
    getStreak,
  };
}
