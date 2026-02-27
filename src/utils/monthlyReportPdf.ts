import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { CycleStats } from '@/types/period';
import type { CyclePhase } from '@/types/settings';
import {
  colors,
  drawRoundedRect,
  drawProgressBar,
  drawDecoCircle,
  addPageFooter,
} from './pdfUtils';

interface MonthlyReportPdfData {
  monthLabel: string;
  userName?: string;
  loggedDays: number;
  periodDays: number;
  avgSleep: number;
  avgWater: number;
  totalExercise: number;
  topSymptoms: [string, number][];
  topMoods: [string, number][];
  dailyChart: { date: string; symptoms: number; moods: number }[];
  stats: CycleStats;
  currentPhase: CyclePhase | null;
  aiInsights: any;
  monthLogs: any[];
}

export async function generateMonthlyReportPdf(data: MonthlyReportPdfData, logoBase64?: string): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin - 20) {
      addPageFooter(pdf, pageWidth, pageHeight, margin);
      pdf.addPage();
      yPos = margin + 5;
      drawDecoCircle(pdf, pageWidth - 20, 20, 15, colors.lavender, 0.15);
      drawDecoCircle(pdf, 25, pageHeight - 25, 10, colors.coral, 0.1);
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.textMuted);
      pdf.text('Flow Index - Monthly Report', pageWidth / 2, 10, { align: 'center' });
      return true;
    }
    return false;
  };

  // Background decoration
  drawDecoCircle(pdf, pageWidth + 10, -10, 40, colors.lavender, 0.1);
  drawDecoCircle(pdf, -15, pageHeight / 2, 30, colors.coral, 0.08);
  drawDecoCircle(pdf, pageWidth - 10, pageHeight - 20, 25, colors.sage, 0.1);

  // ===== HEADER =====
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
  pdf.text('Monthly Health Report', margin + logoXOffset, yPos + 20);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const userText = data.userName ? `Prepared for ${data.userName}` : 'Your Personal Report';
  pdf.text(userText, margin + logoXOffset, yPos + 28);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.monthLabel, pageWidth - margin - 8, yPos + 12, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(format(new Date(), 'MMMM d, yyyy'), pageWidth - margin - 8, yPos + 19, { align: 'right' });

  yPos += headerHeight + 10;

  // ===== OVERVIEW STATS =====
  checkNewPage(40);
  drawRoundedRect(pdf, margin, yPos, contentWidth, 30, 5, colors.cardBg, colors.border);

  const statsCols = [
    { label: 'Days Logged', value: `${data.loggedDays}` },
    { label: 'Period Days', value: `${data.periodDays}` },
    { label: 'Avg Sleep', value: `${data.avgSleep}h` },
    { label: 'Avg Water', value: `${data.avgWater}` },
    { label: 'Exercise', value: `${data.totalExercise}m` },
  ];

  const statWidth = (contentWidth - 20) / statsCols.length;
  statsCols.forEach((stat, i) => {
    const x = margin + 10 + i * statWidth;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primary);
    pdf.text(stat.value, x, yPos + 15);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);
    pdf.text(stat.label, x, yPos + 22);
  });
  yPos += 38;

  // ===== CYCLE STATS =====
  if (data.stats) {
    checkNewPage(35);
    drawRoundedRect(pdf, margin, yPos, contentWidth, 30, 5, colors.cardBg, colors.border);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Cycle Summary', margin + 10, yPos + 10);

    const cStats = [
      { label: 'Avg Cycle', value: `${data.stats.averageCycleLength} days` },
      { label: 'Avg Period', value: `${data.stats.averagePeriodLength} days` },
      { label: 'Total Cycles', value: `${data.stats.totalCycles}` },
      { label: 'Range', value: `${data.stats.shortestCycle}-${data.stats.longestCycle}d` },
    ];

    let cx = margin + 10;
    cStats.forEach((s) => {
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.text);
      pdf.text(s.value, cx, yPos + 20);
      pdf.setFontSize(7);
      pdf.setTextColor(...colors.textMuted);
      pdf.text(s.label, cx, yPos + 25);
      cx += (contentWidth - 20) / 4;
    });
    yPos += 40;
  }

  // ===== SYMPTOM FREQUENCY =====
  if (data.topSymptoms.length > 0) {
    const height = 20 + data.topSymptoms.length * 10;
    checkNewPage(height);

    drawRoundedRect(pdf, margin, yPos, contentWidth, height, 5, colors.cardBg, colors.border);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Symptom Frequency', margin + 10, yPos + 10);

    const maxVal = data.topSymptoms[0][1];
    data.topSymptoms.forEach((s, i) => {
      const by = yPos + 18 + i * 10;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.text);
      pdf.text(s[0].replace(/_/g, ' '), margin + 10, by + 4);

      const barW = contentWidth - 80;
      drawProgressBar(pdf, margin + 60, by, barW, 4, s[1] / maxVal, [240, 240, 245], colors.coral);
      pdf.setTextColor(...colors.textMuted);
      pdf.text(`${s[1]}d`, margin + 65 + barW, by + 4);
    });
    yPos += height + 10;
  }

  // ===== MOOD PATTERNS =====
  if (data.topMoods.length > 0) {
    const height = 20 + data.topMoods.length * 10;
    checkNewPage(height);

    drawRoundedRect(pdf, margin, yPos, contentWidth, height, 5, colors.cardBg, colors.border);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Mood Patterns', margin + 10, yPos + 10);

    const maxVal = data.topMoods[0][1];
    data.topMoods.forEach((m, i) => {
      const by = yPos + 18 + i * 10;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.text);
      pdf.text(m[0], margin + 10, by + 4);

      const barW = contentWidth - 80;
      drawProgressBar(pdf, margin + 60, by, barW, 4, m[1] / maxVal, [240, 240, 245], colors.sage);
      pdf.setTextColor(...colors.textMuted);
      pdf.text(`${m[1]}d`, margin + 65 + barW, by + 4);
    });
    yPos += height + 10;
  }

  // ===== DAILY ACTIVITY TABLE =====
  if (data.dailyChart.length > 0) {
    checkNewPage(30);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Daily Activity Log', margin, yPos + 5);
    yPos += 10;

    drawRoundedRect(pdf, margin, yPos, contentWidth, 8, 2, colors.lavenderLight);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Day', margin + 5, yPos + 5);
    pdf.text('Symptoms', margin + 25, yPos + 5);
    pdf.text('Moods', margin + 55, yPos + 5);
    yPos += 10;

    pdf.setFont('helvetica', 'normal');
    data.dailyChart.forEach((d, i) => {
      checkNewPage(8);
      if (i % 2 === 1) {
        pdf.setFillColor(250, 250, 252);
        pdf.rect(margin, yPos - 2, contentWidth, 8, 'F');
      }
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.text);
      pdf.text(d.date, margin + 5, yPos + 3);
      pdf.text(`${d.symptoms}`, margin + 25, yPos + 3);
      pdf.text(`${d.moods}`, margin + 55, yPos + 3);
      yPos += 8;
    });
    yPos += 10;
  }

  // ===== AI INSIGHTS =====
  if (data.aiInsights) {
    checkNewPage(40);
    drawRoundedRect(pdf, margin, yPos, contentWidth, 15, 5, colors.lavenderLight, colors.border);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primary);
    pdf.text('🧠 AI Health Insights', margin + 10, yPos + 10);
    yPos += 20;

    if (data.aiInsights.wellnessScore) {
      checkNewPage(20);
      drawRoundedRect(pdf, margin, yPos, 40, 20, 5, colors.primaryLight);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.white);
      pdf.text(`${data.aiInsights.wellnessScore}`, margin + 12, yPos + 13);
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.text);
      pdf.text('Wellness Score', margin + 45, yPos + 13);
      yPos += 25;
    }

    if (data.aiInsights.summary) {
      checkNewPage(20);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.text);
      const lines = pdf.splitTextToSize(data.aiInsights.summary, contentWidth - 20);
      pdf.text(lines, margin + 10, yPos);
      yPos += lines.length * 4 + 8;
    }

    if (data.aiInsights.highlights?.length > 0) {
      checkNewPage(15);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.text);
      pdf.text('Highlights', margin + 10, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      data.aiInsights.highlights.forEach((h: string) => {
        checkNewPage(10);
        const lines = pdf.splitTextToSize(`• ${h}`, contentWidth - 20);
        pdf.text(lines, margin + 10, yPos);
        yPos += lines.length * 4 + 3;
      });
      yPos += 5;
    }

    if (data.aiInsights.recommendations?.length > 0) {
      checkNewPage(15);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.text);
      pdf.text('Recommendations', margin + 10, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      data.aiInsights.recommendations.forEach((r: string) => {
        checkNewPage(10);
        const lines = pdf.splitTextToSize(`✓ ${r}`, contentWidth - 20);
        pdf.setTextColor(...colors.sage);
        pdf.text(lines, margin + 10, yPos);
        pdf.setTextColor(...colors.text);
        yPos += lines.length * 4 + 3;
      });
    }
  }

  addPageFooter(pdf, pageWidth, pageHeight, margin);
  pdf.save(`Monthly_Report_${data.monthLabel.replace(' ', '_')}.pdf`);
}
