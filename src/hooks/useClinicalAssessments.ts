import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface ClinicalAssessment {
  id?: string;
  date: string;
  painVas: number;
  fatigueVas: number;
  moodVas: number;
  bloatingVas: number;
  additionalNotes: string;
}

export function useClinicalAssessments() {
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<ClinicalAssessment>({
    date: format(new Date(), 'yyyy-MM-dd'),
    painVas: 0,
    fatigueVas: 0,
    moodVas: 0,
    bloatingVas: 0,
    additionalNotes: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch today's assessment on mount
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchTodaysAssessment = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data, error } = await supabase
          .from('clinical_assessments')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setAssessment({
            id: data.id,
            date: data.date,
            painVas: data.pain_vas ?? 0,
            fatigueVas: data.fatigue_vas ?? 0,
            moodVas: data.mood_vas ?? 0,
            bloatingVas: data.bloating_vas ?? 0,
            additionalNotes: data.additional_notes ?? '',
          });
        }
      } catch (error) {
        console.error('Error fetching clinical assessment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodaysAssessment();
  }, [user]);

  // Save assessment to database with debounce
  const saveAssessment = useCallback(async (newAssessment: ClinicalAssessment) => {
    if (!user) return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // First fetch the latest record to avoid race conditions
        const { data: existingData } = await supabase
          .from('clinical_assessments')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        const assessmentData = {
          user_id: user.id,
          date: today,
          pain_vas: newAssessment.painVas,
          fatigue_vas: newAssessment.fatigueVas,
          mood_vas: newAssessment.moodVas,
          bloating_vas: newAssessment.bloatingVas,
          additional_notes: newAssessment.additionalNotes?.slice(0, 500) || null,
        };

        if (existingData) {
          // Update existing record
          const { error } = await supabase
            .from('clinical_assessments')
            .update(assessmentData)
            .eq('id', existingData.id);

          if (error) throw error;
        } else {
          // Insert new record
          const { error } = await supabase
            .from('clinical_assessments')
            .insert(assessmentData);

          if (error) throw error;
        }
      } catch (error) {
        console.error('Error saving clinical assessment:', error);
        toast.error('Failed to save assessment');
      } finally {
        setIsSaving(false);
      }
    }, 500);
  }, [user]);

  // Update a single VAS scale
  const updateVasScale = useCallback((scaleId: string, value: number) => {
    setAssessment(prev => {
      const updated = { ...prev };
      switch (scaleId) {
        case 'pain':
          updated.painVas = value;
          break;
        case 'fatigue':
          updated.fatigueVas = value;
          break;
        case 'mood':
          updated.moodVas = value;
          break;
        case 'bloating':
          updated.bloatingVas = value;
          break;
      }
      saveAssessment(updated);
      return updated;
    });
  }, [saveAssessment]);

  // Update additional notes
  const updateNotes = useCallback((notes: string) => {
    setAssessment(prev => {
      const updated = { ...prev, additionalNotes: notes };
      saveAssessment(updated);
      return updated;
    });
  }, [saveAssessment]);

  // Get all historical assessments
  const getHistoricalAssessments = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('clinical_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        date: item.date,
        painVas: item.pain_vas ?? 0,
        fatigueVas: item.fatigue_vas ?? 0,
        moodVas: item.mood_vas ?? 0,
        bloatingVas: item.bloating_vas ?? 0,
        additionalNotes: item.additional_notes ?? '',
      })) ?? [];
    } catch (error) {
      console.error('Error fetching historical assessments:', error);
      return [];
    }
  }, [user]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    assessment,
    isLoading,
    isSaving,
    updateVasScale,
    updateNotes,
    getHistoricalAssessments,
  };
}
