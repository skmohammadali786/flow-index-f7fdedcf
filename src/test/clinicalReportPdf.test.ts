import { describe, it, expect, vi } from 'vitest';
import { generateClinicalReportPdf, ClinicalReportData } from '../utils/clinicalReportPdf';

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

describe('generateClinicalReportPdf', () => {
  it('should generate clinical report PDF', async () => {
    const today = new Date();
    const mockData: ClinicalReportData = {
      logs: [
        {
          date: today.toISOString(),
          moods: ['anxious'],
          symptoms: ['cramps'],
          isPeriod: true,
          flowIntensity: 'heavy',
          mood_rating: 0,
          energy_level: 0,
          sleepHours: 0,
          waterIntake: 0,
          exerciseMinutes: 0,
          tags: [],
          self_care_done: false,
          gratitude: '',
          notes: '',
          medications: [],
          temperature: 0
        }
      ],
      cycles: [],
      stats: null,
      assessment: {
        painVas: 7,
        fatigueVas: 5,
        moodVas: 4,
        bloatingVas: 3,
        additionalNotes: 'Some notes',
      },
      userName: 'Test Patient'
    };

    await generateClinicalReportPdf(mockData);

    expect(mockJsPDF.text).toHaveBeenCalledWith('Flow Index', expect.any(Number), expect.any(Number));
    expect(mockJsPDF.text).toHaveBeenCalledWith('Clinical Report', expect.any(Number), expect.any(Number));
    expect(mockJsPDF.text).toHaveBeenCalledWith(expect.stringContaining('Patient: Test Patient'), expect.any(Number), expect.any(Number));

    // Check for VAS scores
    expect(mockJsPDF.text).toHaveBeenCalledWith(expect.stringContaining('Pain Intensity (7/10)'), expect.any(Number), expect.any(Number));

    // Check for notes
    expect(mockJsPDF.text).toHaveBeenCalledWith('Patient Notes', expect.any(Number), expect.any(Number));

    expect(mockJsPDF.save).toHaveBeenCalledWith(expect.stringContaining('clinical-report-'));
  });
});
