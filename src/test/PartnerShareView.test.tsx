import { render, screen } from "@testing-library/react";
import { describe, it, vi, expect, beforeEach } from "vitest";
import { PartnerShareView } from "@/components/period/PartnerShareView";

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({
    toDataURL: () => 'data:image/png;base64,mock',
    width: 100,
    height: 100
  }))
}));

// Mock jsPDF
vi.mock('jspdf', () => ({
  default: vi.fn(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297
      }
    },
    getImageProperties: () => ({ width: 100, height: 100 }),
    addImage: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
    setFillColor: vi.fn(),
    setTextColor: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    text: vi.fn(),
    rect: vi.fn(),
    roundedRect: vi.fn(),
    circle: vi.fn(),
    line: vi.fn(),
  }))
}));

// Mock the partner share PDF generator
vi.mock('@/utils/partnerSharePdf', () => ({
  generatePartnerSharePdf: vi.fn(() => Promise.resolve())
}));

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { 
      email: 'test@example.com',
      user_metadata: { name: 'Test User' }
    },
    session: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })
}));

// Mock useWellnessJournal
vi.mock('@/hooks/useWellnessJournal', () => ({
  useWellnessJournal: () => ({
    entries: [],
    addEntry: vi.fn(),
    updateEntry: vi.fn(),
    deleteEntry: vi.fn(),
    isLoading: false
  })
}));

// Mock ResizeObserver which is used by some UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("PartnerShareView", () => {
  it("renders without crashing", () => {
    render(
      <PartnerShareView
        predictions={null}
        stats={null}
        currentPhase="menstrual"
        daysUntilNextPeriod={null}
        currentCycleDay={1}
        logs={[]}
      />
    );
    expect(screen.getByText("Partner Sharing")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });
});
