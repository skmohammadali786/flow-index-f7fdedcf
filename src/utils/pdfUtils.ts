import jsPDF from 'jspdf';
import { CyclePhase } from '@/types/settings';
import { moodLabels, symptomLabels } from '@/data/phaseData';
import { format, subDays, parseISO } from 'date-fns';
import { DayLog } from '@/types/period';
import type { FertilityLog } from '@/hooks/useFertilityTracker';

// Re-export labels
export { moodLabels, symptomLabels };

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

export const phaseStyles: Record<CyclePhase, {
  color: [number, number, number];
  lightColor: [number, number, number];
  label: string;
}> = {
  menstrual: { color: colors.coral, lightColor: colors.coralLight, label: 'M' },
  follicular: { color: colors.sage, lightColor: colors.sageLight, label: 'F' },
  ovulation: { color: colors.lavender, lightColor: colors.lavenderLight, label: 'O' },
  luteal: { color: colors.peach, lightColor: colors.peachLight, label: 'L' },
};

export function drawRoundedRect(
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

export function drawGradientHeader(
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

export function drawProgressBar(
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

export function drawDecoCircle(pdf: jsPDF, x: number, y: number, radius: number, color: [number, number, number], opacity: number = 0.3) {
  const r = Math.round(color[0] + (255 - color[0]) * (1 - opacity));
  const g = Math.round(color[1] + (255 - color[1]) * (1 - opacity));
  const b = Math.round(color[2] + (255 - color[2]) * (1 - opacity));
  pdf.setFillColor(r, g, b);
  pdf.circle(x, y, radius, 'F');
}

export function addPageFooter(pdfDoc: jsPDF, width: number, height: number, m: number) {
  const footerY = height - 12;
  pdfDoc.setDrawColor(...colors.border);
  pdfDoc.setLineWidth(0.3);
  pdfDoc.line(m, footerY - 3, width - m, footerY - 3);
  pdfDoc.setFontSize(7);
  pdfDoc.setTextColor(...colors.textMuted);
  pdfDoc.setFont('helvetica', 'italic');
  pdfDoc.text('Generated with love from Flow Index', width / 2, footerY, { align: 'center' });
}

export async function loadLogo(src: string): Promise<string | undefined> {
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Could not load logo:', e);
    return undefined;
  }
}

export function drawFertilityChart(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  logs: DayLog[],
  fertilityLogs: FertilityLog[],
  days: number = 30
) {
  // Chart background
  drawRoundedRect(pdf, x, y, width, height, 5, colors.cardBg, colors.border);

  const chartX = x + 12;
  const chartY = y + 10;
  const chartW = width - 20;
  const chartH = height - 20;

  // Split height into 3 sections: BBT (40%), LH (30%), CM (30%)
  const bbtH = chartH * 0.4;
  const lhH = chartH * 0.3;
  const cmH = chartH * 0.3;

  const bbtY = chartY;
  const lhY = bbtY + bbtH;
  const cmY = lhY + lhH;

  // Data preparation
  const today = new Date();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const fLog = fertilityLogs.find(l => l.date === dateStr);
    const pLog = logs.find(l => l.date === dateStr);

    const cmScore = { dry: 1, sticky: 2, creamy: 3, watery: 4, egg_white: 5 }[fLog?.cervical_mucus || ''] || 0;
    const opkScore = { negative: 0, low: 1, high: 2, peak: 3 }[fLog?.opk_result || ''] || 0;

    data.push({
      date: format(d, 'd'),
      fullDate: dateStr,
      bbt: pLog?.temperature || null,
      lh: fLog?.lh_level || null,
      cm: cmScore,
      opk: opkScore,
      intercourse: fLog?.intercourse,
    });
  }

  // Draw Grid Lines (Vertical for days)
  pdf.setDrawColor(230, 230, 240);
  pdf.setLineWidth(0.1);
  const stepX = chartW / (Math.max(days - 1, 1));

  data.forEach((d, i) => {
    const dx = chartX + i * stepX;
    if (i % 5 === 0) {
        pdf.line(dx, chartY, dx, chartY + chartH);
        pdf.setFontSize(6);
        pdf.setTextColor(...colors.textMuted);
        pdf.text(d.date, dx, chartY + chartH + 4, { align: 'center' });
    }
  });

  // 1. BBT Chart
  const validTemps = data.filter(d => d.bbt !== null).map(d => d.bbt as number);
  if (validTemps.length > 0) {
    const minTemp = Math.min(...validTemps) - 0.2;
    const maxTemp = Math.max(...validTemps) + 0.2;
    const tempRange = maxTemp - minTemp || 1;

    // Draw reference lines
    pdf.setDrawColor(200, 200, 200);
    // Max line
    pdf.line(chartX, bbtY, chartX + chartW, bbtY);
    // Min line
    pdf.line(chartX, bbtY + bbtH, chartX + chartW, bbtY + bbtH);

    pdf.setFontSize(5);
    pdf.setTextColor(...colors.textMuted);
    pdf.text(`${maxTemp.toFixed(1)}°`, chartX - 2, bbtY + 2, { align: 'right' });
    pdf.text(`${minTemp.toFixed(1)}°`, chartX - 2, bbtY + bbtH - 1, { align: 'right' });

    // Draw line
    pdf.setDrawColor(251, 146, 60); // Peach for BBT
    pdf.setLineWidth(0.5);
    let lastX: number | null = null;
    let lastY: number | null = null;

    data.forEach((d, i) => {
      if (d.bbt !== null) {
        const x = chartX + i * stepX;
        const y = bbtY + bbtH - ((d.bbt - minTemp) / tempRange) * bbtH;
        if (lastX !== null && lastY !== null) {
          pdf.line(lastX, lastY, x, y);
        }
        pdf.setFillColor(251, 146, 60);
        pdf.circle(x, y, 0.8, 'F');
        lastX = x;
        lastY = y;
      } else {
        lastX = null;
        lastY = null;
      }
    });
    pdf.text('BBT', chartX + 2, bbtY + 5);
  } else {
    pdf.setFontSize(7);
    pdf.setTextColor(...colors.textMuted);
    pdf.text('No BBT Data', chartX + chartW / 2, bbtY + bbtH / 2, { align: 'center' });
  }

  // 2. LH / OPK Chart
  // LH Line (Red), OPK Bars (Purple)
  const validLH = data.filter(d => d.lh !== null).map(d => d.lh as number);
  const maxLH = validLH.length > 0 ? Math.max(...validLH) : 50;

  // Draw OPK Bars first (background)
  data.forEach((d, i) => {
    if (d.opk > 0) {
      const x = chartX + i * stepX;
      const barH = (d.opk / 3) * lhH;
      const y = lhY + lhH - barH;
      pdf.setFillColor(167, 139, 250); // Lavender
      pdf.rect(x - 1, y, 2, barH, 'F');
    }
  });

  // Draw LH Line
  if (validLH.length > 0) {
    pdf.setDrawColor(251, 113, 133); // Coral
    pdf.setLineWidth(0.5);
    let lastX: number | null = null;
    let lastY: number | null = null;

    data.forEach((d, i) => {
      if (d.lh !== null) {
        const x = chartX + i * stepX;
        const y = lhY + lhH - ((d.lh || 0) / maxLH) * lhH;
        if (lastX !== null && lastY !== null) {
          pdf.line(lastX, lastY, x, y);
        }
        pdf.setFillColor(251, 113, 133);
        pdf.circle(x, y, 0.6, 'F');
        lastX = x;
        lastY = y;
      } else {
        lastX = null;
        lastY = null;
      }
    });
  }
  pdf.setFontSize(6);
  pdf.setTextColor(...colors.text);
  pdf.text('LH/OPK', chartX + 2, lhY + 5);


  // 3. CM Chart (Area or Bar)
  // CM 1-5
  data.forEach((d, i) => {
    if (d.cm > 0) {
        const x = chartX + i * stepX;
        const h = (d.cm / 5) * cmH;
        const y = cmY + cmH - h;
        pdf.setFillColor(74, 222, 128); // Sage
        pdf.rect(x - 1.5, y, 3, h, 'F');
    }
  });
  pdf.text('CM', chartX + 2, cmY + 5);

  // 4. Intercourse Markers (Hearts)
  data.forEach((d, i) => {
    if (d.intercourse) {
        const x = chartX + i * stepX;
        const y = chartY + chartH + 2; // Below chart
        pdf.setFillColor(251, 113, 133);
        pdf.circle(x, y, 1.2, 'F');
    }
  });
}
