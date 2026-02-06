import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/period/Header';
import { CycleCalendar } from '@/components/period/CycleCalendar';
import { CycleInsights } from '@/components/period/CycleInsights';
import { HistoryView } from '@/components/period/HistoryView';
import { DayDetailSheet } from '@/components/period/DayDetailSheet';
import { QuickLogButton } from '@/components/period/QuickLogButton';
import { SettingsView } from '@/components/period/SettingsView';
import { ProfileView } from '@/components/period/ProfileView';
import { HealthTipsView } from '@/components/period/HealthTipsView';
import { SymptomAnalyticsView } from '@/components/period/SymptomAnalyticsView';
import { CycleCharts } from '@/components/period/CycleCharts';
import { PartnerShareView } from '@/components/period/PartnerShareView';
import { OnboardingFlow, OnboardingData } from '@/components/period/OnboardingFlow';
import { HealthReportGenerator } from '@/components/period/HealthReportGenerator';
import { useSupabasePeriodTracker } from '@/hooks/useSupabasePeriodTracker';
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings';
import { useSymptomAnalytics } from '@/hooks/useSymptomAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { startOfDay } from 'date-fns';

type TabType = 'calendar' | 'insights' | 'history' | 'tips' | 'analytics' | 'charts' | 'share' | 'report' | 'settings' | 'profile';

const ONBOARDING_KEY = 'period_tracker_onboarding_complete';

const Index = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
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
    exportData,
    importData,
  } = useSupabaseSettings();

  const {
    symptomPatterns,
    moodPatterns,
    symptomsByPhase,
    moodsByPhase,
    currentPhase,
  } = useSymptomAnalytics(logs, cycles);

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

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-full gradient-primary animate-pulse-soft" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
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
              />
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
                onExportData={exportData}
                onImportData={importData}
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
      </main>

      <QuickLogButton onLogToday={handleQuickLog} isOnPeriod={isOnPeriod} />

      <DayDetailSheet
        date={selectedDate}
        log={selectedDate ? getLogForDate(selectedDate) : undefined}
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
