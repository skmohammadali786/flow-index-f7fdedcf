import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/period/Header';
import { CycleCalendar } from '@/components/period/CycleCalendar';
import { CycleInsights } from '@/components/period/CycleInsights';
import { HistoryView } from '@/components/period/HistoryView';
import { DayDetailSheet } from '@/components/period/DayDetailSheet';
import { QuickLogButton } from '@/components/period/QuickLogButton';
import { usePeriodTracker } from '@/hooks/usePeriodTracker';
import { isToday, startOfDay } from 'date-fns';

type TabType = 'calendar' | 'insights' | 'history';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const {
    logs,
    cycles,
    isLoaded,
    getLogForDate,
    logPeriodDay,
    logMood,
    logSymptom,
    logNotes,
    getPredictions,
    getStats,
    isInFertileWindow,
    isOvulationDay,
    isPredictedPeriod,
    getDaysUntilNextPeriod,
    getCurrentCycleDay,
  } = usePeriodTracker();

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

  if (!isLoaded) {
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

  return (
    <div className="min-h-screen gradient-soft">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <CycleCalendar
                logs={logs}
                onDayClick={handleDayClick}
                selectedDate={selectedDate}
                isInFertileWindow={isInFertileWindow}
                isOvulationDay={isOvulationDay}
                isPredictedPeriod={isPredictedPeriod}
                getLogForDate={getLogForDate}
              />
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
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

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <HistoryView cycles={cycles} logs={logs} />
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
      />
    </div>
  );
};

export default Index;
