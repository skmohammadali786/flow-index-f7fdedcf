import { useCycle } from '@/contexts/CycleContext';

export function useSupabasePeriodTracker() {
  return useCycle();
}
