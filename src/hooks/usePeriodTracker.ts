import { useState, useEffect, useCallback } from 'react';
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
  startOfDay,
  isSameDay 
} from 'date-fns';

const STORAGE_KEY = 'period_tracker_data';

interface StoredData {
  logs: DayLog[];
  cycles: CycleData[];
}

export function usePeriodTracker() {
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data: StoredData = JSON.parse(stored);
        setLogs(data.logs || []);
        setCycles(data.cycles || []);
      } catch (e) {
        console.error('Failed to parse stored data', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (isLoaded) {
      const data: StoredData = { logs, cycles };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [logs, cycles, isLoaded]);

  // Get log for a specific date
  const getLogForDate = useCallback((date: Date): DayLog | undefined => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    return logs.find(log => log.date === dateStr);
  }, [logs]);

  // Log period day
  const logPeriodDay = useCallback((
    date: Date, 
    isPeriod: boolean, 
    flowIntensity?: FlowIntensity
  ) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    
    setLogs(prev => {
      const existing = prev.find(log => log.date === dateStr);
      if (existing) {
        return prev.map(log => 
          log.date === dateStr 
            ? { ...log, isPeriod, flowIntensity: isPeriod ? flowIntensity : undefined }
            : log
        );
      }
      return [...prev, { 
        date: dateStr, 
        isPeriod, 
        flowIntensity: isPeriod ? flowIntensity : undefined,
        moods: [],
        symptoms: []
      }];
    });

    // Update cycles when logging period
    if (isPeriod) {
      updateCycles(dateStr);
    }
  }, []);

  // Update cycles based on period logs
  const updateCycles = useCallback((dateStr: string) => {
    setCycles(prev => {
      const date = parseISO(dateStr);
      const sortedCycles = [...prev].sort((a, b) => 
        parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()
      );

      // Check if this date extends an existing cycle
      for (const cycle of sortedCycles) {
        const cycleStart = parseISO(cycle.startDate);
        const cycleEnd = cycle.endDate ? parseISO(cycle.endDate) : cycleStart;
        
        // If within 2 days of existing cycle, extend it
        if (differenceInDays(date, cycleEnd) <= 2 && differenceInDays(date, cycleEnd) >= 0) {
          return prev.map(c => 
            c.startDate === cycle.startDate 
              ? { ...c, endDate: dateStr, length: differenceInDays(date, cycleStart) + 1 }
              : c
          );
        }
        
        if (differenceInDays(cycleStart, date) <= 2 && differenceInDays(cycleStart, date) >= 0) {
          return prev.map(c => 
            c.startDate === cycle.startDate 
              ? { ...c, startDate: dateStr, length: differenceInDays(parseISO(c.endDate || c.startDate), date) + 1 }
              : c
          );
        }
      }

      // Start a new cycle
      return [...prev, { startDate: dateStr, endDate: dateStr, length: 1 }];
    });
  }, []);

  // Log mood
  const logMood = useCallback((date: Date, mood: Mood) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    
    setLogs(prev => {
      const existing = prev.find(log => log.date === dateStr);
      if (existing) {
        const moods = existing.moods.includes(mood)
          ? existing.moods.filter(m => m !== mood)
          : [...existing.moods, mood];
        return prev.map(log => log.date === dateStr ? { ...log, moods } : log);
      }
      return [...prev, { date: dateStr, isPeriod: false, moods: [mood], symptoms: [] }];
    });
  }, []);

  // Log symptom
  const logSymptom = useCallback((date: Date, symptom: Symptom) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    
    setLogs(prev => {
      const existing = prev.find(log => log.date === dateStr);
      if (existing) {
        const symptoms = existing.symptoms.includes(symptom)
          ? existing.symptoms.filter(s => s !== symptom)
          : [...existing.symptoms, symptom];
        return prev.map(log => log.date === dateStr ? { ...log, symptoms } : log);
      }
      return [...prev, { date: dateStr, isPeriod: false, moods: [], symptoms: [symptom] }];
    });
  }, []);

  // Log notes
  const logNotes = useCallback((date: Date, notes: string) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    
    setLogs(prev => {
      const existing = prev.find(log => log.date === dateStr);
      if (existing) {
        return prev.map(log => log.date === dateStr ? { ...log, notes } : log);
      }
      return [...prev, { date: dateStr, isPeriod: false, moods: [], symptoms: [], notes }];
    });
  }, []);

  // Log water intake
  const logWaterIntake = useCallback((date: Date, glasses: number) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    
    setLogs(prev => {
      const existing = prev.find(log => log.date === dateStr);
      if (existing) {
        return prev.map(log => log.date === dateStr ? { ...log, waterIntake: glasses } : log);
      }
      return [...prev, { date: dateStr, isPeriod: false, moods: [], symptoms: [], waterIntake: glasses }];
    });
  }, []);

  // Log medication
  const logMedication = useCallback((date: Date, medication: Medication) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    
    setLogs(prev => {
      const existing = prev.find(log => log.date === dateStr);
      if (existing) {
        const medications = existing.medications || [];
        const existingMedIndex = medications.findIndex(m => m.name === medication.name);
        let updatedMedications: Medication[];
        
        if (existingMedIndex >= 0) {
          if (medication.taken === medications[existingMedIndex].taken) {
            // Remove medication if clicking same state
            updatedMedications = medications.filter(m => m.name !== medication.name);
          } else {
            // Toggle medication state
            updatedMedications = medications.map((m, i) => 
              i === existingMedIndex ? medication : m
            );
          }
        } else {
          updatedMedications = [...medications, medication];
        }
        
        return prev.map(log => log.date === dateStr ? { ...log, medications: updatedMedications } : log);
      }
      return [...prev, { date: dateStr, isPeriod: false, moods: [], symptoms: [], medications: [medication] }];
    });
  }, []);

  // Log sleep
  const logSleep = useCallback((date: Date, hours: number, quality?: SleepQuality) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    
    setLogs(prev => {
      const existing = prev.find(log => log.date === dateStr);
      if (existing) {
        return prev.map(log => log.date === dateStr ? { ...log, sleepHours: hours, sleepQuality: quality } : log);
      }
      return [...prev, { date: dateStr, isPeriod: false, moods: [], symptoms: [], sleepHours: hours, sleepQuality: quality }];
    });
  }, []);

  // Log exercise
  const logExercise = useCallback((date: Date, minutes: number) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    
    setLogs(prev => {
      const existing = prev.find(log => log.date === dateStr);
      if (existing) {
        return prev.map(log => log.date === dateStr ? { ...log, exerciseMinutes: minutes } : log);
      }
      return [...prev, { date: dateStr, isPeriod: false, moods: [], symptoms: [], exerciseMinutes: minutes }];
    });
  }, []);

  // Log temperature
  const logTemperature = useCallback((date: Date, temp: number) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    
    setLogs(prev => {
      const existing = prev.find(log => log.date === dateStr);
      if (existing) {
        return prev.map(log => log.date === dateStr ? { ...log, temperature: temp } : log);
      }
      return [...prev, { date: dateStr, isPeriod: false, moods: [], symptoms: [], temperature: temp }];
    });
  }, []);

  // Calculate predictions
  const getPredictions = useCallback((): CyclePrediction | null => {
    if (cycles.length < 2) return null;

    const sortedCycles = [...cycles].sort((a, b) => 
      parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()
    );

    // Calculate average cycle length
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
    if (cycles.length < 2) return null;

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

    if (cycleLengths.length === 0) return null;

    const avgCycleLength = Math.round(
      cycleLengths.reduce((sum, l) => sum + l, 0) / cycleLengths.length
    );
    const avgPeriodLength = Math.round(
      sortedCycles.reduce((sum, c) => sum + (c.length || 5), 0) / sortedCycles.length
    );

    return {
      averageCycleLength: avgCycleLength,
      averagePeriodLength: avgPeriodLength,
      totalCycles: cycles.length,
      shortestCycle: Math.min(...cycleLengths),
      longestCycle: Math.max(...cycleLengths),
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
