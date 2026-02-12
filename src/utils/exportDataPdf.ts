import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';
import { UserProfile, UserSettings } from '@/types/settings';
import {
  colors,
  drawRoundedRect,
  addPageFooter,
  drawDecoCircle
} from './pdfUtils';

// Define Raw DB Interfaces based on Supabase tables
export interface DBPeriodLog {
  id: string;
  user_id: string;
  date: string;
  is_period: boolean;
  flow_intensity?: string;
  moods?: string[];
  symptoms?: string[];
  notes?: string;
  water_intake?: number;
  sleep_hours?: number;
  sleep_quality?: string;
  exercise_minutes?: number;
  temperature?: number;
  medications?: any[];
  created_at?: string;
}

export interface DBCycle {
  id: string;
  user_id: string;
  start_date: string;
  end_date?: string;
  length?: number;
  created_at?: string;
}

export interface DBClinicalAssessment {
  id: string;
  user_id: string;
  date: string;
  pain_vas: number;
  fatigue_vas: number;
  mood_vas: number;
  bloating_vas: number;
  additional_notes?: string;
  created_at?: string;
}

interface ExportDataPdfProps {
  profile: UserProfile;
  settings: UserSettings;
  logs: DBPeriodLog[];
  cycles: DBCycle[];
  assessments: DBClinicalAssessment[];
  userName?: string;
}

export async function generateExportDataPdf(data: ExportDataPdfProps, logoBase64?: string): Promise<void> {
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

  const userName = data.userName || data.profile.name || 'User';

  // Helper to add new page if needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin - 20) {
      addPageFooter(pdf, pageWidth, pageHeight, margin);
      pdf.addPage();
      yPos = margin + 5;

      // Decorative elements on new page
      drawDecoCircle(pdf, pageWidth - 20, 20, 15, colors.lavender, 0.15);
      drawDecoCircle(pdf, 25, pageHeight - 25, 10, colors.coral, 0.1);

      pdf.setFontSize(8);
      pdf.setTextColor(...colors.textMuted);
      pdf.text('Flow Index - Data Export', pageWidth / 2, 10, { align: 'center' });
      return true;
    }
    return false;
  };

  // ===== PAGE BACKGROUND DECORATION =====
  drawDecoCircle(pdf, pageWidth + 10, -10, 40, colors.lavender, 0.1);
  drawDecoCircle(pdf, -15, pageHeight / 2, 30, colors.coral, 0.08);
  drawDecoCircle(pdf, pageWidth - 10, pageHeight - 20, 25, colors.sage, 0.1);

  // ===== HEADER =====
  const headerHeight = 35;
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

  pdf.setTextColor(...colors.white);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Flow Index', margin + logoXOffset, yPos + 10);

  pdf.setFontSize(20);
  pdf.text('Complete Data Export', margin + logoXOffset, yPos + 20);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Personal Data Record for ${userName}`, margin + logoXOffset, yPos + 28);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(format(new Date(), 'MMMM d, yyyy'), pageWidth - margin - 8, yPos + 12, { align: 'right' });

  yPos += headerHeight + 10;

  // ===== PROFILE & SETTINGS =====
  checkNewPage(60);

  drawRoundedRect(pdf, margin, yPos, contentWidth, 45, 5, colors.cardBg, colors.border);

  pdf.setTextColor(...colors.text);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Profile & Settings', margin + 8, yPos + 10);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');

  // Left Column
  let currentY = yPos + 20;
  pdf.text(`Name: ${data.profile.name || '-'}`, margin + 8, currentY); currentY += 6;
  pdf.text(`Joined: ${data.profile.createdAt ? format(parseISO(data.profile.createdAt), 'PP') : '-'}`, margin + 8, currentY); currentY += 6;
  pdf.text(`Goal: ${data.settings.trackingGoal.replace('_', ' ')}`, margin + 8, currentY);

  // Right Column
  currentY = yPos + 20;
  const col2X = margin + contentWidth / 2;
  pdf.text(`Avg Cycle Length: ${data.settings.cycleLength} days`, col2X, currentY); currentY += 6;
  pdf.text(`Avg Period Length: ${data.settings.periodLength} days`, col2X, currentY); currentY += 6;
  pdf.text(`Luteal Phase: ${data.settings.lutealPhaseLength} days`, col2X, currentY);

  yPos += 55;

  // ===== CYCLE HISTORY =====
  if (data.cycles.length > 0) {
    checkNewPage(40);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Cycle History', margin, yPos);
    yPos += 8;

    // Table Header
    const cycleCols = [
      { header: 'Start Date', width: 40 },
      { header: 'End Date', width: 40 },
      { header: 'Length', width: 30 },
    ];

    drawRoundedRect(pdf, margin, yPos, contentWidth, 8, 2, colors.lavenderLight);
    let x = margin + 5;
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.text);
    cycleCols.forEach(col => {
      pdf.text(col.header, x, yPos + 5);
      x += col.width + 10;
    });
    yPos += 10;

    // Table Rows
    pdf.setFont('helvetica', 'normal');
    data.cycles.forEach((cycle, i) => {
      checkNewPage(10);

      if (i % 2 === 1) {
        pdf.setFillColor(250, 250, 252);
        pdf.rect(margin, yPos - 2, contentWidth, 8, 'F');
      }

      x = margin + 5;
      pdf.text(cycle.start_date, x, yPos + 3); x += cycleCols[0].width + 10;
      pdf.text(cycle.end_date || 'Current', x, yPos + 3); x += cycleCols[1].width + 10;
      pdf.text(cycle.length ? `${cycle.length} days` : '-', x, yPos + 3);

      yPos += 8;
    });
    yPos += 10;
  }

  // ===== CLINICAL ASSESSMENTS =====
  if (data.assessments.length > 0) {
    checkNewPage(40);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Clinical Assessments', margin, yPos);
    yPos += 8;

    // Table Header
    const assessCols = [
      { header: 'Date', width: 30 },
      { header: 'Pain', width: 15 },
      { header: 'Fatigue', width: 15 },
      { header: 'Mood', width: 15 },
      { header: 'Bloating', width: 15 },
      { header: 'Notes', width: 60 },
    ];

    drawRoundedRect(pdf, margin, yPos, contentWidth, 8, 2, colors.sageLight);
    let x = margin + 5;
    pdf.setFontSize(9);
    assessCols.forEach(col => {
      pdf.text(col.header, x, yPos + 5);
      x += col.width + 5;
    });
    yPos += 10;

    // Table Rows
    pdf.setFont('helvetica', 'normal');
    data.assessments.forEach((assess, i) => {
      checkNewPage(12);

      if (i % 2 === 1) {
        pdf.setFillColor(250, 250, 252);
        pdf.rect(margin, yPos - 2, contentWidth, 10, 'F');
      }

      x = margin + 5;
      pdf.text(assess.date, x, yPos + 3); x += assessCols[0].width + 5;
      pdf.text(assess.pain_vas.toString(), x + 2, yPos + 3); x += assessCols[1].width + 5;
      pdf.text(assess.fatigue_vas.toString(), x + 2, yPos + 3); x += assessCols[2].width + 5;
      pdf.text(assess.mood_vas.toString(), x + 2, yPos + 3); x += assessCols[3].width + 5;
      pdf.text(assess.bloating_vas.toString(), x + 2, yPos + 3); x += assessCols[4].width + 5;

      const notes = assess.additional_notes || '-';
      const truncatedNotes = notes.length > 40 ? notes.substring(0, 37) + '...' : notes;
      pdf.text(truncatedNotes, x, yPos + 3);

      yPos += 10;
    });
    yPos += 10;
  }

  // ===== PERIOD LOGS =====
  if (data.logs.length > 0) {
    checkNewPage(40);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Daily Logs History', margin, yPos);
    yPos += 8;

    // Table Header
    const logCols = [
      { header: 'Date', width: 25 },
      { header: 'Flow', width: 15 },
      { header: 'Moods', width: 45 },
      { header: 'Symptoms', width: 45 },
      { header: 'Other', width: 30 },
    ];

    drawRoundedRect(pdf, margin, yPos, contentWidth, 8, 2, colors.coralLight);
    let x = margin + 5;
    pdf.setFontSize(9);
    logCols.forEach(col => {
      pdf.text(col.header, x, yPos + 5);
      x += col.width + 5;
    });
    yPos += 10;

    // Table Rows
    pdf.setFont('helvetica', 'normal');
    data.logs.forEach((log, i) => {
      checkNewPage(15); // Require slightly more space for potentially multi-line

      if (i % 2 === 1) {
        pdf.setFillColor(250, 250, 252);
        pdf.rect(margin, yPos - 2, contentWidth, 12, 'F');
      }

      x = margin + 5;
      pdf.text(log.date, x, yPos + 3); x += logCols[0].width + 5;

      // Flow
      const flow = log.is_period ? (log.flow_intensity || 'Yes') : '-';
      pdf.text(flow, x, yPos + 3); x += logCols[1].width + 5;

      // Moods
      const moods = (log.moods || []).join(', ').substring(0, 30);
      pdf.text(moods || '-', x, yPos + 3); x += logCols[2].width + 5;

      // Symptoms
      const symptoms = (log.symptoms || []).join(', ').substring(0, 30);
      pdf.text(symptoms || '-', x, yPos + 3); x += logCols[3].width + 5;

      // Other info
      let other = [];
      if (log.sleep_hours) other.push(`Sleep: ${log.sleep_hours}h`);
      if (log.water_intake) other.push(`Water: ${log.water_intake}`);
      if (log.exercise_minutes) other.push(`Ex: ${log.exercise_minutes}m`);
      pdf.text(other.join(', ').substring(0, 20) || '-', x, yPos + 3);

      yPos += 12;
    });
  }

  // Footer on last page
  addPageFooter(pdf, pageWidth, pageHeight, margin);

  // Save the PDF
  pdf.save(`flow-index-data-export-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
