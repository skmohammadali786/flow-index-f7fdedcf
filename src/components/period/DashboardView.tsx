import { useMemo } from 'react';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, BarChart, Bar,
} from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DayLog } from '@/types/period';
import { CyclePhase } from '@/types/settings';
import type { ClinicalAssessment } from '@/hooks/useClinicalAssessments';
import type { JournalEntry } from '@/hooks/useWellnessJournal';
import type { FertilityLog } from '@/hooks/useFertilityTracker';
import {
  LayoutDashboard, TrendingUp, Heart, Droplets, Moon, Dumbbell,
  Thermometer, Brain, Activity, Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  logs: DayLog[];
  clinicalAssessments: ClinicalAssessment[];
  journalEntries: JournalEntry[];
  fertilityLogs: FertilityLog[];
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
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const nonZero = payload.filter((p: any) => p.value > 0);
  if (nonZero.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-xs space-y-1.5 max-w-[200px]">
      <p className="font-bold text-foreground text-sm">{label}</p>
      {nonZero.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          <span className="font-medium">{p.name}:</span> {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

export function DashboardView({
  logs,
  clinicalAssessments,
  journalEntries,
  fertilityLogs,
  currentPhase,
  days = 30,
}: DashboardViewProps) {
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const logMap = new Map(logs.map(l => [l.date, l]));
    const clinicalMap = new Map(clinicalAssessments.map(a => [a.date, a]));
    const journalMap = new Map(journalEntries.map(e => [e.date, e]));
    const fertilityMap = new Map(fertilityLogs.map(f => [f.date, f]));

    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(today, i);
      const dateStr = format(day, 'yyyy-MM-dd');
      const log = logMap.get(dateStr);
      const clinical = clinicalMap.get(dateStr);
      const journal = journalMap.get(dateStr);
      const fertility = fertilityMap.get(dateStr);

      data.push({
        date: format(day, 'MMM d'),
        Flow: flowToValue(log),
        Moods: log?.moods?.length || 0,
        Symptoms: log?.symptoms?.length || 0,
        Sleep: log?.sleepHours || 0,
        Water: log?.waterIntake || 0,
        Exercise: (log?.exerciseMinutes || 0) / 10, // Scale down for visibility
        'BBT': log?.temperature ? log.temperature - 36 : 0, // Offset for visibility
        Pain: clinical?.painVas || 0,
        Fatigue: clinical?.fatigueVas || 0,
        'Clinical Mood': clinical?.moodVas || 0,
        Bloating: clinical?.bloatingVas || 0,
        'Journal Mood': journal?.mood_rating || 0,
        Energy: journal?.energy_level || 0,
        'LH Level': fertility?.lh_level || 0,
      });
    }
    return data;
  }, [logs, clinicalAssessments, journalEntries, fertilityLogs, days]);

  // Summary radar data
  const radarData = useMemo(() => {
    const totals = chartData.reduce(
      (acc, d) => ({
        flow: acc.flow + d.Flow,
        moods: acc.moods + d.Moods,
        symptoms: acc.symptoms + d.Symptoms,
        sleep: acc.sleep + d.Sleep,
        water: acc.water + d.Water,
        exercise: acc.exercise + d.Exercise,
        pain: acc.pain + d.Pain,
        energy: acc.energy + d.Energy,
      }),
      { flow: 0, moods: 0, symptoms: 0, sleep: 0, water: 0, exercise: 0, pain: 0, energy: 0 }
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
    ];
  }, [chartData]);

  // Quick stats
  const quickStats = useMemo(() => {
    const daysWithData = chartData.filter(d =>
      d.Flow > 0 || d.Moods > 0 || d.Symptoms > 0 || d.Sleep > 0 || d.Water > 0
    ).length;
    const avgSleep = chartData.reduce((s, d) => s + d.Sleep, 0) / Math.max(chartData.filter(d => d.Sleep > 0).length, 1);
    const avgWater = chartData.reduce((s, d) => s + d.Water, 0) / Math.max(chartData.filter(d => d.Water > 0).length, 1);
    const periodDays = chartData.filter(d => d.Flow > 0).length;
    const avgEnergy = chartData.reduce((s, d) => s + d.Energy, 0) / Math.max(chartData.filter(d => d.Energy > 0).length, 1);
    const avgPain = chartData.reduce((s, d) => s + d.Pain, 0) / Math.max(chartData.filter(d => d.Pain > 0).length, 1);

    return { daysWithData, avgSleep, avgWater, periodDays, avgEnergy, avgPain };
  }, [chartData]);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg gradient-primary">
          <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Complete health overview — {days} days</p>
        </div>
      </div>

      {/* Quick Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Logged', value: `${quickStats.daysWithData}d`, icon: Activity, color: 'text-primary' },
          { label: 'Period', value: `${quickStats.periodDays}d`, icon: Heart, color: 'text-coral' },
          { label: 'Avg Sleep', value: `${quickStats.avgSleep.toFixed(1)}h`, icon: Moon, color: 'text-lavender' },
          { label: 'Avg Water', value: `${quickStats.avgWater.toFixed(0)}`, icon: Droplets, color: 'text-fertility' },
          { label: 'Avg Energy', value: `${quickStats.avgEnergy.toFixed(1)}`, icon: Sparkles, color: 'text-peach' },
          { label: 'Avg Pain', value: `${quickStats.avgPain.toFixed(1)}`, icon: Thermometer, color: 'text-destructive' },
        ].map(stat => (
          <Card key={stat.label} className="p-2 text-center border-border/50">
            <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </motion.div>

      {/* Main Comprehensive Area Chart */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Complete Wellness Timeline
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
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Clinical & Wellness Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Clinical VAS Chart */}
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

        {/* Wellness Radar */}
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

      {/* Temperature & Fertility Row */}
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
  days = 30
) {
  const today = startOfDay(new Date());
  const logMap = new Map(logs.map(l => [l.date, l]));
  const clinicalMap = new Map(clinicalAssessments.map(a => [a.date, a]));
  const journalMap = new Map(journalEntries.map(e => [e.date, e]));
  const fertilityMap = new Map(fertilityLogs.map(f => [f.date, f]));

  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(today, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const log = logMap.get(dateStr);
    const clinical = clinicalMap.get(dateStr);
    const journal = journalMap.get(dateStr);
    const fertility = fertilityMap.get(dateStr);

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
    });
  }
  return data;
}
