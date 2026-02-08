import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format, parseISO, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { CyclePrediction, CycleStats, DayLog, Mood, Symptom } from '@/types/period';
import { CyclePhase } from '@/types/settings';

// Color palette matching the app theme
const colors = {
  primary: [139, 92, 246] as [number, number, number], // Purple
  coral: [244, 114, 182] as [number, number, number],
  sage: [134, 239, 172] as [number, number, number],
  lavender: [196, 181, 253] as [number, number, number],
  peach: [251, 207, 232] as [number, number, number],
  text: [30, 30, 30] as [number, number, number],
  muted: [120, 120, 120] as [number, number, number],
  background: [250, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const phaseColors: Record<CyclePhase, [number, number, number]> = {
  menstrual: colors.coral,
  follicular: colors.sage,
  ovulation: colors.lavender,
  luteal: colors.peach,
};

const moodLabels: Record<Mood, { label: string; emoji: string }> = {
  happy: { label: 'Happy', emoji: '😊' },
  calm: { label: 'Calm', emoji: '😌' },
  sad: { label: 'Sad', emoji: '😢' },
  anxious: { label: 'Anxious', emoji: '😰' },
  irritable: { label: 'Irritable', emoji: '😤' },
  energetic: { label: 'Energetic', emoji: '⚡' },
  tired: { label: 'Tired', emoji: '😴' },
};

const symptomLabels: Record<Symptom, { label: string; emoji: string }> = {
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

const phaseInfo: Record<CyclePhase, { title: string; tips: string[] }> = {
  menstrual: {
    title: 'Menstrual Phase',
    tips: [
      'Extra rest and comfort may be appreciated',
      'Offer to help with physical tasks',
      'Warm drinks and cozy time together',
      'Be patient with mood fluctuations',
    ],
  },
  follicular: {
    title: 'Follicular Phase',
    tips: [
      'Great time for planning activities together',
      'Energy levels are typically rising',
      'Good time for trying new things',
      'Creativity and sociability often peak',
    ],
  },
  ovulation: {
    title: 'Ovulation Phase',
    tips: [
      'Highest energy and confidence time',
      'Great for social activities and dates',
      'Communication may be extra effective',
      'Peak fertility window',
    ],
  },
  luteal: {
    title: 'Luteal Phase',
    tips: [
      'PMS symptoms may appear later in this phase',
      'Extra patience and understanding helps',
      'Comfort foods might be craved',
      'Quiet, relaxing activities are good',
    ],
  },
};

interface PdfData {
  predictions: CyclePrediction | null;
  stats: CycleStats | null;
  currentPhase: CyclePhase;
  daysUntilNextPeriod: number | null;
  currentCycleDay: number | null;
  logs: DayLog[];
  shareSettings: {
    showPeriodDates: boolean;
    showFertileWindow: boolean;
    showMoodTips: boolean;
    showCurrentPhase: boolean;
    showMoodInsights: boolean;
    showSymptomInsights: boolean;
  };
}

function calculateInsights(logs: DayLog[]) {
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);
  
  const recentLogs = logs.filter(log => {
    const logDate = parseISO(log.date);
    return logDate >= sevenDaysAgo && logDate <= today;
  });

  const moodCounts: Record<Mood, number> = {} as Record<Mood, number>;
  const symptomCounts: Record<Symptom, number> = {} as Record<Symptom, number>;
  let totalSleep = 0;
  let sleepCount = 0;
  let totalWater = 0;
  let waterCount = 0;
  let totalExercise = 0;
  let exerciseCount = 0;
  let periodDays = 0;

  recentLogs.forEach(log => {
    log.moods.forEach(mood => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });
    log.symptoms.forEach(symptom => {
      symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
    });
    if (log.sleepHours) {
      totalSleep += log.sleepHours;
      sleepCount++;
    }
    if (log.waterIntake) {
      totalWater += log.waterIntake;
      waterCount++;
    }
    if (log.exerciseMinutes) {
      totalExercise += log.exerciseMinutes;
      exerciseCount++;
    }
    if (log.isPeriod) {
      periodDays++;
    }
  });

  const topMoods = Object.entries(moodCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([mood, count]) => ({ mood: mood as Mood, count }));

  const topSymptoms = Object.entries(symptomCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([symptom, count]) => ({ symptom: symptom as Symptom, count }));

  return {
    topMoods,
    topSymptoms,
    avgSleep: sleepCount > 0 ? Math.round((totalSleep / sleepCount) * 10) / 10 : null,
    avgWater: waterCount > 0 ? Math.round(totalWater / waterCount) : null,
    totalExercise,
    periodDays,
    daysLogged: recentLogs.length,
  };
}

function calculateSummaryData(logs: DayLog[]) {
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const weekLogs = logs.filter(log => {
    const logDate = parseISO(log.date);
    return logDate >= weekStart && logDate <= weekEnd;
  });

  const monthLogs = logs.filter(log => {
    const logDate = parseISO(log.date);
    return logDate >= monthStart && logDate <= monthEnd;
  });

  const calculateSummary = (logSet: DayLog[]) => {
    const allMoods: Mood[] = [];
    const allSymptoms: Symptom[] = [];
    let totalSleep = 0, sleepCount = 0;
    let totalWater = 0, waterCount = 0;
    let totalExercise = 0;
    let periodDays = 0;

    logSet.forEach(log => {
      allMoods.push(...log.moods);
      allSymptoms.push(...log.symptoms);
      if (log.sleepHours) { totalSleep += log.sleepHours; sleepCount++; }
      if (log.waterIntake) { totalWater += log.waterIntake; waterCount++; }
      if (log.exerciseMinutes) { totalExercise += log.exerciseMinutes; }
      if (log.isPeriod) periodDays++;
    });

    const moodCounts = allMoods.reduce((acc, m) => ({ ...acc, [m]: (acc[m] || 0) + 1 }), {} as Record<string, number>);
    const symptomCounts = allSymptoms.reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {} as Record<string, number>);

    return {
      periodDays,
      daysLogged: logSet.length,
      avgSleep: sleepCount > 0 ? Math.round((totalSleep / sleepCount) * 10) / 10 : null,
      avgWater: waterCount > 0 ? Math.round(totalWater / waterCount) : null,
      totalExercise,
      topMood: Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0]?.[0] as Mood | undefined,
      topSymptom: Object.entries(symptomCounts).sort(([,a], [,b]) => b - a)[0]?.[0] as Symptom | undefined,
    };
  };

  return {
    weekly: calculateSummary(weekLogs),
    monthly: calculateSummary(monthLogs),
  };
}

function drawRoundedRect(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor: [number, number, number]
) {
  pdf.setFillColor(...fillColor);
  pdf.roundedRect(x, y, width, height, radius, radius, 'F');
}

function drawProgressBar(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  progress: number,
  bgColor: [number, number, number],
  fillColor: [number, number, number]
) {
  // Background
  drawRoundedRect(pdf, x, y, width, height, height / 2, bgColor);
  // Fill
  if (progress > 0) {
    const fillWidth = Math.max(height, width * Math.min(progress, 1));
    drawRoundedRect(pdf, x, y, fillWidth, height, height / 2, fillColor);
  }
}

export async function generatePartnerSharePdf(data: PdfData): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const insights = calculateInsights(data.logs);
  const summaryData = calculateSummaryData(data.logs);
  const currentPhaseData = phaseInfo[data.currentPhase];
  const phaseColor = phaseColors[data.currentPhase];

  // Helper to add new page if needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // ===== HEADER =====
  drawRoundedRect(pdf, margin, yPos, contentWidth, 25, 4, colors.primary);
  
  pdf.setTextColor(...colors.white);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('💐 Cycle Update', margin + 8, yPos + 10);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')}`, margin + 8, yPos + 18);
  
  pdf.setFontSize(9);
  pdf.text('Flow Index Partner Report', pageWidth - margin - 45, yPos + 10);

  yPos += 32;

  // ===== CURRENT PHASE CARD =====
  if (data.shareSettings.showCurrentPhase) {
    drawRoundedRect(pdf, margin, yPos, contentWidth, 35, 4, phaseColor);
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(currentPhaseData.title, margin + 8, yPos + 12);
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    if (data.currentCycleDay) {
      pdf.text(`Day ${data.currentCycleDay} of cycle`, margin + 8, yPos + 20);
    }
    if (data.daysUntilNextPeriod !== null) {
      pdf.text(`${data.daysUntilNextPeriod} days until next period`, margin + 8, yPos + 28);
    }

    yPos += 42;
  }

  // ===== PREDICTIONS =====
  if (data.shareSettings.showPeriodDates && data.predictions) {
    checkNewPage(35);
    
    drawRoundedRect(pdf, margin, yPos, contentWidth, 28, 4, colors.background);
    pdf.setDrawColor(200, 200, 200);
    pdf.roundedRect(margin, yPos, contentWidth, 28, 4, 4, 'S');
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('📅 Upcoming Dates', margin + 8, yPos + 10);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const nextStart = new Date(data.predictions.nextPeriodStart);
    const nextEnd = new Date(data.predictions.nextPeriodEnd);
    pdf.text(`Next Period: ${format(nextStart, 'MMM d')} - ${format(nextEnd, 'MMM d')}`, margin + 8, yPos + 20);
    
    if (data.shareSettings.showFertileWindow) {
      const fertileStart = new Date(data.predictions.fertileWindowStart);
      const fertileEnd = new Date(data.predictions.fertileWindowEnd);
      pdf.text(`Fertile Window: ${format(fertileStart, 'MMM d')} - ${format(fertileEnd, 'MMM d')}`, margin + 100, yPos + 20);
    }

    yPos += 35;
  }

  // ===== QUICK STATS =====
  checkNewPage(45);
  
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📊 Quick Stats (Last 7 Days)', margin, yPos);
  yPos += 8;
  
  const statBoxWidth = (contentWidth - 10) / 3;
  const statsToShow = [
    { label: 'Days Logged', value: `${insights.daysLogged}/7`, icon: '📝' },
    { label: 'Avg Sleep', value: insights.avgSleep ? `${insights.avgSleep}h` : 'N/A', icon: '😴' },
    { label: 'Avg Water', value: insights.avgWater ? `${insights.avgWater} glasses` : 'N/A', icon: '💧' },
  ];
  
  statsToShow.forEach((stat, i) => {
    const xOffset = margin + i * (statBoxWidth + 5);
    drawRoundedRect(pdf, xOffset, yPos, statBoxWidth, 25, 3, colors.background);
    
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.muted);
    pdf.text(stat.label, xOffset + 5, yPos + 8);
    
    pdf.setFontSize(14);
    pdf.setTextColor(...colors.text);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${stat.icon} ${stat.value}`, xOffset + 5, yPos + 18);
  });
  
  yPos += 35;

  // ===== MOOD PATTERNS =====
  if (data.shareSettings.showMoodInsights && insights.topMoods.length > 0) {
    checkNewPage(50);
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('💭 Mood Patterns (Last 7 Days)', margin, yPos);
    yPos += 8;
    
    const maxMoodCount = Math.max(...insights.topMoods.map(m => m.count));
    
    insights.topMoods.forEach((moodData, i) => {
      const moodInfo = moodLabels[moodData.mood];
      const barWidth = contentWidth - 50;
      const progress = moodData.count / maxMoodCount;
      
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.text);
      pdf.text(`${moodInfo.emoji} ${moodInfo.label}`, margin, yPos + 5);
      
      drawProgressBar(pdf, margin + 40, yPos + 1, barWidth, 6, progress, [230, 230, 235], colors.lavender);
      
      pdf.setTextColor(...colors.muted);
      pdf.setFontSize(9);
      pdf.text(`${moodData.count}x`, margin + 42 + barWidth, yPos + 5);
      
      yPos += 10;
    });
    
    yPos += 10;
  }

  // ===== SYMPTOM PATTERNS =====
  if (data.shareSettings.showSymptomInsights && insights.topSymptoms.length > 0) {
    checkNewPage(50);
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('🩺 Symptom Patterns (Last 7 Days)', margin, yPos);
    yPos += 8;
    
    const maxSymptomCount = Math.max(...insights.topSymptoms.map(s => s.count));
    
    insights.topSymptoms.forEach((symptomData, i) => {
      const symptomInfo = symptomLabels[symptomData.symptom];
      const barWidth = contentWidth - 65;
      const progress = symptomData.count / maxSymptomCount;
      
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.text);
      pdf.text(`${symptomInfo.emoji} ${symptomInfo.label}`, margin, yPos + 5);
      
      drawProgressBar(pdf, margin + 55, yPos + 1, barWidth, 6, progress, [230, 230, 235], colors.coral);
      
      pdf.setTextColor(...colors.muted);
      pdf.setFontSize(9);
      pdf.text(`${symptomData.count}x`, margin + 57 + barWidth, yPos + 5);
      
      yPos += 10;
    });
    
    yPos += 10;
  }

  // ===== WEEKLY SUMMARY =====
  checkNewPage(55);
  
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📅 Weekly Summary', margin, yPos);
  yPos += 8;
  
  drawRoundedRect(pdf, margin, yPos, contentWidth / 2 - 5, 40, 3, colors.background);
  
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.muted);
  pdf.text('Days Logged', margin + 5, yPos + 10);
  pdf.setTextColor(...colors.text);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(`${summaryData.weekly.daysLogged}`, margin + 5, yPos + 22);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.muted);
  pdf.text('Period Days', margin + 5, yPos + 32);
  pdf.setTextColor(...colors.text);
  pdf.text(`${summaryData.weekly.periodDays}`, margin + 35, yPos + 32);

  // Monthly Summary
  drawRoundedRect(pdf, margin + contentWidth / 2 + 5, yPos, contentWidth / 2 - 5, 40, 3, colors.background);
  
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.muted);
  pdf.text('Monthly Avg Sleep', margin + contentWidth / 2 + 10, yPos + 10);
  pdf.setTextColor(...colors.text);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(summaryData.monthly.avgSleep ? `${summaryData.monthly.avgSleep}h` : 'N/A', margin + contentWidth / 2 + 10, yPos + 22);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.muted);
  pdf.text('Avg Water', margin + contentWidth / 2 + 10, yPos + 32);
  pdf.setTextColor(...colors.text);
  pdf.text(summaryData.monthly.avgWater ? `${summaryData.monthly.avgWater} glasses` : 'N/A', margin + contentWidth / 2 + 35, yPos + 32);

  yPos += 50;

  // ===== CYCLE STATS =====
  if (data.stats) {
    checkNewPage(45);
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('📈 Cycle Statistics', margin, yPos);
    yPos += 8;
    
    const statWidth = (contentWidth - 15) / 4;
    const cycleStats = [
      { label: 'Avg Cycle', value: `${data.stats.averageCycleLength} days` },
      { label: 'Avg Period', value: `${data.stats.averagePeriodLength} days` },
      { label: 'Cycles Tracked', value: `${data.stats.totalCycles}` },
      { label: 'Range', value: `${data.stats.shortestCycle}-${data.stats.longestCycle} days` },
    ];
    
    cycleStats.forEach((stat, i) => {
      const xOffset = margin + i * (statWidth + 5);
      drawRoundedRect(pdf, xOffset, yPos, statWidth, 22, 3, colors.background);
      
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.muted);
      pdf.text(stat.label, xOffset + 4, yPos + 8);
      
      pdf.setFontSize(11);
      pdf.setTextColor(...colors.text);
      pdf.setFont('helvetica', 'bold');
      pdf.text(stat.value, xOffset + 4, yPos + 16);
    });
    
    yPos += 32;
  }

  // ===== PARTNER TIPS =====
  if (data.shareSettings.showMoodTips) {
    checkNewPage(60);
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('💝 Partner Care Tips', margin, yPos);
    yPos += 8;
    
    drawRoundedRect(pdf, margin, yPos, contentWidth, 45, 4, [250, 245, 255]);
    pdf.setDrawColor(...colors.primary);
    pdf.roundedRect(margin, yPos, contentWidth, 45, 4, 4, 'S');
    
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.text);
    pdf.setFont('helvetica', 'normal');
    
    currentPhaseData.tips.forEach((tip, i) => {
      pdf.text(`• ${tip}`, margin + 8, yPos + 10 + i * 9);
    });
    
    yPos += 55;
  }

  // ===== FOOTER =====
  checkNewPage(25);
  
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.muted);
  pdf.text('This report was generated from Flow Index - A personal health tracking app', pageWidth / 2, pageHeight - 15, { align: 'center' });
  pdf.text('The information shared is for personal reference and partner communication only.', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  pdf.save(`cycle-update-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
