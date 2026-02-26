import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SleepLog {
  id: string;
  user_id: string;
  date: string;
  bedtime: string | null;
  wake_time: string | null;
  sleep_hours: number | null;
  sleep_quality: string;
  sleep_score: number | null;
  dream_logged: boolean;
  dream_description: string | null;
  dream_mood: string | null;
  dream_tags: string[];
  night_wakings: number;
  sleep_aids: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useSleepTracker() {
  const { user } = useAuth();
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(500);
      if (error) throw error;
      setSleepLogs(data || []);
    } catch (err) {
      console.error('Error fetching sleep logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const addSleepLog = async (log: Omit<SleepLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    try {
      const { error } = await (supabase as any)
        .from('sleep_logs')
        .insert({ ...log, user_id: user.id });
      if (error) throw error;
      toast.success('Sleep logged!');
      fetchLogs();
    } catch (err) {
      toast.error('Failed to log sleep');
      console.error(err);
    }
  };

  const deleteSleepLog = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await (supabase as any)
        .from('sleep_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Sleep log deleted');
      fetchLogs();
    } catch (err) {
      toast.error('Failed to delete sleep log');
    }
  };

  const getAverageSleep = (days: number = 7): number => {
    const recent = sleepLogs.slice(0, days).filter(l => l.sleep_hours);
    if (recent.length === 0) return 0;
    return Number((recent.reduce((s, l) => s + (l.sleep_hours || 0), 0) / recent.length).toFixed(1));
  };

  const getSleepTrend = (): 'improving' | 'declining' | 'stable' => {
    if (sleepLogs.length < 4) return 'stable';
    const recent = sleepLogs.slice(0, 3).reduce((s, l) => s + (l.sleep_hours || 0), 0) / 3;
    const older = sleepLogs.slice(3, 6).reduce((s, l) => s + (l.sleep_hours || 0), 0) / 3;
    if (recent - older > 0.5) return 'improving';
    if (older - recent > 0.5) return 'declining';
    return 'stable';
  };

  const getDreamStats = () => {
    const withDreams = sleepLogs.filter(l => l.dream_logged);
    const moods: Record<string, number> = {};
    withDreams.forEach(l => {
      if (l.dream_mood) moods[l.dream_mood] = (moods[l.dream_mood] || 0) + 1;
    });
    return { totalDreams: withDreams.length, moodDistribution: moods };
  };

  return { sleepLogs, isLoading, addSleepLog, deleteSleepLog, getAverageSleep, getSleepTrend, getDreamStats, refetch: fetchLogs };
}
