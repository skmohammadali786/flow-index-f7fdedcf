import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Droplets, Heart, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DayLog, FlowIntensity } from '@/types/period';
import { CrimsonGraph } from './CrimsonGraph';
import { FertilityLog, PregnancyLog, BirthRecord, PostpartumLog } from '@/hooks/useFertilityTracker';

interface CycleCalendarProps {
  logs: DayLog[];
  fertilityLogs?: FertilityLog[];
  pregnancyLogs?: PregnancyLog[];
  postpartumLogs?: PostpartumLog[];
  birthRecords?: BirthRecord[];
  onDayClick: (date: Date) => void;
  selectedDate: Date | null;
  isInFertileWindow: (date: Date) => boolean;
  isOvulationDay: (date: Date) => boolean;
  isPredictedPeriod: (date: Date) => boolean;
  getLogForDate: (date: Date) => DayLog | undefined;
}

export function CycleCalendar({
  logs,
  fertilityLogs = [],
  pregnancyLogs = [],
  postpartumLogs = [],
  birthRecords = [],
  onDayClick,
  selectedDate,
  isInFertileWindow,
  isOvulationDay,
  isPredictedPeriod,
  getLogForDate,
}: CycleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getFertilityLogForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return fertilityLogs?.find(l => l.date === dateStr);
  };

  const getPregnancyLogForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return pregnancyLogs?.find(l => l.date === dateStr);
  };

  const getPostpartumLogForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return postpartumLogs?.find(l => l.date === dateStr);
  };

  const getBirthRecordForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return birthRecords?.find(r => r.birth_date === dateStr);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getFlowColor = (intensity?: FlowIntensity) => {
    switch (intensity) {
      case 'spotting': return 'bg-coral-light';
      case 'light': return 'bg-coral/50';
      case 'medium': return 'bg-coral/75';
      case 'heavy': return 'bg-coral';
      default: return 'bg-coral/60';
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="rounded-full hover:bg-coral-light"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <motion.h2 
          key={format(currentMonth, 'MMM-yyyy')}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-display font-semibold"
        >
          {format(currentMonth, 'MMMM yyyy')}
        </motion.h2>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="rounded-full hover:bg-coral-light"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        <AnimatePresence mode="wait">
          {days.map((day, idx) => {
            const log = getLogForDate(day);
            const fertLog = getFertilityLogForDate(day);
            const pregLog = getPregnancyLogForDate(day);
            const ppLog = getPostpartumLogForDate(day);
            const birthRecord = getBirthRecordForDate(day);
            const isPeriod = log?.isPeriod;
            const isFertile = isInFertileWindow(day);
            const isOvulation = isOvulationDay(day);
            const isPredicted = isPredictedPeriod(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            const hasFertilityLog = !!fertLog;

            return (
              <motion.button
                key={day.toString()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.01 }}
                onClick={() => onDayClick(day)}
                className={cn(
                  "relative aspect-square rounded-xl p-1 transition-all duration-200",
                  "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50",
                  !isCurrentMonth && "opacity-30",
                  isSelected && "ring-2 ring-primary",
                )}
              >
                <div className={cn(
                  "w-full h-full rounded-lg flex flex-col items-center justify-center",
                  birthRecord && "bg-birth hover:bg-birth/90 text-white",
                  !birthRecord && ppLog && "bg-postpartum-log hover:bg-postpartum-log/90 text-foreground",
                  !birthRecord && !ppLog && pregLog && "bg-pregnancy-log hover:bg-pregnancy-log/90 text-foreground",
                  !birthRecord && !ppLog && !pregLog && hasFertilityLog && "bg-fertility hover:bg-fertility/90 text-white",
                  !birthRecord && !ppLog && !pregLog && !hasFertilityLog && isPeriod && getFlowColor(log?.flowIntensity),
                  !birthRecord && !ppLog && !pregLog && !hasFertilityLog && !isPeriod && isPredicted && "border-2 border-dashed border-coral/50",
                  !birthRecord && !ppLog && !pregLog && !hasFertilityLog && !isPeriod && !isPredicted && isFertile && "bg-lavender-light",
                  !birthRecord && !ppLog && !pregLog && !hasFertilityLog && !isPeriod && !isPredicted && isOvulation && !isPeriod && "bg-lavender ring-2 ring-lavender",
                  !birthRecord && !ppLog && !pregLog && !hasFertilityLog && isToday(day) && !isPeriod && !isFertile && "bg-peach-light",
                )}>
                  <span className={cn(
                    "text-sm font-medium",
                    (isPeriod || birthRecord || hasFertilityLog) && !ppLog && !pregLog && "text-primary-foreground",
                    (ppLog || pregLog) && "text-foreground",
                    isToday(day) && "font-bold",
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {isPeriod && (
                    <Droplets className="h-3 w-3 text-primary-foreground mt-0.5" />
                  )}
                  
                  {isOvulation && !isPeriod && (
                    <div className="w-1.5 h-1.5 rounded-full bg-lavender mt-0.5" />
                  )}
                </div>

                {/* Fertility + symptom indicators */}
                <div className="absolute bottom-0.5 left-0.5 right-0.5 flex justify-center gap-0.5">
                  {fertLog?.intercourse && (
                    <div className="w-1.5 h-1.5 rounded-full bg-coral" title="Intercourse" />
                  )}
                  {fertLog?.opk_result === 'peak' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" title="OPK Peak" />
                  )}
                  {fertLog?.opk_result === 'high' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-peach" title="OPK High" />
                  )}
                  {log && log.symptoms.length > 0 && !fertLog?.intercourse && !fertLog?.opk_result && (
                    <div className="w-1.5 h-1.5 rounded-full bg-peach" />
                  )}
                  {!ppLog && !pregLog && log && log.moods.length > 0 && !fertLog?.intercourse && !fertLog?.opk_result && (
                    <div className="w-1.5 h-1.5 rounded-full bg-sage" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-coral" />
          <span className="text-muted-foreground">Period</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-dashed border-coral/50" />
          <span className="text-muted-foreground">Predicted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-lavender-light" />
          <span className="text-muted-foreground">Fertile</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-lavender" />
          <span className="text-muted-foreground">Ovulation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-fertility" />
          <span className="text-muted-foreground">Fertility</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-birth" />
          <span className="text-muted-foreground">Birth</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-pregnancy-log" />
          <span className="text-muted-foreground">Pregnancy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-postpartum-log" />
          <span className="text-muted-foreground">Postpartum</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-coral" />
          <span className="text-muted-foreground">Intercourse</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">OPK Peak</span>
        </div>
      </div>

      {/* Crimson Graph */}
      <CrimsonGraph logs={logs} currentMonth={currentMonth} onDayClick={onDayClick} />
    </div>
  );
}
