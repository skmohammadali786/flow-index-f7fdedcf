import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, startOfDay } from 'date-fns';
import { Egg, Droplets, TestTube, Heart, TrendingUp, AlertCircle, ThermometerSun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid, Legend } from 'recharts';
import { FertilityLog, useFertilityTracker } from '@/hooks/useFertilityTracker';
import { useReportDraft } from '@/contexts/ReportDraftContext';
import { DayLog } from '@/types/period';

interface FertilityTrackingViewProps {
  periodLogs: DayLog[];
  initialDate?: Date;
}

const OPK_OPTIONS = [
  { value: 'negative', label: 'Negative', color: 'bg-muted text-muted-foreground' },
  { value: 'low', label: 'Low', color: 'bg-sage-light text-sage' },
  { value: 'high', label: 'High', color: 'bg-peach-light text-accent-foreground' },
  { value: 'peak', label: 'Peak', color: 'bg-coral-light text-primary' },
];

const CM_OPTIONS = [
  { value: 'dry', label: 'Dry', emoji: '○' },
  { value: 'sticky', label: 'Sticky', emoji: '◐' },
  { value: 'creamy', label: 'Creamy', emoji: '◑' },
  { value: 'watery', label: 'Watery', emoji: '◕' },
  { value: 'egg_white', label: 'Egg White', emoji: '●' },
];

const CERVIX_POS = ['low', 'medium', 'high'];
const CERVIX_FIRM = ['firm', 'medium', 'soft'];

export function FertilityTrackingView({ periodLogs, initialDate }: FertilityTrackingViewProps) {
  const {
    fertilityLogs,
    saveFertilityLog,
    getFertilityLogForDate,
    detectLHSurge,
    detectBBTShift,
  } = useFertilityTracker();

  const { setFertilityDraft } = useReportDraft();

  const [selectedDate, setSelectedDate] = useState(initialDate ? startOfDay(initialDate) : startOfDay(new Date()));

  // Update selectedDate when initialDate changes
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(startOfDay(initialDate));
    }
  }, [initialDate]);

  const currentLog = getFertilityLogForDate(selectedDate);

  const [opk, setOpk] = useState(currentLog?.opk_result || '');
  const [cm, setCm] = useState(currentLog?.cervical_mucus || '');
  const [lh, setLh] = useState(currentLog?.lh_level?.toString() || '');
  const [intercourse, setIntercourse] = useState(currentLog?.intercourse || false);
  const [intercourseProt, setIntercourseProt] = useState(currentLog?.intercourse_protected || false);
  const [cervixPos, setCervixPos] = useState(currentLog?.cervix_position || '');
  const [cervixFirm, setCervixFirm] = useState(currentLog?.cervix_firmness || '');
  const [notes, setNotes] = useState(currentLog?.notes || '');

  // Sync draft state for PDF reports
  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    setFertilityDraft(dateStr, {
      opk_result: opk as any || null,
      cervical_mucus: cm as any || null,
      lh_level: lh ? parseFloat(lh) : null,
      intercourse,
      intercourse_protected: intercourse ? intercourseProt : null,
      cervix_position: cervixPos as any || null,
      cervix_firmness: cervixFirm as any || null,
      notes: notes?.slice(0, 500) || null,
    });
  }, [selectedDate, opk, cm, lh, intercourse, intercourseProt, cervixPos, cervixFirm, notes, setFertilityDraft]);

  // Update form when date changes
  const handleDateChange = (days: number) => {
    const newDate = subDays(selectedDate, -days);
    setSelectedDate(newDate);
    const log = getFertilityLogForDate(newDate);
    setOpk(log?.opk_result || '');
    setCm(log?.cervical_mucus || '');
    setLh(log?.lh_level?.toString() || '');
    setIntercourse(log?.intercourse || false);
    setIntercourseProt(log?.intercourse_protected || false);
    setCervixPos(log?.cervix_position || '');
    setCervixFirm(log?.cervix_firmness || '');
    setNotes(log?.notes || '');
  };

  const handleSave = async () => {
    await saveFertilityLog(selectedDate, {
      opk_result: opk as any || null,
      cervical_mucus: cm as any || null,
      lh_level: lh ? parseFloat(lh) : null,
      intercourse,
      intercourse_protected: intercourse ? intercourseProt : null,
      cervix_position: cervixPos as any || null,
      cervix_firmness: cervixFirm as any || null,
      notes: notes?.slice(0, 500) || null,
    });
  };

  const lhSurge = detectLHSurge();
  const bbtShift = detectBBTShift(periodLogs);

  // Chart data: last 30 days of fertility signs
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const fLog = fertilityLogs.find(l => l.date === dateStr);
      const pLog = periodLogs.find(l => l.date === dateStr);
      
      const cmScore = { dry: 1, sticky: 2, creamy: 3, watery: 4, egg_white: 5 }[fLog?.cervical_mucus || ''] || 0;
      const opkScore = { negative: 0, low: 1, high: 2, peak: 3 }[fLog?.opk_result || ''] || 0;

      days.push({
        date: format(d, 'MMM d'),
        bbt: pLog?.temperature || null,
        lh: fLog?.lh_level || null,
        cm: cmScore || null,
        opk: opkScore || null,
        intercourse: fLog?.intercourse ? 1 : 0,
      });
    }
    return days;
  }, [fertilityLogs, periodLogs]);

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4 border-none shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <TestTube className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">LH Surge</span>
            </div>
            {lhSurge.detected ? (
              <div>
                <Badge className="bg-coral-light text-primary text-xs">Detected</Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {lhSurge.daysAgo === 0 ? 'Today' : `${lhSurge.daysAgo}d ago`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Not yet detected</p>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-4 border-none shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <ThermometerSun className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">BBT Shift</span>
            </div>
            {bbtShift.shifted ? (
              <div>
                <Badge className="bg-peach-light text-accent-foreground text-xs">Confirmed</Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Shift on {bbtShift.shiftDate ? format(new Date(bbtShift.shiftDate), 'MMM d') : ''}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Log BBT daily</p>
            )}
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="log" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="log">Daily Log</TabsTrigger>
          <TabsTrigger value="charts">Fertility Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-4 mt-4">
          {/* Date Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => handleDateChange(-1)}>← Prev</Button>
            <span className="font-medium">{format(selectedDate, 'MMM d, yyyy')}</span>
            <Button variant="ghost" size="sm" onClick={() => handleDateChange(1)}>Next →</Button>
          </div>

          {/* OPK */}
          <Card className="p-4 border-none shadow-card space-y-3">
            <div className="flex items-center gap-2">
              <TestTube className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">OPK Result</span>
            </div>
            <div className="flex gap-2">
              {OPK_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  variant={opk === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className={cn('flex-1 text-xs', opk === opt.value && opt.color)}
                  onClick={() => setOpk(opk === opt.value ? '' : opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </Card>

          {/* Cervical Mucus */}
          <Card className="p-4 border-none shadow-card space-y-3">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-lavender" />
              <span className="font-medium text-sm">Cervical Mucus</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {CM_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  variant={cm === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setCm(cm === opt.value ? '' : opt.value)}
                >
                  {opt.emoji} {opt.label}
                </Button>
              ))}
            </div>
          </Card>

          {/* LH Level */}
          <Card className="p-4 border-none shadow-card space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sage" />
              <span className="font-medium text-sm">LH Level (mIU/mL)</span>
            </div>
            <Input
              type="number"
              placeholder="e.g. 25.5"
              value={lh}
              onChange={e => setLh(e.target.value)}
              className="text-sm"
            />
          </Card>

          {/* Cervix */}
          <Card className="p-4 border-none shadow-card space-y-3">
            <span className="font-medium text-sm">Cervix Position & Firmness</span>
            <div className="grid grid-cols-2 gap-3">
              <Select value={cervixPos} onValueChange={setCervixPos}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Position" /></SelectTrigger>
                <SelectContent>
                  {CERVIX_POS.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={cervixFirm} onValueChange={setCervixFirm}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Firmness" /></SelectTrigger>
                <SelectContent>
                  {CERVIX_FIRM.map(f => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Intercourse */}
          <Card className="p-4 border-none shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-coral" />
                <span className="font-medium text-sm">Intercourse</span>
              </div>
              <Switch checked={intercourse} onCheckedChange={setIntercourse} />
            </div>
            {intercourse && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Protected</span>
                <Switch checked={intercourseProt} onCheckedChange={setIntercourseProt} />
              </div>
            )}
          </Card>

          {/* Notes */}
          <Textarea
            placeholder="Additional notes..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={500}
            className="text-sm"
          />

          <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground">
            Save Fertility Log
          </Button>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4 mt-4">
          {/* BBT Chart */}
          <Card className="p-4 border-none shadow-card">
            <h3 className="font-display font-semibold mb-3 text-sm">Basal Body Temperature (30 days)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="bbt" stroke="hsl(25 80% 75%)" fill="hsl(25 80% 75% / 0.2)" name="BBT °F" connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* LH + OPK Chart */}
          <Card className="p-4 border-none shadow-card">
            <h3 className="font-display font-semibold mb-3 text-sm">LH & OPK Trends</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="lh" stroke="hsl(355 70% 65%)" name="LH mIU/mL" connectNulls dot={false} />
                  <Line type="stepAfter" dataKey="opk" stroke="hsl(280 40% 75%)" name="OPK (0-3)" connectNulls dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Cervical Mucus Chart */}
          <Card className="p-4 border-none shadow-card">
            <h3 className="font-display font-semibold mb-3 text-sm">Cervical Mucus Pattern</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 9 }} tickFormatter={(v) => ['', 'Dry', 'Stky', 'Crm', 'Wtr', 'EW'][v] || ''} />
                  <Tooltip />
                  <Area type="stepAfter" dataKey="cm" stroke="hsl(140 30% 70%)" fill="hsl(140 30% 70% / 0.2)" name="CM Quality" connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Intercourse overlay */}
          <Card className="p-4 border-none shadow-card">
            <h3 className="font-display font-semibold mb-2 text-sm">Intercourse Log (30 days)</h3>
            <div className="flex flex-wrap gap-1">
              {chartData.map((d, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-6 h-6 rounded text-[10px] flex items-center justify-center',
                    d.intercourse ? 'bg-coral-light text-primary' : 'bg-muted text-muted-foreground'
                  )}
                  title={d.date}
                >
                  {d.intercourse ? '♥' : '·'}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
