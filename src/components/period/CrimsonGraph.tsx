import { useMemo } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DayLog } from '@/types/period';
import { Droplets } from 'lucide-react';

interface CrimsonGraphProps {
  logs: DayLog[];
  currentMonth: Date;
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

const flowLabels: Record<number, string> = {
  0: 'None',
  1: 'Spotting',
  2: 'Light',
  3: 'Medium',
  4: 'Heavy',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const value = payload[0].value as number;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-coral flex items-center gap-1">
        <Droplets className="h-3 w-3" />
        {flowLabels[value] || 'None'}
      </p>
    </div>
  );
};

export function CrimsonGraph({ logs, currentMonth }: CrimsonGraphProps) {
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const logMap = new Map(logs.map(l => [l.date, l]));

    // Show last 30 days of data
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const day = subDays(today, i);
      const dateStr = format(day, 'yyyy-MM-dd');
      const log = logMap.get(dateStr);
      data.push({
        date: format(day, 'MMM d'),
        value: flowToValue(log),
        raw: log,
      });
    }
    return data;
  }, [logs, currentMonth]);

  const hasAnyFlow = chartData.some(d => d.value > 0);

  return (
    <div className="bg-card rounded-2xl shadow-card p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Droplets className="h-5 w-5 text-coral" />
        <h3 className="text-base font-display font-semibold text-foreground">Crimson Graph</h3>
        <span className="text-xs text-muted-foreground ml-auto">Last 30 days</span>
      </div>

      {!hasAnyFlow ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Droplets className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No period flow data logged yet</p>
          <p className="text-xs mt-1">Log your period days to see the flow chart</p>
        </div>
      ) : (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="crimsonGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(355, 70%, 65%)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(355, 70%, 65%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tickCount={6}
              />
              <YAxis
                domain={[0, 4]}
                ticks={[0, 1, 2, 3, 4]}
                tickFormatter={(v: number) => flowLabels[v]?.[0] || ''}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(355, 70%, 65%)"
                strokeWidth={2.5}
                fill="url(#crimsonGradient)"
                dot={false}
                activeDot={{ r: 5, fill: 'hsl(355, 70%, 65%)', strokeWidth: 2, stroke: 'white' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mini legend */}
      <div className="flex justify-center gap-3 mt-3 text-xs text-muted-foreground">
        {['Spotting', 'Light', 'Medium', 'Heavy'].map((label, i) => (
          <div key={label} className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: `hsl(355, 70%, ${75 - i * 8}%)` }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
