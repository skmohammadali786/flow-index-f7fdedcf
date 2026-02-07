import { useMemo } from 'react';
import { DayLog, CycleData } from '@/types/period';
import { CyclePhase } from '@/types/settings';
import { ClinicalAssessment } from './useClinicalAssessments';
import { parseISO, differenceInDays, subDays, format } from 'date-fns';

export interface PersonalizedCognitiveForecast {
  focus: number;
  processingSpeed: number;
  mentalClarity: number;
  energy: number;
  creativity: number;
  emotionalResilience: number;
  confidence: 'low' | 'medium' | 'high';
  dataPoints: number;
}

export interface PersonalizedInsight {
  title: string;
  description: string;
  keyHormone: string;
  brainEffect: string;
  personalNote: string;
}

export interface TodayStatus {
  sleepQuality: string | null;
  sleepHours: number | null;
  exerciseMinutes: number | null;
  waterIntake: number | null;
  currentSymptoms: string[];
  currentMoods: string[];
  painLevel: number;
  fatigueLevel: number;
  moodLevel: number;
  bloatingLevel: number;
}

export function useBrainForecast(
  logs: DayLog[],
  cycles: CycleData[],
  currentPhase: CyclePhase | null,
  currentCycleDay: number | null,
  clinicalAssessments: ClinicalAssessment[]
) {
  // Get today's log data
  const todayStatus = useMemo((): TodayStatus => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayLog = logs?.find(log => log.date === today);
    const todayAssessment = clinicalAssessments?.find(a => a.date === today);

    return {
      sleepQuality: todayLog?.sleepQuality || null,
      sleepHours: todayLog?.sleepHours || null,
      exerciseMinutes: todayLog?.exerciseMinutes || null,
      waterIntake: todayLog?.waterIntake || null,
      currentSymptoms: todayLog?.symptoms || [],
      currentMoods: todayLog?.moods || [],
      painLevel: todayAssessment?.painVas || 0,
      fatigueLevel: todayAssessment?.fatigueVas || 0,
      moodLevel: todayAssessment?.moodVas || 0,
      bloatingLevel: todayAssessment?.bloatingVas || 0,
    };
  }, [logs, clinicalAssessments]);

  // Calculate historical patterns for current phase
  const phaseHistory = useMemo(() => {
    if (!currentPhase || !cycles || cycles.length === 0) return null;

    const phaseData: {
      symptoms: Record<string, number>;
      moods: Record<string, number>;
      avgSleep: number;
      avgExercise: number;
      avgWater: number;
      avgPain: number;
      avgFatigue: number;
      avgMood: number;
      dataPoints: number;
    } = {
      symptoms: {},
      moods: {},
      avgSleep: 0,
      avgExercise: 0,
      avgWater: 0,
      avgPain: 0,
      avgFatigue: 0,
      avgMood: 0,
      dataPoints: 0,
    };

    let sleepCount = 0, exerciseCount = 0, waterCount = 0;
    let painCount = 0, fatigueCount = 0, moodCount = 0;

    // Look at logs from the same phase in previous cycles
    (logs || []).forEach(log => {
      const logDate = parseISO(log.date);
      
      // Find which cycle this log belongs to
      for (const cycle of cycles) {
        const cycleStart = parseISO(cycle.startDate);
        const dayInCycle = differenceInDays(logDate, cycleStart) + 1;
        
        if (dayInCycle >= 1 && dayInCycle <= 45) {
          const cycleLength = cycle.length || 28;
          const logPhase = getCyclePhaseForDay(dayInCycle, cycleLength);
          
          if (logPhase === currentPhase) {
            phaseData.dataPoints++;
            
            // Track symptoms
            log.symptoms.forEach(s => {
              phaseData.symptoms[s] = (phaseData.symptoms[s] || 0) + 1;
            });
            
            // Track moods
            log.moods.forEach(m => {
              phaseData.moods[m] = (phaseData.moods[m] || 0) + 1;
            });
            
            // Track metrics
            if (log.sleepHours) {
              phaseData.avgSleep += log.sleepHours;
              sleepCount++;
            }
            if (log.exerciseMinutes) {
              phaseData.avgExercise += log.exerciseMinutes;
              exerciseCount++;
            }
            if (log.waterIntake) {
              phaseData.avgWater += log.waterIntake;
              waterCount++;
            }
          }
          break;
        }
      }
    });

    // Get clinical assessments for the same phase
    (clinicalAssessments || []).forEach(assessment => {
      const assessmentDate = parseISO(assessment.date);
      
      for (const cycle of cycles) {
        const cycleStart = parseISO(cycle.startDate);
        const dayInCycle = differenceInDays(assessmentDate, cycleStart) + 1;
        
        if (dayInCycle >= 1 && dayInCycle <= 45) {
          const cycleLength = cycle.length || 28;
          const assessmentPhase = getCyclePhaseForDay(dayInCycle, cycleLength);
          
          if (assessmentPhase === currentPhase) {
            phaseData.avgPain += assessment.painVas;
            painCount++;
            phaseData.avgFatigue += assessment.fatigueVas;
            fatigueCount++;
            phaseData.avgMood += assessment.moodVas;
            moodCount++;
          }
          break;
        }
      }
    });

    // Calculate averages
    if (sleepCount > 0) phaseData.avgSleep /= sleepCount;
    if (exerciseCount > 0) phaseData.avgExercise /= exerciseCount;
    if (waterCount > 0) phaseData.avgWater /= waterCount;
    if (painCount > 0) phaseData.avgPain /= painCount;
    if (fatigueCount > 0) phaseData.avgFatigue /= fatigueCount;
    if (moodCount > 0) phaseData.avgMood /= moodCount;

    return phaseData;
  }, [logs, cycles, currentPhase, clinicalAssessments]);

  // Calculate personalized cognitive forecast
  const personalizedForecast = useMemo((): PersonalizedCognitiveForecast | null => {
    if (!currentPhase) return null;

    // Base forecasts by phase
    const baseForecasts: Record<CyclePhase, PersonalizedCognitiveForecast> = {
      menstrual: { focus: 40, processingSpeed: 45, mentalClarity: 35, energy: 30, creativity: 65, emotionalResilience: 40, confidence: 'low', dataPoints: 0 },
      follicular: { focus: 75, processingSpeed: 80, mentalClarity: 85, energy: 70, creativity: 90, emotionalResilience: 75, confidence: 'low', dataPoints: 0 },
      ovulation: { focus: 85, processingSpeed: 90, mentalClarity: 80, energy: 95, creativity: 85, emotionalResilience: 70, confidence: 'low', dataPoints: 0 },
      luteal: { focus: 55, processingSpeed: 60, mentalClarity: 50, energy: 45, creativity: 70, emotionalResilience: 55, confidence: 'low', dataPoints: 0 },
    };

    const base = { ...baseForecasts[currentPhase] };
    
    // Adjust based on today's data
    const today = todayStatus;
    
    // Sleep impact
    if (today.sleepHours) {
      if (today.sleepHours >= 7) {
        base.focus = Math.min(100, base.focus + 10);
        base.mentalClarity = Math.min(100, base.mentalClarity + 10);
        base.processingSpeed = Math.min(100, base.processingSpeed + 5);
      } else if (today.sleepHours < 6) {
        base.focus = Math.max(10, base.focus - 15);
        base.mentalClarity = Math.max(10, base.mentalClarity - 15);
        base.energy = Math.max(10, base.energy - 20);
      }
    }

    // Exercise impact
    if (today.exerciseMinutes && today.exerciseMinutes > 0) {
      base.energy = Math.min(100, base.energy + Math.min(15, today.exerciseMinutes / 3));
      base.focus = Math.min(100, base.focus + 5);
      base.emotionalResilience = Math.min(100, base.emotionalResilience + 5);
    }

    // Hydration impact
    if (today.waterIntake && today.waterIntake >= 6) {
      base.mentalClarity = Math.min(100, base.mentalClarity + 5);
      base.energy = Math.min(100, base.energy + 5);
    }

    // Clinical assessment impact (VAS scores - higher = worse symptoms)
    if (today.painLevel > 50) {
      base.focus = Math.max(10, base.focus - (today.painLevel - 50) / 5);
      base.processingSpeed = Math.max(10, base.processingSpeed - (today.painLevel - 50) / 5);
    }
    if (today.fatigueLevel > 50) {
      base.energy = Math.max(10, base.energy - (today.fatigueLevel - 50) / 3);
      base.mentalClarity = Math.max(10, base.mentalClarity - (today.fatigueLevel - 50) / 5);
    }
    if (today.moodLevel > 50) {
      base.emotionalResilience = Math.max(10, base.emotionalResilience - (today.moodLevel - 50) / 4);
      base.creativity = Math.max(10, base.creativity - (today.moodLevel - 50) / 6);
    }

    // Symptom impact
    if (today.currentSymptoms.includes('headache')) {
      base.focus = Math.max(10, base.focus - 15);
      base.processingSpeed = Math.max(10, base.processingSpeed - 10);
    }
    if (today.currentSymptoms.includes('fatigue')) {
      base.energy = Math.max(10, base.energy - 20);
    }
    if (today.currentSymptoms.includes('insomnia')) {
      base.focus = Math.max(10, base.focus - 10);
      base.mentalClarity = Math.max(10, base.mentalClarity - 15);
    }
    if (today.currentSymptoms.includes('cramps')) {
      base.focus = Math.max(10, base.focus - 10);
    }

    // Mood impact
    if (today.currentMoods.includes('energetic')) {
      base.energy = Math.min(100, base.energy + 15);
    }
    if (today.currentMoods.includes('tired')) {
      base.energy = Math.max(10, base.energy - 15);
    }
    if (today.currentMoods.includes('anxious')) {
      base.emotionalResilience = Math.max(10, base.emotionalResilience - 10);
      base.focus = Math.max(10, base.focus - 5);
    }
    if (today.currentMoods.includes('calm')) {
      base.focus = Math.min(100, base.focus + 10);
      base.emotionalResilience = Math.min(100, base.emotionalResilience + 10);
    }
    if (today.currentMoods.includes('happy')) {
      base.creativity = Math.min(100, base.creativity + 10);
      base.emotionalResilience = Math.min(100, base.emotionalResilience + 5);
    }

    // Calculate confidence based on data points
    const dataPoints = phaseHistory?.dataPoints || 0;
    if (dataPoints >= 10) {
      base.confidence = 'high';
    } else if (dataPoints >= 5) {
      base.confidence = 'medium';
    } else {
      base.confidence = 'low';
    }
    base.dataPoints = dataPoints;

    // Round all values
    base.focus = Math.round(base.focus);
    base.processingSpeed = Math.round(base.processingSpeed);
    base.mentalClarity = Math.round(base.mentalClarity);
    base.energy = Math.round(base.energy);
    base.creativity = Math.round(base.creativity);
    base.emotionalResilience = Math.round(base.emotionalResilience);

    return base;
  }, [currentPhase, todayStatus, phaseHistory]);

  // Generate personalized insight
  const personalizedInsight = useMemo((): PersonalizedInsight | null => {
    if (!currentPhase) return null;

    const baseInsights: Record<CyclePhase, Omit<PersonalizedInsight, 'personalNote'>> = {
      menstrual: {
        title: 'Rest & Reflect Phase',
        description: 'Your brain is in recovery mode. Hormone levels are at their lowest, which can affect neurotransmitter production.',
        keyHormone: 'Low Estrogen & Progesterone',
        brainEffect: 'Reduced verbal memory, increased need for rest, heightened intuition',
      },
      follicular: {
        title: 'Rising Energy Phase',
        description: 'Estrogen is climbing, boosting serotonin and dopamine. Your brain is primed for new learning and creative thinking.',
        keyHormone: 'Rising Estrogen',
        brainEffect: 'Enhanced memory formation, verbal fluency, and neuroplasticity',
      },
      ovulation: {
        title: 'Peak Performance Phase',
        description: 'Estrogen peaks along with a testosterone surge. Optimal neurotransmitter levels for communication and quick thinking.',
        keyHormone: 'Peak Estrogen + Testosterone',
        brainEffect: 'Maximum verbal skills, social cognition, and processing speed',
      },
      luteal: {
        title: 'Focus & Finish Phase',
        description: 'Progesterone rises and GABA increases, creating a calming effect. Your brain shifts toward detail-oriented work.',
        keyHormone: 'Rising Progesterone',
        brainEffect: 'Heightened attention to detail, reduced novelty-seeking',
      },
    };

    const base = baseInsights[currentPhase];
    let personalNote = '';

    // Generate personal note based on today's data
    const notes: string[] = [];
    
    if (todayStatus.sleepHours) {
      if (todayStatus.sleepHours >= 7) {
        notes.push('Your good sleep is boosting cognitive performance today');
      } else if (todayStatus.sleepHours < 6) {
        notes.push('Low sleep may affect your focus today - consider shorter work blocks');
      }
    }

    if (todayStatus.exerciseMinutes && todayStatus.exerciseMinutes >= 20) {
      notes.push('Exercise has enhanced your energy and mood today');
    }

    if (todayStatus.painLevel > 60) {
      notes.push('High pain levels detected - prioritize comfort and lighter tasks');
    }

    if (todayStatus.fatigueLevel > 60) {
      notes.push('Fatigue is elevated - take more frequent breaks');
    }

    if (todayStatus.currentSymptoms.length > 2) {
      notes.push(`Managing ${todayStatus.currentSymptoms.length} symptoms today - be gentle with yourself`);
    }

    if (phaseHistory && phaseHistory.dataPoints > 0) {
      const topSymptoms = Object.entries(phaseHistory.symptoms)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([s]) => s.replace('_', ' '));
      
      if (topSymptoms.length > 0) {
        notes.push(`In past ${currentPhase} phases, you've often experienced: ${topSymptoms.join(', ')}`);
      }
    }

    personalNote = notes.length > 0 
      ? notes.join('. ') + '.'
      : 'Log more data to get personalized insights based on your patterns.';

    return { ...base, personalNote };
  }, [currentPhase, todayStatus, phaseHistory]);

  // Get recommended adjustments
  const recommendations = useMemo(() => {
    if (!currentPhase || !personalizedForecast) return [];

    const recs: { type: 'warning' | 'tip' | 'boost'; message: string }[] = [];

    if (personalizedForecast.energy < 40) {
      recs.push({ type: 'warning', message: 'Energy is low - consider a 10-minute walk or power nap' });
    }
    if (personalizedForecast.focus < 40) {
      recs.push({ type: 'tip', message: 'Focus may be challenging - use 20-minute work sprints' });
    }
    if (personalizedForecast.mentalClarity < 40) {
      recs.push({ type: 'tip', message: 'Mental fog possible - stay hydrated and take frequent breaks' });
    }
    if (personalizedForecast.emotionalResilience < 40) {
      recs.push({ type: 'warning', message: 'Emotional sensitivity is high - avoid difficult conversations if possible' });
    }

    if (todayStatus.sleepHours && todayStatus.sleepHours < 6) {
      recs.push({ type: 'warning', message: 'Sleep deficit detected - prioritize an earlier bedtime tonight' });
    }
    if (!todayStatus.waterIntake || todayStatus.waterIntake < 4) {
      recs.push({ type: 'tip', message: 'Increase water intake for better mental clarity' });
    }
    if (!todayStatus.exerciseMinutes || todayStatus.exerciseMinutes === 0) {
      recs.push({ type: 'tip', message: 'Even a short walk can boost your cognitive performance' });
    }

    if (personalizedForecast.creativity >= 80) {
      recs.push({ type: 'boost', message: 'Creativity is high - great day for brainstorming!' });
    }
    if (personalizedForecast.focus >= 80) {
      recs.push({ type: 'boost', message: 'Focus is excellent - tackle your most challenging tasks' });
    }

    return recs.slice(0, 4);
  }, [currentPhase, personalizedForecast, todayStatus]);

  return {
    todayStatus,
    phaseHistory,
    personalizedForecast,
    personalizedInsight,
    recommendations,
  };
}

function getCyclePhaseForDay(dayInCycle: number, cycleLength: number = 28): CyclePhase {
  if (dayInCycle <= 5) return 'menstrual';
  if (dayInCycle <= cycleLength - 14) return 'follicular';
  if (dayInCycle <= cycleLength - 12) return 'ovulation';
  return 'luteal';
}
