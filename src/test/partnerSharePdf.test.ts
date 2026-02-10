import { describe, it, expect, vi } from 'vitest';
import { generatePartnerSharePdf, PdfData } from '../utils/partnerSharePdf';
import { CyclePhase } from '../types/settings';

// Mock jsPDF
const mockJsPDF = {
  internal: {
    pageSize: {
      getWidth: () => 210,
      getHeight: () => 297,
    },
  },
  setFillColor: vi.fn(),
  roundedRect: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  rect: vi.fn(),
  circle: vi.fn(),
  addImage: vi.fn(),
  setTextColor: vi.fn(),
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  text: vi.fn(),
  addPage: vi.fn(),
  line: vi.fn(),
  save: vi.fn(),
};

vi.mock('jspdf', () => {
  return {
    default: vi.fn(() => mockJsPDF),
  };
});

describe('generatePartnerSharePdf', () => {
  it('should generate PDF with daily logs table', async () => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    const mockData: PdfData = {
      predictions: null,
      stats: null,
      currentPhase: 'follicular' as CyclePhase,
      daysUntilNextPeriod: 10,
      currentCycleDay: 5,
      logs: [
        {
          date: today.toISOString(),
          moods: ['happy'],
          symptoms: ['headache'],
          sleepHours: 7.5,
          waterIntake: 5,
          exerciseMinutes: 30,
          isPeriod: false,
        },
        {
          date: yesterday.toISOString(),
          moods: ['energetic'],
          symptoms: [],
          sleepHours: 8,
          waterIntake: 6,
          exerciseMinutes: 0,
          isPeriod: false,
        }
      ],
      shareSettings: {
        showPeriodDates: true,
        showFertileWindow: true,
        showMoodTips: true,
        showCurrentPhase: true,
        showMoodInsights: true,
        showSymptomInsights: true,
      },
    };

    await generatePartnerSharePdf(mockData);

    // Verify header was drawn
    expect(mockJsPDF.text).toHaveBeenCalledWith('Date', expect.any(Number), expect.any(Number));
    expect(mockJsPDF.text).toHaveBeenCalledWith('Sleep', expect.any(Number), expect.any(Number));

    // Verify row data was drawn
    expect(mockJsPDF.text).toHaveBeenCalledWith('7.5h', expect.any(Number), expect.any(Number));
    expect(mockJsPDF.text).toHaveBeenCalledWith('30m', expect.any(Number), expect.any(Number));

    expect(mockJsPDF.save).toHaveBeenCalled();
  });
});
