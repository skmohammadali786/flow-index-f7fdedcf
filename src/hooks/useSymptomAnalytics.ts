import { useMemo } from 'react';
import { DayLog, CycleData, Symptom, Mood } from '@/types/period';
import { CyclePhase, SymptomPattern, MoodPattern } from '@/types/settings';
import { parseISO, differenceInDays } from 'date-fns';

export function useSymptomAnalytics(logs: DayLog[], cycles: CycleData[]) {
  const getCyclePhase = (dayInCycle: number, cycleLength: number = 28): CyclePhase => {
    if (dayInCycle <= 5) return 'menstrual';
    if (dayInCycle <= cycleLength - 14) return 'follicular';
    if (dayInCycle <= cycleLength - 12) return 'ovulation';
    return 'luteal';
  };

  const getDayInCycle = (date: string): number | null => {
    const logDate = parseISO(date);
    
    for (const cycle of cycles) {
      const cycleStart = parseISO(cycle.startDate);
      const dayDiff = differenceInDays(logDate, cycleStart);
      if (dayDiff >= 0 && dayDiff < 45) {
        return dayDiff + 1;
      }
    }
    return null;
  };

  const symptomPatterns = useMemo((): SymptomPattern[] => {
    const symptomData: Record<string, { 
      count: number; 
      phases: CyclePhase[]; 
      days: number[];
      recentCount: number;
      oldCount: number;
    }> = {};

    const sortedLogs = [...logs].sort((a, b) => 
      parseISO(b.date).getTime() - parseISO(a.date).getTime()
    );
    const midPoint = Math.floor(sortedLogs.length / 2);

    logs.forEach((log, index) => {
      const dayInCycle = getDayInCycle(log.date);
      if (!dayInCycle) return;

      const phase = getCyclePhase(dayInCycle);
      const isRecent = index < midPoint;

      log.symptoms.forEach((symptom) => {
        if (!symptomData[symptom]) {
          symptomData[symptom] = { count: 0, phases: [], days: [], recentCount: 0, oldCount: 0 };
        }
        symptomData[symptom].count++;
        symptomData[symptom].phases.push(phase);
        symptomData[symptom].days.push(dayInCycle);
        if (isRecent) {
          symptomData[symptom].recentCount++;
        } else {
          symptomData[symptom].oldCount++;
        }
      });
    });

    return Object.entries(symptomData).map(([symptom, data]) => {
      const phaseCount: Record<CyclePhase, number> = {
        menstrual: 0,
        follicular: 0,
        ovulation: 0,
        luteal: 0,
      };
      data.phases.forEach((p) => phaseCount[p]++);
      const mostCommonPhase = (Object.entries(phaseCount)
        .sort(([,a], [,b]) => b - a)[0][0]) as CyclePhase;

      const avgDay = Math.round(data.days.reduce((a, b) => a + b, 0) / data.days.length);

      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (data.recentCount > data.oldCount * 1.3) trend = 'increasing';
      else if (data.recentCount < data.oldCount * 0.7) trend = 'decreasing';

      return {
        symptom,
        frequency: data.count,
        mostCommonPhase,
        averageDayInCycle: avgDay,
        trend,
      };
    }).sort((a, b) => b.frequency - a.frequency);
  }, [logs, cycles]);

  const moodPatterns = useMemo((): MoodPattern[] => {
    const moodData: Record<string, { count: number; phases: CyclePhase[]; days: number[] }> = {};

    logs.forEach((log) => {
      const dayInCycle = getDayInCycle(log.date);
      if (!dayInCycle) return;

      const phase = getCyclePhase(dayInCycle);

      log.moods.forEach((mood) => {
        if (!moodData[mood]) {
          moodData[mood] = { count: 0, phases: [], days: [] };
        }
        moodData[mood].count++;
        moodData[mood].phases.push(phase);
        moodData[mood].days.push(dayInCycle);
      });
    });

    return Object.entries(moodData).map(([mood, data]) => {
      const phaseCount: Record<CyclePhase, number> = {
        menstrual: 0,
        follicular: 0,
        ovulation: 0,
        luteal: 0,
      };
      data.phases.forEach((p) => phaseCount[p]++);
      const mostCommonPhase = (Object.entries(phaseCount)
        .sort(([,a], [,b]) => b - a)[0][0]) as CyclePhase;

      const avgDay = Math.round(data.days.reduce((a, b) => a + b, 0) / data.days.length);

      return {
        mood,
        frequency: data.count,
        mostCommonPhase,
        averageDayInCycle: avgDay,
      };
    }).sort((a, b) => b.frequency - a.frequency);
  }, [logs, cycles]);

  const symptomsByPhase = useMemo(() => {
    const phaseSymptoms: Record<CyclePhase, Record<string, number>> = {
      menstrual: {},
      follicular: {},
      ovulation: {},
      luteal: {},
    };

    logs.forEach((log) => {
      const dayInCycle = getDayInCycle(log.date);
      if (!dayInCycle) return;

      const phase = getCyclePhase(dayInCycle);

      log.symptoms.forEach((symptom) => {
        phaseSymptoms[phase][symptom] = (phaseSymptoms[phase][symptom] || 0) + 1;
      });
    });

    return phaseSymptoms;
  }, [logs, cycles]);

  const moodsByPhase = useMemo(() => {
    const phaseMoods: Record<CyclePhase, Record<string, number>> = {
      menstrual: {},
      follicular: {},
      ovulation: {},
      luteal: {},
    };

    logs.forEach((log) => {
      const dayInCycle = getDayInCycle(log.date);
      if (!dayInCycle) return;

      const phase = getCyclePhase(dayInCycle);

      log.moods.forEach((mood) => {
        phaseMoods[phase][mood] = (phaseMoods[phase][mood] || 0) + 1;
      });
    });

    return phaseMoods;
  }, [logs, cycles]);

  const currentPhase = useMemo((): CyclePhase | null => {
    if (cycles.length === 0) return null;
    
    const today = new Date();
    
    // Find the cycle that contains today's date
    // Sort cycles by start date descending to check most recent first
    const sortedCycles = [...cycles].sort((a, b) => 
      parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()
    );
    
    // Find the cycle where today falls within or after the start date
    for (const cycle of sortedCycles) {
      const cycleStart = parseISO(cycle.startDate);
      const dayInCycle = differenceInDays(today, cycleStart) + 1;
      
      // If today is on or after cycle start and within reasonable range
      if (dayInCycle >= 1 && dayInCycle <= 45) {
        return getCyclePhase(dayInCycle, cycle.length || 28);
      }
    }
    
    return null;
  }, [cycles]);

  return {
    symptomPatterns,
    moodPatterns,
    symptomsByPhase,
    moodsByPhase,
    currentPhase,
    getCyclePhase,
  };
}
