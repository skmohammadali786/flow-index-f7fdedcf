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

// Mock useFertilityTracker
vi.mock('@/hooks/useFertilityTracker', () => ({
  useFertilityTracker: () => ({
    fertilityLogs: [],
    pregnancyLogs: [],
    birthRecords: [],
    pregnancies: [],
    postpartumLogs: [],
    isLoaded: true
  })
}));

// Mock useSupabaseSettings
vi.mock('@/hooks/useSupabaseSettings', () => ({
  useSupabaseSettings: () => ({
    profile: { name: 'Test User', avatarUrl: null },
    settings: {
      showFertileWindow: true,
      showOvulation: true,
      showPeriodPredictions: true,
      cycleLength: 28,
      periodLength: 5,
    },
    isLoaded: true,
    updateSettings: vi.fn(),
    updateNotifications: vi.fn(),
    updateProfile: vi.fn(),
    resetSettings: vi.fn(),
    exportDataPdf: vi.fn(),
  })
}));

// Mock useClinicalAssessments
vi.mock('@/hooks/useClinicalAssessments', () => ({
  useClinicalAssessments: () => ({
    historicalAssessments: [],
    saveAssessment: vi.fn(),
    getAssessment: vi.fn(),
  })
}));

// Mock useWorkoutTracker
vi.mock('@/hooks/useWorkoutTracker', () => ({
  useWorkoutTracker: () => ({
    workoutLogs: [],
    addWorkoutLog: vi.fn(),
    updateWorkoutLog: vi.fn(),
    deleteWorkoutLog: vi.fn(),
  })
}));

// Mock useReportDraft
vi.mock('@/contexts/ReportDraftContext', () => ({
  useReportDraft: () => ({
    fertilityDrafts: {},
    pregnancyDrafts: {},
    birthDraft: {},
    postpartumDrafts: {},
    updateFertilityDraft: vi.fn(),
    updatePregnancyDraft: vi.fn(),
    updateBirthDraft: vi.fn(),
    updatePostpartumDraft: vi.fn(),
    saveFertilityDraft: vi.fn(),
    savePregnancyDraft: vi.fn(),
    saveBirthDraft: vi.fn(),
    savePostpartumDraft: vi.fn(),
    clearDrafts: vi.fn()
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
