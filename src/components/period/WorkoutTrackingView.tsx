import { useState, useMemo } from 'react';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  useWorkoutTracker, WorkoutLog, WORKOUT_TYPES, WORKOUT_CATEGORIES, WorkoutCategory,
} from '@/hooks/useWorkoutTracker';
import { CuteLoader } from './CuteLoader';
import jsPDF from 'jspdf';
import {
  Dumbbell, Plus, Flame, Clock, TrendingUp, Calendar, Filter,
  Trash2, Star, Heart, BarChart3, FileDown, X,
} from 'lucide-react';
import { colors, drawRoundedRect, addPageFooter } from '@/utils/pdfUtils';

type RangeOption = 7 | 30 | 90;

const INTENSITY_OPTIONS = [
  { value: 'light', label: 'Light', color: 'hsl(142, 55%, 50%)' },
  { value: 'moderate', label: 'Moderate', color: 'hsl(45, 85%, 50%)' },
  { value: 'intense', label: 'Intense', color: 'hsl(25, 85%, 50%)' },
  { value: 'extreme', label: 'Extreme', color: 'hsl(0, 75%, 50%)' },
];

const PIE_COLORS = [
  'hsl(0, 75%, 55%)', 'hsl(220, 70%, 55%)', 'hsl(280, 65%, 55%)',
  'hsl(142, 55%, 45%)', 'hsl(330, 70%, 55%)', 'hsl(25, 85%, 50%)',
  'hsl(160, 60%, 45%)', 'hsl(15, 90%, 50%)', 'hsl(200, 60%, 55%)',
  'hsl(50, 85%, 50%)',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-xs space-y-1.5 max-w-[200px]">
      <p className="font-bold text-foreground text-sm">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color || p.fill }} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color || p.fill }} />
          <span className="font-medium">{p.name}:</span> {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

export function WorkoutTrackingView() {
  const { workoutLogs, isLoading, addWorkout, deleteWorkout } = useWorkoutTracker();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('log');
  const [range, setRange] = useState<RangeOption>(30);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formCategory, setFormCategory] = useState<string>('');
  const [formType, setFormType] = useState('');
  const [formDuration, setFormDuration] = useState('30');
  const [formCalories, setFormCalories] = useState('');
  const [formIntensity, setFormIntensity] = useState('moderate');
  const [formSets, setFormSets] = useState('');
  const [formReps, setFormReps] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formDistance, setFormDistance] = useState('');
  const [formHrAvg, setFormHrAvg] = useState('');
  const [formHrMax, setFormHrMax] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formRating, setFormRating] = useState<number>(0);

  const filteredTypes = useMemo(() =>
    formCategory ? WORKOUT_TYPES.filter(w => w.category === formCategory) : WORKOUT_TYPES
  , [formCategory]);

  const selectedWorkoutType = WORKOUT_TYPES.find(w => w.id === formType);

  const handleAutoCalories = () => {
    if (selectedWorkoutType && formDuration) {
      setFormCalories(String(Math.round(selectedWorkoutType.caloriesPerMin * parseInt(formDuration))));
    }
  };

  const handleSubmit = async () => {
    if (!formType || !formDuration) {
      toast({ title: 'Required', description: 'Please select a workout type and duration.', variant: 'destructive' });
      return;
    }
    const wt = WORKOUT_TYPES.find(w => w.id === formType)!;
    await addWorkout({
      date: formDate,
      workout_type: wt.label,
      workout_category: wt.category,
      duration_minutes: parseInt(formDuration) || 0,
      calories_burned: formCalories ? parseInt(formCalories) : null,
      intensity: formIntensity,
      sets: formSets ? parseInt(formSets) : null,
      reps: formReps ? parseInt(formReps) : null,
      weight_kg: formWeight ? parseFloat(formWeight) : null,
      distance_km: formDistance ? parseFloat(formDistance) : null,
      heart_rate_avg: formHrAvg ? parseInt(formHrAvg) : null,
      heart_rate_max: formHrMax ? parseInt(formHrMax) : null,
      notes: formNotes || null,
      rating: formRating || null,
    });
    // Reset form
    setFormType('');
    setFormCategory('');
    setFormDuration('30');
    setFormCalories('');
    setFormIntensity('moderate');
    setFormSets(''); setFormReps(''); setFormWeight(''); setFormDistance('');
    setFormHrAvg(''); setFormHrMax(''); setFormNotes(''); setFormRating(0);
    setShowForm(false);
  };

  // Filtered data by range and category
  const filteredLogs = useMemo(() => {
    const cutoff = format(subDays(new Date(), range), 'yyyy-MM-dd');
    return workoutLogs.filter(l => {
      if (l.date < cutoff) return false;
      if (categoryFilter !== 'all' && l.workout_category !== categoryFilter) return false;
      return true;
    });
  }, [workoutLogs, range, categoryFilter]);

  // Chart data: daily duration/calories over range
  const timelineData = useMemo(() => {
    const today = startOfDay(new Date());
    const map = new Map<string, { duration: number; calories: number; count: number }>();
    filteredLogs.forEach(l => {
      const existing = map.get(l.date) || { duration: 0, calories: 0, count: 0 };
      map.set(l.date, {
        duration: existing.duration + (l.duration_minutes || 0),
        calories: existing.calories + (l.calories_burned || 0),
        count: existing.count + 1,
      });
    });
    const data = [];
    for (let i = range - 1; i >= 0; i--) {
      const day = subDays(today, i);
      const dateStr = format(day, 'yyyy-MM-dd');
      const entry = map.get(dateStr);
      data.push({
        date: format(day, 'MMM d'),
        Duration: entry?.duration || 0,
        Calories: entry?.calories || 0,
        Workouts: entry?.count || 0,
      });
    }
    return data;
  }, [filteredLogs, range]);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach(l => {
      counts[l.workout_category] = (counts[l.workout_category] || 0) + 1;
    });
    return Object.entries(counts).map(([cat, count]) => {
      const info = WORKOUT_CATEGORIES.find(c => c.id === cat);
      return { name: info?.label || cat, value: count };
    }).sort((a, b) => b.value - a.value);
  }, [filteredLogs]);

  // Workout type frequency
  const typeFrequency = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach(l => {
      counts[l.workout_type] = (counts[l.workout_type] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));
  }, [filteredLogs]);

  // Intensity distribution for radar
  const intensityData = useMemo(() => {
    const counts: Record<string, number> = { light: 0, moderate: 0, intense: 0, extreme: 0 };
    filteredLogs.forEach(l => {
      if (l.intensity && counts[l.intensity] !== undefined) counts[l.intensity]++;
    });
    return Object.entries(counts).map(([k, v]) => ({
      intensity: k.charAt(0).toUpperCase() + k.slice(1),
      value: v,
    }));
  }, [filteredLogs]);

  // Summary stats
  const stats = useMemo(() => {
    const totalDuration = filteredLogs.reduce((s, l) => s + (l.duration_minutes || 0), 0);
    const totalCalories = filteredLogs.reduce((s, l) => s + (l.calories_burned || 0), 0);
    const avgDuration = filteredLogs.length > 0 ? totalDuration / filteredLogs.length : 0;
    const uniqueTypes = new Set(filteredLogs.map(l => l.workout_type)).size;
    return { totalDuration, totalCalories, avgDuration, uniqueTypes, totalWorkouts: filteredLogs.length };
  }, [filteredLogs]);

  // PDF export
  const handleExportPdf = async () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Header
    drawRoundedRect(pdf, margin, yPos, contentWidth, 30, 8, colors.primary);
    pdf.setTextColor(...colors.white);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Workout Report', margin + 12, yPos + 15);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${range}-Day Summary | ${format(new Date(), 'MMMM d, yyyy')}`, margin + 12, yPos + 24);
    yPos += 40;

    // Summary stats
    const statItems = [
      { label: 'Workouts', value: stats.totalWorkouts.toString() },
      { label: 'Total Min', value: stats.totalDuration.toString() },
      { label: 'Calories', value: stats.totalCalories.toString() },
      { label: 'Types', value: stats.uniqueTypes.toString() },
    ];
    const statW = (contentWidth - 12) / 4;
    statItems.forEach((s, i) => {
      const x = margin + i * (statW + 4);
      drawRoundedRect(pdf, x, yPos, statW, 22, 4, colors.lavenderLight);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.text);
      pdf.text(s.value, x + 6, yPos + 14);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.textMuted);
      pdf.text(s.label, x + statW - 6, yPos + 18, { align: 'right' });
    });
    yPos += 30;

    // Workout log table
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    pdf.text('Workout Log', margin, yPos + 4);
    yPos += 10;

    // Table header
    drawRoundedRect(pdf, margin, yPos, contentWidth, 8, 2, colors.lavenderLight);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    const tCols = [
      { label: 'Date', x: margin + 4 },
      { label: 'Workout', x: margin + 28 },
      { label: 'Category', x: margin + 75 },
      { label: 'Duration', x: margin + 105 },
      { label: 'Calories', x: margin + 125 },
      { label: 'Intensity', x: margin + 147 },
    ];
    tCols.forEach(c => pdf.text(c.label, c.x, yPos + 5));
    yPos += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    filteredLogs.slice(0, 50).forEach(log => {
      if (yPos > pageHeight - 30) {
        addPageFooter(pdf, pageWidth, pageHeight, margin);
        pdf.addPage();
        yPos = margin + 5;
      }
      pdf.setTextColor(...colors.text);
      pdf.text(format(parseISO(log.date), 'MMM d'), tCols[0].x, yPos + 4);
      pdf.text(log.workout_type.slice(0, 20), tCols[1].x, yPos + 4);
      pdf.text(log.workout_category, tCols[2].x, yPos + 4);
      pdf.text(`${log.duration_minutes}m`, tCols[3].x, yPos + 4);
      pdf.text(log.calories_burned ? `${log.calories_burned}` : '-', tCols[4].x, yPos + 4);
      pdf.text(log.intensity || '-', tCols[5].x, yPos + 4);
      pdf.setDrawColor(...colors.border);
      pdf.line(margin, yPos + 6, margin + contentWidth, yPos + 6);
      yPos += 8;
    });

    addPageFooter(pdf, pageWidth, pageHeight, margin);
    pdf.save(`workout-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: 'PDF Downloaded', description: 'Workout report saved.' });
  };

  if (isLoading) return <CuteLoader message="Loading workouts..." />;

  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
  const rangeOptions: { value: RangeOption; label: string }[] = [
    { value: 7, label: '7D' }, { value: 30, label: '30D' }, { value: 90, label: '90D' },
  ];

  return (
    <motion.div
      initial="hidden" animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg gradient-primary">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold">Workout Tracker</h2>
            <p className="text-sm text-muted-foreground">{stats.totalWorkouts} workouts logged</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={handleExportPdf} className="gap-1">
            <FileDown className="h-3.5 w-3.5" /> PDF
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Log
          </Button>
        </div>
      </div>

      {/* Log Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-primary/30">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Log Workout</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Select value={formCategory} onValueChange={v => { setFormCategory(v); setFormType(''); }}>
                      <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        {WORKOUT_CATEGORIES.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.emoji} {c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Workout Type</Label>
                  <Select value={formType} onValueChange={v => { setFormType(v); }}>
                    <SelectTrigger><SelectValue placeholder="Select workout" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {filteredTypes.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.emoji} {w.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Duration (min)</Label>
                    <Input type="number" value={formDuration} onChange={e => setFormDuration(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Calories</Label>
                    <div className="flex gap-1">
                      <Input type="number" value={formCalories} onChange={e => setFormCalories(e.target.value)} placeholder="Auto" />
                      <Button variant="outline" size="sm" onClick={handleAutoCalories} className="px-2 shrink-0 text-xs">Est.</Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Intensity</Label>
                    <Select value={formIntensity} onValueChange={setFormIntensity}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INTENSITY_OPTIONS.map(i => (
                          <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div><Label className="text-xs">Sets</Label><Input type="number" value={formSets} onChange={e => setFormSets(e.target.value)} placeholder="-" /></div>
                  <div><Label className="text-xs">Reps</Label><Input type="number" value={formReps} onChange={e => setFormReps(e.target.value)} placeholder="-" /></div>
                  <div><Label className="text-xs">Weight(kg)</Label><Input type="number" value={formWeight} onChange={e => setFormWeight(e.target.value)} placeholder="-" /></div>
                  <div><Label className="text-xs">Dist(km)</Label><Input type="number" value={formDistance} onChange={e => setFormDistance(e.target.value)} placeholder="-" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Avg HR</Label><Input type="number" value={formHrAvg} onChange={e => setFormHrAvg(e.target.value)} placeholder="-" /></div>
                  <div><Label className="text-xs">Max HR</Label><Input type="number" value={formHrMax} onChange={e => setFormHrMax(e.target.value)} placeholder="-" /></div>
                </div>
                <div>
                  <Label className="text-xs">Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setFormRating(s)} className="p-1">
                        <Star className={`h-5 w-5 ${s <= formRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="How did it feel?" rows={2} />
                </div>
                <Button onClick={handleSubmit} className="w-full gap-2">
                  <Dumbbell className="h-4 w-4" /> Save Workout
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="log"><Calendar className="h-4 w-4 mr-1" />History</TabsTrigger>
          <TabsTrigger value="graphs"><BarChart3 className="h-4 w-4 mr-1" />Graphs</TabsTrigger>
          <TabsTrigger value="stats"><TrendingUp className="h-4 w-4 mr-1" />Stats</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
            {rangeOptions.map(opt => (
              <button key={opt.value} onClick={() => setRange(opt.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${range === opt.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {opt.label}
              </button>
            ))}
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {WORKOUT_CATEGORIES.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.emoji} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="log" className="space-y-3 mt-3">
          {filteredLogs.length === 0 ? (
            <Card className="p-8 text-center">
              <Dumbbell className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No workouts logged yet.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}>Log your first workout</Button>
            </Card>
          ) : (
            filteredLogs.map(log => (
              <motion.div key={log.id} variants={itemVariants}>
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {WORKOUT_TYPES.find(w => w.label === log.workout_type)?.emoji || '🏋️'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{log.workout_type}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{format(parseISO(log.date), 'MMM d')}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{log.duration_minutes}m</span>
                          {log.calories_burned && <><span>·</span><span className="flex items-center gap-0.5"><Flame className="h-3 w-3" />{log.calories_burned}</span></>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{log.intensity}</Badge>
                      {log.rating && (
                        <div className="flex">
                          {Array.from({ length: log.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteWorkout(log.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {(log.sets || log.distance_km || log.notes) && (
                    <div className="mt-2 text-xs text-muted-foreground flex gap-3 flex-wrap">
                      {log.sets && <span>Sets: {log.sets}</span>}
                      {log.reps && <span>Reps: {log.reps}</span>}
                      {log.weight_kg && <span>Weight: {log.weight_kg}kg</span>}
                      {log.distance_km && <span>Distance: {log.distance_km}km</span>}
                      {log.heart_rate_avg && <span>HR: {log.heart_rate_avg}bpm</span>}
                      {log.notes && <span className="italic">"{log.notes}"</span>}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="graphs" className="space-y-4 mt-3">
          {/* Timeline */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Workout Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradDur" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradCal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(25, 85%, 50%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(25, 85%, 50%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '9px' }} />
                      <Area type="monotone" dataKey="Duration" stroke="hsl(var(--primary))" fill="url(#gradDur)" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                      <Area type="monotone" dataKey="Calories" stroke="hsl(25, 85%, 50%)" fill="url(#gradCal)" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Pie + Intensity Radar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Category Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false} fontSize={8}>
                          {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Intensity Spread</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={intensityData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="intensity" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <PolarRadiusAxis tick={false} axisLine={false} />
                        <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Top Workouts Bar */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Most Frequent Workouts</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeFrequency} layout="vertical" margin={{ left: 60, right: 10, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis type="number" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="type" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={55} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Times" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4 mt-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Total Workouts', value: stats.totalWorkouts, icon: Dumbbell, color: 'hsl(var(--primary))' },
              { label: 'Total Minutes', value: stats.totalDuration, icon: Clock, color: 'hsl(280, 65%, 55%)' },
              { label: 'Total Calories', value: stats.totalCalories, icon: Flame, color: 'hsl(25, 85%, 50%)' },
              { label: 'Workout Types', value: stats.uniqueTypes, icon: Heart, color: 'hsl(330, 70%, 55%)' },
            ].map(s => (
              <Card key={s.label} className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className="h-4 w-4" style={{ color: s.color }} />
                  <span className="text-[10px] text-muted-foreground font-medium">{s.label}</span>
                </div>
                <p className="text-xl font-bold">{s.value.toLocaleString()}</p>
              </Card>
            ))}
          </div>

          <Card className="p-4">
            <CardTitle className="text-sm mb-3">Avg Duration per Workout</CardTitle>
            <p className="text-3xl font-bold">{stats.avgDuration.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">min</span></p>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
