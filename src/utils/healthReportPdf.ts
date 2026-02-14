import jsPDF from 'jspdf';
import { format, parseISO, subMonths, subDays } from 'date-fns';
import { DayLog, CycleData, CycleStats } from '@/types/period';
import type { FertilityLog, PregnancyLog, BirthRecord } from '@/hooks/useFertilityTracker';
import {
  colors,
  drawRoundedRect,
  drawProgressBar,
  drawDecoCircle,
  addPageFooter,
  drawFertilityChart
} from './pdfUtils';

export interface HealthReportOptions {
  period: '1' | '3' | '6' | '12';
  includeCycles: boolean;
  includeSymptoms: boolean;
  includeMoods: boolean;
  includeMedications: boolean;
  includeSleep: boolean;
  includeWater: boolean;
  includeBirthHistory: boolean;
}

interface HealthReportData {
  logs: DayLog[];
  cycles: CycleData[];
  stats: CycleStats | null;
  options: HealthReportOptions;
  fertilityLogs?: FertilityLog[];
  pregnancyLogs?: PregnancyLog[];
  birthRecords?: BirthRecord[];
  userName?: string;
}

export async function generateHealthReportPdf(data: HealthReportData, logoBase64?: string): Promise<void> {
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

  // Process Data
  const monthsAgo = parseInt(data.options.period);
  const startDate = subMonths(new Date(), monthsAgo);
  const endDate = new Date();

  const filteredLogs = data.logs
    .filter(log => parseISO(log.date) >= startDate)
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const filteredCycles = data.cycles.filter(cycle => parseISO(cycle.startDate) >= startDate);

  // Stats calculation
  const symptomCounts: Record<string, number> = {};
  const moodCounts: Record<string, number> = {};
  const medicationLogs: Record<string, number> = {};
  let totalSleep = 0, sleepCount = 0;
  let totalWater = 0, waterCount = 0;
  let totalExercise = 0, exerciseCount = 0;
  let periodDays = 0;

  filteredLogs.forEach(log => {
    if (log.isPeriod) periodDays++;
    log.symptoms.forEach(s => symptomCounts[s] = (symptomCounts[s] || 0) + 1);
    log.moods.forEach(m => moodCounts[m] = (moodCounts[m] || 0) + 1);
    log.medications?.forEach(med => {
      if (med.taken) medicationLogs[med.name] = (medicationLogs[med.name] || 0) + 1;
    });
    if (log.sleepHours) { totalSleep += log.sleepHours; sleepCount++; }
    if (log.waterIntake) { totalWater += log.waterIntake; waterCount++; }
    if (log.exerciseMinutes) { totalExercise += log.exerciseMinutes; exerciseCount++; }
  });

  const avgSleep = sleepCount > 0 ? Math.round((totalSleep / sleepCount) * 10) / 10 : 0;
  const avgWater = waterCount > 0 ? Math.round((totalWater / waterCount) * 10) / 10 : 0;
  const avgExercise = exerciseCount > 0 ? Math.round(totalExercise / exerciseCount) : 0;


  // Helper to check new page
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin - 20) {
      addPageFooter(pdf, pageWidth, pageHeight, margin);
      pdf.addPage();
      yPos = margin + 5;
      drawDecoCircle(pdf, pageWidth - 20, 20, 15, colors.lavender, 0.15);
      drawDecoCircle(pdf, 25, pageHeight - 25, 10, colors.coral, 0.1);
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.textMuted);
      pdf.text('Flow Index - Health Report', pageWidth / 2, 10, { align: 'center' });
      return true;
    }
    return false;
  };

  // Header
  // Background decoration
  drawDecoCircle(pdf, pageWidth + 10, -10, 40, colors.lavender, 0.1);
  drawDecoCircle(pdf, -15, pageHeight / 2, 30, colors.coral, 0.08);

  const headerHeight = 38;
  drawRoundedRect(pdf, margin, yPos, contentWidth, headerHeight, 8, colors.primary);

  let logoXOffset = 12;
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'PNG', margin + 8, yPos + 6, 18, 18);
      logoXOffset = 32;
    } catch (e) {
      console.warn('Could not add logo:', e);
    }
  }

  pdf.setTextColor(...colors.white);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Flow Index', margin + logoXOffset, yPos + 10);

  pdf.setFontSize(20);
  pdf.text('Health Report', margin + logoXOffset, yPos + 20);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const userNameText = data.userName ? `Prepared for ${data.userName}` : 'Your Personal Report';
  pdf.text(userNameText, margin + logoXOffset, yPos + 28);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(format(new Date(), 'MMMM d, yyyy'), pageWidth - margin - 8, yPos + 12, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`, pageWidth - margin - 8, yPos + 19, { align: 'right' });

  yPos += headerHeight + 10;

  // Overview Stats
  checkNewPage(40);
  drawRoundedRect(pdf, margin, yPos, contentWidth, 30, 5, colors.cardBg, colors.border);

  const statsCols = [
    { label: 'Days Logged', value: `${filteredLogs.length}` },
    { label: 'Cycles', value: `${filteredCycles.length}` },
    { label: 'Period Days', value: `${periodDays}` },
  ];
  if (data.options.includeSleep) statsCols.push({ label: 'Avg Sleep', value: `${avgSleep}h` });

  const statWidth = (contentWidth - 20) / statsCols.length;
  statsCols.forEach((stat, i) => {
    const x = margin + 10 + i * statWidth;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primary);
    pdf.text(stat.value, x, yPos + 15);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);
    pdf.text(stat.label, x, yPos + 22);
  });
  yPos += 38;

  // Cycle Summary
  if (data.options.includeCycles && data.stats) {
    checkNewPage(40);
    drawRoundedRect(pdf, margin, yPos, contentWidth, 35, 5, colors.cardBg, colors.border);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Cycle Summary', margin + 10, yPos + 10);

    const cStats = [
      { label: 'Avg Cycle Length', value: `${data.stats.averageCycleLength} days` },
      { label: 'Avg Period Length', value: `${data.stats.averagePeriodLength} days` },
      { label: 'Total Cycles', value: `${data.stats.totalCycles}` },
      { label: 'Cycle Range', value: `${data.stats.shortestCycle} - ${data.stats.longestCycle} days` },
    ];

    let cx = margin + 10;
    let cy = yPos + 20;
    cStats.forEach((s, i) => {
       pdf.setFontSize(10);
       pdf.setTextColor(...colors.text);
       pdf.text(s.value, cx, cy);
       pdf.setFontSize(8);
       pdf.setTextColor(...colors.textMuted);
       pdf.text(s.label, cx, cy + 5);
       cx += (contentWidth - 20) / 4;
    });
    yPos += 45;
  }

  // Fertility Chart (Last 30 Days)
  if (data.fertilityLogs && data.fertilityLogs.length > 0) {
    const hasRecentData = data.fertilityLogs.some(l => {
        const d = parseISO(l.date);
        return d >= subDays(new Date(), 30);
    });

    if (hasRecentData) {
        checkNewPage(80);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.text);
        pdf.text('Fertility Chart (Last 30 Days)', margin + 10, yPos + 10);

        drawFertilityChart(pdf, margin, yPos + 15, contentWidth, 60, data.logs, data.fertilityLogs, 30);
        yPos += 85;
    }
  }

  // Birth History
  if (data.options.includeBirthHistory && data.birthRecords && data.birthRecords.length > 0) {
    checkNewPage(40);
    drawRoundedRect(pdf, margin, yPos, contentWidth, 35, 5, colors.cardBg, colors.border);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Birth History', margin + 10, yPos + 10);

    const latestBirth = data.birthRecords[0]; // Assuming sorted descending
    const bStats = [
      { label: 'Date', value: latestBirth.birth_date },
      { label: 'Type', value: latestBirth.birth_type?.replace(/_/g, ' ') || '-' },
      { label: 'Weight', value: latestBirth.baby_weight ? `${latestBirth.baby_weight} lbs` : '-' },
      { label: 'Baby', value: latestBirth.baby_name || 'Baby' },
    ];

    let bx = margin + 10;
    let by = yPos + 20;
    bStats.forEach((s, i) => {
       pdf.setFontSize(10);
       pdf.setTextColor(...colors.text);
       pdf.text(s.value, bx, by);
       pdf.setFontSize(8);
       pdf.setTextColor(...colors.textMuted);
       pdf.text(s.label, bx, by + 5);
       bx += (contentWidth - 20) / 4;
    });
    yPos += 45;
  }

  // Symptom Frequency
  if (data.options.includeSymptoms && Object.keys(symptomCounts).length > 0) {
    const topSymptoms = Object.entries(symptomCounts).sort((a,b) => b[1] - a[1]);
    const height = 20 + topSymptoms.length * 10;
    checkNewPage(height);

    drawRoundedRect(pdf, margin, yPos, contentWidth, height, 5, colors.cardBg, colors.border);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Symptom Frequency', margin + 10, yPos + 10);

    const maxVal = topSymptoms[0][1];
    topSymptoms.forEach((s, i) => {
       const by = yPos + 18 + i * 10;
       pdf.setFontSize(9);
       pdf.setTextColor(...colors.text);
       pdf.text(s[0].replace(/_/g, ' '), margin + 10, by + 4);

       const barW = contentWidth - 80;
       drawProgressBar(pdf, margin + 60, by, barW, 4, s[1] / maxVal, [240, 240, 245], colors.coral);
       pdf.setTextColor(...colors.textMuted);
       pdf.text(`${s[1]} days`, margin + 65 + barW, by + 4);
    });
    yPos += height + 10;
  }

  // Mood Patterns
  if (data.options.includeMoods && Object.keys(moodCounts).length > 0) {
    const topMoods = Object.entries(moodCounts).sort((a,b) => b[1] - a[1]);
    const height = 20 + topMoods.length * 10;
    checkNewPage(height);

    drawRoundedRect(pdf, margin, yPos, contentWidth, height, 5, colors.cardBg, colors.border);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Mood Patterns', margin + 10, yPos + 10);

    const maxVal = topMoods[0][1];
    topMoods.forEach((m, i) => {
       const by = yPos + 18 + i * 10;
       pdf.setFontSize(9);
       pdf.setTextColor(...colors.text);
       pdf.text(m[0], margin + 10, by + 4);

       const barW = contentWidth - 80;
       drawProgressBar(pdf, margin + 60, by, barW, 4, m[1] / maxVal, [240, 240, 245], colors.sage);
       pdf.setTextColor(...colors.textMuted);
       pdf.text(`${m[1]} days`, margin + 65 + barW, by + 4);
    });
    yPos += height + 10;
  }

  // Daily Logs (Table)
  if (filteredLogs.length > 0) {
    checkNewPage(30);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Daily Log Details', margin, yPos + 5);
    yPos += 10;

    // Headers
    drawRoundedRect(pdf, margin, yPos, contentWidth, 8, 2, colors.lavenderLight);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    const cols = [
       { header: 'Date', x: margin + 4 },
       { header: 'Details', x: margin + 35 },
    ];
    pdf.text(cols[0].header, cols[0].x, yPos + 5);
    pdf.text(cols[1].header, cols[1].x, yPos + 5);
    yPos += 10;

    filteredLogs.forEach(log => {
      // Build details text
      let details = [];
      if (log.isPeriod) details.push(`Period (${log.flowIntensity || 'medium'})`);
      if (log.moods.length) details.push(`Moods: ${log.moods.join(', ')}`);
      if (log.symptoms.length) details.push(`Symptoms: ${log.symptoms.map(s => s.replace(/_/g, ' ')).join(', ')}`);
      if (log.sleepHours) details.push(`Sleep: ${log.sleepHours}h`);
      if (log.waterIntake) details.push(`Water: ${log.waterIntake}`);

      // Fertility details
      const fertLog = data.fertilityLogs?.find(fl => fl.date === log.date);
      if (fertLog) {
        if (fertLog.opk_result) details.push(`OPK: ${fertLog.opk_result}`);
        if (fertLog.cervical_mucus) details.push(`CM: ${fertLog.cervical_mucus.replace(/_/g, ' ')}`);
        if (fertLog.lh_level) details.push(`LH: ${fertLog.lh_level}`);
        if (fertLog.intercourse) details.push(`Intercourse: ${fertLog.intercourse_protected ? 'Protected' : 'Unprotected'}`);
      }

      // Pregnancy details
      const pregLog = data.pregnancyLogs?.find(pl => pl.date === log.date);
      if (pregLog) {
        if (pregLog.week_number) details.push(`Week ${pregLog.week_number}`);
        if (pregLog.weight) details.push(`Weight: ${pregLog.weight}`);
        if (pregLog.baby_movements) details.push(`Kicks: ${pregLog.baby_movements}`);
      }

      const detailsText = details.join(' | ');
      const splitDetails = pdf.splitTextToSize(detailsText, contentWidth - 40);
      const rowHeight = Math.max(8, splitDetails.length * 4 + 4);

      checkNewPage(rowHeight);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.text);

      pdf.text(format(parseISO(log.date), 'EEE, MMM d'), cols[0].x, yPos + 4);
      pdf.text(splitDetails, cols[1].x, yPos + 4);

      pdf.setDrawColor(...colors.border);
      pdf.line(margin, yPos + rowHeight, margin + contentWidth, yPos + rowHeight);

      yPos += rowHeight;
    });
  }

  addPageFooter(pdf, pageWidth, pageHeight, margin);
  pdf.save(`health-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
