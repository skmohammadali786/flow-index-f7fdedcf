import { describe, it, expect, vi } from 'vitest';
import { generateHealthReportPdf, HealthReportOptions } from '../utils/healthReportPdf';
import { DayLog } from '../types/period';

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
  splitTextToSize: vi.fn((text) => [text]),
};

vi.mock('jspdf', () => {
  return {
    default: vi.fn(() => mockJsPDF),
  };
});

describe('generateHealthReportPdf', () => {
  it('should generate health report PDF', async () => {
    const today = new Date();
    const logs: DayLog[] = [
      {
        date: today.toISOString(),
        moods: ['happy'],
        symptoms: ['headache'],
        sleepHours: 7.5,
        waterIntake: 5,
        exerciseMinutes: 30,
        isPeriod: true,
        flowIntensity: 'medium',
        notes: '',
        medications: [],
        temperature: 0
      }
    ];

    const options: HealthReportOptions = {
      period: '3',
      includeCycles: true,
      includeSymptoms: true,
      includeMoods: true,
      includeMedications: true,
      includeSleep: true,
      includeWater: true,
      includeBirthHistory: true,
    };

    await generateHealthReportPdf({
      logs,
      cycles: [],
      stats: null,
      options,
      userName: 'Test User'
    });

    expect(mockJsPDF.text).toHaveBeenCalledWith('Flow Index', expect.any(Number), expect.any(Number));
    expect(mockJsPDF.text).toHaveBeenCalledWith('Health Report', expect.any(Number), expect.any(Number));
    expect(mockJsPDF.text).toHaveBeenCalledWith(expect.stringContaining('Prepared for Test User'), expect.any(Number), expect.any(Number));

    // Check for log details - details string construction might be tricky to match exact string due to joins
    // We check if splitTextToSize was called with something containing 'Period (medium)'
    expect(mockJsPDF.splitTextToSize).toHaveBeenCalledWith(expect.stringContaining('Period (medium)'), expect.any(Number));

    expect(mockJsPDF.save).toHaveBeenCalledWith(expect.stringContaining('health-report-'));
  });
});
