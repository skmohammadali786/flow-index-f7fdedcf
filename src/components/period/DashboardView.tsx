import { useState, useMemo } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, BarChart, Bar,
} from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DayLog } from '@/types/period';
import { CyclePhase } from '@/types/settings';
import type { ClinicalAssessment } from '@/hooks/useClinicalAssessments';
import type { JournalEntry } from '@/hooks/useWellnessJournal';
import type { FertilityLog } from '@/hooks/useFertilityTracker';
import type { WorkoutLog } from '@/hooks/useWorkoutTracker';
import {
  LayoutDashboard, TrendingUp, TrendingDown, Minus, Heart, Droplets, Moon, Dumbbell,
  Thermometer, Brain, Activity, Sparkles, type LucideIcon,
} from 'lucide-react';

interface ChartDataPoint {
  date: string;
  Flow: number;
  Moods: number;
  Symptoms: number;
  Sleep: number;
  Water: number;
  Exercise: number;
  'BBT': number;
  Pain: number;
  Fatigue: number;
  'Clinical Mood': number;
  Bloating: number;
  'Journal Mood': number;
  Energy: number;
  'LH Level': number;
  'Workout Min': number;
  'Workout Cal': number;
}

interface ComprehensiveDataPoint {
  date: string;
  flow: number;
  moods: number;
  symptoms: number;
  sleep: number;
  water: number;
  exercise: number;
  bbt: number;
  pain: number;
  fatigue: number;
  clinicalMood: number;
  bloating: number;
  journalMood: number;
  energy: number;
  lh: number;
  workoutMin: number;
  workoutCal: number;
}

interface DashboardViewProps {
  logs: DayLog[];
  clinicalAssessments: ClinicalAssessment[];
  journalEntries: JournalEntry[];
  fertilityLogs: FertilityLog[];
  workoutLogs?: WorkoutLog[];
  currentPhase: CyclePhase;
  days?: number;
}

const flowToValue = (log?: DayLog): number => {
  if (!log?.isPeriod) return 0;
  switch (log.flowIntensity) {
    case 'spotting': return 1;
    case 'light': return 2;
    case 'medium': return 3;
    case 'heavy': return 4;
    default: return 2;
  }
};

const COLORS = {
  flow: 'hsl(355, 70%, 60%)',
  moods: 'hsl(280, 65%, 60%)',
  symptoms: 'hsl(25, 95%, 60%)',
  sleep: 'hsl(263, 70%, 65%)',
  water: 'hsl(200, 70%, 55%)',
  exercise: 'hsl(142, 55%, 50%)',
  temperature: 'hsl(15, 80%, 55%)',
  pain: 'hsl(0, 75%, 55%)',
  fatigue: 'hsl(35, 85%, 55%)',
  clinicalMood: 'hsl(310, 60%, 55%)',
  bloating: 'hsl(45, 80%, 50%)',
  journalMood: 'hsl(330, 65%, 60%)',
  energy: 'hsl(50, 85%, 50%)',
  lh: 'hsl(190, 70%, 50%)',
  workout: 'hsl(270, 70%, 55%)',
  calories: 'hsl(15, 90%, 50%)',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    value: number | string;
    name: string;
    color: string;
    dataKey: string;
  }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const nonZero = payload.filter((p) => (typeof p.value === 'number' ? p.value > 0 : !!p.value));
  if (nonZero.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-xs space-y-1.5 max-w-[200px]">
      <p className="font-bold text-foreground text-sm">{label}</p>
      {nonZero.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          <span className="font-medium">{p.name}:</span> {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

type RangeOption = 7 | 30 | 90;

function buildChartData(
  logs: DayLog[], clinicalAssessments: ClinicalAssessment[],
  journalEntries: JournalEntry[], fertilityLogs: FertilityLog[], 
  workoutLogs: WorkoutLog[], days: number
): ChartDataPoint[] {
  const today = startOfDay(new Date());
  const logMap = new Map(logs.map(l => [l.date, l]));
  const clinicalMap = new Map(clinicalAssessments.map(a => [a.date, a]));
  const journalMap = new Map(journalEntries.map(e => [e.date, e]));
  const fertilityMap = new Map(fertilityLogs.map(f => [f.date, f]));
  
  // Group workouts by date
  const workoutMap = new Map<string, { duration: number; calories: number; count: number }>();
  workoutLogs.forEach(w => {
    const existing = workoutMap.get(w.date) || { duration: 0, calories: 0, count: 0 };
    workoutMap.set(w.date, {
      duration: existing.duration + (w.duration_minutes || 0),
      calories: existing.calories + (w.calories_burned || 0),
      count: existing.count + 1,
    });
  });

  const data: ChartDataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(today, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const log = logMap.get(dateStr);
    const clinical = clinicalMap.get(dateStr);
    const journal = journalMap.get(dateStr);
    const fertility = fertilityMap.get(dateStr);
    const workout = workoutMap.get(dateStr);

    data.push({
      date: format(day, 'MMM d'),
      Flow: flowToValue(log),
      Moods: log?.moods?.length || 0,
      Symptoms: log?.symptoms?.length || 0,
      Sleep: log?.sleepHours || 0,
      Water: log?.waterIntake || 0,
      Exercise: (log?.exerciseMinutes || 0) / 10,
      'BBT': log?.temperature ? log.temperature - 36 : 0,
      Pain: clinical?.painVas || 0,
      Fatigue: clinical?.fatigueVas || 0,
      'Clinical Mood': clinical?.moodVas || 0,
      Bloating: clinical?.bloatingVas || 0,
      'Journal Mood': journal?.mood_rating || 0,
      Energy: journal?.energy_level || 0,
      'LH Level': fertility?.lh_level || 0,
      'Workout Min': workout?.duration || 0,
      'Workout Cal': (workout?.calories || 0) / 10,
    });
  }
  return data;
}

function computeAvg<T extends Record<string, any>>(data: T[], key: keyof T): number {
  const vals = data.filter(d => typeof d[key] === 'number' && (d[key] as number) > 0);
  if (vals.length === 0) return 0;
  return vals.reduce((s, d) => s + (d[key] as number), 0) / vals.length;
}

interface TrendStat {
  label: string;
  thisWeek: number;
  lastWeek: number;
  unit: string;
  icon: LucideIcon;
  color: string;
  invert?: boolean; // true = lower is better (pain, symptoms)
}

function TrendCard({ stat }: { stat: TrendStat }) {
  const diff = stat.thisWeek - stat.lastWeek;
  const pct = stat.lastWeek > 0 ? Math.abs(diff / stat.lastWeek * 100) : 0;
  const isUp = diff > 0;
  const isNeutral = Math.abs(diff) < 0.05;

  // For inverted metrics (pain, symptoms), up = bad, down = good
  const isPositive = stat.invert ? !isUp : isUp;

  const Icon = isNeutral ? Minus : isUp ? TrendingUp : TrendingDown;
  const trendColor = isNeutral
    ? 'text-muted-foreground'
    : isPositive ? 'text-birth' : 'text-destructive';

  return (
    <Card className="p-3 border-border/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-5" style={{ backgroundColor: stat.color, transform: 'translate(30%, -30%)' }} />
      <div className="flex items-center gap-2 mb-1">
        <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
        <span className="text-[10px] text-muted-foreground font-medium">{stat.label}</span>
      </div>
      <p className="text-xl font-bold">{stat.thisWeek.toFixed(1)}<span className="text-xs font-normal text-muted-foreground ml-0.5">{stat.unit}</span></p>
      <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
        <Icon className="h-3 w-3" />
        <span className="text-[10px] font-medium">
          {isNeutral ? 'No change' : `${pct.toFixed(0)}% vs last wk`}
        </span>
      </div>
    </Card>
  );
}

export function DashboardView({
  logs, clinicalAssessments, journalEntries, fertilityLogs, workoutLogs = [], currentPhase,
}: DashboardViewProps) {
  const [range, setRange] = useState<RangeOption>(30);

  const chartData = useMemo(() =>
    buildChartData(logs, clinicalAssessments, journalEntries, fertilityLogs, workoutLogs, range),
    [logs, clinicalAssessments, journalEntries, fertilityLogs, workoutLogs, range]
  );

  // Trend comparison: this week vs last week (always 7-day windows)
  const trendStats = useMemo<TrendStat[]>(() => {
    const thisWeekData = buildChartData(logs, clinicalAssessments, journalEntries, fertilityLogs, workoutLogs, 7);
    const twoWeekData = buildChartData(logs, clinicalAssessments, journalEntries, fertilityLogs, workoutLogs, 14);
    const lastWeekData = twoWeekData.slice(0, 7);

    return [
      { label: 'Sleep', thisWeek: computeAvg(thisWeekData, 'Sleep'), lastWeek: computeAvg(lastWeekData, 'Sleep'), unit: 'h', icon: Moon, color: COLORS.sleep },
      { label: 'Water', thisWeek: computeAvg(thisWeekData, 'Water'), lastWeek: computeAvg(lastWeekData, 'Water'), unit: '', icon: Droplets, color: COLORS.water },
      { label: 'Energy', thisWeek: computeAvg(thisWeekData, 'Energy'), lastWeek: computeAvg(lastWeekData, 'Energy'), unit: '', icon: Sparkles, color: COLORS.energy },
      { label: 'Pain', thisWeek: computeAvg(thisWeekData, 'Pain'), lastWeek: computeAvg(lastWeekData, 'Pain'), unit: '', icon: Thermometer, color: COLORS.pain, invert: true },
      { label: 'Workout', thisWeek: computeAvg(thisWeekData, 'Workout Min'), lastWeek: computeAvg(lastWeekData, 'Workout Min'), unit: 'm', icon: Dumbbell, color: COLORS.workout },
      { label: 'Exercise', thisWeek: computeAvg(thisWeekData, 'Exercise'), lastWeek: computeAvg(lastWeekData, 'Exercise'), unit: '', icon: Activity, color: COLORS.exercise },
    ];
  }, [logs, clinicalAssessments, journalEntries, fertilityLogs, workoutLogs]);

  // Radar data
  const radarData = useMemo(() => {
    const totals = chartData.reduce(
      (acc, d) => ({
        flow: acc.flow + d.Flow, moods: acc.moods + d.Moods, symptoms: acc.symptoms + d.Symptoms,
        sleep: acc.sleep + d.Sleep, water: acc.water + d.Water, exercise: acc.exercise + d.Exercise,
        pain: acc.pain + d.Pain, energy: acc.energy + d.Energy, workout: acc.workout + d['Workout Min'],
      }),
      { flow: 0, moods: 0, symptoms: 0, sleep: 0, water: 0, exercise: 0, pain: 0, energy: 0, workout: 0 }
    );
    const maxVal = Math.max(...(Object.values(totals) as number[]), 1);
    return [
      { metric: 'Flow', value: (totals.flow / maxVal) * 100 },
      { metric: 'Moods', value: (totals.moods / maxVal) * 100 },
      { metric: 'Symptoms', value: (totals.symptoms / maxVal) * 100 },
      { metric: 'Sleep', value: (totals.sleep / maxVal) * 100 },
      { metric: 'Water', value: (totals.water / maxVal) * 100 },
      { metric: 'Exercise', value: (totals.exercise / maxVal) * 100 },
      { metric: 'Pain', value: (totals.pain / maxVal) * 100 },
      { metric: 'Energy', value: (totals.energy / maxVal) * 100 },
      { metric: 'Workout', value: (totals.workout / maxVal) * 100 },
    ];
  }, [chartData]);

  // Quick stats for selected range
  const quickStats = useMemo(() => {
    const daysWithData = chartData.filter(d =>
      d.Flow > 0 || d.Moods > 0 || d.Symptoms > 0 || d.Sleep > 0 || d.Water > 0
    ).length;
    const periodDays = chartData.filter(d => d.Flow > 0).length;
    return { daysWithData, periodDays };
  }, [chartData]);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const rangeOptions: { value: RangeOption; label: string }[] = [
    { value: 7, label: '7 Days' },
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      className="space-y-5"
    >
      {/* Header with Range Selector */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg gradient-primary">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold">Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              {quickStats.daysWithData} days logged · {quickStats.periodDays} period days
            </p>
          </div>
        </div>
        <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
          {rangeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                range === opt.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trend Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {trendStats.map(stat => (
          <TrendCard key={stat.label} stat={stat} />
        ))}
      </motion.div>

      {/* Main Comprehensive Area Chart */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Complete Wellness Timeline — {range} Days
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.flow} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.flow} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradSleep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.sleep} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={COLORS.sleep} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradWater" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.water} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.water} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.pain} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.pain} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradEnergy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.energy} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.energy} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '9px', paddingTop: '4px' }} />
                  <Area type="monotone" dataKey="Flow" stroke={COLORS.flow} fill="url(#gradFlow)" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                  <Area type="monotone" dataKey="Sleep" stroke={COLORS.sleep} fill="url(#gradSleep)" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
                  <Area type="monotone" dataKey="Water" stroke={COLORS.water} fill="url(#gradWater)" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
                  <Area type="monotone" dataKey="Pain" stroke={COLORS.pain} fill="url(#gradPain)" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
                  <Area type="monotone" dataKey="Energy" stroke={COLORS.energy} fill="url(#gradEnergy)" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
                  <Area type="monotone" dataKey="Moods" stroke={COLORS.moods} fill="none" strokeWidth={1.5} dot={false} strokeDasharray="4 2" activeDot={{ r: 3 }} />
                  <Area type="monotone" dataKey="Symptoms" stroke={COLORS.symptoms} fill="none" strokeWidth={1.5} dot={false} strokeDasharray="4 2" activeDot={{ r: 3 }} />
                  <Area type="monotone" dataKey="Exercise" stroke={COLORS.exercise} fill="none" strokeWidth={1} dot={false} strokeDasharray="2 2" activeDot={{ r: 2 }} />
                  <Area type="monotone" dataKey="Journal Mood" stroke={COLORS.journalMood} fill="none" strokeWidth={1} dot={false} strokeDasharray="3 3" activeDot={{ r: 2 }} />
                  <Area type="monotone" dataKey="LH Level" stroke={COLORS.lh} fill="none" strokeWidth={1} dot={false} strokeDasharray="5 2" activeDot={{ r: 2 }} />
                  <Area type="monotone" dataKey="Workout Min" stroke={COLORS.workout} fill="none" strokeWidth={1.5} dot={false} strokeDasharray="4 2" activeDot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Clinical & Wellness Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-lavender" />
              Clinical Scores (VAS)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.slice(-14)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 7, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 7 }} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Pain" fill={COLORS.pain} radius={[2, 2, 0, 0]} opacity={0.8} />
                  <Bar dataKey="Fatigue" fill={COLORS.fatigue} radius={[2, 2, 0, 0]} opacity={0.8} />
                  <Bar dataKey="Clinical Mood" fill={COLORS.clinicalMood} radius={[2, 2, 0, 0]} opacity={0.8} />
                  <Bar dataKey="Bloating" fill={COLORS.bloating} radius={[2, 2, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-peach" />
              Wellness Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Temperature & Fertility */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-peach" />
              Temperature & Fertility Markers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradBBT" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.temperature} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.temperature} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradLH" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.lh} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.lh} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '9px' }} />
                  <Area type="monotone" dataKey="BBT" stroke={COLORS.temperature} fill="url(#gradBBT)" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                  <Area type="monotone" dataKey="LH Level" stroke={COLORS.lh} fill="url(#gradLH)" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Export data builder for PDF usage
export function buildComprehensiveDashboardData(
  logs: DayLog[],
  clinicalAssessments: ClinicalAssessment[],
  journalEntries: JournalEntry[],
  fertilityLogs: FertilityLog[],
  workoutLogs: WorkoutLog[] = [],
  days = 30
): ComprehensiveDataPoint[] {
  const today = startOfDay(new Date());
  const logMap = new Map(logs.map(l => [l.date, l]));
  const clinicalMap = new Map(clinicalAssessments.map(a => [a.date, a]));
  const journalMap = new Map(journalEntries.map(e => [e.date, e]));
  const fertilityMap = new Map(fertilityLogs.map(f => [f.date, f]));
  const workoutMap = new Map<string, { duration: number; calories: number }>();
  workoutLogs.forEach(w => {
    const existing = workoutMap.get(w.date) || { duration: 0, calories: 0 };
    workoutMap.set(w.date, {
      duration: existing.duration + (w.duration_minutes || 0),
      calories: existing.calories + (w.calories_burned || 0),
    });
  });

  const data: ComprehensiveDataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(today, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const log = logMap.get(dateStr);
    const clinical = clinicalMap.get(dateStr);
    const journal = journalMap.get(dateStr);
    const fertility = fertilityMap.get(dateStr);
    const workout = workoutMap.get(dateStr);

    data.push({
      date: format(day, 'd'),
      flow: flowToValue(log),
      moods: log?.moods?.length || 0,
      symptoms: log?.symptoms?.length || 0,
      sleep: log?.sleepHours || 0,
      water: log?.waterIntake || 0,
      exercise: (log?.exerciseMinutes || 0) / 10,
      bbt: log?.temperature ? log.temperature - 36 : 0,
      pain: clinical?.painVas || 0,
      fatigue: clinical?.fatigueVas || 0,
      clinicalMood: clinical?.moodVas || 0,
      bloating: clinical?.bloatingVas || 0,
      journalMood: journal?.mood_rating || 0,
      energy: journal?.energy_level || 0,
      lh: fertility?.lh_level || 0,
      workoutMin: workout?.duration || 0,
      workoutCal: workout?.calories || 0,
    });
  }
  return data;
}
