import jsPDF from 'jspdf';
import { CyclePhase } from '@/types/settings';
import { moodLabels, symptomLabels } from '@/data/phaseData';

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
