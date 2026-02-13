export interface UserSettings {
  cycleLength: number;
  periodLength: number;
  lutealPhaseLength: number;
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'system';
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  showFertileWindow: boolean;
  showOvulation: boolean;
  trackingGoal: 'health' | 'pregnancy' | 'avoid_pregnancy';
}

export interface NotificationSettings {
  periodReminder: boolean;
  periodReminderDays: number;
  fertileWindowReminder: boolean;
  dailyLogReminder: boolean;
  dailyLogReminderTime: string;
  ovulationReminder: boolean;
}

export interface UserProfile {
  name: string;
  birthDate?: string;
  avatar?: string;
  email?: string;
  createdAt: string;
  lastBackup?: string;
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export type TipCategory = CyclePhase | 'fertility' | 'pregnancy' | 'postpartum';

export interface HealthTip {
  id: string;
  phase: TipCategory;
  category: 'nutrition' | 'exercise' | 'wellness' | 'mood' | 'sleep' | 'lifestyle';
  title: string;
  description: string;
  icon: string;
}

export interface SymptomPattern {
  symptom: string;
  frequency: number;
  mostCommonPhase: CyclePhase;
  averageDayInCycle: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface MoodPattern {
  mood: string;
  frequency: number;
  mostCommonPhase: CyclePhase;
  averageDayInCycle: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  cycleLength: 28,
  periodLength: 5,
  lutealPhaseLength: 14,
  notifications: {
    periodReminder: true,
    periodReminderDays: 2,
    fertileWindowReminder: false,
    dailyLogReminder: true,
    dailyLogReminderTime: '21:00',
    ovulationReminder: false,
  },
  theme: 'system',
  firstDayOfWeek: 0,
  dateFormat: 'MM/DD/YYYY',
  showFertileWindow: true,
  showOvulation: true,
  trackingGoal: 'health',
};

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  createdAt: new Date().toISOString(),
};
