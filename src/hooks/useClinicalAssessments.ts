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
  const [historicalAssessments, setHistoricalAssessments] = useState<ClinicalAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch today's assessment and historical data on mount
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchAssessments = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Fetch today's assessment
        const { data: todayData, error: todayError } = await supabase
          .from('clinical_assessments')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (todayError) throw todayError;

        if (todayData) {
          setAssessment({
            id: todayData.id,
            date: todayData.date,
            painVas: todayData.pain_vas ?? 0,
            fatigueVas: todayData.fatigue_vas ?? 0,
            moodVas: todayData.mood_vas ?? 0,
            bloatingVas: todayData.bloating_vas ?? 0,
            additionalNotes: todayData.additional_notes ?? '',
          });
        }

        // Fetch historical assessments (last 30 days)
        const { data: historyData, error: historyError } = await supabase
          .from('clinical_assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true })
          .limit(30);

        if (historyError) throw historyError;

        if (historyData) {
          setHistoricalAssessments(historyData.map(item => ({
            id: item.id,
            date: item.date,
            painVas: item.pain_vas ?? 0,
            fatigueVas: item.fatigue_vas ?? 0,
            moodVas: item.mood_vas ?? 0,
            bloatingVas: item.bloating_vas ?? 0,
            additionalNotes: item.additional_notes ?? '',
          })));
        }
      } catch (error) {
        console.error('Error fetching clinical assessments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
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
          const { data: insertedData, error } = await supabase
            .from('clinical_assessments')
            .insert(assessmentData)
            .select()
            .single();

          if (error) throw error;

          // Update historical assessments with the new entry
          if (insertedData) {
            setHistoricalAssessments(prev => [...prev, {
              id: insertedData.id,
              date: insertedData.date,
              painVas: insertedData.pain_vas ?? 0,
              fatigueVas: insertedData.fatigue_vas ?? 0,
              moodVas: insertedData.mood_vas ?? 0,
              bloatingVas: insertedData.bloating_vas ?? 0,
              additionalNotes: insertedData.additional_notes ?? '',
            }]);
          }
        }

        // Update historical assessments for today's entry
        setHistoricalAssessments(prev => {
          const existingIndex = prev.findIndex(a => a.date === today);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = { ...newAssessment, date: today };
            return updated;
          }
          return prev;
        });
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
    historicalAssessments,
    isLoading,
    isSaving,
    updateVasScale,
    updateNotes,
  };
}
