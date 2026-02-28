import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitCompare, Calendar, Activity, Droplets, ThermometerSun, TrendingUp, AlertTriangle } from 'lucide-react';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { CustomTooltip } from '@/components/ui/custom-tooltip';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import type { DayLog, CycleData } from '@/types/period';

interface CycleComparisonViewProps {
  logs: DayLog[];
  cycles: CycleData[];
}

const SYMPTOM_LABELS: Record<string, string> = {
  cramps: 'Cramps', headache: 'Headache', backache: 'Backache', bloating: 'Bloating',
  breast_tenderness: 'Breast Tenderness', acne: 'Acne', fatigue: 'Fatigue',
  insomnia: 'Insomnia', nausea: 'Nausea', cravings: 'Cravings',
};

const COLORS = ['hsl(var(--primary))', 'hsl(280, 65%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)'];

export function CycleComparisonView({ logs, cycles }: CycleComparisonViewProps) {
  const [selectedCycles, setSelectedCycles] = useState<string[]>([]);

  const cycleSummaries = useMemo(() => {
    return cycles.filter(c => c.endDate).map((cycle, i) => {
      const start = parseISO(cycle.startDate);
      const end = cycle.endDate ? parseISO(cycle.endDate) : addDays(start, 28);
      const length = cycle.length || differenceInDays(end, start);
      const cycleLogs = logs.filter(l => {
        const d = parseISO(l.date);
        return d >= start && d <= end;
      });

      const periodDays = cycleLogs.filter(l => l.isPeriod).length;
      const avgMoodCount = cycleLogs.filter(l => l.moods.length > 0).length;
      const avgSymptomCount = cycleLogs.reduce((s, l) => s + l.symptoms.length, 0);
      const avgWater = cycleLogs.filter(l => l.waterIntake).reduce((s, l) => s + (l.waterIntake || 0), 0) / Math.max(cycleLogs.filter(l => l.waterIntake).length, 1);
      const avgSleep = cycleLogs.filter(l => l.sleepHours).reduce((s, l) => s + (l.sleepHours || 0), 0) / Math.max(cycleLogs.filter(l => l.sleepHours).length, 1);
      const avgTemp = cycleLogs.filter(l => l.temperature).reduce((s, l) => s + (l.temperature || 0), 0) / Math.max(cycleLogs.filter(l => l.temperature).length, 1);

      // Symptom frequency
      const symptomFreq: Record<string, number> = {};
      cycleLogs.forEach(l => l.symptoms.forEach(s => { symptomFreq[s] = (symptomFreq[s] || 0) + 1; }));

      // Day-by-day data for overlay
      const dayData = Array.from({ length: length }, (_, day) => {
        const dayLog = cycleLogs.find(l => differenceInDays(parseISO(l.date), start) === day);
        return {
          day: day + 1,
          symptoms: dayLog?.symptoms.length || 0,
          moods: dayLog?.moods.length || 0,
          sleep: dayLog?.sleepHours || null,
          water: dayLog?.waterIntake || null,
          temp: dayLog?.temperature || null,
          isPeriod: dayLog?.isPeriod || false,
        };
      });

      return {
        id: cycle.startDate,
        label: `Cycle ${cycles.length - i}`,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        length,
        periodDays,
        avgMoodCount,
        avgSymptomCount,
        avgWater: Number(avgWater.toFixed(1)),
        avgSleep: Number(avgSleep.toFixed(1)),
        avgTemp: Number(avgTemp.toFixed(1)),
        symptomFreq,
        dayData,
      };
    });
  }, [logs, cycles]);

  // Auto-select last 2 cycles
  const selected = selectedCycles.length > 0 ? selectedCycles : cycleSummaries.slice(0, 2).map(c => c.id);
  const comparedCycles = cycleSummaries.filter(c => selected.includes(c.id));

  // Build overlay chart data
  const maxDays = Math.max(...comparedCycles.map(c => c.length), 0);
  const overlayData = Array.from({ length: maxDays }, (_, i) => {
    const point: Record<string, any> = { day: i + 1 };
    comparedCycles.forEach((c, ci) => {
      const dayInfo = c.dayData[i];
      point[`symptoms_${ci}`] = dayInfo?.symptoms || 0;
      point[`sleep_${ci}`] = dayInfo?.sleep;
    });
    return point;
  });

  // Radar chart data
  const radarData = ['cramps', 'headache', 'bloating', 'fatigue', 'acne', 'insomnia'].map(symptom => {
    const point: Record<string, any> = { symptom: SYMPTOM_LABELS[symptom] || symptom };
    comparedCycles.forEach((c, ci) => {
      point[`cycle_${ci}`] = c.symptomFreq[symptom] || 0;
    });
    return point;
  });

  // Anomaly detection
  const anomalies = useMemo(() => {
    if (cycleSummaries.length < 3) return [];
    const lengths = cycleSummaries.map(c => c.length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const std = Math.sqrt(lengths.reduce((s, l) => s + (l - avg) ** 2, 0) / lengths.length);
    return cycleSummaries.filter(c => Math.abs(c.length - avg) > std * 1.5).map(c => ({
      cycle: c.label,
      length: c.length,
      deviation: Math.round(Math.abs(c.length - avg)),
    }));
  }, [cycleSummaries]);

  // Regularity score
  const regularityScore = useMemo(() => {
    if (cycleSummaries.length < 2) return null;
    const lengths = cycleSummaries.map(c => c.length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((s, l) => s + (l - avg) ** 2, 0) / lengths.length;
    return Math.max(0, Math.round(100 - variance * 2));
  }, [cycleSummaries]);

  if (cycles.length < 2) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <GitCompare className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Cycle Comparison</h2>
        </div>
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          You need at least 2 completed cycles to compare. Keep tracking!
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <GitCompare className="h-6 w-6 text-primary" /> Cycle Comparison
            </h2>
            <p className="text-muted-foreground text-sm">Compare patterns across cycles</p>
          </div>
          {regularityScore !== null && (
            <Badge variant={regularityScore > 70 ? 'default' : 'secondary'} className="text-sm">
              Regularity: {regularityScore}%
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Cycle Selector */}
      <Card>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground mb-2">Select cycles to compare (up to 4):</p>
          <div className="flex flex-wrap gap-2">
            {cycleSummaries.map((c, i) => (
              <Badge
                key={c.id}
                variant={selected.includes(c.id) ? 'default' : 'outline'}
                className="cursor-pointer transition-all"
                onClick={() => {
                  if (selected.includes(c.id)) {
                    setSelectedCycles(selected.filter(s => s !== c.id));
                  } else if (selected.length < 4) {
                    setSelectedCycles([...selected, c.id]);
                  }
                }}
              >
                {c.label} ({c.length}d)
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Comparison</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground">Metric</th>
                {comparedCycles.map((c, i) => (
                  <th key={c.id} className="text-center py-2" style={{ color: COLORS[i] }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Length', key: 'length', suffix: ' days' },
                { label: 'Period Days', key: 'periodDays', suffix: '' },
                { label: 'Symptoms', key: 'avgSymptomCount', suffix: '' },
                { label: 'Avg Sleep', key: 'avgSleep', suffix: 'h' },
                { label: 'Avg Water', key: 'avgWater', suffix: ' cups' },
              ].map(row => (
                <tr key={row.key} className="border-b border-border/50">
                  <td className="py-2 text-muted-foreground">{row.label}</td>
                  {comparedCycles.map(c => (
                    <td key={c.id} className="text-center py-2 font-medium text-foreground">
                      {(c as any)[row.key]}{row.suffix}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Symptom Overlay */}
      {overlayData.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Symptom Intensity Overlay</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>

              <AreaChart data={overlayData}>
                <defs>
                  {comparedCycles.map((c, i) => (
                    <linearGradient key={`grad_${c.id}`} id={`grad_${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[i]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" label={{ value: 'Cycle Day', position: 'bottom', offset: -5 }} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {comparedCycles.map((c, i) => (
                  <Area key={c.id} type="monotone" dataKey={`symptoms_${i}`} name={c.label} stroke={COLORS[i]} fill={`url(#grad_${i})`} strokeWidth={2} dot={false} fillOpacity={1} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Radar Chart */}
      {radarData.some(d => Object.values(d).some(v => typeof v === 'number' && v > 0)) && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Symptom Radar</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis dataKey="symptom" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                {comparedCycles.map((c, i) => (
                  <Radar key={c.id} name={c.label} dataKey={`cycle_${i}`} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Anomaly Alerts */}
      {anomalies.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Anomaly Detection</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {anomalies.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-700">{a.cycle}</Badge>
                <span className="text-muted-foreground">{a.length} days — deviates by {a.deviation} days from average</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
