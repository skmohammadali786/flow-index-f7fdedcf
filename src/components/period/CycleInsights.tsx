import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Activity, Droplets, Sun } from 'lucide-react';
import { CyclePrediction, CycleStats } from '@/types/period';
import { cn } from '@/lib/utils';

interface CycleInsightsProps {
  predictions: CyclePrediction | null;
  stats: CycleStats | null;
  daysUntilNextPeriod: number | null;
  currentCycleDay: number | null;
}

export function CycleInsights({
  predictions,
  stats,
  daysUntilNextPeriod,
  currentCycleDay,
}: CycleInsightsProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {/* Main status card */}
      <motion.div
        variants={itemVariants}
        className="col-span-full gradient-primary rounded-2xl p-6 text-primary-foreground shadow-elevated"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm font-medium mb-1">
              {daysUntilNextPeriod !== null ? 'Days until next period' : 'Current cycle day'}
            </p>
            <p className="text-5xl font-display font-bold">
              {daysUntilNextPeriod !== null ? daysUntilNextPeriod : currentCycleDay ?? '—'}
            </p>
            {currentCycleDay && (
              <p className="text-primary-foreground/80 text-sm mt-2">
                Day {currentCycleDay} of your cycle
              </p>
            )}
          </div>
          <div className="p-4 bg-white/20 rounded-2xl">
            <Calendar className="h-10 w-10" />
          </div>
        </div>
      </motion.div>

      {/* Cycle length */}
      <motion.div
        variants={itemVariants}
        className="bg-card rounded-2xl p-5 shadow-card"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-lavender-light">
            <TrendingUp className="h-5 w-5 text-lavender" />
          </div>
          <span className="text-sm text-muted-foreground">Avg. Cycle</span>
        </div>
        <p className="text-3xl font-display font-semibold">
          {stats?.averageCycleLength ?? '—'}
          <span className="text-lg text-muted-foreground ml-1">days</span>
        </p>
        {stats && (
          <p className="text-xs text-muted-foreground mt-2">
            Range: {stats.shortestCycle}–{stats.longestCycle} days
          </p>
        )}
      </motion.div>

      {/* Period length */}
      <motion.div
        variants={itemVariants}
        className="bg-card rounded-2xl p-5 shadow-card"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-coral-light">
            <Droplets className="h-5 w-5 text-coral" />
          </div>
          <span className="text-sm text-muted-foreground">Avg. Period</span>
        </div>
        <p className="text-3xl font-display font-semibold">
          {stats?.averagePeriodLength ?? '—'}
          <span className="text-lg text-muted-foreground ml-1">days</span>
        </p>
        {stats && (
          <p className="text-xs text-muted-foreground mt-2">
            Based on {stats.totalCycles} cycles tracked
          </p>
        )}
      </motion.div>

      {/* Fertile window */}
      {predictions && (
        <motion.div
          variants={itemVariants}
          className="bg-card rounded-2xl p-5 shadow-card"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-sage-light">
              <Sun className="h-5 w-5 text-sage" />
            </div>
            <span className="text-sm text-muted-foreground">Fertile Window</span>
          </div>
          <p className="text-lg font-semibold">
            {new Date(predictions.fertileWindowStart).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
            {' – '}
            {new Date(predictions.fertileWindowEnd).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Ovulation: {new Date(predictions.ovulationDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
        </motion.div>
      )}

      {/* Total cycles */}
      <motion.div
        variants={itemVariants}
        className="bg-card rounded-2xl p-5 shadow-card"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-peach-light">
            <Activity className="h-5 w-5 text-peach" />
          </div>
          <span className="text-sm text-muted-foreground">Cycles Tracked</span>
        </div>
        <p className="text-3xl font-display font-semibold">
          {stats?.totalCycles ?? 0}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {!stats ? 'Log your period to start tracking' : 'Keep logging for better predictions'}
        </p>
      </motion.div>

      {/* No data state */}
      {!stats && (
        <motion.div
          variants={itemVariants}
          className="col-span-full bg-muted/50 rounded-2xl p-6 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-coral-light flex items-center justify-center">
            <Droplets className="h-8 w-8 text-coral" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">
            Start Tracking Your Cycle
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Log at least 2 periods to see predictions and insights about your cycle.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
