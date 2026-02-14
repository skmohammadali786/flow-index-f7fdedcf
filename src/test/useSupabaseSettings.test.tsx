import { renderHook, waitFor } from '@testing-library/react';
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to create mock functions that can be used in vi.mock
const { mockFrom, mockSelect, mockEq, mockMaybeSingle, mockUser } = vi.hoisted(() => {
  return {
    mockFrom: vi.fn(),
    mockSelect: vi.fn(),
    mockEq: vi.fn(),
    mockMaybeSingle: vi.fn(),
    mockUser: { id: 'test-user-id' }
  };
});

// Mock useAuth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
  },
}));

// Helper to delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('useSupabaseSettings Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup the mock chain
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
  });

  it('fetches profile and settings in parallel', async () => {
    // Setup the mock to delay
    mockMaybeSingle.mockImplementation(async () => {
      await delay(100); // Simulate 100ms network latency per request
      return { data: {}, error: null };
    });

    const startTime = performance.now();

    const { result } = renderHook(() => useSupabaseSettings());

    // Wait for isLoaded to be true
    await waitFor(() => expect(result.current.isLoaded).toBe(true), { timeout: 2000 });

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Execution time: ${duration.toFixed(2)}ms`);

    // In parallel execution: max(100ms, 100ms) + overhead ~= 100ms+
    // We expect it to be significantly less than the sequential baseline (which was > 180ms)
    // Using 160ms as a threshold (allowing for overhead)
    expect(duration).toBeLessThan(160);
  });
});
