import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { FertilityLog, PregnancyLog, BirthRecord, PostpartumLog } from '@/hooks/useFertilityTracker';

interface ReportDraftContextType {
  fertilityDrafts: Record<string, Partial<FertilityLog>>;
  setFertilityDraft: (date: string, draft: Partial<FertilityLog>) => void;
  pregnancyDrafts: Record<string, Partial<PregnancyLog>>;
  setPregnancyDraft: (date: string, draft: Partial<PregnancyLog>) => void;
  birthDraft: Partial<BirthRecord> | null;
  setBirthDraft: (draft: Partial<BirthRecord> | null) => void;
  postpartumDrafts: Record<string, Partial<PostpartumLog>>;
  setPostpartumDraft: (date: string, draft: Partial<PostpartumLog>) => void;
}

const ReportDraftContext = createContext<ReportDraftContextType | undefined>(undefined);

export function ReportDraftProvider({ children }: { children: ReactNode }) {
  const [fertilityDrafts, setFertilityDrafts] = useState<Record<string, Partial<FertilityLog>>>({});
  const [pregnancyDrafts, setPregnancyDrafts] = useState<Record<string, Partial<PregnancyLog>>>({});
  const [birthDraft, setBirthDraft] = useState<Partial<BirthRecord> | null>(null);
  const [postpartumDrafts, setPostpartumDrafts] = useState<Record<string, Partial<PostpartumLog>>>({});

  const setFertilityDraft = useCallback((date: string, draft: Partial<FertilityLog>) => {
    setFertilityDrafts(prev => ({ ...prev, [date]: draft }));
  }, []);

  const setPregnancyDraft = useCallback((date: string, draft: Partial<PregnancyLog>) => {
    setPregnancyDrafts(prev => ({ ...prev, [date]: draft }));
  }, []);

  const setPostpartumDraft = useCallback((date: string, draft: Partial<PostpartumLog>) => {
    setPostpartumDrafts(prev => ({ ...prev, [date]: draft }));
  }, []);

  return (
    <ReportDraftContext.Provider value={{
      fertilityDrafts,
      setFertilityDraft,
      pregnancyDrafts,
      setPregnancyDraft,
      birthDraft,
      setBirthDraft,
      postpartumDrafts,
      setPostpartumDraft
    }}>
      {children}
    </ReportDraftContext.Provider>
  );
}

export function useReportDraft() {
  const context = useContext(ReportDraftContext);
  if (context === undefined) {
    throw new Error('useReportDraft must be used within a ReportDraftProvider');
  }
  return context;
}
