import jsPDF from 'jspdf';
import { format, parseISO, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { CyclePrediction, CycleStats, DayLog, Mood, Symptom } from '@/types/period';
import { CyclePhase } from '@/types/settings';

// Beautiful color palette matching the app
export const colors = {
  // Primary gradient colors
  primary: [139, 92, 246] as [number, number, number],
  primaryLight: [167, 139, 250] as [number, number, number],
  
  // Phase colors - soft and gentle
  coral: [251, 113, 133] as [number, number, number],
  coralLight: [254, 205, 211] as [number, number, number],
  sage: [74, 222, 128] as [number, number, number],
  sageLight: [187, 247, 208] as [number, number, number],
  lavender: [167, 139, 250] as [number, number, number],
  lavenderLight: [221, 214, 254] as [number, number, number],
  peach: [251, 146, 60] as [number, number, number],
  peachLight: [254, 215, 170] as [number, number, number],
  
  // Neutrals
  text: [30, 27, 75] as [number, number, number],
  textMuted: [100, 100, 120] as [number, number, number],
  background: [254, 252, 255] as [number, number, number],
  cardBg: [255, 255, 255] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  border: [233, 213, 255] as [number, number, number],
};

<<<<<<< HEAD
export const phaseStyles: Record<CyclePhase, {
=======
export const phaseStyles: Record<CyclePhase, {
>>>>>>> fix-partner-share-pdf-1994780851259566418
  color: [number, number, number]; 
  lightColor: [number, number, number];
  icon: string;
}> = {
  menstrual: { color: colors.coral, lightColor: colors.coralLight, icon: '🌙' },
  follicular: { color: colors.sage, lightColor: colors.sageLight, icon: '✨' },
  ovulation: { color: colors.lavender, lightColor: colors.lavenderLight, icon: '💜' },
  luteal: { color: colors.peach, lightColor: colors.peachLight, icon: '🍂' },
};

export const moodLabels: Record<Mood, { label: string; emoji: string }> = {
  happy: { label: 'Happy', emoji: '😊' },
  calm: { label: 'Calm', emoji: '😌' },
  sad: { label: 'Sad', emoji: '😢' },
  anxious: { label: 'Anxious', emoji: '😰' },
  irritable: { label: 'Irritable', emoji: '😤' },
  energetic: { label: 'Energetic', emoji: '⚡' },
  tired: { label: 'Tired', emoji: '😴' },
};

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

export const phaseInfo: Record<CyclePhase, { title: string; subtitle: string; tips: string[] }> = {
  menstrual: {
    title: 'Menstrual Phase',
    subtitle: 'A time for rest and renewal',
    tips: [
      'Extra rest and comfort may be appreciated',
      'Offer to help with physical tasks',
      'Warm drinks and cozy time together',
      'Be patient with mood fluctuations',
    ],
  },
  follicular: {
    title: 'Follicular Phase',
    subtitle: 'Energy is building',
    tips: [
      'Great time for planning activities together',
      'Energy levels are typically rising',
      'Good time for trying new things',
      'Creativity and sociability often peak',
    ],
  },
  ovulation: {
    title: 'Ovulation Phase',
    subtitle: 'Peak energy and connection',
    tips: [
      'Highest energy and confidence time',
      'Great for social activities and dates',
      'Communication may be extra effective',
      'Peak fertility window',
    ],
  },
  luteal: {
    title: 'Luteal Phase',
    subtitle: 'Winding down gracefully',
    tips: [
      'PMS symptoms may appear later in this phase',
      'Extra patience and understanding helps',
      'Comfort foods might be craved',
      'Quiet, relaxing activities are good',
    ],
  },
};

export interface PdfData {
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

export function calculateInsights(logs: DayLog[]) {
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);
  
  const recentLogs = logs.filter(log => {
    const logDate = parseISO(log.date);
    return logDate >= sevenDaysAgo && logDate <= today;
  });

  const moodCounts: Record<Mood, number> = {} as Record<Mood, number>;
  const symptomCounts: Record<Symptom, number> = {} as Record<Symptom, number>;
  let totalSleep = 0, sleepCount = 0;
  let totalWater = 0, waterCount = 0;
  let totalExercise = 0, exerciseCount = 0;
  let periodDays = 0;

  recentLogs.forEach(log => {
    log.moods.forEach(mood => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });
    log.symptoms.forEach(symptom => {
      symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
    });
    if (log.sleepHours) { totalSleep += log.sleepHours; sleepCount++; }
    if (log.waterIntake) { totalWater += log.waterIntake; waterCount++; }
    if (log.exerciseMinutes) { totalExercise += log.exerciseMinutes; exerciseCount++; }
    if (log.isPeriod) periodDays++;
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

export function calculateSummaryData(logs: DayLog[]) {
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

// Utility functions for drawing
function drawRoundedRect(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor: [number, number, number],
  strokeColor?: [number, number, number]
) {
  pdf.setFillColor(...fillColor);
  pdf.roundedRect(x, y, width, height, radius, radius, 'F');
  if (strokeColor) {
    pdf.setDrawColor(...strokeColor);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, y, width, height, radius, radius, 'S');
  }
}

function drawGradientHeader(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number
) {
  // Simulate gradient with multiple rectangles
  const steps = 20;
  const stepWidth = width / steps;
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    const r = Math.round(colors.primary[0] + (colors.lavender[0] - colors.primary[0]) * ratio);
    const g = Math.round(colors.primary[1] + (colors.lavender[1] - colors.primary[1]) * ratio);
    const b = Math.round(colors.primary[2] + (colors.lavender[2] - colors.primary[2]) * ratio);
    pdf.setFillColor(r, g, b);
    pdf.rect(x + i * stepWidth, y, stepWidth + 0.5, height, 'F');
  }
  // Round corners overlay
  pdf.setFillColor(...colors.background);
  // Top-left corner
  pdf.rect(x, y, 5, 5, 'F');
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.circle(x + 5, y + 5, 5, 'F');
  // Top-right corner
  pdf.setFillColor(...colors.background);
  pdf.rect(x + width - 5, y, 5, 5, 'F');
  pdf.setFillColor(colors.lavender[0], colors.lavender[1], colors.lavender[2]);
  pdf.circle(x + width - 5, y + 5, 5, 'F');
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
  pdf.setFillColor(...bgColor);
  pdf.roundedRect(x, y, width, height, height / 2, height / 2, 'F');
  // Fill
  if (progress > 0) {
    const fillWidth = Math.max(height, width * Math.min(progress, 1));
    pdf.setFillColor(...fillColor);
    pdf.roundedRect(x, y, fillWidth, height, height / 2, height / 2, 'F');
  }
}

function drawDecoCircle(pdf: jsPDF, x: number, y: number, radius: number, color: [number, number, number], opacity: number = 0.3) {
  const r = Math.round(color[0] + (255 - color[0]) * (1 - opacity));
  const g = Math.round(color[1] + (255 - color[1]) * (1 - opacity));
  const b = Math.round(color[2] + (255 - color[2]) * (1 - opacity));
  pdf.setFillColor(r, g, b);
  pdf.circle(x, y, radius, 'F');
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
  const phaseStyle = phaseStyles[data.currentPhase];

  // Helper to add new page if needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin - 15) {
      pdf.addPage();
      yPos = margin;
      // Add subtle decorative elements on new page
      drawDecoCircle(pdf, pageWidth - 20, 20, 15, colors.lavender, 0.15);
      drawDecoCircle(pdf, 25, pageHeight - 25, 10, colors.coral, 0.1);
      return true;
    }
    return false;
  };

  // ===== PAGE BACKGROUND DECORATION =====
  // Subtle decorative circles
  drawDecoCircle(pdf, pageWidth + 10, -10, 40, colors.lavender, 0.1);
  drawDecoCircle(pdf, -15, pageHeight / 2, 30, colors.coral, 0.08);
  drawDecoCircle(pdf, pageWidth - 10, pageHeight - 20, 25, colors.sage, 0.1);

  // ===== HEADER =====
  drawRoundedRect(pdf, margin, yPos, contentWidth, 32, 6, colors.primary);
  
  // Add decorative pattern
  pdf.setFillColor(255, 255, 255, 0.1);
  for (let i = 0; i < 5; i++) {
    pdf.circle(margin + contentWidth - 15 - i * 12, yPos + 16, 3 + i * 0.5, 'F');
  }
  
  pdf.setTextColor(...colors.white);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('💐 Cycle Update', margin + 12, yPos + 14);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('A personal wellness report for your partner', margin + 12, yPos + 22);
  
  pdf.setFontSize(9);
  pdf.text(format(new Date(), 'MMMM d, yyyy'), pageWidth - margin - 35, yPos + 14);
  pdf.text('Flow Index', pageWidth - margin - 23, yPos + 22);

  yPos += 42;

  // ===== CURRENT PHASE HERO CARD =====
  if (data.shareSettings.showCurrentPhase) {
    drawRoundedRect(pdf, margin, yPos, contentWidth, 42, 6, phaseStyle.lightColor);
    drawRoundedRect(pdf, margin, yPos, 8, 42, 6, phaseStyle.color);
    
    // Phase icon circle
    drawRoundedRect(pdf, margin + 16, yPos + 8, 26, 26, 13, colors.white);
    pdf.setFontSize(18);
    pdf.text(phaseStyle.icon, margin + 22, yPos + 24);
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(currentPhaseData.title, margin + 50, yPos + 18);
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(...colors.textMuted);
    pdf.text(currentPhaseData.subtitle, margin + 50, yPos + 27);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    if (data.currentCycleDay) {
      pdf.text(`Day ${data.currentCycleDay} of cycle`, margin + 50, yPos + 36);
    }
    if (data.daysUntilNextPeriod !== null) {
      pdf.text(`•  ${data.daysUntilNextPeriod} days until next period`, margin + 95, yPos + 36);
    }

    yPos += 52;
  }

  // ===== PREDICTIONS CARD =====
  if (data.shareSettings.showPeriodDates && data.predictions) {
    checkNewPage(40);
    
    drawRoundedRect(pdf, margin, yPos, contentWidth, 32, 5, colors.cardBg, colors.border);
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('📅 Upcoming Dates', margin + 10, yPos + 12);
    
    const nextStart = new Date(data.predictions.nextPeriodStart);
    const nextEnd = new Date(data.predictions.nextPeriodEnd);
    
    // Period dates box
    drawRoundedRect(pdf, margin + 10, yPos + 16, 75, 12, 3, colors.coralLight);
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.text);
    pdf.text(`🩸 Period: ${format(nextStart, 'MMM d')} - ${format(nextEnd, 'MMM d')}`, margin + 14, yPos + 24);
    
    if (data.shareSettings.showFertileWindow) {
      const fertileStart = new Date(data.predictions.fertileWindowStart);
      const fertileEnd = new Date(data.predictions.fertileWindowEnd);
      
      drawRoundedRect(pdf, margin + 95, yPos + 16, 80, 12, 3, colors.lavenderLight);
      pdf.text(`🌸 Fertile: ${format(fertileStart, 'MMM d')} - ${format(fertileEnd, 'MMM d')}`, margin + 99, yPos + 24);
    }

    yPos += 42;
  }

  // ===== QUICK STATS GRID =====
  checkNewPage(55);
  
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📊 This Week at a Glance', margin, yPos + 4);
  yPos += 12;
  
  const statBoxWidth = (contentWidth - 8) / 3;
  const stats = [
    { label: 'Days Logged', value: `${insights.daysLogged}/7`, icon: '📝', color: colors.lavenderLight },
    { label: 'Avg Sleep', value: insights.avgSleep ? `${insights.avgSleep}h` : '—', icon: '😴', color: colors.sageLight },
    { label: 'Avg Water', value: insights.avgWater ? `${insights.avgWater}` : '—', icon: '💧', color: colors.coralLight },
  ];
  
  stats.forEach((stat, i) => {
    const xOffset = margin + i * (statBoxWidth + 4);
    drawRoundedRect(pdf, xOffset, yPos, statBoxWidth, 28, 5, stat.color);
    
    pdf.setFontSize(18);
    pdf.text(stat.icon, xOffset + 8, yPos + 12);
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text(stat.value, xOffset + 8, yPos + 22);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);
    pdf.text(stat.label, xOffset + statBoxWidth - 8, yPos + 22, { align: 'right' });
  });
  
  yPos += 38;

  // ===== MOOD PATTERNS =====
  if (data.shareSettings.showMoodInsights && insights.topMoods.length > 0) {
    checkNewPage(60);
    
    drawRoundedRect(pdf, margin, yPos, contentWidth, 8 + insights.topMoods.length * 12 + 8, 5, colors.cardBg, colors.border);
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('💭 Mood Patterns', margin + 10, yPos + 10);
    
    const maxMoodCount = Math.max(...insights.topMoods.map(m => m.count));
    
    insights.topMoods.forEach((moodData, i) => {
      const moodInfo = moodLabels[moodData.mood];
      const barY = yPos + 18 + i * 12;
      const barWidth = contentWidth - 70;
      const progress = moodData.count / maxMoodCount;
      
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.text);
      pdf.text(`${moodInfo.emoji} ${moodInfo.label}`, margin + 10, barY + 5);
      
      drawProgressBar(pdf, margin + 50, barY + 1, barWidth, 5, progress, [240, 235, 250], colors.lavender);
      
      pdf.setTextColor(...colors.textMuted);
      pdf.setFontSize(9);
      pdf.text(`${moodData.count}×`, margin + 52 + barWidth, barY + 5);
    });
    
    yPos += 8 + insights.topMoods.length * 12 + 18;
  }

  // ===== SYMPTOM PATTERNS =====
  if (data.shareSettings.showSymptomInsights && insights.topSymptoms.length > 0) {
    checkNewPage(60);
    
    drawRoundedRect(pdf, margin, yPos, contentWidth, 8 + insights.topSymptoms.length * 12 + 8, 5, colors.cardBg, colors.border);
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('🩺 Symptom Tracker', margin + 10, yPos + 10);
    
    const maxSymptomCount = Math.max(...insights.topSymptoms.map(s => s.count));
    
    insights.topSymptoms.forEach((symptomData, i) => {
      const symptomInfo = symptomLabels[symptomData.symptom];
      const barY = yPos + 18 + i * 12;
      const barWidth = contentWidth - 85;
      const progress = symptomData.count / maxSymptomCount;
      
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.text);
      pdf.text(`${symptomInfo.emoji} ${symptomInfo.label}`, margin + 10, barY + 5);
      
      drawProgressBar(pdf, margin + 65, barY + 1, barWidth, 5, progress, [255, 235, 238], colors.coral);
      
      pdf.setTextColor(...colors.textMuted);
      pdf.setFontSize(9);
      pdf.text(`${symptomData.count}×`, margin + 67 + barWidth, barY + 5);
    });
    
    yPos += 8 + insights.topSymptoms.length * 12 + 18;
  }

  // ===== WEEKLY & MONTHLY SUMMARY =====
  checkNewPage(65);
  
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📈 Summary', margin, yPos + 4);
  yPos += 12;
  
  const summaryWidth = (contentWidth - 6) / 2;
  
  // Weekly
  drawRoundedRect(pdf, margin, yPos, summaryWidth, 50, 5, colors.sageLight);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.text);
  pdf.text('This Week', margin + 10, yPos + 12);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`📝 ${summaryData.weekly.daysLogged} days logged`, margin + 10, yPos + 24);
  pdf.text(`🩸 ${summaryData.weekly.periodDays} period days`, margin + 10, yPos + 33);
  if (summaryData.weekly.topMood) {
    const mood = moodLabels[summaryData.weekly.topMood];
    pdf.text(`${mood.emoji} Most common: ${mood.label}`, margin + 10, yPos + 42);
  }
  
  // Monthly
  drawRoundedRect(pdf, margin + summaryWidth + 6, yPos, summaryWidth, 50, 5, colors.lavenderLight);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('This Month', margin + summaryWidth + 16, yPos + 12);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`📝 ${summaryData.monthly.daysLogged} days logged`, margin + summaryWidth + 16, yPos + 24);
  pdf.text(`😴 Avg sleep: ${summaryData.monthly.avgSleep || '—'}h`, margin + summaryWidth + 16, yPos + 33);
  pdf.text(`💧 Avg water: ${summaryData.monthly.avgWater || '—'} glasses`, margin + summaryWidth + 16, yPos + 42);

  yPos += 60;

  // ===== CYCLE STATS =====
  if (data.stats) {
    checkNewPage(50);
    
    drawRoundedRect(pdf, margin, yPos, contentWidth, 38, 5, colors.cardBg, colors.border);
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('🔄 Cycle Statistics', margin + 10, yPos + 12);
    
    const statWidth = (contentWidth - 40) / 4;
    const cycleStats = [
      { label: 'Avg Cycle', value: `${data.stats.averageCycleLength}d` },
      { label: 'Avg Period', value: `${data.stats.averagePeriodLength}d` },
      { label: 'Tracked', value: `${data.stats.totalCycles}` },
      { label: 'Range', value: `${data.stats.shortestCycle}-${data.stats.longestCycle}d` },
    ];
    
    cycleStats.forEach((stat, i) => {
      const xOffset = margin + 10 + i * (statWidth + 8);
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.primary);
      pdf.text(stat.value, xOffset, yPos + 26);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.textMuted);
      pdf.text(stat.label, xOffset, yPos + 33);
    });
    
    yPos += 48;
  }

  // ===== PARTNER TIPS =====
  if (data.shareSettings.showMoodTips) {
    checkNewPage(70);
    
    drawRoundedRect(pdf, margin, yPos, contentWidth, 60, 6, colors.lavenderLight);
    drawRoundedRect(pdf, margin, yPos, 6, 60, 6, colors.primary);
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('💝 How You Can Help', margin + 14, yPos + 14);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.text);
    
    currentPhaseData.tips.forEach((tip, i) => {
      pdf.setFillColor(...colors.primary);
      pdf.circle(margin + 18, yPos + 24 + i * 10, 1.5, 'F');
      pdf.text(tip, margin + 24, yPos + 26 + i * 10);
    });
    
    yPos += 70;
  }

  // ===== FOOTER =====
  const footerY = pageHeight - 18;
  
  // Decorative line
  pdf.setDrawColor(...colors.border);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  pdf.setFontSize(8);
  pdf.setTextColor(...colors.textMuted);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Generated with love from Flow Index', pageWidth / 2, footerY, { align: 'center' });
  pdf.text('This report is for personal wellness tracking and partner communication only.', pageWidth / 2, footerY + 5, { align: 'center' });
  
  // Heart decoration
  pdf.setFontSize(10);
  pdf.text('💜', margin + 5, footerY);
  pdf.text('💜', pageWidth - margin - 5, footerY);

  // Save the PDF
  pdf.save(`cycle-update-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
