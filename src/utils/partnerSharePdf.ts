import jsPDF from 'jspdf';
import { format, parseISO, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { CyclePrediction, CycleStats, DayLog, Mood, Symptom } from '@/types/period';
import { CyclePhase } from '@/types/settings';
import { getPhaseInfoForPdf } from '@/data/phaseData';
import type { JournalEntry } from '@/hooks/useWellnessJournal';
import type { FertilityLog } from '@/hooks/useFertilityTracker';
import {
  colors,
  phaseStyles,
  moodLabels,
  symptomLabels,
  drawRoundedRect,
  drawProgressBar,
  drawDecoCircle,
  addPageFooter
} from './pdfUtils';

// Re-export for backward compatibility
export { colors, phaseStyles, moodLabels, symptomLabels };

export interface PdfData {
  predictions: CyclePrediction | null;
  stats: CycleStats | null;
  currentPhase: CyclePhase;
  daysUntilNextPeriod: number | null;
  currentCycleDay: number | null;
  logs: DayLog[];
  fertilityLogs?: FertilityLog[];
  userName?: string;
  journalEntries?: JournalEntry[];
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

// Build graph data for PDF chart
function buildGraphData(logs: DayLog[], days: number) {
  const today = startOfDay(new Date());
  const logMap = new Map(logs.map(l => [l.date, l]));
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(today, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const log = logMap.get(dateStr);
    const flowVal = !log?.isPeriod ? 0 : 
      log.flowIntensity === 'spotting' ? 1 :
      log.flowIntensity === 'light' ? 2 :
      log.flowIntensity === 'medium' ? 3 :
      log.flowIntensity === 'heavy' ? 4 : 2;
    data.push({
      date: format(day, 'd'),
      flow: flowVal,
      moods: log?.moods?.length || 0,
      symptoms: log?.symptoms?.length || 0,
      sleep: log?.sleepHours || 0,
      water: log?.waterIntake || 0,
    });
  }
  return data;
}

export async function generatePartnerSharePdf(data: PdfData, logoBase64?: string): Promise<void> {
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
  const currentPhaseData = getPhaseInfoForPdf(data.currentPhase);
  const phaseStyle = phaseStyles[data.currentPhase];
  const userName = data.userName || 'Your Partner';

  // Helper to add new page if needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin - 20) {
      // Add footer to current page before new page
      addPageFooter(pdf, pageWidth, pageHeight, margin);
      pdf.addPage();
      yPos = margin + 5;
      // Add subtle decorative elements on new page
      drawDecoCircle(pdf, pageWidth - 20, 20, 15, colors.lavender, 0.15);
      drawDecoCircle(pdf, 25, pageHeight - 25, 10, colors.coral, 0.1);
      // Add page header watermark
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.textMuted);
      pdf.text('Flow Index - Cycle Update', pageWidth / 2, 10, { align: 'center' });
      return true;
    }
    return false;
  };

  // ===== PAGE BACKGROUND DECORATION =====
  drawDecoCircle(pdf, pageWidth + 10, -10, 40, colors.lavender, 0.1);
  drawDecoCircle(pdf, -15, pageHeight / 2, 30, colors.coral, 0.08);
  drawDecoCircle(pdf, pageWidth - 10, pageHeight - 20, 25, colors.sage, 0.1);

  // ===== HEADER WITH BRANDING =====
  const headerHeight = 38;
  drawRoundedRect(pdf, margin, yPos, contentWidth, headerHeight, 8, colors.primary);
  
  // Add logo if available
  let logoXOffset = 12;
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'PNG', margin + 8, yPos + 6, 18, 18);
      logoXOffset = 32;
    } catch (e) {
      console.warn('Could not add logo to PDF:', e);
    }
  }
  
  // App name and title
  pdf.setTextColor(...colors.white);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Flow Index', margin + logoXOffset, yPos + 10);
  
  pdf.setFontSize(20);
  pdf.text('Cycle Update', margin + logoXOffset, yPos + 20);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`A wellness report for ${userName}'s partner`, margin + logoXOffset, yPos + 28);
  
  // Date on right
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(format(new Date(), 'MMMM d, yyyy'), pageWidth - margin - 8, yPos + 12, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Partner Share Report', pageWidth - margin - 8, yPos + 19, { align: 'right' });

  yPos += headerHeight + 10;

  // ===== CURRENT PHASE HERO CARD =====
  if (data.shareSettings.showCurrentPhase) {
    drawRoundedRect(pdf, margin, yPos, contentWidth, 42, 6, phaseStyle.lightColor);
    drawRoundedRect(pdf, margin, yPos, 8, 42, 6, phaseStyle.color);
    
    // Phase icon circle with letter
    drawRoundedRect(pdf, margin + 16, yPos + 8, 26, 26, 13, colors.white);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...phaseStyle.color);
    pdf.text(phaseStyle.label, margin + 25, yPos + 24);
    
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
      pdf.text(`  |  ${data.daysUntilNextPeriod} days until next period`, margin + 95, yPos + 36);
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
    pdf.text('Upcoming predicted Dates', margin + 10, yPos + 12);
    
    const nextStart = new Date(data.predictions.nextPeriodStart);
    const nextEnd = new Date(data.predictions.nextPeriodEnd);
    
    // Period dates box
    drawRoundedRect(pdf, margin + 10, yPos + 16, 75, 12, 3, colors.coralLight);
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.text);
    pdf.text(`Period: ${format(nextStart, 'MMM d')} - ${format(nextEnd, 'MMM d')}`, margin + 14, yPos + 24);
    
    if (data.shareSettings.showFertileWindow) {
      const fertileStart = new Date(data.predictions.fertileWindowStart);
      const fertileEnd = new Date(data.predictions.fertileWindowEnd);
      
      drawRoundedRect(pdf, margin + 95, yPos + 16, 80, 12, 3, colors.lavenderLight);
      pdf.text(`Fertile: ${format(fertileStart, 'MMM d')} - ${format(fertileEnd, 'MMM d')}`, margin + 99, yPos + 24);
    }

    yPos += 42;
  }

  // ===== QUICK STATS GRID =====
  checkNewPage(55);
  
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('This Week at a Glance', margin, yPos + 4);
  yPos += 12;
  
  const statBoxWidth = (contentWidth - 12) / 4;
  const stats = [
    { label: 'Days Logged', value: `${insights.daysLogged}/7`, color: colors.lavenderLight },
    { label: 'Avg Sleep', value: insights.avgSleep ? `${insights.avgSleep}h` : '-', color: colors.sageLight },
    { label: 'Avg Water', value: insights.avgWater ? `${insights.avgWater}` : '-', color: colors.coralLight },
    { label: 'Exercise', value: insights.totalExercise > 0 ? `${insights.totalExercise}m` : '-', color: colors.peachLight },
  ];
  
  stats.forEach((stat, i) => {
    const xOffset = margin + i * (statBoxWidth + 4);
    drawRoundedRect(pdf, xOffset, yPos, statBoxWidth, 28, 5, stat.color);
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text(stat.value, xOffset + 8, yPos + 18);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);
    pdf.text(stat.label, xOffset + statBoxWidth - 8, yPos + 22, { align: 'right' });
  });
  
  yPos += 38;

  // ===== DAILY LOGS TABLE =====
  checkNewPage(60);

  // Filter logs for the last 7 days and sort descending
  const today = endOfDay(new Date());
  const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
  const recentLogs = data.logs
    .filter(log => {
      const logDate = parseISO(log.date);
      return logDate >= sevenDaysAgo && logDate <= today;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (recentLogs.length > 0) {
    // Header
    drawRoundedRect(pdf, margin, yPos, contentWidth, 8, 2, colors.lavenderLight);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);

    // Column definitions
    const cols = [
      { header: 'Date', x: margin + 4, width: 25 },
      { header: 'Sleep', x: margin + 29, width: 15 },
      { header: 'Water', x: margin + 44, width: 15 },
      { header: 'Activity', x: margin + 59, width: 18 },
      { header: 'Moods', x: margin + 77, width: 50 },
      { header: 'Symptoms', x: margin + 127, width: 50 }
    ];

    cols.forEach(col => {
      pdf.text(col.header, col.x, yPos + 5);
    });

    yPos += 10;

    // Rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    recentLogs.forEach((log) => {
      checkNewPage(12);

      const dateStr = format(parseISO(log.date), 'EEE d');
      const sleepStr = log.sleepHours ? `${log.sleepHours}h` : '-';
      const waterStr = log.waterIntake ? `${log.waterIntake}` : '-';
      const activityStr = log.exerciseMinutes ? `${log.exerciseMinutes}m` : '-';

      const moodStr = log.moods.map(m => moodLabels[m]?.label || m).join(', ');
      const symptomStr = log.symptoms.map(s => symptomLabels[s]?.label || s).join(', ');

      // Truncate helper
      const truncate = (str: string, maxLen: number) => {
        return str.length > maxLen ? str.substring(0, maxLen - 3) + '...' : str;
      };

      pdf.text(dateStr, cols[0].x, yPos + 5);
      pdf.text(sleepStr, cols[1].x, yPos + 5);
      pdf.text(waterStr, cols[2].x, yPos + 5);
      pdf.text(activityStr, cols[3].x, yPos + 5);
      pdf.text(truncate(moodStr, 35), cols[4].x, yPos + 5);
      pdf.text(truncate(symptomStr, 35), cols[5].x, yPos + 5);

      pdf.setDrawColor(...colors.border);
      pdf.line(margin, yPos + 8, margin + contentWidth, yPos + 8);

      yPos += 10;
    });

    yPos += 10;
  }

  // ===== FERTILITY SIGNS =====
  const recentFertilityLogs = data.fertilityLogs?.filter(log => {
    const logDate = parseISO(log.date);
    return logDate >= sevenDaysAgo && logDate <= today;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (recentFertilityLogs && recentFertilityLogs.length > 0) {
    const tableHeight = 25 + recentFertilityLogs.length * 10;
    checkNewPage(tableHeight);

    drawRoundedRect(pdf, margin, yPos, contentWidth, tableHeight, 5, colors.cardBg, colors.border);

    pdf.setTextColor(...colors.text);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Fertility Signs (Recent)', margin + 10, yPos + 10);

    // Header
    const fY = yPos + 18;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.textMuted);

    const fCols = [
      { label: 'Date', x: margin + 10 },
      { label: 'OPK', x: margin + 40 },
      { label: 'CM', x: margin + 70 },
      { label: 'LH Level', x: margin + 100 },
      { label: 'BBT', x: margin + 130 },
      { label: 'Intercourse', x: margin + 160 },
    ];

    fCols.forEach(col => pdf.text(col.label, col.x, fY));

    let rowY = fY + 8;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.text);

    recentFertilityLogs.forEach(log => {
      const bbt = data.logs.find(l => l.date === log.date)?.temperature;

      pdf.text(format(parseISO(log.date), 'MMM d'), fCols[0].x, rowY);
      pdf.text(log.opk_result ? log.opk_result.toUpperCase() : '-', fCols[1].x, rowY);
      pdf.text(log.cervical_mucus ? log.cervical_mucus.replace(/_/g, ' ') : '-', fCols[2].x, rowY);
      pdf.text(log.lh_level ? log.lh_level.toString() : '-', fCols[3].x, rowY);
      pdf.text(bbt ? `${bbt}°` : '-', fCols[4].x, rowY);

      if (log.intercourse) {
        pdf.setTextColor(...colors.coral);
        pdf.text('Yes', fCols[5].x, rowY);
        pdf.setTextColor(...colors.text);
      } else {
        pdf.text('-', fCols[5].x, rowY);
      }

      rowY += 10;
    });

    yPos += tableHeight + 10;
  }

  // ===== MOOD PATTERNS =====
  if (data.shareSettings.showMoodInsights && insights.topMoods.length > 0) {
    checkNewPage(60);
    
    drawRoundedRect(pdf, margin, yPos, contentWidth, 8 + insights.topMoods.length * 12 + 8, 5, colors.cardBg, colors.border);
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Mood Patterns', margin + 10, yPos + 10);
    
    const maxMoodCount = Math.max(...insights.topMoods.map(m => m.count));
    
    insights.topMoods.forEach((moodData, i) => {
      const moodInfo = moodLabels[moodData.mood];
      const barY = yPos + 18 + i * 12;
      const barWidth = contentWidth - 70;
      const progress = moodData.count / maxMoodCount;
      
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.text);
      pdf.text(moodInfo.label, margin + 10, barY + 5);
      
      drawProgressBar(pdf, margin + 50, barY + 1, barWidth, 5, progress, [240, 235, 250], colors.lavender);
      
      pdf.setTextColor(...colors.textMuted);
      pdf.setFontSize(9);
      pdf.text(`${moodData.count}x`, margin + 52 + barWidth, barY + 5);
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
    pdf.text('Symptom Tracker', margin + 10, yPos + 10);
    
    const maxSymptomCount = Math.max(...insights.topSymptoms.map(s => s.count));
    
    insights.topSymptoms.forEach((symptomData, i) => {
      const symptomInfo = symptomLabels[symptomData.symptom];
      const barY = yPos + 18 + i * 12;
      const barWidth = contentWidth - 85;
      const progress = symptomData.count / maxSymptomCount;
      
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.text);
      pdf.text(symptomInfo.label, margin + 10, barY + 5);
      
      drawProgressBar(pdf, margin + 65, barY + 1, barWidth, 5, progress, [255, 235, 238], colors.coral);
      
      pdf.setTextColor(...colors.textMuted);
      pdf.setFontSize(9);
      pdf.text(`${symptomData.count}x`, margin + 67 + barWidth, barY + 5);
    });
    
  yPos += 8 + insights.topSymptoms.length * 12 + 18;
  }

  // ===== INSIGHTS GRAPH (drawn with jsPDF primitives) =====
  checkNewPage(90);
  
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('30-Day Wellness Overview', margin, yPos + 4);
  yPos += 12;

  // Build graph data
  const graphData = buildGraphData(data.logs, 30);
  const graphX = margin + 10;
  const graphY = yPos;
  const graphW = contentWidth - 20;
  const graphH = 55;

  // Background
  drawRoundedRect(pdf, margin, yPos - 4, contentWidth, graphH + 22, 5, colors.cardBg, colors.border);

  // Grid lines
  pdf.setDrawColor(230, 230, 240);
  pdf.setLineWidth(0.15);
  for (let i = 0; i <= 4; i++) {
    const gy = graphY + graphH - (i / 4) * graphH;
    pdf.line(graphX, gy, graphX + graphW, gy);
  }

  // X-axis labels (every 5 days)
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.textMuted);
  graphData.forEach((d, i) => {
    if (i % 5 === 0 || i === graphData.length - 1) {
      const x = graphX + (i / (graphData.length - 1)) * graphW;
      pdf.text(d.date, x, graphY + graphH + 5, { align: 'center' });
    }
  });

  // Find max value for scaling
  const maxVal = Math.max(
    4, // flow max
    ...graphData.map(d => Math.max(d.moods, d.symptoms, d.sleep, d.water))
  );

  // Line configs
  const lineConfigs: { key: keyof typeof graphData[0]; color: [number, number, number]; label: string; maxScale: number }[] = [
    { key: 'flow', color: [220, 60, 80], label: 'Flow', maxScale: 4 },
    { key: 'moods', color: [74, 180, 100], label: 'Moods', maxScale: maxVal },
    { key: 'symptoms', color: [240, 130, 50], label: 'Symptoms', maxScale: maxVal },
    { key: 'sleep', color: [140, 100, 220], label: 'Sleep', maxScale: Math.max(12, maxVal) },
    { key: 'water', color: [60, 150, 220], label: 'Water', maxScale: Math.max(12, maxVal) },
  ];

  // Draw lines
  lineConfigs.forEach(config => {
    pdf.setDrawColor(...config.color);
    pdf.setLineWidth(0.6);
    
    let prevX: number | null = null;
    let prevY: number | null = null;
    
    graphData.forEach((d, i) => {
      const val = d[config.key] as number;
      const x = graphX + (i / (graphData.length - 1)) * graphW;
      const y = graphY + graphH - (val / config.maxScale) * graphH;
      
      if (prevX !== null && prevY !== null) {
        pdf.line(prevX, prevY, x, y);
      }
      prevX = x;
      prevY = y;
    });

    // Draw dots at non-zero points
    graphData.forEach((d, i) => {
      const val = d[config.key] as number;
      if (val > 0) {
        const x = graphX + (i / (graphData.length - 1)) * graphW;
        const y = graphY + graphH - (val / config.maxScale) * graphH;
        pdf.setFillColor(...config.color);
        pdf.circle(x, y, 0.8, 'F');
      }
    });
  });

  // Legend
  const legendY = graphY + graphH + 10;
  const legendSpacing = contentWidth / lineConfigs.length;
  lineConfigs.forEach((config, i) => {
    const lx = margin + 8 + i * legendSpacing;
    pdf.setFillColor(...config.color);
    pdf.circle(lx, legendY, 1.5, 'F');
    pdf.setFontSize(7);
    pdf.setTextColor(...colors.textMuted);
    pdf.text(config.label, lx + 4, legendY + 1.5);
  });

  yPos += graphH + 30;

  // ===== WEEKLY & MONTHLY SUMMARY =====
  checkNewPage(65);
  
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Summary', margin, yPos + 4);
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
  pdf.text(`${summaryData.weekly.daysLogged} days logged`, margin + 10, yPos + 24);
  pdf.text(`${summaryData.weekly.periodDays} period days`, margin + 10, yPos + 33);
  if (summaryData.weekly.topMood) {
    const mood = moodLabels[summaryData.weekly.topMood];
    pdf.text(`Most common: ${mood.label}`, margin + 10, yPos + 42);
  }
  
  // Monthly
  drawRoundedRect(pdf, margin + summaryWidth + 6, yPos, summaryWidth, 50, 5, colors.lavenderLight);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('This Month', margin + summaryWidth + 16, yPos + 12);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`${summaryData.monthly.daysLogged} days logged`, margin + summaryWidth + 16, yPos + 24);
  pdf.text(`Avg sleep: ${summaryData.monthly.avgSleep || '-'}h`, margin + summaryWidth + 16, yPos + 33);
  pdf.text(`Avg water: ${summaryData.monthly.avgWater || '-'} glasses`, margin + summaryWidth + 16, yPos + 42);

  yPos += 60;

  // ===== CYCLE STATS =====
  if (data.stats) {
    checkNewPage(50);
    
    drawRoundedRect(pdf, margin, yPos, contentWidth, 38, 5, colors.cardBg, colors.border);
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Cycle Statistics', margin + 10, yPos + 12);
    
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

  // ===== WELLNESS JOURNAL SECTION =====
  const journalEntries = data.journalEntries || [];
  if (journalEntries.length > 0) {
    // Recent journal entries (last 7)
    const recentJournal = journalEntries.slice(0, 7);

    // Calculate mood trend data
    const moodRatings = recentJournal.filter(e => e.mood_rating).map(e => e.mood_rating!);
    const energyRatings = recentJournal.filter(e => e.energy_level).map(e => e.energy_level!);
    const avgMood = moodRatings.length > 0 ? Math.round((moodRatings.reduce((a, b) => a + b, 0) / moodRatings.length) * 10) / 10 : null;
    const avgEnergy = energyRatings.length > 0 ? Math.round((energyRatings.reduce((a, b) => a + b, 0) / energyRatings.length) * 10) / 10 : null;
    const selfCareDays = recentJournal.filter(e => e.self_care_done).length;

    // Collect all tags
    const tagCounts: Record<string, number> = {};
    recentJournal.forEach(e => (e.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    const topTags = Object.entries(tagCounts).sort(([,a],[,b]) => b - a).slice(0, 5);

    // Calculate journal streak
    let streak = 0;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    for (let i = 0; i < journalEntries.length; i++) {
      const expected = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (journalEntries[i].date === expected) { streak++; } else { break; }
    }

    // Section header
    checkNewPage(100);
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Wellness Journal', margin, yPos + 4);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);
    pdf.text('Daily reflections and emotional well-being', margin, yPos + 12);
    yPos += 20;

    // Stats row
    const jStatWidth = (contentWidth - 12) / 4;
    const moodLabelsMap = ['', 'Rough', 'Low', 'Okay', 'Good', 'Great'];
    const energyLabelsMap = ['', 'Drained', 'Low', 'Moderate', 'Energized', 'Vibrant'];

    const journalStats = [
      { label: 'Avg Mood', value: avgMood ? moodLabelsMap[Math.round(avgMood)] : '-', color: colors.lavenderLight },
      { label: 'Avg Energy', value: avgEnergy ? energyLabelsMap[Math.round(avgEnergy)] : '-', color: colors.peachLight },
      { label: 'Self-Care', value: `${selfCareDays}/${recentJournal.length}`, color: colors.sageLight },
      { label: 'Streak', value: streak > 0 ? `${streak}d` : '-', color: colors.coralLight },
    ];

    journalStats.forEach((stat, i) => {
      const xOffset = margin + i * (jStatWidth + 4);
      drawRoundedRect(pdf, xOffset, yPos, jStatWidth, 24, 5, stat.color);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.text);
      pdf.text(stat.value, xOffset + 8, yPos + 14);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.textMuted);
      pdf.text(stat.label, xOffset + jStatWidth - 6, yPos + 18, { align: 'right' });
    });
    yPos += 32;

    // Mood trend mini-chart (7 days)
    if (moodRatings.length >= 2) {
      checkNewPage(50);
      drawRoundedRect(pdf, margin, yPos, contentWidth, 40, 5, colors.cardBg, colors.border);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.text);
      pdf.text('Mood & Energy Trend (Recent)', margin + 10, yPos + 10);

      const chartX = margin + 15;
      const chartW = contentWidth - 30;
      const chartY = yPos + 14;
      const chartH = 20;

      // Grid
      pdf.setDrawColor(230, 230, 240);
      pdf.setLineWidth(0.1);
      for (let i = 0; i <= 4; i++) {
        const gy = chartY + chartH - (i / 4) * chartH;
        pdf.line(chartX, gy, chartX + chartW, gy);
      }

      // Mood line (pink)
      const moodEntries = recentJournal.filter(e => e.mood_rating).reverse();
      if (moodEntries.length >= 2) {
        pdf.setDrawColor(220, 80, 140);
        pdf.setLineWidth(0.7);
        let px: number | null = null, py: number | null = null;
        moodEntries.forEach((e, i) => {
          const x = chartX + (i / (moodEntries.length - 1)) * chartW;
          const y = chartY + chartH - ((e.mood_rating! - 1) / 4) * chartH;
          if (px !== null && py !== null) pdf.line(px, py, x, y);
          pdf.setFillColor(220, 80, 140);
          pdf.circle(x, y, 0.9, 'F');
          px = x; py = y;
        });
      }

      // Energy line (amber)
      const energyEntries = recentJournal.filter(e => e.energy_level).reverse();
      if (energyEntries.length >= 2) {
        pdf.setDrawColor(245, 158, 11);
        pdf.setLineWidth(0.7);
        let px: number | null = null, py: number | null = null;
        energyEntries.forEach((e, i) => {
          const x = chartX + (i / (energyEntries.length - 1)) * chartW;
          const y = chartY + chartH - ((e.energy_level! - 1) / 4) * chartH;
          if (px !== null && py !== null) pdf.line(px, py, x, y);
          pdf.setFillColor(245, 158, 11);
          pdf.circle(x, y, 0.9, 'F');
          px = x; py = y;
        });
      }

      // Legend
      pdf.setFillColor(220, 80, 140);
      pdf.circle(margin + 15, yPos + 37, 1.5, 'F');
      pdf.setFontSize(7);
      pdf.setTextColor(...colors.textMuted);
      pdf.text('Mood', margin + 19, yPos + 38.5);

      pdf.setFillColor(245, 158, 11);
      pdf.circle(margin + 40, yPos + 37, 1.5, 'F');
      pdf.text('Energy', margin + 44, yPos + 38.5);

      yPos += 46;
    }

    // Top wellness tags
    if (topTags.length > 0) {
      checkNewPage(25);
      drawRoundedRect(pdf, margin, yPos, contentWidth, 20, 5, colors.cardBg, colors.border);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.text);
      pdf.text('Top Wellness Tags:', margin + 8, yPos + 8);
      
      let tagX = margin + 50;
      topTags.forEach(([tag, count]) => {
        drawRoundedRect(pdf, tagX, yPos + 10, pdf.getTextWidth(tag) + 14, 7, 3, colors.lavenderLight);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.text);
        pdf.text(`${tag} (${count})`, tagX + 4, yPos + 14.5);
        tagX += pdf.getTextWidth(`${tag} (${count})`) + 18;
      });
      yPos += 26;
    }

    // Recent gratitude highlights
    const gratitudeEntries = recentJournal.filter(e => e.gratitude).slice(0, 3);
    if (gratitudeEntries.length > 0) {
      checkNewPage(20 + gratitudeEntries.length * 14);
      
      drawRoundedRect(pdf, margin, yPos, contentWidth, 12 + gratitudeEntries.length * 14, 5, colors.cardBg, colors.border);
      drawRoundedRect(pdf, margin, yPos, 5, 12 + gratitudeEntries.length * 14, 5, colors.sage);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.text);
      pdf.text('Gratitude Highlights', margin + 12, yPos + 10);

      gratitudeEntries.forEach((entry, i) => {
        const entryY = yPos + 18 + i * 14;
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.textMuted);
        pdf.text(format(new Date(entry.date), 'MMM d'), margin + 12, entryY);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(...colors.text);
        const gratText = (entry.gratitude || '').length > 80 ? (entry.gratitude || '').substring(0, 77) + '...' : (entry.gratitude || '');
        pdf.text(`"${gratText}"`, margin + 12, entryY + 7);
      });

      yPos += 20 + gratitudeEntries.length * 14;
    }

    yPos += 8;
  }

  // ===== PARTNER TIPS =====
  if (data.shareSettings.showMoodTips) {
    checkNewPage(70);
    
    drawRoundedRect(pdf, margin, yPos, contentWidth, 60, 6, colors.lavenderLight);
    drawRoundedRect(pdf, margin, yPos, 6, 60, 6, colors.primary);
    
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('How You Can Help', margin + 14, yPos + 14);
    
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

  // ===== FINAL PAGE FOOTER =====
  addPageFooter(pdf, pageWidth, pageHeight, margin);
  
  // Additional signature line on last page
  pdf.setFontSize(7);
  pdf.setTextColor(...colors.textMuted);
  pdf.setFont('helvetica', 'italic');
  pdf.text('This report is for personal wellness tracking and partner communication only.', pageWidth / 2, pageHeight - 8, { align: 'center' });

  // Save the PDF
  pdf.save(`flow-index-cycle-update-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
