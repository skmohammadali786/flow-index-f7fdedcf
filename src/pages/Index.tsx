import { useState, useEffect, lazy, Suspense } from 'react';
import { CuteLoader } from '@/components/period/CuteLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/period/Header';
import { DayDetailSheet } from '@/components/period/DayDetailSheet';
import { QuickLogButton } from '@/components/period/QuickLogButton';
import type { OnboardingData } from '@/components/period/OnboardingFlow';

const CycleCalendar = lazy(() => import('@/components/period/CycleCalendar').then(module => ({ default: module.CycleCalendar })));
const CycleInsights = lazy(() => import('@/components/period/CycleInsights').then(module => ({ default: module.CycleInsights })));
const HistoryView = lazy(() => import('@/components/period/HistoryView').then(module => ({ default: module.HistoryView })));
const SettingsView = lazy(() => import('@/components/period/SettingsView').then(module => ({ default: module.SettingsView })));
const ProfileView = lazy(() => import('@/components/period/ProfileView').then(module => ({ default: module.ProfileView })));
const HealthTipsView = lazy(() => import('@/components/period/HealthTipsView').then(module => ({ default: module.HealthTipsView })));
const SymptomAnalyticsView = lazy(() => import('@/components/period/SymptomAnalyticsView').then(module => ({ default: module.SymptomAnalyticsView })));
const CycleCharts = lazy(() => import('@/components/period/CycleCharts').then(module => ({ default: module.CycleCharts })));
const PartnerShareView = lazy(() => import('@/components/period/PartnerShareView').then(module => ({ default: module.PartnerShareView })));
const OnboardingFlow = lazy(() => import('@/components/period/OnboardingFlow').then(module => ({ default: module.OnboardingFlow })));
const HealthReportGenerator = lazy(() => import('@/components/period/HealthReportGenerator').then(module => ({ default: module.HealthReportGenerator })));
const BrainForecastView = lazy(() => import('@/components/period/BrainForecastView').then(module => ({ default: module.BrainForecastView })));
const ClinicalEvidenceView = lazy(() => import('@/components/period/ClinicalEvidenceView').then(module => ({ default: module.ClinicalEvidenceView })));
const WellnessJournalView = lazy(() => import('@/components/period/WellnessJournalView').then(module => ({ default: module.WellnessJournalView })));
const FertilityTrackingView = lazy(() => import('@/components/period/FertilityTrackingView').then(module => ({ default: module.FertilityTrackingView })));
const PregnancyBirthView = lazy(() => import('@/components/period/PregnancyBirthView').then(module => ({ default: module.PregnancyBirthView })));
const DashboardView = lazy(() => import('@/components/period/DashboardView').then(module => ({ default: module.DashboardView })));
import { useSupabasePeriodTracker } from '@/hooks/useSupabasePeriodTracker';
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings';
import { useFertilityTracker } from '@/hooks/useFertilityTracker';
import { useSymptomAnalytics } from '@/hooks/useSymptomAnalytics';
import { useClinicalAssessments } from '@/hooks/useClinicalAssessments';
import { useWellnessJournal } from '@/hooks/useWellnessJournal';
import { useReportDraft } from '@/contexts/ReportDraftContext';
import { useAuth } from '@/contexts/AuthContext';
import { getTipsForCategory, getTipsForPhase } from '@/data/healthTips';
import { startOfDay, format } from 'date-fns';

type TabType = 'calendar' | 'insights' | 'history' | 'tips' | 'analytics' | 'charts' | 'share' | 'report' | 'brain' | 'clinical' | 'journal' | 'fertility' | 'pregnancy' | 'dashboard' | 'settings' | 'profile';

const ONBOARDING_KEY = 'period_tracker_onboarding_complete';

const TabLoadingFallback = () => (
  <CuteLoader message="Loading view..." />
);

const Index = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [fertilityViewDate, setFertilityViewDate] = useState<Date | null>(null);
  const [pregnancyViewTab, setPregnancyViewTab] = useState<string | undefined>(undefined);
  
  const {
    logs,
    cycles,
    isLoaded,
    getLogForDate,
    logPeriodDay,
    logMood,
    logSymptom,
    logNotes,
    logWaterIntake,
    logMedication,
    logSleep,
    logExercise,
    logTemperature,
    getPredictions,
    getStats,
    isInFertileWindow,
    isOvulationDay,
    isPredictedPeriod,
    getDaysUntilNextPeriod,
    getCurrentCycleDay,
  } = useSupabasePeriodTracker();

  const {
    settings,
    profile,
    isLoaded: settingsLoaded,
    updateSettings,
    updateNotifications,
    updateProfile,
    resetSettings,
    exportDataPdf,
  } = useSupabaseSettings();

  const {
    symptomPatterns,
    moodPatterns,
    symptomsByPhase,
    moodsByPhase,
    currentPhase,
  } = useSymptomAnalytics(logs, cycles);

  const {
    fertilityLogs,
    pregnancyLogs,
    birthRecords,
    postpartumLogs,
    getActivePregnancy,
    getFertilityLogForDate,
  } = useFertilityTracker();

  const { fertilityDrafts, pregnancyDrafts, birthDraft } = useReportDraft();
  const { historicalAssessments: clinicalAssessments } = useClinicalAssessments();
  const { entries: journalEntries } = useWellnessJournal();

  const handleExportPdf = async () => {
    await exportDataPdf({
      fertilityDrafts,
      pregnancyDrafts,
      birthDraft,
    });
  };

  // Check if onboarding is needed - only for new signups
  useEffect(() => {
    if (isLoaded && settingsLoaded && user) {
      const onboardingComplete = localStorage.getItem(ONBOARDING_KEY);
      const isNewUser = localStorage.getItem('period_tracker_is_new_user');
      
      // Only show onboarding for new users who signed up (not logged in)
      // and haven't completed onboarding yet, and have no cycles
      if (!onboardingComplete && isNewUser === 'true' && cycles.length === 0) {
        setShowOnboarding(true);
      }
    }
  }, [isLoaded, settingsLoaded, user, cycles.length]);

  const handleOnboardingComplete = (data: OnboardingData) => {
    // Save profile info (name and birth date) to backend
    updateProfile({
      name: data.name,
      birthDate: data.birthDate,
    });
    
    // Log the initial period
    logPeriodDay(data.lastPeriodDate, true, 'medium');
    
    // Save cycle length preference
    updateSettings({
      cycleLength: data.averageCycleLength,
      periodLength: data.averagePeriodLength,
    });
    
    // Mark onboarding as complete
    localStorage.setItem(ONBOARDING_KEY, 'true');
    // Clear the new user flag
    localStorage.removeItem('period_tracker_is_new_user');
    setShowOnboarding(false);
  };

  const predictions = getPredictions();
  const stats = getStats();
  const daysUntilNextPeriod = getDaysUntilNextPeriod();
  const currentCycleDay = getCurrentCycleDay();

  const todayLog = getLogForDate(new Date());
  const isOnPeriod = todayLog?.isPeriod ?? false;

  // Calculate display name for reports
  const displayName = profile.name || user?.user_metadata?.name || user?.email?.split('@')[0];

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasBirth = birthRecords.some(b => b.birth_date === dateStr);
    const hasFertilityLog = fertilityLogs.some(l => l.date === dateStr);
    const hasPregnancyLog = pregnancyLogs.some(l => l.date === dateStr);
    const hasPostpartumLog = postpartumLogs.some(l => l.date === dateStr);

    if (hasBirth) {
      setPregnancyViewTab('birth');
      setActiveTab('pregnancy');
    } else if (hasPostpartumLog) {
      setPregnancyViewTab('postpartum');
      setActiveTab('pregnancy');
    } else if (hasPregnancyLog) {
      setPregnancyViewTab('pregnancy');
      setActiveTab('pregnancy');
    } else if (hasFertilityLog) {
      setFertilityViewDate(date);
      setActiveTab('fertility');
    } else {
      setSelectedDate(date);
    }
  };

  const getPregnancyLogForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return pregnancyLogs.find(l => l.date === dateStr);
  };

  const getRelevantTips = () => {
    const activePregnancy = getActivePregnancy();
    if (activePregnancy) {
      return getTipsForCategory('pregnancy');
    }

    if (selectedDate && isInFertileWindow(selectedDate)) {
      return getTipsForCategory('fertility');
    }

    if (currentPhase) {
      return getTipsForPhase(currentPhase);
    }

    return [];
  };

  const handleQuickLog = () => {
    const today = startOfDay(new Date());
    if (isOnPeriod) {
      setSelectedDate(today);
    } else {
      logPeriodDay(today, true, 'medium');
    }
  };

  if (!isLoaded || !settingsLoaded) {
    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center">
        <CuteLoader message="Loading your data..." />
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <Suspense fallback={
        <div className="min-h-screen gradient-soft flex items-center justify-center">
          <div className="w-12 h-12 rounded-full gradient-primary animate-pulse-soft" />
        </div>
      }>
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </Suspense>
    );
  }

  const pageVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <div className="min-h-screen gradient-soft">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <Suspense fallback={<TabLoadingFallback />}>
          <AnimatePresence mode="wait">
            {activeTab === 'calendar' && (
              <motion.div
              key="calendar"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <CycleCalendar
                logs={logs}
                fertilityLogs={fertilityLogs}
                pregnancyLogs={pregnancyLogs}
                postpartumLogs={postpartumLogs}
                birthRecords={birthRecords}
                onDayClick={handleDayClick}
                selectedDate={selectedDate}
                isInFertileWindow={settings.showFertileWindow ? isInFertileWindow : () => false}
                isOvulationDay={settings.showOvulation ? isOvulationDay : () => false}
                isPredictedPeriod={isPredictedPeriod}
                getLogForDate={getLogForDate}
              />
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <CycleInsights
                predictions={predictions}
                stats={stats}
                daysUntilNextPeriod={daysUntilNextPeriod}
                currentCycleDay={currentCycleDay}
              />
            </motion.div>
          )}

          {activeTab === 'tips' && (
            <motion.div
              key="tips"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <HealthTipsView
                currentPhase={currentPhase}
                currentCycleDay={currentCycleDay}
              />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <SymptomAnalyticsView
                symptomPatterns={symptomPatterns}
                moodPatterns={moodPatterns}
                symptomsByPhase={symptomsByPhase}
                moodsByPhase={moodsByPhase}
              />
            </motion.div>
          )}

          {activeTab === 'charts' && (
            <motion.div
              key="charts"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <CycleCharts logs={logs} cycles={cycles} />
            </motion.div>
          )}

          {activeTab === 'share' && (
            <motion.div
              key="share"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <PartnerShareView
                predictions={predictions}
                stats={stats}
                currentPhase={currentPhase}
                daysUntilNextPeriod={daysUntilNextPeriod}
                currentCycleDay={currentCycleDay}
                logs={logs}
                userName={displayName}
              />
            </motion.div>
          )}

          {activeTab === 'report' && (
            <motion.div
              key="report"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <HealthReportGenerator
                logs={logs}
                cycles={cycles}
                stats={stats}
                userName={displayName}
              />
            </motion.div>
          )}

          {activeTab === 'brain' && (
            <motion.div
              key="brain"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <BrainForecastView
                currentPhase={currentPhase}
                currentCycleDay={currentCycleDay}
                logs={logs}
                cycles={cycles}
              />
            </motion.div>
          )}

          {activeTab === 'clinical' && (
            <motion.div
              key="clinical"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <ClinicalEvidenceView
                logs={logs}
                cycles={cycles}
                stats={stats}
                userName={displayName}
              />
            </motion.div>
          )}

          {activeTab === 'journal' && (
              <motion.div
                key="journal"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <WellnessJournalView />
              </motion.div>
            )}

            {activeTab === 'fertility' && (
              <motion.div
                key="fertility"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <FertilityTrackingView periodLogs={logs} initialDate={fertilityViewDate || undefined} />
              </motion.div>
            )}

            {activeTab === 'pregnancy' && (
              <motion.div
                key="pregnancy"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <PregnancyBirthView defaultTab={pregnancyViewTab} />
              </motion.div>
            )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <HistoryView cycles={cycles} logs={logs} />
            </motion.div>
           )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <DashboardView
                logs={logs}
                clinicalAssessments={clinicalAssessments}
                journalEntries={journalEntries}
                fertilityLogs={fertilityLogs}
                currentPhase={currentPhase}
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <SettingsView
                settings={settings}
                onUpdateSettings={updateSettings}
                onUpdateNotifications={updateNotifications}
                onExportData={handleExportPdf}
                onExportPdf={handleExportPdf}
                onResetSettings={resetSettings}
              />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <ProfileView
                profile={profile}
                stats={stats}
                onUpdateProfile={updateProfile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </main>

      <QuickLogButton onLogToday={handleQuickLog} isOnPeriod={isOnPeriod} />

      <DayDetailSheet
        date={selectedDate}
        log={selectedDate ? getLogForDate(selectedDate) : undefined}
        fertilityLog={selectedDate ? getFertilityLogForDate(selectedDate) : undefined}
        pregnancyLog={selectedDate ? getPregnancyLogForDate(selectedDate) : undefined}
        tips={getRelevantTips()}
        isOpen={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        onLogPeriod={logPeriodDay}
        onLogMood={logMood}
        onLogSymptom={logSymptom}
        onLogNotes={logNotes}
        onLogWaterIntake={logWaterIntake}
        onLogMedication={logMedication}
        onLogSleep={logSleep}
        onLogExercise={logExercise}
        onLogTemperature={logTemperature}
      />
    </div>
  );
};

export default Index;
