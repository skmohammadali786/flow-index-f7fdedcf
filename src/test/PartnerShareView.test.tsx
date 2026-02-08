import { render, screen } from "@testing-library/react";
import { describe, it, vi, expect } from "vitest";
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
    save: vi.fn()
  }))
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
