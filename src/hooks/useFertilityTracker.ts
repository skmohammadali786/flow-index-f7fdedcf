import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfDay, subDays, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export interface FertilityLog {
  id: string;
  date: string;
  opk_result?: 'negative' | 'low' | 'high' | 'peak' | null;
  cervical_mucus?: 'dry' | 'sticky' | 'creamy' | 'watery' | 'egg_white' | null;
  lh_level?: number | null;
  intercourse?: boolean;
  intercourse_protected?: boolean | null;
  cervix_position?: 'low' | 'medium' | 'high' | null;
  cervix_firmness?: 'firm' | 'medium' | 'soft' | null;
  notes?: string | null;
}

export interface PregnancyRecord {
  id: string;
  conception_date?: string | null;
  last_period_date?: string | null;
  due_date: string;
  is_active: boolean;
  pregnancy_confirmed: boolean;
  notes?: string | null;
}

export interface PregnancyLog {
  id: string;
  pregnancy_id: string;
  date: string;
  week_number?: number | null;
  weight?: number | null;
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
  symptoms?: string[];
  baby_movements?: number | null;
  appointment_notes?: string | null;
  mood?: string | null;
  notes?: string | null;
}

export interface BirthRecord {
  id: string;
  pregnancy_id?: string | null;
  birth_date: string;
  birth_time?: string | null;
  birth_type?: 'vaginal' | 'cesarean' | 'assisted' | 'water_birth' | null;
  baby_name?: string | null;
  baby_weight?: number | null;
  baby_length?: number | null;
  baby_gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  apgar_1min?: number | null;
  apgar_5min?: number | null;
  birth_location?: string | null;
  birth_notes?: string | null;
  birth_plan?: Record<string, any>;
  complications?: string | null;
}

export interface PostpartumLog {
  id: string;
  birth_record_id?: string | null;
  date: string;
  mood_rating?: number | null;
  anxiety_level?: number | null;
  sleep_hours?: number | null;
  bleeding_intensity?: 'none' | 'light' | 'moderate' | 'heavy' | null;
  pain_level?: number | null;
  breastfeeding?: boolean | null;
  breastfeeding_issues?: string | null;
  physical_symptoms?: string[];
  emotional_symptoms?: string[];
  support_received?: boolean;
  notes?: string | null;
}

export function useFertilityTracker() {
  const { user } = useAuth();
  const [fertilityLogs, setFertilityLogs] = useState<FertilityLog[]>([]);
  const [pregnancies, setPregnancies] = useState<PregnancyRecord[]>([]);
  const [pregnancyLogs, setPregnancyLogs] = useState<PregnancyLog[]>([]);
  const [birthRecords, setBirthRecords] = useState<BirthRecord[]>([]);
  const [postpartumLogs, setPostpartumLogs] = useState<PostpartumLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const [fertRes, pregRes, pregLogRes, birthRes, ppRes] = await Promise.all([
        supabase.from('fertility_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('pregnancy_tracking').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('pregnancy_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('birth_records').select('*').eq('user_id', user.id).order('birth_date', { ascending: false }),
        supabase.from('postpartum_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      ]);

      if (fertRes.data) setFertilityLogs(fertRes.data as any);
      if (pregRes.data) setPregnancies(pregRes.data as any);
      if (pregLogRes.data) setPregnancyLogs(pregLogRes.data as any);
      if (birthRes.data) setBirthRecords(birthRes.data as any);
      if (ppRes.data) setPostpartumLogs(ppRes.data as any);
      setIsLoaded(true);
    } catch (err) {
      console.error('Error fetching fertility data:', err);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveFertilityLog = useCallback(async (date: Date, data: Partial<FertilityLog>) => {
    if (!user) return;
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    const existing = fertilityLogs.find(l => l.date === dateStr);

    try {
      if (existing) {
        await supabase.from('fertility_logs').update(data as any).eq('id', existing.id);
      } else {
        await supabase.from('fertility_logs').insert({ user_id: user.id, date: dateStr, ...data } as any);
      }
      await fetchAll();
    } catch (err) {
      toast.error('Failed to save fertility log');
    }
  }, [user, fertilityLogs, fetchAll]);

  const getFertilityLogForDate = useCallback((date: Date): FertilityLog | undefined => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    return fertilityLogs.find(l => l.date === dateStr);
  }, [fertilityLogs]);

  // Pregnancy
  const createPregnancy = useCallback(async (data: { last_period_date?: string; conception_date?: string; due_date: string }) => {
    if (!user) return;
    try {
      // Deactivate existing pregnancies
      await supabase.from('pregnancy_tracking').update({ is_active: false } as any).eq('user_id', user.id).eq('is_active', true);
      await supabase.from('pregnancy_tracking').insert({ user_id: user.id, is_active: true, ...data } as any);
      toast.success('Pregnancy tracking started!');
      await fetchAll();
    } catch (err) {
      toast.error('Failed to create pregnancy record');
    }
  }, [user, fetchAll]);

  const getActivePregnancy = useCallback((): PregnancyRecord | undefined => {
    return pregnancies.find(p => p.is_active);
  }, [pregnancies]);

  const getPregnancyWeek = useCallback((pregnancy: PregnancyRecord): number => {
    const refDate = pregnancy.last_period_date || pregnancy.conception_date;
    if (!refDate) return 0;
    const days = differenceInDays(new Date(), new Date(refDate));
    if (pregnancy.conception_date && !pregnancy.last_period_date) {
      return Math.floor((days + 14) / 7); // Add 2 weeks if counting from conception
    }
    return Math.floor(days / 7);
  }, []);

  const savePregnancyLog = useCallback(async (date: Date, pregnancyId: string, data: Partial<PregnancyLog>) => {
    if (!user) return;
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    const existing = pregnancyLogs.find(l => l.date === dateStr);

    try {
      if (existing) {
        await supabase.from('pregnancy_logs').update(data as any).eq('id', existing.id);
      } else {
        await supabase.from('pregnancy_logs').insert({ user_id: user.id, pregnancy_id: pregnancyId, date: dateStr, ...data } as any);
      }
      await fetchAll();
    } catch (err) {
      toast.error('Failed to save pregnancy log');
    }
  }, [user, pregnancyLogs, fetchAll]);

  // Birth
  const saveBirthRecord = useCallback(async (data: Partial<BirthRecord> & { birth_date: string }) => {
    if (!user) return;
    const existing = birthRecords.find(b => b.birth_date === data.birth_date);
    try {
      if (existing) {
        await supabase.from('birth_records').update(data as any).eq('id', existing.id);
      } else {
        await supabase.from('birth_records').insert({ user_id: user.id, ...data } as any);
      }
      // Deactivate pregnancy
      if (data.pregnancy_id) {
        await supabase.from('pregnancy_tracking').update({ is_active: false } as any).eq('id', data.pregnancy_id);
      }
      toast.success('Birth record saved!');
      await fetchAll();
    } catch (err) {
      toast.error('Failed to save birth record');
    }
  }, [user, birthRecords, fetchAll]);

  // Postpartum
  const savePostpartumLog = useCallback(async (date: Date, data: Partial<PostpartumLog>) => {
    if (!user) return;
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    const existing = postpartumLogs.find(l => l.date === dateStr);

    try {
      if (existing) {
        await supabase.from('postpartum_logs').update(data as any).eq('id', existing.id);
      } else {
        await supabase.from('postpartum_logs').insert({ user_id: user.id, date: dateStr, ...data } as any);
      }
      await fetchAll();
    } catch (err) {
      toast.error('Failed to save postpartum log');
    }
  }, [user, postpartumLogs, fetchAll]);

  // LH surge detection
  const detectLHSurge = useCallback((): { detected: boolean; surgeDate?: string; daysAgo?: number } => {
    const recent = fertilityLogs
      .filter(l => l.lh_level && l.lh_level > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    if (recent.length < 3) return { detected: false };

    const avg = recent.reduce((sum, l) => sum + (l.lh_level || 0), 0) / recent.length;
    const surgeEntry = recent.find(l => (l.lh_level || 0) > avg * 1.5);
    
    if (surgeEntry) {
      return {
        detected: true,
        surgeDate: surgeEntry.date,
        daysAgo: differenceInDays(new Date(), new Date(surgeEntry.date)),
      };
    }
    return { detected: false };
  }, [fertilityLogs]);

  // BBT pattern detection
  const detectBBTShift = useCallback((periodLogs: Array<{ date: string; temperature?: number }>): { shifted: boolean; shiftDate?: string } => {
    const temps = periodLogs
      .filter(l => l.temperature && l.temperature > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-21);

    if (temps.length < 10) return { shifted: false };

    // Find potential shift: 3 consecutive temps above the previous 6 avg
    for (let i = 6; i < temps.length - 2; i++) {
      const preAvg = temps.slice(i - 6, i).reduce((s, t) => s + (t.temperature || 0), 0) / 6;
      const post = temps.slice(i, i + 3);
      const allAbove = post.every(t => (t.temperature || 0) > preAvg + 0.1);
      if (allAbove) {
        return { shifted: true, shiftDate: temps[i].date };
      }
    }
    return { shifted: false };
  }, []);

  return {
    fertilityLogs,
    pregnancies,
    pregnancyLogs,
    birthRecords,
    postpartumLogs,
    isLoaded,
    saveFertilityLog,
    getFertilityLogForDate,
    createPregnancy,
    getActivePregnancy,
    getPregnancyWeek,
    savePregnancyLog,
    saveBirthRecord,
    savePostpartumLog,
    detectLHSurge,
    detectBBTShift,
    refetch: fetchAll,
  };
}
