import { HealthTip, CyclePhase } from '@/types/settings';

export const healthTips: HealthTip[] = [
  // Menstrual Phase
  {
    id: 'mens-1',
    phase: 'menstrual',
    category: 'nutrition',
    title: 'Iron-Rich Foods',
    description: 'Focus on iron-rich foods like leafy greens, beans, and lean red meat to replenish what you lose during menstruation.',
    icon: '🥬',
  },
  {
    id: 'mens-2',
    phase: 'menstrual',
    category: 'exercise',
    title: 'Gentle Movement',
    description: 'Opt for light activities like yoga, walking, or stretching. Listen to your body and rest when needed.',
    icon: '🧘',
  },
  {
    id: 'mens-3',
    phase: 'menstrual',
    category: 'wellness',
    title: 'Heat Therapy',
    description: 'Use a heating pad on your lower abdomen to ease cramps and relax tense muscles.',
    icon: '🔥',
  },
  {
    id: 'mens-4',
    phase: 'menstrual',
    category: 'mood',
    title: 'Self-Compassion',
    description: 'This is a time for rest and reflection. Allow yourself to slow down without guilt.',
    icon: '💝',
  },
  {
    id: 'mens-5',
    phase: 'menstrual',
    category: 'sleep',
    title: 'Extra Rest',
    description: 'Your body is working hard. Aim for 7-9 hours of sleep and consider going to bed earlier.',
    icon: '😴',
  },

  // Follicular Phase
  {
    id: 'foll-1',
    phase: 'follicular',
    category: 'nutrition',
    title: 'Fresh & Light Foods',
    description: 'Your metabolism is ramping up. Enjoy fresh vegetables, lean proteins, and fermented foods.',
    icon: '🥗',
  },
  {
    id: 'foll-2',
    phase: 'follicular',
    category: 'exercise',
    title: 'Try Something New',
    description: 'Energy levels are rising! Great time for cardio, strength training, or learning new skills.',
    icon: '🏃‍♀️',
  },
  {
    id: 'foll-3',
    phase: 'follicular',
    category: 'wellness',
    title: 'Start New Projects',
    description: 'Your creativity and motivation are high. Perfect time to start new ventures or tackle big tasks.',
    icon: '✨',
  },
  {
    id: 'foll-4',
    phase: 'follicular',
    category: 'mood',
    title: 'Socialize',
    description: 'Rising estrogen boosts mood and sociability. Great time for social activities and networking.',
    icon: '👥',
  },
  {
    id: 'foll-5',
    phase: 'follicular',
    category: 'sleep',
    title: 'Optimize Sleep',
    description: 'You may need less sleep but quality matters. Maintain consistent sleep and wake times.',
    icon: '⏰',
  },

  // Ovulation Phase
  {
    id: 'ovul-1',
    phase: 'ovulation',
    category: 'nutrition',
    title: 'Anti-Inflammatory Foods',
    description: 'Support your body with omega-3 rich foods, berries, and plenty of fiber.',
    icon: '🐟',
  },
  {
    id: 'ovul-2',
    phase: 'ovulation',
    category: 'exercise',
    title: 'High-Intensity Workouts',
    description: 'Your energy peaks now! Maximize with HIIT, spin classes, or competitive sports.',
    icon: '💪',
  },
  {
    id: 'ovul-3',
    phase: 'ovulation',
    category: 'wellness',
    title: 'Important Conversations',
    description: 'Communication skills peak during ovulation. Schedule important meetings or discussions.',
    icon: '💬',
  },
  {
    id: 'ovul-4',
    phase: 'ovulation',
    category: 'mood',
    title: 'Confidence Boost',
    description: 'You may feel more confident and attractive. Embrace this energy in all areas of life.',
    icon: '💃',
  },
  {
    id: 'ovul-5',
    phase: 'ovulation',
    category: 'sleep',
    title: 'Cool Sleep Environment',
    description: 'Body temperature rises during ovulation. Keep your bedroom cool for better sleep.',
    icon: '❄️',
  },

  // Luteal Phase
  {
    id: 'lute-1',
    phase: 'luteal',
    category: 'nutrition',
    title: 'Complex Carbs',
    description: 'Combat cravings with complex carbohydrates, magnesium-rich foods, and B vitamins.',
    icon: '🍠',
  },
  {
    id: 'lute-2',
    phase: 'luteal',
    category: 'exercise',
    title: 'Moderate Exercise',
    description: 'Energy decreases. Switch to moderate activities like pilates, swimming, or hiking.',
    icon: '🚶‍♀️',
  },
  {
    id: 'lute-3',
    phase: 'luteal',
    category: 'wellness',
    title: 'Finish Projects',
    description: 'Detail-oriented energy is great for completing tasks and organizing. Tie up loose ends.',
    icon: '📝',
  },
  {
    id: 'lute-4',
    phase: 'luteal',
    category: 'mood',
    title: 'Manage PMS',
    description: 'If PMS affects you, try meditation, journaling, or talking to a friend about your feelings.',
    icon: '🧠',
  },
  {
    id: 'lute-5',
    phase: 'luteal',
    category: 'sleep',
    title: 'Wind Down Early',
    description: 'You may feel more tired. Create a calming bedtime routine and avoid screens before bed.',
    icon: '🌙',
  },
];

export const getPhaseInfo = (phase: CyclePhase) => {
  const info = {
    menstrual: {
      name: 'Menstrual Phase',
      days: 'Days 1-5',
      description: 'Your period starts. Focus on rest, nourishment, and gentle self-care.',
      color: 'coral',
      emoji: '🌸',
    },
    follicular: {
      name: 'Follicular Phase',
      days: 'Days 6-13',
      description: 'Energy rises as estrogen increases. Great time for new beginnings.',
      color: 'sage',
      emoji: '🌱',
    },
    ovulation: {
      name: 'Ovulation Phase',
      days: 'Days 14-16',
      description: 'Peak energy and fertility. Your most social and confident time.',
      color: 'lavender',
      emoji: '🌟',
    },
    luteal: {
      name: 'Luteal Phase',
      days: 'Days 17-28',
      description: 'Winding down. Focus on completing tasks and self-care.',
      color: 'peach',
      emoji: '🍂',
    },
  };
  return info[phase];
};

export const getTipsForPhase = (phase: CyclePhase): HealthTip[] => {
  return healthTips.filter((tip) => tip.phase === phase);
};
