import { useMemo } from 'react';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import { DayLog } from '@/types/period';
import { BarChart3 } from 'lucide-react';

interface InsightsGraphProps {
  logs: DayLog[];
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export function InsightsGraph({ logs, days = 30 }: InsightsGraphProps) {
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const logMap = new Map(logs.map(l => [l.date, l]));

    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(today, i);
      const dateStr = format(day, 'yyyy-MM-dd');
      const log = logMap.get(dateStr);

      data.push({
        date: format(day, 'MMM d'),
        Flow: flowToValue(log),
        Moods: log?.moods?.length || 0,
        Symptoms: log?.symptoms?.length || 0,
        Sleep: log?.sleepHours || 0,
        Water: log?.waterIntake || 0,
      });
    }
    return data;
  }, [logs, days]);

  const hasData = chartData.some(d => d.Flow > 0 || d.Moods > 0 || d.Symptoms > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <BarChart3 className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">No data to display yet</p>
        <p className="text-xs mt-1">Log your daily data to see the insights graph</p>
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tickCount={6}
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          />
          <Line type="monotone" dataKey="Flow" stroke="hsl(355, 70%, 60%)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="Moods" stroke="hsl(142, 55%, 55%)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="Symptoms" stroke="hsl(25, 95%, 60%)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="Sleep" stroke="hsl(263, 70%, 65%)" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} strokeDasharray="4 2" />
          <Line type="monotone" dataKey="Water" stroke="hsl(200, 70%, 55%)" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Export data builder for PDF usage
export function buildInsightsData(logs: DayLog[], days = 30) {
  const today = startOfDay(new Date());
  const logMap = new Map(logs.map(l => [l.date, l]));
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(today, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const log = logMap.get(dateStr);
    data.push({
      date: format(day, 'd'),
      flow: flowToValue(log),
      moods: log?.moods?.length || 0,
      symptoms: log?.symptoms?.length || 0,
      sleep: log?.sleepHours || 0,
      water: log?.waterIntake || 0,
    });
  }
  return data;
}
