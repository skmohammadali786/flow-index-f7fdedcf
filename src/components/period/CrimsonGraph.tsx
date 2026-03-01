import { useMemo } from 'react';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { CustomTooltip } from '@/components/ui/custom-tooltip';
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DayLog } from '@/types/period';
import { Droplets } from 'lucide-react';

interface CrimsonGraphProps {
  logs: DayLog[];
  currentMonth: Date;
  onDayClick?: (date: Date) => void;
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

interface ClickableDotProps {
  cx?: number;
  cy?: number;
  payload?: any;
  onDayClick?: (date: Date) => void;
}

const ClickableDot = ({ cx, cy, payload, onDayClick }: ClickableDotProps) => {
  if (!cx || !cy || !payload || payload.value === 0) return null;

  const intensityColors: Record<number, string> = {
    1: 'hsl(355, 60%, 80%)',
    2: 'hsl(355, 65%, 70%)',
    3: 'hsl(355, 70%, 60%)',
    4: 'hsl(355, 75%, 50%)',
  };

  return (
    <g
      onClick={() => {
        if (onDayClick && payload.rawDate) {
          onDayClick(parseISO(payload.rawDate));
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* Larger invisible hit area */}
      <circle cx={cx} cy={cy} r={12} fill="transparent" />
      {/* Outer glow */}
      <circle cx={cx} cy={cy} r={7} fill={intensityColors[payload.value] || 'hsl(355, 70%, 65%)'} opacity={0.3} />
      {/* Inner dot */}
      <circle cx={cx} cy={cy} r={4.5} fill={intensityColors[payload.value] || 'hsl(355, 70%, 65%)'} stroke="white" strokeWidth={2} />
    </g>
  );
};

const ActiveClickableDot = ({ cx, cy, payload, onDayClick }: ClickableDotProps) => {
  if (!cx || !cy || !payload) return null;

  return (
    <g
      onClick={() => {
        if (onDayClick && payload.rawDate) {
          onDayClick(parseISO(payload.rawDate));
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <circle cx={cx} cy={cy} r={14} fill="transparent" />
      <circle cx={cx} cy={cy} r={9} fill="hsl(355, 70%, 65%)" opacity={0.2} />
      <circle cx={cx} cy={cy} r={6} fill="hsl(355, 70%, 65%)" stroke="white" strokeWidth={2.5} />
    </g>
  );
};

export function CrimsonGraph({ logs, currentMonth, onDayClick }: CrimsonGraphProps) {
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const logMap = new Map(logs.map(l => [l.date, l]));

    const data = [];
    for (let i = 29; i >= 0; i--) {
      const day = subDays(today, i);
      const dateStr = format(day, 'yyyy-MM-dd');
      const log = logMap.get(dateStr);
      data.push({
        date: format(day, 'MMM d'),
        rawDate: dateStr,
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
                <linearGradient id="multiStopGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ff00ff" stopOpacity={0.8} />
                  <stop offset="25%" stopColor="#ff69b4" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#ff7f50" stopOpacity={0.8} />
                  <stop offset="75%" stopColor="#ffa500" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#ffbf00" stopOpacity={0.8} />
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
                stroke="url(#multiStopGrad)"
                strokeWidth={2.5}
                fill="url(#multiStopGrad)"
                dot={<ClickableDot onDayClick={onDayClick} />}
                activeDot={<ActiveClickableDot onDayClick={onDayClick} />}
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

// Export utilities for reuse in partner share
export { flowToValue, flowLabels };
