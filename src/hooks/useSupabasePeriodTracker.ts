import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DayLog, 
  CycleData, 
  CyclePrediction, 
  CycleStats,
  FlowIntensity,
  Mood,
  Symptom,
  Medication,
  SleepQuality
} from '@/types/period';
import { 
  format, 
  parseISO, 
  addDays, 
  differenceInDays, 
  startOfDay 
} from 'date-fns';

export function useSupabasePeriodTracker() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch data from database
  useEffect(() => {
    if (!user) {
      setLogs([]);
      setCycles([]);
      setIsLoaded(true);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch period logs
        const { data: logsData, error: logsError } = await supabase
          .from('period_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (logsError) throw logsError;

        // Transform database logs to app format
        const transformedLogs: DayLog[] = (logsData || []).map(log => ({
          date: log.date,
          isPeriod: log.is_period,
          flowIntensity: log.flow_intensity as FlowIntensity | undefined,
          moods: (log.moods || []) as Mood[],
          symptoms: (log.symptoms || []) as Symptom[],
          notes: log.notes || undefined,
          waterIntake: log.water_intake || undefined,
          sleepHours: log.sleep_hours ? Number(log.sleep_hours) : undefined,
          sleepQuality: log.sleep_quality as SleepQuality | undefined,
          exerciseMinutes: log.exercise_minutes || undefined,
          temperature: log.temperature ? Number(log.temperature) : undefined,
          medications: Array.isArray(log.medications) ? (log.medications as unknown as Medication[]) : undefined,
        }));

        setLogs(transformedLogs);

        // Fetch cycles
        const { data: cyclesData, error: cyclesError } = await supabase
          .from('cycles')
          .select('*')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });

        if (cyclesError) throw cyclesError;

        const transformedCycles: CycleData[] = (cyclesData || []).map(cycle => ({
          startDate: cycle.start_date,
          endDate: cycle.end_date || undefined,
          length: cycle.length || undefined,
        }));

        setCycles(transformedCycles);
      } catch (error) {
        console.error('Error fetching period data:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  }, [user]);

  // Get log for a specific date
  const getLogForDate = useCallback((date: Date): DayLog | undefined => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    return logs.find(log => log.date === dateStr);
  }, [logs]);

  // Upsert log to database
  const upsertLog = async (dateStr: string, updates: Partial<DayLog>) => {
    if (!user) return;

    const existingLog = logs.find(l => l.date === dateStr);
    const newLog: DayLog = {
      date: dateStr,
      isPeriod: updates.isPeriod ?? existingLog?.isPeriod ?? false,
      flowIntensity: updates.flowIntensity ?? existingLog?.flowIntensity,
      moods: updates.moods ?? existingLog?.moods ?? [],
      symptoms: updates.symptoms ?? existingLog?.symptoms ?? [],
      notes: updates.notes ?? existingLog?.notes,
      waterIntake: updates.waterIntake ?? existingLog?.waterIntake,
      sleepHours: updates.sleepHours ?? existingLog?.sleepHours,
      sleepQuality: updates.sleepQuality ?? existingLog?.sleepQuality,
      exerciseMinutes: updates.exerciseMinutes ?? existingLog?.exerciseMinutes,
      temperature: updates.temperature ?? existingLog?.temperature,
      medications: updates.medications ?? existingLog?.medications,
    };

    // Update local state optimistically
    setLogs(prev => {
      const existing = prev.find(l => l.date === dateStr);
      if (existing) {
        return prev.map(l => l.date === dateStr ? newLog : l);
      }
      return [...prev, newLog];
    });

    // Save to database - check if log exists first
    const { data: existingData } = await supabase
      .from('period_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', dateStr)
      .maybeSingle();

    let error;
    if (existingData) {
      const result = await supabase
        .from('period_logs')
        .update({
          is_period: newLog.isPeriod,
          flow_intensity: newLog.flowIntensity || null,
          moods: newLog.moods,
          symptoms: newLog.symptoms,
          notes: newLog.notes || null,
          water_intake: newLog.waterIntake || null,
          sleep_hours: newLog.sleepHours || null,
          sleep_quality: newLog.sleepQuality || null,
          exercise_minutes: newLog.exerciseMinutes || null,
          temperature: newLog.temperature || null,
          medications: newLog.medications as unknown as null,
        })
        .eq('id', existingData.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('period_logs')
        .insert([{
          user_id: user.id,
          date: dateStr,
          is_period: newLog.isPeriod,
          flow_intensity: newLog.flowIntensity || null,
          moods: newLog.moods,
          symptoms: newLog.symptoms,
          notes: newLog.notes || null,
          water_intake: newLog.waterIntake || null,
          sleep_hours: newLog.sleepHours || null,
          sleep_quality: newLog.sleepQuality || null,
          exercise_minutes: newLog.exerciseMinutes || null,
          temperature: newLog.temperature || null,
          medications: newLog.medications as unknown as null,
        }]);
      error = result.error;
    }

    if (error) {
      console.error('Error saving log:', error);
    }
  };

  // Log period day
  const logPeriodDay = useCallback(async (
    date: Date, 
    isPeriod: boolean, 
    flowIntensity?: FlowIntensity
  ) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    
    await upsertLog(dateStr, { 
      isPeriod, 
      flowIntensity: isPeriod ? flowIntensity : undefined 
    });

    // Update cycles when logging period
    if (isPeriod && user) {
      await updateCycles(dateStr);
    }
  }, [user, logs]);

  // Update cycles based on period logs
  const updateCycles = async (dateStr: string) => {
    if (!user) return;

    const date = parseISO(dateStr);
    const sortedCycles = [...cycles].sort((a, b) => 
      parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()
    );

    // Check if this date extends an existing cycle
    for (const cycle of sortedCycles) {
      const cycleStart = parseISO(cycle.startDate);
      const cycleEnd = cycle.endDate ? parseISO(cycle.endDate) : cycleStart;
      
      // If within 2 days of existing cycle, extend it
      if (differenceInDays(date, cycleEnd) <= 2 && differenceInDays(date, cycleEnd) >= 0) {
        const newLength = differenceInDays(date, cycleStart) + 1;
        
        setCycles(prev => prev.map(c => 
          c.startDate === cycle.startDate 
            ? { ...c, endDate: dateStr, length: newLength }
            : c
        ));

        await supabase
          .from('cycles')
          .update({ end_date: dateStr, length: newLength })
          .eq('user_id', user.id)
          .eq('start_date', cycle.startDate);
        return;
      }
      
      if (differenceInDays(cycleStart, date) <= 2 && differenceInDays(cycleStart, date) >= 0) {
        const newLength = differenceInDays(parseISO(cycle.endDate || cycle.startDate), date) + 1;
        
        setCycles(prev => prev.map(c => 
          c.startDate === cycle.startDate 
            ? { ...c, startDate: dateStr, length: newLength }
            : c
        ));

        await supabase
          .from('cycles')
          .update({ start_date: dateStr, length: newLength })
          .eq('user_id', user.id)
          .eq('start_date', cycle.startDate);
        return;
      }
    }

    // Start a new cycle
    const newCycle: CycleData = { startDate: dateStr, endDate: dateStr, length: 1 };
    setCycles(prev => [...prev, newCycle]);

    await supabase
      .from('cycles')
      .insert({
        user_id: user.id,
        start_date: dateStr,
        end_date: dateStr,
        length: 1,
      });
  };

  // Log mood
  const logMood = useCallback(async (date: Date, mood: Mood) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    const existing = logs.find(log => log.date === dateStr);
    const currentMoods = existing?.moods || [];
    const newMoods = currentMoods.includes(mood)
      ? currentMoods.filter(m => m !== mood)
      : [...currentMoods, mood];
    
    await upsertLog(dateStr, { moods: newMoods });
  }, [logs, user]);

  // Log symptom
  const logSymptom = useCallback(async (date: Date, symptom: Symptom) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    const existing = logs.find(log => log.date === dateStr);
    const currentSymptoms = existing?.symptoms || [];
    const newSymptoms = currentSymptoms.includes(symptom)
      ? currentSymptoms.filter(s => s !== symptom)
      : [...currentSymptoms, symptom];
    
    await upsertLog(dateStr, { symptoms: newSymptoms });
  }, [logs, user]);

  // Log notes
  const logNotes = useCallback(async (date: Date, notes: string) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    await upsertLog(dateStr, { notes });
  }, [user]);

  // Log water intake
  const logWaterIntake = useCallback(async (date: Date, glasses: number) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    await upsertLog(dateStr, { waterIntake: glasses });
  }, [user]);

  // Log medication
  const logMedication = useCallback(async (date: Date, medication: Medication) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    const existing = logs.find(log => log.date === dateStr);
    const medications = existing?.medications || [];
    const existingMedIndex = medications.findIndex(m => m.name === medication.name);
    let updatedMedications: Medication[];
    
    if (existingMedIndex >= 0) {
      if (medication.taken === medications[existingMedIndex].taken) {
        updatedMedications = medications.filter(m => m.name !== medication.name);
      } else {
        updatedMedications = medications.map((m, i) => 
          i === existingMedIndex ? medication : m
        );
      }
    } else {
      updatedMedications = [...medications, medication];
    }
    
    await upsertLog(dateStr, { medications: updatedMedications });
  }, [logs, user]);

  // Log sleep
  const logSleep = useCallback(async (date: Date, hours: number, quality?: SleepQuality) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    await upsertLog(dateStr, { sleepHours: hours, sleepQuality: quality });
  }, [user]);

  // Log exercise
  const logExercise = useCallback(async (date: Date, minutes: number) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    await upsertLog(dateStr, { exerciseMinutes: minutes });
  }, [user]);

  // Log temperature
  const logTemperature = useCallback(async (date: Date, temp: number) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    await upsertLog(dateStr, { temperature: temp });
  }, [user]);

  // Calculate predictions
  const getPredictions = useCallback((): CyclePrediction | null => {
    if (cycles.length < 2) return null;

    const sortedCycles = [...cycles].sort((a, b) => 
      parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()
    );

    let totalCycleLength = 0;
    let cycleCount = 0;
    
    for (let i = 0; i < sortedCycles.length - 1; i++) {
      const currentStart = parseISO(sortedCycles[i].startDate);
      const prevStart = parseISO(sortedCycles[i + 1].startDate);
      const length = differenceInDays(currentStart, prevStart);
      if (length > 20 && length < 45) {
        totalCycleLength += length;
        cycleCount++;
      }
    }

    if (cycleCount === 0) return null;

    const avgCycleLength = Math.round(totalCycleLength / cycleCount);
    const avgPeriodLength = Math.round(
      sortedCycles.reduce((sum, c) => sum + (c.length || 5), 0) / sortedCycles.length
    );

    const lastCycleStart = parseISO(sortedCycles[0].startDate);
    const nextPeriodStart = addDays(lastCycleStart, avgCycleLength);
    const nextPeriodEnd = addDays(nextPeriodStart, avgPeriodLength - 1);
    const ovulationDate = addDays(nextPeriodStart, -14);
    const fertileWindowStart = addDays(ovulationDate, -5);
    const fertileWindowEnd = addDays(ovulationDate, 1);

    return {
      nextPeriodStart: format(nextPeriodStart, 'yyyy-MM-dd'),
      nextPeriodEnd: format(nextPeriodEnd, 'yyyy-MM-dd'),
      fertileWindowStart: format(fertileWindowStart, 'yyyy-MM-dd'),
      fertileWindowEnd: format(fertileWindowEnd, 'yyyy-MM-dd'),
      ovulationDate: format(ovulationDate, 'yyyy-MM-dd'),
    };
  }, [cycles]);

  // Calculate stats
  const getStats = useCallback((): CycleStats | null => {
    if (cycles.length < 1) return null;

    const sortedCycles = [...cycles].sort((a, b) => 
      parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
    );

    const cycleLengths: number[] = [];
    for (let i = 1; i < sortedCycles.length; i++) {
      const currentStart = parseISO(sortedCycles[i].startDate);
      const prevStart = parseISO(sortedCycles[i - 1].startDate);
      const length = differenceInDays(currentStart, prevStart);
      if (length > 20 && length < 45) {
        cycleLengths.push(length);
      }
    }

    const avgCycleLength = cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((sum, l) => sum + l, 0) / cycleLengths.length)
      : 28;
    const avgPeriodLength = Math.round(
      sortedCycles.reduce((sum, c) => sum + (c.length || 5), 0) / sortedCycles.length
    );

    return {
      averageCycleLength: avgCycleLength,
      averagePeriodLength: avgPeriodLength,
      totalCycles: cycles.length,
      shortestCycle: cycleLengths.length > 0 ? Math.min(...cycleLengths) : avgCycleLength,
      longestCycle: cycleLengths.length > 0 ? Math.max(...cycleLengths) : avgCycleLength,
    };
  }, [cycles]);

  // Check if date is in fertile window
  const isInFertileWindow = useCallback((date: Date): boolean => {
    const predictions = getPredictions();
    if (!predictions) return false;

    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    return dateStr >= predictions.fertileWindowStart && dateStr <= predictions.fertileWindowEnd;
  }, [getPredictions]);

  // Check if date is ovulation day
  const isOvulationDay = useCallback((date: Date): boolean => {
    const predictions = getPredictions();
    if (!predictions) return false;

    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    return dateStr === predictions.ovulationDate;
  }, [getPredictions]);

  // Check if date is predicted period
  const isPredictedPeriod = useCallback((date: Date): boolean => {
    const predictions = getPredictions();
    if (!predictions) return false;

    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    return dateStr >= predictions.nextPeriodStart && dateStr <= predictions.nextPeriodEnd;
  }, [getPredictions]);

  // Get days until next period
  const getDaysUntilNextPeriod = useCallback((): number | null => {
    const predictions = getPredictions();
    if (!predictions) return null;

    const today = startOfDay(new Date());
    const nextStart = parseISO(predictions.nextPeriodStart);
    const days = differenceInDays(nextStart, today);
    return days >= 0 ? days : null;
  }, [getPredictions]);

  // Get current cycle day
  const getCurrentCycleDay = useCallback((): number | null => {
    if (cycles.length === 0) return null;

    const sortedCycles = [...cycles].sort((a, b) => 
      parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()
    );

    const lastCycleStart = parseISO(sortedCycles[0].startDate);
    const today = startOfDay(new Date());
    const dayInCycle = differenceInDays(today, lastCycleStart) + 1;
    
    return dayInCycle > 0 ? dayInCycle : null;
  }, [cycles]);

  return {
    logs,
    cycles,
    isLoaded,
    getLogForDate,
    logPeriodDay,
    logMood,
    logSymptom,
    logNotes,
    logWaterIntake,
    logMedication,
    logSleep,
    logExercise,
    logTemperature,
    getPredictions,
    getStats,
    isInFertileWindow,
    isOvulationDay,
    isPredictedPeriod,
    getDaysUntilNextPeriod,
    getCurrentCycleDay,
  };
}
