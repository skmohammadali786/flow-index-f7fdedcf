export type FlowIntensity = 'light' | 'medium' | 'heavy' | 'spotting';

export type Mood = 'happy' | 'calm' | 'sad' | 'anxious' | 'irritable' | 'energetic' | 'tired';

export type Symptom = 
  | 'cramps'
  | 'headache'
  | 'backache'
  | 'bloating'
  | 'breast_tenderness'
  | 'acne'
  | 'fatigue'
  | 'insomnia'
  | 'nausea'
  | 'cravings';

export interface DayLog {
  date: string;
  isPeriod: boolean;
  flowIntensity?: FlowIntensity;
  moods: Mood[];
  symptoms: Symptom[];
  notes?: string;
}

export interface CycleData {
  startDate: string;
  endDate?: string;
  length?: number;
}

export interface CyclePrediction {
  nextPeriodStart: string;
  nextPeriodEnd: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  ovulationDate: string;
}

export interface CycleStats {
  averageCycleLength: number;
  averagePeriodLength: number;
  totalCycles: number;
  shortestCycle: number;
  longestCycle: number;
}
