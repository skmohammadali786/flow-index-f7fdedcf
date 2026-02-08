import { CyclePhase } from '@/types/settings';
import { Mood, Symptom } from '@/types/period';

/**
 * Centralized phase data to avoid duplication across components
 * This file contains all phase-related information used in both UI and PDF rendering
 */

// Mood labels with emojis
export const moodLabels: Record<Mood, { label: string; emoji: string }> = {
  happy: { label: 'Happy', emoji: '😊' },
  calm: { label: 'Calm', emoji: '😌' },
  sad: { label: 'Sad', emoji: '😢' },
  anxious: { label: 'Anxious', emoji: '😰' },
  irritable: { label: 'Irritable', emoji: '😤' },
  energetic: { label: 'Energetic', emoji: '⚡' },
  tired: { label: 'Tired', emoji: '😴' },
};

// Symptom labels with emojis
export const symptomLabels: Record<Symptom, { label: string; emoji: string }> = {
  cramps: { label: 'Cramps', emoji: '💫' },
  headache: { label: 'Headache', emoji: '🤕' },
  backache: { label: 'Backache', emoji: '🔙' },
  bloating: { label: 'Bloating', emoji: '🎈' },
  breast_tenderness: { label: 'Breast Tenderness', emoji: '💗' },
  acne: { label: 'Acne', emoji: '🔴' },
  fatigue: { label: 'Fatigue', emoji: '😩' },
  insomnia: { label: 'Insomnia', emoji: '🌙' },
  nausea: { label: 'Nausea', emoji: '🤢' },
  cravings: { label: 'Cravings', emoji: '🍫' },
};

// Comprehensive phase information with all details
export interface PhaseInformation {
  title: string;
  subtitle: string;
  partnerTips: string[];
  careSuggestions: { category: string; suggestions: string[] }[];
}

export const phaseInfo: Record<CyclePhase, PhaseInformation> = {
  menstrual: {
    title: 'Menstrual Phase',
    subtitle: 'A time for rest and renewal',
    partnerTips: [
      'Extra rest and comfort may be appreciated',
      'Offer to help with physical tasks',
      'Warm drinks and cozy time together',
      'Be patient with mood fluctuations',
    ],
    careSuggestions: [
      { category: 'Physical Comfort', suggestions: ['Offer a heating pad or warm compress', 'Prepare warm herbal tea (chamomile, ginger)', 'Give a gentle back or foot massage'] },
      { category: 'Emotional Support', suggestions: ['Create a calm, relaxing environment', 'Be understanding of fatigue or mood changes', 'Offer to watch their favorite show together'] },
      { category: 'Practical Help', suggestions: ['Take over household chores', 'Prepare comfort foods', 'Run errands they would normally do'] },
    ],
  },
  follicular: {
    title: 'Follicular Phase',
    subtitle: 'Energy is building',
    partnerTips: [
      'Great time for planning activities together',
      'Energy levels are typically rising',
      'Good time for trying new things',
      'Creativity and sociability often peak',
    ],
    careSuggestions: [
      { category: 'Activities', suggestions: ['Plan exciting dates or outings', 'Try a new restaurant or activity together', 'Start a creative project together'] },
      { category: 'Communication', suggestions: ['Great time for important conversations', 'Plan future goals together', 'Be open to spontaneous plans'] },
      { category: 'Wellness', suggestions: ['Join them for a workout or hike', 'Try a new healthy recipe together', 'Explore new hobbies as a couple'] },
    ],
  },
  ovulation: {
    title: 'Ovulation Phase',
    subtitle: 'Peak energy and connection',
    partnerTips: [
      'Highest energy and confidence time',
      'Great for social activities and dates',
      'Communication may be extra effective',
      'Peak fertility window',
    ],
    careSuggestions: [
      { category: 'Romance', suggestions: ['Plan a special date night', 'Express appreciation and admiration', 'Be present and attentive'] },
      { category: 'Social', suggestions: ['Attend social events together', 'Host friends for dinner', 'Double date with other couples'] },
      { category: 'Connection', suggestions: ['Have meaningful conversations', 'Take photos and create memories', 'Surprise them with something thoughtful'] },
    ],
  },
  luteal: {
    title: 'Luteal Phase',
    subtitle: 'Winding down gracefully',
    partnerTips: [
      'PMS symptoms may appear later in this phase',
      'Extra patience and understanding helps',
      'Comfort foods might be craved',
      'Quiet, relaxing activities are good',
    ],
    careSuggestions: [
      { category: 'Comfort', suggestions: ['Stock up on their favorite snacks', 'Create a cozy environment at home', 'Prepare comfort meals'] },
      { category: 'Patience', suggestions: ["Don't take mood swings personally", 'Listen without trying to fix everything', 'Offer reassurance and validation'] },
      { category: 'Self-Care Support', suggestions: ['Draw them a warm bath', 'Suggest relaxing activities like reading or movies', 'Give them space when needed'] },
    ],
  },
};

// Simpler version for PDF rendering (backward compatibility)
export const getPhaseInfoForPdf = (phase: CyclePhase) => {
  const info = phaseInfo[phase];
  return {
    title: info.title,
    subtitle: info.subtitle,
    tips: info.partnerTips,
  };
};
