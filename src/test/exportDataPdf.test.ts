import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateExportDataPdf } from '../utils/exportDataPdf';
import { DEFAULT_PROFILE, DEFAULT_SETTINGS } from '../types/settings';

// Mock jsPDF
const mockJsPDF = {
  internal: {
    pageSize: {
      getWidth: () => 210,
      getHeight: () => 297,
    },
  },
  text: vi.fn(),
  rect: vi.fn(),
  roundedRect: vi.fn(),
  circle: vi.fn(),
  line: vi.fn(),
  setFillColor: vi.fn(),
  setDrawColor: vi.fn(),
  setFont: vi.fn(),
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  setLineWidth: vi.fn(),
  addPage: vi.fn(),
  addImage: vi.fn(),
  save: vi.fn(),
  getTextWidth: vi.fn(() => 10),
};

vi.mock('jspdf', () => ({
  default: vi.fn(() => mockJsPDF),
}));

describe('generateExportDataPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate PDF with valid data', async () => {
    const data = {
      profile: { ...DEFAULT_PROFILE, name: 'Test User' },
      settings: DEFAULT_SETTINGS,
      logs: [
        {
          id: '1',
          user_id: 'user1',
          date: '2024-01-01',
          is_period: true,
          flow_intensity: 'medium',
          moods: ['happy'],
          symptoms: ['cramps'],
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      cycles: [
        {
          id: '1',
          user_id: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-01-05',
          length: 5,
        },
      ],
      assessments: [
        {
          id: '1',
          user_id: 'user1',
          date: '2024-01-01',
          pain_vas: 5,
          fatigue_vas: 3,
          mood_vas: 2,
          bloating_vas: 1,
        },
      ],
      userName: 'Test User',
    };

    await generateExportDataPdf(data);

    expect(mockJsPDF.save).toHaveBeenCalled();
    expect(mockJsPDF.text).toHaveBeenCalledWith(
      expect.stringContaining('Complete Data Export'),
      expect.any(Number),
      expect.any(Number)
    );
  });
});
