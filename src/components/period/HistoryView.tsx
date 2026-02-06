import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Calendar, Droplets, TrendingUp } from 'lucide-react';
import { CycleData, DayLog } from '@/types/period';
import { cn } from '@/lib/utils';

interface HistoryViewProps {
  cycles: CycleData[];
  logs: DayLog[];
}

export function HistoryView({ cycles, logs }: HistoryViewProps) {
  const sortedCycles = [...cycles].sort((a, b) => 
    parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()
  );

  // Calculate cycle lengths between consecutive cycles
  const cyclesWithInterval = sortedCycles.map((cycle, index) => {
    if (index < sortedCycles.length - 1) {
      const currentStart = parseISO(cycle.startDate);
      const prevStart = parseISO(sortedCycles[index + 1].startDate);
      const intervalDays = Math.round(
        (currentStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { ...cycle, intervalFromPrevious: intervalDays };
    }
    return { ...cycle, intervalFromPrevious: null };
  });

  if (sortedCycles.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-8 text-center shadow-card">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-display font-semibold text-lg mb-2">
          No Cycle History Yet
        </h3>
        <p className="text-muted-foreground text-sm">
          Your period history will appear here once you start logging.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold mb-6">Cycle History</h2>
      
      {cyclesWithInterval.map((cycle, index) => (
        <motion.div
          key={cycle.startDate}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card rounded-2xl p-5 shadow-card"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-xl",
                index === 0 ? "gradient-primary" : "bg-coral-light"
              )}>
                <Droplets className={cn(
                  "h-6 w-6",
                  index === 0 ? "text-primary-foreground" : "text-coral"
                )} />
              </div>
              
              <div>
                <p className="font-semibold">
                  {format(parseISO(cycle.startDate), 'MMM d')}
                  {cycle.endDate && cycle.endDate !== cycle.startDate && (
                    <span className="text-muted-foreground">
                      {' – '}{format(parseISO(cycle.endDate), 'MMM d')}
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(cycle.startDate), 'yyyy')}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2 text-coral">
                <Droplets className="h-4 w-4" />
                <span className="font-semibold">{cycle.length || 1} days</span>
              </div>
              
              {cycle.intervalFromPrevious && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>{cycle.intervalFromPrevious} day cycle</span>
                </div>
              )}
            </div>
          </div>

          {/* Show symptoms/moods logged during this period */}
          {(() => {
            const periodLogs = logs.filter(log => {
              const logDate = parseISO(log.date);
              const startDate = parseISO(cycle.startDate);
              const endDate = cycle.endDate ? parseISO(cycle.endDate) : startDate;
              return logDate >= startDate && logDate <= endDate && (log.symptoms.length > 0 || log.moods.length > 0);
            });

            if (periodLogs.length === 0) return null;

            const allSymptoms = [...new Set(periodLogs.flatMap(l => l.symptoms))];
            const allMoods = [...new Set(periodLogs.flatMap(l => l.moods))];

            return (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {allSymptoms.slice(0, 4).map(symptom => (
                    <span
                      key={symptom}
                      className="px-2 py-1 text-xs rounded-full bg-peach-light text-peach capitalize"
                    >
                      {symptom.replace('_', ' ')}
                    </span>
                  ))}
                  {allMoods.slice(0, 3).map(mood => (
                    <span
                      key={mood}
                      className="px-2 py-1 text-xs rounded-full bg-sage-light text-sage capitalize"
                    >
                      {mood}
                    </span>
                  ))}
                  {(allSymptoms.length > 4 || allMoods.length > 3) && (
                    <span className="px-2 py-1 text-xs text-muted-foreground">
                      +{allSymptoms.length - 4 + allMoods.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </motion.div>
      ))}
    </div>
  );
}
