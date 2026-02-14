import jsPDF from 'jspdf';
import { format, parseISO, differenceInDays, subDays } from 'date-fns';
import { DayLog, CycleData, CycleStats, Symptom, Mood } from '@/types/period';
import type { FertilityLog, PregnancyLog } from '@/hooks/useFertilityTracker';
import {
  colors,
  drawRoundedRect,
  drawProgressBar,
  drawDecoCircle,
  addPageFooter,
  drawFertilityChart
} from './pdfUtils';

export interface ClinicalAssessment {
  painVas: number;
  fatigueVas: number;
  moodVas: number;
  bloatingVas: number;
  additionalNotes?: string;
}

export interface ClinicalReportData {
  logs: DayLog[];
  cycles: CycleData[];
  stats: CycleStats | null;
  assessment: ClinicalAssessment;
  fertilityLogs?: FertilityLog[];
  pregnancyLogs?: PregnancyLog[];
  userName?: string;
}

const symptomToClinicalTerm: Record<string, string> = {
  cramps: 'Dysmenorrhea (menstrual cramping)',
  headache: 'Cephalgia (headache)',
  backache: 'Lumbago (lower back pain)',
  bloating: 'Abdominal distension',
  breast_tenderness: 'Mastodynia (breast tenderness)',
  acne: 'Acne vulgaris',
  fatigue: 'Asthenia (fatigue/weakness)',
  insomnia: 'Insomnia (sleep disturbance)',
  nausea: 'Nausea',
  cravings: 'Increased appetite/food cravings',
};

const moodToClinicalTerm: Record<string, string> = {
  happy: 'Euthymic (normal/positive mood)',
  calm: 'Euthymic/relaxed state',
  sad: 'Depressed mood',
  anxious: 'Anxiety',
  irritable: 'Irritability',
  energetic: 'Elevated energy',
  tired: 'Fatigue/low energy',
};

const getVASDescription = (value: number): string => {
  if (value === 0) return 'No pain/symptom';
  if (value <= 3) return 'Mild';
  if (value <= 6) return 'Moderate';
  if (value <= 8) return 'Severe';
  return 'Very Severe';
};

export async function generateClinicalReportPdf(data: ClinicalReportData, logoBase64?: string): Promise<void> {
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

  // Process Clinical Analysis Data (Last 90 days)
  const last90Days = data.logs.filter(log => {
    const logDate = parseISO(log.date);
    const daysDiff = differenceInDays(new Date(), logDate);
    return daysDiff <= 90;
  });

  const symptomFrequency: Record<string, number> = {};
  const moodFrequency: Record<string, number> = {};
  let totalPeriodDays = 0;
  let heavyFlowDays = 0;

  last90Days.forEach(log => {
    if (log.isPeriod) totalPeriodDays++;
    if (log.flowIntensity === 'heavy') heavyFlowDays++;

    log.symptoms.forEach(symptom => {
      symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
    });

    log.moods.forEach(mood => {
      moodFrequency[mood] = (moodFrequency[mood] || 0) + 1;
    });
  });

  const topSymptoms = Object.entries(symptomFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([symptom, count]) => ({
      symptom: symptom,
      count,
      clinicalTerm: symptomToClinicalTerm[symptom] || symptom,
      percentage: totalPeriodDays > 0 ? (count / last90Days.length) : 0,
    }));

  const topMoods = Object.entries(moodFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([mood, count]) => ({
      mood: mood,
      count,
      clinicalTerm: moodToClinicalTerm[mood] || mood,
      percentage: totalPeriodDays > 0 ? (count / last90Days.length) : 0,
    }));

  const heavyFlowPercentage = totalPeriodDays > 0 ? Math.round((heavyFlowDays / totalPeriodDays) * 100) : 0;


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
      pdf.text('Flow Index - Clinical Report', pageWidth / 2, 10, { align: 'center' });
      return true;
    }
    return false;
  };

  // Header
  // Background decoration
  drawDecoCircle(pdf, pageWidth + 10, -10, 40, colors.sage, 0.1);
  drawDecoCircle(pdf, -15, pageHeight / 2, 30, colors.lavender, 0.08);

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
  pdf.text('Clinical Report', margin + logoXOffset, yPos + 20);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const userNameText = data.userName ? `Patient: ${data.userName}` : 'Patient Report';
  pdf.text(userNameText, margin + logoXOffset, yPos + 28);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(format(new Date(), 'MMMM d, yyyy'), pageWidth - margin - 8, yPos + 12, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Menstrual Health Clinical Summary', pageWidth - margin - 8, yPos + 19, { align: 'right' });

  yPos += headerHeight + 10;

  // Cycle Stats
  if (data.stats) {
    checkNewPage(45);
    drawRoundedRect(pdf, margin, yPos, contentWidth, 38, 5, colors.cardBg, colors.border);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Menstrual Cycle Statistics', margin + 10, yPos + 10);

    const cStats = [
      { label: 'Avg Cycle Length', value: `${data.stats.averageCycleLength} days` },
      { label: 'Avg Period Duration', value: `${data.stats.averagePeriodLength} days` },
      { label: 'Total Cycles Recorded', value: `${data.stats.totalCycles}` },
      { label: 'Cycle Range', value: `${data.stats.shortestCycle} - ${data.stats.longestCycle} days` },
    ];

    let cx = margin + 10;
    let cy = yPos + 20;
    cStats.forEach((s, i) => {
       pdf.setFontSize(10);
       pdf.setTextColor(...colors.primary);
       pdf.text(s.value, cx, cy);
       pdf.setFontSize(8);
       pdf.setTextColor(...colors.textMuted);
       pdf.text(s.label, cx, cy + 5);
       cx += (contentWidth - 20) / 4;
    });
    yPos += 48;
  }

  // Fertility & Pregnancy Highlights
  if ((data.fertilityLogs && data.fertilityLogs.length > 0) || (data.pregnancyLogs && data.pregnancyLogs.length > 0)) {
    checkNewPage(45);
    drawRoundedRect(pdf, margin, yPos, contentWidth, 38, 5, colors.cardBg, colors.border);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Fertility & Pregnancy Highlights', margin + 10, yPos + 10);

    let summaryText = "";
    if (data.pregnancyLogs && data.pregnancyLogs.length > 0) {
      summaryText += `Pregnancy Logs: ${data.pregnancyLogs.length} entries. `;
      const lastPregLog = data.pregnancyLogs[0]; // Assumes sorted
      if (lastPregLog.week_number) summaryText += `Latest: Week ${lastPregLog.week_number}. `;
    }
    if (data.fertilityLogs && data.fertilityLogs.length > 0) {
      const positiveOPKs = data.fertilityLogs.filter(l => l.opk_result === 'high' || l.opk_result === 'peak').length;
      summaryText += `Fertility Logs: ${data.fertilityLogs.length} entries. Positive/Peak OPKs: ${positiveOPKs}.`;
    }

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(summaryText, margin + 10, yPos + 20);

    yPos += 48;
  }

  // Fertility Chart
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
        pdf.text('Fertility Overview (30 Days)', margin + 10, yPos + 10);

        drawFertilityChart(pdf, margin, yPos + 15, contentWidth, 60, data.logs, data.fertilityLogs, 30);
        yPos += 80;
    }
  }

  // VAS Assessments
  checkNewPage(60);
  drawRoundedRect(pdf, margin, yPos, contentWidth, 50, 5, colors.cardBg, colors.border);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.text);
  pdf.text('Visual Analog Scale Assessments (Current)', margin + 10, yPos + 10);

  const vasData = [
    { label: 'Pain Intensity', value: data.assessment.painVas, term: 'Visual Analog Scale - Pain', color: colors.coral },
    { label: 'Fatigue Level', value: data.assessment.fatigueVas, term: 'Fatigue Severity Scale', color: colors.lavender },
    { label: 'Mood Disturbance', value: data.assessment.moodVas, term: 'Mood Rating Scale', color: colors.peach },
    { label: 'Bloating Severity', value: data.assessment.bloatingVas, term: 'Bloating Severity Scale', color: colors.sage },
  ];

  vasData.forEach((vas, i) => {
    const by = yPos + 20 + i * 8;
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.text);
    pdf.text(`${vas.label} (${vas.value}/10)`, margin + 10, by);

    // Bar
    drawProgressBar(pdf, margin + 60, by - 3, contentWidth - 80, 4, vas.value / 10, [240, 240, 245], vas.color);

    pdf.setFontSize(7);
    pdf.setTextColor(...colors.textMuted);
    pdf.text(vas.term, margin + 60, by + 3);
  });
  yPos += 60;

  // Symptom Analysis
  if (topSymptoms.length > 0) {
    const height = 30 + topSymptoms.length * 10;
    checkNewPage(height);
    drawRoundedRect(pdf, margin, yPos, contentWidth, height, 5, colors.cardBg, colors.border);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Symptom Frequency Analysis (Last 90 Days)', margin + 10, yPos + 10);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Days Tracked: ${last90Days.length} | Period Days: ${totalPeriodDays} | Heavy Flow Days: ${heavyFlowDays} (${heavyFlowPercentage}%)`, margin + 10, yPos + 18);

    let listY = yPos + 28;
    topSymptoms.forEach((item, i) => {
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.text);
      pdf.text(`${i+1}. ${item.clinicalTerm}`, margin + 10, listY);

      pdf.setTextColor(...colors.textMuted);
      pdf.text(`- ${Math.round(item.percentage * 100)}% of tracked days`, margin + 80, listY);
      listY += 8;
    });
    yPos += height + 10;
  }

  // Mood Patterns
  if (topMoods.length > 0) {
    const height = 20 + topMoods.length * 10;
    checkNewPage(height);
    drawRoundedRect(pdf, margin, yPos, contentWidth, height, 5, colors.cardBg, colors.border);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Mood Patterns', margin + 10, yPos + 10);

    let listY = yPos + 20;
    topMoods.forEach((item, i) => {
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.text);
      pdf.text(`${i+1}. ${item.clinicalTerm}`, margin + 10, listY);

      pdf.setTextColor(...colors.textMuted);
      pdf.text(`- ${Math.round(item.percentage * 100)}% of tracked days`, margin + 80, listY);
      listY += 8;
    });
    yPos += height + 10;
  }

  // Patient Notes
  if (data.assessment.additionalNotes?.trim()) {
    checkNewPage(40);
    const notes = data.assessment.additionalNotes.trim();
    const splitNotes = pdf.splitTextToSize(notes, contentWidth - 20);
    const height = 20 + splitNotes.length * 5;

    drawRoundedRect(pdf, margin, yPos, contentWidth, height, 5, colors.cardBg, colors.border);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Patient Notes', margin + 10, yPos + 10);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(splitNotes, margin + 10, yPos + 18);

    yPos += height + 10;
  }

  // Disclaimer
  checkNewPage(20);
  pdf.setFontSize(8);
  pdf.setTextColor(...colors.textMuted);
  pdf.setFont('helvetica', 'italic');
  const disclaimer = 'DISCLAIMER: This report is generated from self-reported data and is intended to facilitate patient-provider communication. It does not constitute a medical diagnosis.';
  const splitDisclaimer = pdf.splitTextToSize(disclaimer, contentWidth);
  pdf.text(splitDisclaimer, margin, yPos + 5);

  addPageFooter(pdf, pageWidth, pageHeight, margin);
  pdf.save(`clinical-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
