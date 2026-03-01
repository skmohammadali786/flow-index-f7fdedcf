import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, AreaChart, Area, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ComposedChart, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  TrendingUp, Activity, Heart, Droplets, Moon, Dumbbell, GlassWater, 
  Thermometer, Flame, Target, Zap, Calendar, BarChart3, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DayLog, CycleData, Symptom, Mood } from '@/types/period';
import { cn } from '@/lib/utils';
import { CustomTooltip } from '@/components/ui/custom-tooltip';

interface CycleChartsProps {
  logs: DayLog[];
  cycles: CycleData[];
}

// Stat card component
function StatCard({ icon: Icon, label, value, subtext, trend, color }: { 
  icon: any; label: string; value: string; subtext?: string; trend?: 'up' | 'down' | 'stable'; color: string 
}) {
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const trendColor = trend === 'up' ? 'text-sage' : trend === 'down' ? 'text-coral' : 'text-muted-foreground';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-xl p-3 border border-border/50 shadow-card"
    >
      <div className="flex items-start justify-between mb-1">
        <div className={cn("p-1.5 rounded-lg", color)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        {trend && <TrendIcon className={cn("h-3 w-3 mt-1", trendColor)} />}
      </div>
      <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      {subtext && <p className="text-[9px] text-muted-foreground/70 mt-0.5">{subtext}</p>}
    </motion.div>
  );
}

// Phase bar component
function PhaseTimeline({ cycleLength, periodLength }: { cycleLength: number; periodLength: number }) {
  const phases = [
    { name: 'Period', days: periodLength, color: 'bg-coral' },
    { name: 'Follicular', days: Math.max(0, Math.round(cycleLength * 0.35) - periodLength), color: 'bg-sage' },
    { name: 'Ovulation', days: 3, color: 'bg-[hsl(var(--fertility))]' },
    { name: 'Luteal', days: Math.max(0, cycleLength - Math.round(cycleLength * 0.35) - 3), color: 'bg-lavender' },
  ];
  
  return (
    <div className="space-y-2">
      <div className="flex rounded-full overflow-hidden h-3">
        {phases.map((phase, i) => (
          <motion.div
            key={phase.name}
            initial={{ width: 0 }}
            animate={{ width: `${(phase.days / cycleLength) * 100}%` }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className={cn(phase.color, "relative group")}
            title={`${phase.name}: ${phase.days} days`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground">
        {phases.map(p => (
          <span key={p.name} className="flex items-center gap-1">
            <span className={cn("h-1.5 w-1.5 rounded-full", p.color)} />
            {p.name} ({p.days}d)
          </span>
        ))}
      </div>
    </div>
  );
}

// Mood heatmap
function MoodHeatmap({ logs }: { logs: DayLog[] }) {
  const moodColors: Record<string, string> = {
    happy: 'hsl(var(--sage))',
    sad: 'hsl(var(--lavender))',
    anxious: 'hsl(var(--peach))',
    irritable: 'hsl(var(--coral))',
    calm: 'hsl(var(--fertility))',
    energetic: 'hsl(140 60% 55%)',
    tired: 'hsl(var(--muted-foreground))',
    emotional: 'hsl(280 60% 65%)',
  };

  const moodData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      log.moods.forEach(m => {
        counts[m] = (counts[m] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([mood, count]) => ({ mood: mood.replace('_', ' '), count, fill: moodColors[mood] || 'hsl(var(--muted))' }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [logs]);

  if (moodData.length === 0) return null;

  const maxCount = Math.max(...moodData.map(d => d.count));

  return (
    <div className="space-y-2">
      {moodData.map((d, i) => (
        <motion.div
          key={d.mood}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-2"
        >
          <span className="text-[10px] text-muted-foreground w-16 text-right capitalize truncate">{d.mood}</span>
          <div className="flex-1 h-5 bg-muted rounded-md overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.count / maxCount) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="h-full rounded-md flex items-center justify-end pr-1.5"
              style={{ backgroundColor: d.fill }}
            >
              <span className="text-[9px] font-bold text-primary-foreground">{d.count}</span>
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

type ChartTab = 'overview' | 'cycles' | 'symptoms' | 'wellness' | 'moods';

export function CycleCharts({ logs, cycles }: CycleChartsProps) {
  const [activeChart, setActiveChart] = useState<ChartTab>('overview');

  const dailyChartData = useMemo(() => {
    return [...logs]
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(-14)
      .map(log => ({
        date: format(parseISO(log.date), 'MMM d'),
        symptoms: log.symptoms.length,
        moods: log.moods.length,
        sleep: log.sleepHours || 0,
        exercise: log.exerciseMinutes || 0,
        water: log.waterIntake || 0,
        temp: log.temperature || null,
      }));
  }, [logs]);

  const chartData = useMemo(() => {
    const months: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLogs = logs.filter(log => {
        const d = parseISO(log.date);
        return d >= monthStart && d <= monthEnd;
      });
      if (monthLogs.length === 0) continue;
      const sleepLogs = monthLogs.filter(l => l.sleepHours);
      const exerciseLogs = monthLogs.filter(l => l.exerciseMinutes);
      const waterLogs = monthLogs.filter(l => l.waterIntake);
      months.push({
        month: format(monthDate, 'MMM'),
        symptoms: monthLogs.reduce((s, l) => s + l.symptoms.length, 0),
        moods: monthLogs.reduce((s, l) => s + l.moods.length, 0),
        avgSleep: sleepLogs.length ? +(sleepLogs.reduce((s, l) => s + (l.sleepHours || 0), 0) / sleepLogs.length).toFixed(1) : 0,
        avgExercise: exerciseLogs.length ? Math.round(exerciseLogs.reduce((s, l) => s + (l.exerciseMinutes || 0), 0) / exerciseLogs.length) : 0,
        avgWater: waterLogs.length ? +(waterLogs.reduce((s, l) => s + (l.waterIntake || 0), 0) / waterLogs.length).toFixed(1) : 0,
        days: monthLogs.length,
      });
    }
    return months.length ? months : [{ month: format(new Date(), 'MMM'), symptoms: 0, moods: 0, avgSleep: 0, avgExercise: 0, avgWater: 0, days: 0 }];
  }, [logs]);

  const showDailyView = logs.length < 30;

  const cycleLengthData = useMemo(() => {
    const sorted = [...cycles].sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
    const data: any[] = [];
    for (let i = 1; i < sorted.length && i <= 12; i++) {
      const len = differenceInDays(parseISO(sorted[i].startDate), parseISO(sorted[i - 1].startDate));
      if (len > 20 && len < 45) {
        data.push({ cycle: format(parseISO(sorted[i].startDate), 'MMM d'), length: len, periodLength: sorted[i].length || 5 });
      }
    }
    return data;
  }, [cycles]);

  const symptomFrequencyData = useMemo(() => {
    const freq: Record<string, number> = {};
    logs.forEach(l => l.symptoms.forEach(s => { freq[s] = (freq[s] || 0) + 1; }));
    return Object.entries(freq)
      .map(([s, c]) => ({ symptom: s.replace('_', ' '), count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [logs]);

  const symptomRadarData = useMemo(() => {
    const freq: Record<string, number> = {};
    logs.forEach(l => l.symptoms.forEach(s => { freq[s] = (freq[s] || 0) + 1; }));
    const max = Math.max(...Object.values(freq), 1);
    return Object.entries(freq)
      .map(([s, c]) => ({ symptom: s.replace('_', ' '), value: Math.round((c / max) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [logs]);

  const temperatureData = useMemo(() => {
    return logs
      .filter(l => l.temperature)
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(-30)
      .map(l => ({ date: format(parseISO(l.date), 'MMM d'), temp: l.temperature }));
  }, [logs]);

  // Summary stats
  const stats = useMemo(() => {
    const avgCycleLen = cycleLengthData.length ? Math.round(cycleLengthData.reduce((s, d) => s + d.length, 0) / cycleLengthData.length) : null;
    const avgPeriodLen = cycleLengthData.length ? +(cycleLengthData.reduce((s, d) => s + d.periodLength, 0) / cycleLengthData.length).toFixed(1) : null;
    const sleepLogs = logs.filter(l => l.sleepHours);
    const avgSleep = sleepLogs.length ? +(sleepLogs.reduce((s, l) => s + (l.sleepHours || 0), 0) / sleepLogs.length).toFixed(1) : null;
    const totalSymptoms = logs.reduce((s, l) => s + l.symptoms.length, 0);
    const exerciseLogs = logs.filter(l => l.exerciseMinutes);
    const avgExercise = exerciseLogs.length ? Math.round(exerciseLogs.reduce((s, l) => s + (l.exerciseMinutes || 0), 0) / exerciseLogs.length) : null;
    
    // Trend: compare last 7 days to previous 7
    const recent = logs.filter(l => {
      const d = parseISO(l.date);
      const now = new Date();
      return differenceInDays(now, d) <= 7;
    });
    const prev = logs.filter(l => {
      const d = parseISO(l.date);
      const now = new Date();
      const diff = differenceInDays(now, d);
      return diff > 7 && diff <= 14;
    });
    const recentSymAvg = recent.length ? recent.reduce((s, l) => s + l.symptoms.length, 0) / recent.length : 0;
    const prevSymAvg = prev.length ? prev.reduce((s, l) => s + l.symptoms.length, 0) / prev.length : 0;
    const symptomTrend: 'up' | 'down' | 'stable' = recentSymAvg > prevSymAvg + 0.5 ? 'up' : recentSymAvg < prevSymAvg - 0.5 ? 'down' : 'stable';

    return { avgCycleLen, avgPeriodLen, avgSleep, totalSymptoms, avgExercise, symptomTrend, totalLogs: logs.length };
  }, [logs, cycleLengthData]);

  const tabs: { key: ChartTab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'cycles', label: 'Cycles', icon: Calendar },
    { key: 'symptoms', label: 'Symptoms', icon: Activity },
    { key: 'moods', label: 'Moods', icon: Heart },
    { key: 'wellness', label: 'Wellness', icon: Zap },
  ];

  if (logs.length < 2) {
    return (
      <div className="bg-card rounded-2xl p-8 text-center shadow-card">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-display font-semibold text-lg mb-2">Not Enough Data Yet</h3>
        <p className="text-muted-foreground text-sm">Log at least 2 days of data to see trends and charts here.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Cycle Charts</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{stats.totalLogs} days tracked</span>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {stats.avgCycleLen && (
          <StatCard icon={Droplets} label="Avg Cycle" value={`${stats.avgCycleLen}d`} color="bg-coral/15 text-coral" />
        )}
        {stats.avgPeriodLen && (
          <StatCard icon={Flame} label="Avg Period" value={`${stats.avgPeriodLen}d`} color="bg-peach/15 text-peach" />
        )}
        <StatCard icon={Target} label="Symptoms" value={`${stats.totalSymptoms}`} trend={stats.symptomTrend} color="bg-lavender/15 text-lavender" />
        {stats.avgSleep && (
          <StatCard icon={Moon} label="Avg Sleep" value={`${stats.avgSleep}h`} color="bg-[hsl(var(--fertility))]/15 text-[hsl(var(--fertility))]" />
        )}
        {stats.avgExercise && (
          <StatCard icon={Dumbbell} label="Avg Exercise" value={`${stats.avgExercise}m`} color="bg-sage/15 text-sage" />
        )}
      </div>

      {/* Phase timeline */}
      {stats.avgCycleLen && stats.avgPeriodLen && (
        <Card className="border-border/50 shadow-card">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Average Cycle Phases</p>
            <PhaseTimeline cycleLength={stats.avgCycleLen} periodLength={Math.round(stats.avgPeriodLen)} />
          </CardContent>
        </Card>
      )}

      {/* Chart tabs - pill style */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeChart === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveChart(tab.key)}
              className={cn(
                "relative flex-1 min-w-0 flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-all",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="chartTab"
                  className="absolute inset-0 bg-card shadow-sm rounded-lg"
                  transition={{ type: 'spring', duration: 0.4 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chart content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeChart}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {activeChart === 'overview' && (
            <>
              <Card className="border-border/50 shadow-card overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-peach" />
                    {showDailyView ? 'Daily Activity' : 'Monthly Activity'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {showDailyView ? (
                        <ComposedChart data={dailyChartData}>
                          <defs>
                            <linearGradient id="symptomGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#ff00ff" stopOpacity={0.8} />
                              <stop offset="25%" stopColor="#ff69b4" stopOpacity={0.8} />
                              <stop offset="50%" stopColor="#ff7f50" stopOpacity={0.8} />
                              <stop offset="75%" stopColor="#ffa500" stopOpacity={0.8} />
                              <stop offset="100%" stopColor="#ffbf00" stopOpacity={0.8} />
                            </linearGradient>
                            <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--sage))" stopOpacity={0.8} />
                              <stop offset="100%" stopColor="hsl(var(--sage))" stopOpacity={0.2} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Area type="monotone" dataKey="symptoms" fill="url(#symptomGrad)" stroke="url(#symptomGrad)" strokeWidth={2} name="Symptoms" />
                          <Area type="monotone" dataKey="moods" fill="url(#moodGrad)" stroke="hsl(var(--sage))" strokeWidth={2} name="Moods" />
                        </ComposedChart>
                      ) : (
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="symptomGradM" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#ff00ff" stopOpacity={0.8} />
                              <stop offset="25%" stopColor="#ff69b4" stopOpacity={0.8} />
                              <stop offset="50%" stopColor="#ff7f50" stopOpacity={0.8} />
                              <stop offset="75%" stopColor="#ffa500" stopOpacity={0.8} />
                              <stop offset="100%" stopColor="#ffbf00" stopOpacity={0.8} />
                            </linearGradient>
                            <linearGradient id="moodGradM" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--sage))" stopOpacity={0.6} />
                              <stop offset="100%" stopColor="hsl(var(--sage))" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Area type="monotone" dataKey="symptoms" stroke="url(#symptomGradM)" fill="url(#symptomGradM)" strokeWidth={2} name="Symptoms" />
                          <Area type="monotone" dataKey="moods" stroke="hsl(var(--sage))" fill="url(#moodGradM)" strokeWidth={2} name="Moods" />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Temperature chart inline if data exists */}
              {temperatureData.length > 3 && (
                <Card className="border-border/50 shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Thermometer className="h-4 w-4 text-coral" />
                      Basal Body Temperature
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={temperatureData}>
                          <defs>
                            <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--coral))" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="hsl(var(--coral))" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis domain={[35.5, 37.5]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="temp" stroke="hsl(var(--coral))" fill="url(#tempGrad)" strokeWidth={2} name="Temp (°C)" dot={{ fill: 'hsl(var(--coral))', r: 3 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {activeChart === 'cycles' && (
            <>
              {cycleLengthData.length > 0 ? (
                <Card className="border-border/50 shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Droplets className="h-4 w-4 text-coral" />
                      Cycle & Period Length Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={cycleLengthData}>
                          <defs>
                            <linearGradient id="cycleGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#ff00ff" stopOpacity={0.8} />
                              <stop offset="25%" stopColor="#ff69b4" stopOpacity={0.8} />
                              <stop offset="50%" stopColor="#ff7f50" stopOpacity={0.8} />
                              <stop offset="75%" stopColor="#ffa500" stopOpacity={0.8} />
                              <stop offset="100%" stopColor="#ffbf00" stopOpacity={0.8} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="cycle" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis domain={[0, 'auto']} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Area type="monotone" dataKey="length" stroke="url(#cycleGrad)" fill="url(#cycleGrad)" strokeWidth={2} name="Cycle Length" dot={{ fill: '#ffa500', r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))' }} />
                          <Bar dataKey="periodLength" fill="hsl(var(--lavender))" name="Period Length" radius={[4, 4, 0, 0]} opacity={0.7} barSize={16} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Cycle variation indicator */}
                    {cycleLengthData.length > 2 && (
                      <div className="mt-3 p-2.5 bg-muted rounded-lg">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Cycle variation</span>
                          <span className="font-medium text-foreground">
                            {Math.min(...cycleLengthData.map(d => d.length))} – {Math.max(...cycleLengthData.map(d => d.length))} days
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="p-8 text-center border-border/50 shadow-card">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Track at least 2 full cycles to see trends</p>
                </Card>
              )}
            </>
          )}

          {activeChart === 'symptoms' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {symptomFrequencyData.length > 0 ? (
                <>
                  <Card className="border-border/50 shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-peach" />
                        Symptom Frequency
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={symptomFrequencyData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis dataKey="symptom" type="category" width={80} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Occurrences">
                              {symptomFrequencyData.map((_, i) => (
                                <Cell key={i} fill={`hsl(${355 - i * 20} 70% ${65 + i * 3}%)`} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {symptomRadarData.length >= 3 && (
                    <Card className="border-border/50 shadow-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-lavender" />
                          Symptom Radar
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[260px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={symptomRadarData}>
                              <PolarGrid stroke="hsl(var(--border))" />
                              <PolarAngleAxis dataKey="symptom" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                              <PolarRadiusAxis tick={{ fontSize: 8 }} stroke="hsl(var(--border))" />
                              <Radar name="Intensity" dataKey="value" stroke="hsl(var(--lavender))" fill="hsl(var(--lavender))" fillOpacity={0.3} strokeWidth={2} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="sm:col-span-2 p-8 text-center border-border/50 shadow-card">
                  <p className="text-muted-foreground text-sm">Log symptoms to see frequency data</p>
                </Card>
              )}
            </div>
          )}

          {activeChart === 'moods' && (
            <Card className="border-border/50 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-coral" />
                  Mood Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MoodHeatmap logs={logs} />
                {logs.some(l => l.moods.length > 0) ? null : (
                  <p className="text-center text-muted-foreground text-sm py-6">Log moods to see distribution</p>
                )}
              </CardContent>
            </Card>
          )}

          {activeChart === 'wellness' && (
            <>
              <Card className="border-border/50 shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Moon className="h-4 w-4 text-lavender" />
                    {showDailyView ? 'Daily Wellness' : 'Monthly Wellness'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={showDailyView ? dailyChartData : chartData}>
                        <defs>
                          <linearGradient id="sleepBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--lavender))" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="hsl(var(--lavender))" stopOpacity={0.4} />
                          </linearGradient>
                          <linearGradient id="waterBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--fertility))" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="hsl(var(--fertility))" stopOpacity={0.4} />
                          </linearGradient>
                          <linearGradient id="exerciseBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--sage))" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="hsl(var(--sage))" stopOpacity={0.4} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis dataKey={showDailyView ? "date" : "month"} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey={showDailyView ? "sleep" : "avgSleep"} fill="url(#sleepBar)" name="Sleep (hrs)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey={showDailyView ? "water" : "avgWater"} fill="url(#waterBar)" name="Water" radius={[4, 4, 0, 0]} />
                        {showDailyView && <Bar dataKey="exercise" fill="url(#exerciseBar)" name="Exercise (min)" radius={[4, 4, 0, 0]} />}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
