import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CuteLoader } from './CuteLoader';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { FileText, Download, Calendar, Activity, Droplets, Moon, TrendingUp, Heart, Brain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { DayLog, CycleData, CycleStats } from '@/types/period';
import type { CyclePhase } from '@/types/settings';


interface MonthlyReportViewProps {
  logs: DayLog[];
  cycles: CycleData[];
  stats: CycleStats;
  currentPhase: CyclePhase | null;
  userName?: string;
}

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(280, 65%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)'];

export function MonthlyReportView({ logs, cycles, stats, currentPhase, userName }: MonthlyReportViewProps) {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const monthStart = startOfMonth(parseISO(selectedMonth + '-01'));
  const monthEnd = endOfMonth(monthStart);

  // Filter data for selected month
  const monthLogs = logs.filter(l => {
    const d = parseISO(l.date);
    return isWithinInterval(d, { start: monthStart, end: monthEnd });
  });

  const monthCycles = cycles.filter(c => {
    const s = parseISO(c.startDate);
    return isWithinInterval(s, { start: monthStart, end: monthEnd });
  });

  // Compute monthly stats
  const periodDays = monthLogs.filter(l => l.isPeriod).length;
  const loggedDays = monthLogs.length;
  const avgSleep = monthLogs.filter(l => l.sleepHours).length > 0
    ? Number((monthLogs.filter(l => l.sleepHours).reduce((s, l) => s + (l.sleepHours || 0), 0) / monthLogs.filter(l => l.sleepHours).length).toFixed(1))
    : 0;
  const avgWater = monthLogs.filter(l => l.waterIntake).length > 0
    ? Number((monthLogs.filter(l => l.waterIntake).reduce((s, l) => s + (l.waterIntake || 0), 0) / monthLogs.filter(l => l.waterIntake).length).toFixed(1))
    : 0;
  const totalExercise = monthLogs.reduce((s, l) => s + (l.exerciseMinutes || 0), 0);

  // Symptom frequency
  const symptomFreq: Record<string, number> = {};
  monthLogs.forEach(l => l.symptoms.forEach(s => { symptomFreq[s] = (symptomFreq[s] || 0) + 1; }));
  const topSymptoms = Object.entries(symptomFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Mood frequency
  const moodFreq: Record<string, number> = {};
  monthLogs.forEach(l => l.moods.forEach(m => { moodFreq[m] = (moodFreq[m] || 0) + 1; }));
  const topMoods = Object.entries(moodFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Daily symptom chart
  const dailyChart = monthLogs.map(l => ({
    date: format(parseISO(l.date), 'dd'),
    symptoms: l.symptoms.length,
    moods: l.moods.length,
  }));

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') };
  });

  const generateAiInsights = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('monthly-report-ai', {
        body: {
          month: selectedMonth,
          monthLogs,
          periodDays,
          loggedDays,
          avgSleep,
          avgWater,
          totalExercise,
          topSymptoms,
          topMoods,
          stats,
          currentPhase,
        },
      });
      if (error) throw error;
      setAiInsights(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate AI insights');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPdf = async () => {
    setIsExporting(true);
    try {
      const { generateMonthlyReportPdf } = await import('@/utils/monthlyReportPdf');
      const { loadLogo } = await import('@/utils/pdfUtils');
      const logoModule = await import('@/assets/logo-pdf.png');
      const logoBase64 = await loadLogo(logoModule.default);
      await generateMonthlyReportPdf({
        monthLabel: format(monthStart, 'MMMM yyyy'),
        userName,
        loggedDays,
        periodDays,
        avgSleep,
        avgWater,
        totalExercise,
        topSymptoms,
        topMoods,
        dailyChart,
        stats,
        currentPhase,
        aiInsights,
        monthLogs,
      }, logoBase64);
      toast.success('Report exported!');
    } catch (err) {
      toast.error('Failed to export PDF');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Monthly Report
            </h2>
            <p className="text-muted-foreground text-sm">Comprehensive monthly health summary</p>
          </div>
          <Select value={selectedMonth} onValueChange={v => { setSelectedMonth(v); setAiInsights(null); }}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'Logged', value: loggedDays, icon: Calendar, color: 'text-primary' },
          { label: 'Period', value: `${periodDays}d`, icon: Droplets, color: 'text-red-500' },
          { label: 'Sleep', value: `${avgSleep}h`, icon: Moon, color: 'text-indigo-500' },
          { label: 'Water', value: avgWater, icon: Droplets, color: 'text-blue-500' },
          { label: 'Exercise', value: `${totalExercise}m`, icon: Activity, color: 'text-green-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="text-center">
              <CardContent className="p-2">
                <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
                <p className="text-sm font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Daily Activity Chart */}
      {dailyChart.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Daily Activity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip />
                <Bar dataKey="symptoms" fill="hsl(var(--primary))" name="Symptoms" radius={[2, 2, 0, 0]} />
                <Bar dataKey="moods" fill="hsl(280, 65%, 60%)" name="Moods" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Symptoms & Moods */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs">Top Symptoms</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {topSymptoms.length === 0 ? <p className="text-xs text-muted-foreground">None logged</p> : topSymptoms.map(([s, c]) => (
              <div key={s} className="flex justify-between text-xs">
                <span className="text-foreground capitalize">{s.replace('_', ' ')}</span>
                <Badge variant="secondary" className="text-[10px]">{c}d</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs">Top Moods</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {topMoods.length === 0 ? <p className="text-xs text-muted-foreground">None logged</p> : topMoods.map(([m, c]) => (
              <div key={m} className="flex justify-between text-xs">
                <span className="text-foreground capitalize">{m}</span>
                <Badge variant="secondary" className="text-[10px]">{c}d</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> AI Health Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!aiInsights && !isGenerating && (
            <Button onClick={generateAiInsights} className="w-full" variant="outline">
              <Brain className="h-4 w-4 mr-2" /> Generate AI Insights for {format(monthStart, 'MMMM')}
            </Button>
          )}
          {isGenerating && <CuteLoader message="Analyzing your month..." />}
          {aiInsights && (
            <div className="space-y-4">
              {aiInsights.wellnessScore && (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                    <span className="text-2xl font-bold text-primary">{aiInsights.wellnessScore}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Wellness Score</p>
                </div>
              )}
              {aiInsights.summary && <p className="text-sm text-foreground">{aiInsights.summary}</p>}
              {aiInsights.highlights?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Highlights</p>
                  {aiInsights.highlights.map((h: string, i: number) => (
                    <p key={i} className="text-sm text-foreground flex gap-2"><Heart className="h-3 w-3 text-primary mt-1 flex-shrink-0" />{h}</p>
                  ))}
                </div>
              )}
              {aiInsights.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Recommendations</p>
                  {aiInsights.recommendations.map((r: string, i: number) => (
                    <p key={i} className="text-sm text-foreground flex gap-2"><TrendingUp className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />{r}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Button onClick={exportPdf} disabled={isExporting} className="w-full" variant="outline">
        <Download className="h-4 w-4 mr-2" /> {isExporting ? 'Exporting...' : 'Export as PDF'}
      </Button>
    </div>
  );
}
