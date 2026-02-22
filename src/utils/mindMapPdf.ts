import jsPDF from 'jspdf';
import { format } from 'date-fns';
import {
  colors,
  drawRoundedRect,
  drawProgressBar,
  addPageFooter,
} from './pdfUtils';

interface MindMapAnalysis {
  overallScore: number;
  scoreLabel: string;
  summary: string;
  cycleHealth: { score: number; status: string; insight: string };
  mentalHealth: { score: number; status: string; insight: string };
  physicalHealth: { score: number; status: string; insight: string };
  sleepHealth: { score: number; status: string; insight: string };
  predictions: Array<{ title: string; description: string; confidence: string; timeframe: string }>;
  doList: Array<{ title: string; description: string; priority: string; category: string }>;
  dontList: Array<{ title: string; reason: string; severity: string }>;
  weeklyPlan: Array<{ day: string; focus: string; tip: string }>;
  phaseAdvice: {
    currentPhase: string;
    daysRemaining: string;
    nutrition: string[];
    exercise: string[];
    selfCare: string[];
  };
}

export async function generateMindMapPdf(analysis: MindMapAnalysis, userName?: string): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;
  let pageNum = 1;

  const checkPage = (needed: number) => {
    if (yPos + needed > pageHeight - 20) {
      addPageFooter(pdf, pageWidth, pageHeight, margin);
      pdf.addPage();
      pageNum++;
      yPos = margin;
    }
  };

  // ===== HEADER =====
  drawRoundedRect(pdf, margin, yPos, contentWidth, 32, 4, colors.coralLight);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(colors.coral[0], colors.coral[1], colors.coral[2]);
  pdf.text('AI Mind Map Report', margin + 8, yPos + 13);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(120, 120, 120);
  pdf.text(userName || 'Health Report', margin + 8, yPos + 21);
  pdf.text(format(new Date(), 'MMMM d, yyyy'), pageWidth - margin - 8, yPos + 13, { align: 'right' });
  pdf.text('Mind Map Report', pageWidth - margin - 8, yPos + 21, { align: 'right' });
  yPos += 38;

  // ===== OVERALL SCORE =====
  checkPage(45);
  drawRoundedRect(pdf, margin, yPos, contentWidth, 40, 4, colors.sageLight);
  
  const cx = margin + 22;
  const cy = yPos + 20;
  pdf.setDrawColor(colors.sage[0], colors.sage[1], colors.sage[2]);
  pdf.setLineWidth(1.5);
  pdf.circle(cx, cy, 14, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(colors.sage[0], colors.sage[1], colors.sage[2]);
  pdf.text(`${analysis.overallScore}`, cx, cy + 2, { align: 'center' });
  pdf.setFontSize(7);
  pdf.text(analysis.scoreLabel, cx, cy + 8, { align: 'center' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(50, 50, 50);
  pdf.text('Overall Wellness Score', margin + 42, yPos + 12);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  const summaryLines = pdf.splitTextToSize(analysis.summary, contentWidth - 50);
  pdf.text(summaryLines, margin + 42, yPos + 19);
  yPos += 46;

  // ===== HEALTH SCORES =====
  checkPage(55);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(50, 50, 50);
  pdf.text('Health Breakdown', margin, yPos + 5);
  yPos += 10;

  const healthItems = [
    { label: 'Cycle Health', data: analysis.cycleHealth, color: colors.coral },
    { label: 'Mental Health', data: analysis.mentalHealth, color: colors.lavender },
    { label: 'Physical Health', data: analysis.physicalHealth, color: colors.sage },
    { label: 'Sleep Health', data: analysis.sleepHealth, color: colors.peach },
  ];

  const colWidth = (contentWidth - 6) / 2;
  healthItems.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    if (col === 0 && row > 0) yPos += 24;
    const x = margin + col * (colWidth + 6);
    const y = yPos;

    const lightColor: [number, number, number] = [
      Math.min(255, item.color[0] + 80),
      Math.min(255, item.color[1] + 80),
      Math.min(255, item.color[2] + 80),
    ];
    drawRoundedRect(pdf, x, y, colWidth, 22, 3, lightColor);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(item.color[0], item.color[1], item.color[2]);
    pdf.text(item.label, x + 4, y + 7);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(`${item.data.score}`, x + colWidth - 6, y + 9, { align: 'right' });

    const bgColor: [number, number, number] = [230, 230, 235];
    drawProgressBar(pdf, x + 4, y + 11, colWidth - 8, 2.5, item.data.score / 100, bgColor, item.color);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 100, 100);
    const insightLine = pdf.splitTextToSize(item.data.insight, colWidth - 8);
    pdf.text(insightLine[0] || '', x + 4, y + 19);
  });
  yPos += 28;

  // ===== PREDICTIONS =====
  checkPage(15);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(50, 50, 50);
  pdf.text('Predictions & Insights', margin, yPos + 5);
  yPos += 10;

  analysis.predictions.forEach((pred) => {
    checkPage(18);
    drawRoundedRect(pdf, margin, yPos, contentWidth, 15, 3, colors.lavenderLight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(colors.lavender[0], colors.lavender[1], colors.lavender[2]);
    pdf.text(pred.title, margin + 4, yPos + 6);
    
    pdf.setFontSize(6);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`${pred.confidence} confidence • ${pred.timeframe}`, pageWidth - margin - 4, yPos + 6, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(80, 80, 80);
    const predLine = pdf.splitTextToSize(pred.description, contentWidth - 8);
    pdf.text(predLine[0] || '', margin + 4, yPos + 12);
    yPos += 18;
  });

  // ===== DO LIST =====
  checkPage(15);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(colors.sage[0], colors.sage[1], colors.sage[2]);
  pdf.text('What to Do', margin, yPos + 5);
  yPos += 10;

  analysis.doList.forEach((item) => {
    checkPage(16);
    drawRoundedRect(pdf, margin, yPos, contentWidth, 14, 3, colors.sageLight);

    pdf.setFillColor(colors.sage[0], colors.sage[1], colors.sage[2]);
    pdf.circle(margin + 6, yPos + 5.5, 2.5, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(50, 50, 50);
    pdf.text(item.title, margin + 12, yPos + 6);

    pdf.setFontSize(6);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`${item.priority} • ${item.category}`, pageWidth - margin - 4, yPos + 6, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(80, 80, 80);
    const descLine = pdf.splitTextToSize(item.description, contentWidth - 18);
    pdf.text(descLine[0] || '', margin + 12, yPos + 11.5);
    yPos += 17;
  });

  // ===== DON'T LIST =====
  checkPage(15);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(colors.coral[0], colors.coral[1], colors.coral[2]);
  pdf.text('What to Avoid', margin, yPos + 5);
  yPos += 10;

  analysis.dontList.forEach((item) => {
    checkPage(16);
    drawRoundedRect(pdf, margin, yPos, contentWidth, 14, 3, colors.coralLight);

    pdf.setFillColor(colors.coral[0], colors.coral[1], colors.coral[2]);
    pdf.circle(margin + 6, yPos + 5.5, 2.5, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(50, 50, 50);
    pdf.text(item.title, margin + 12, yPos + 6);

    pdf.setFontSize(6);
    pdf.setTextColor(120, 120, 120);
    pdf.text(item.severity, pageWidth - margin - 4, yPos + 6, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(80, 80, 80);
    const reasonLine = pdf.splitTextToSize(item.reason, contentWidth - 18);
    pdf.text(reasonLine[0] || '', margin + 12, yPos + 11.5);
    yPos += 17;
  });

  // ===== WEEKLY PLAN =====
  checkPage(20);
  pdf.addPage();
  pageNum++;
  yPos = margin;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(50, 50, 50);
  pdf.text('Weekly Wellness Plan', margin, yPos + 5);
  yPos += 10;

  const dayColors = [colors.coral, colors.lavender, colors.sage, colors.peach, colors.coral, colors.lavender, colors.sage];
  analysis.weeklyPlan.forEach((day, i) => {
    checkPage(18);
    const dc = dayColors[i % dayColors.length];
    const lightDc: [number, number, number] = [
      Math.min(255, dc[0] + 80),
      Math.min(255, dc[1] + 80),
      Math.min(255, dc[2] + 80),
    ];
    drawRoundedRect(pdf, margin, yPos, contentWidth, 15, 3, lightDc);

    // Day badge
    drawRoundedRect(pdf, margin + 3, yPos + 3, 18, 9, 2, dc);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text(day.day.slice(0, 3), margin + 12, yPos + 9, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(50, 50, 50);
    pdf.text(day.focus, margin + 25, yPos + 7);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 100, 100);
    const tipLine = pdf.splitTextToSize(day.tip, contentWidth - 30);
    pdf.text(tipLine[0] || '', margin + 25, yPos + 12);
    yPos += 18;
  });

  // ===== PHASE ADVICE =====
  checkPage(50);
  yPos += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(50, 50, 50);
  pdf.text(`Phase Advice: ${analysis.phaseAdvice.currentPhase}`, margin, yPos + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text(analysis.phaseAdvice.daysRemaining, margin + pdf.getTextWidth(`Phase Advice: ${analysis.phaseAdvice.currentPhase}`) + 4, yPos + 5);
  yPos += 12;

  const adviceSections = [
    { label: 'Nutrition', items: analysis.phaseAdvice.nutrition, color: colors.sage },
    { label: 'Exercise', items: analysis.phaseAdvice.exercise, color: colors.coral },
    { label: 'Self Care', items: analysis.phaseAdvice.selfCare, color: colors.lavender },
  ];

  adviceSections.forEach((section) => {
    checkPage(10 + section.items.length * 6);
    const lightSec: [number, number, number] = [
      Math.min(255, section.color[0] + 80),
      Math.min(255, section.color[1] + 80),
      Math.min(255, section.color[2] + 80),
    ];
    drawRoundedRect(pdf, margin, yPos, contentWidth, 7 + section.items.length * 6, 3, lightSec);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(section.color[0], section.color[1], section.color[2]);
    pdf.text(section.label, margin + 4, yPos + 6);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(80, 80, 80);
    section.items.forEach((item, i) => {
      pdf.text(`• ${item}`, margin + 8, yPos + 12 + i * 6);
    });
    yPos += 10 + section.items.length * 6 + 3;
  });

  addPageFooter(pdf, pageWidth, pageHeight, margin);
  pdf.save(`mind-map-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
