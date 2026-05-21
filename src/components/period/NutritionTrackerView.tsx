import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNutritionTracker } from '@/hooks/useNutritionTracker';
import { CuteLoader } from './CuteLoader';
import { format, subDays } from 'date-fns';
import { Plus, Trash2, Apple, Beef, Wheat, Droplets, Flame, Cookie, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CustomTooltip } from '@/components/ui/custom-tooltip';
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_ICONS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍪' };
const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(142, 71%, 45%)', 'hsl(280, 65%, 60%)'];

export function NutritionTrackerView() {
  const { nutritionLogs, isLoading, addMeal, deleteMeal, getDailySummary, getWeeklySummaries } = useNutritionTracker();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    meal_type: 'breakfast' as string,
    food_name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    iron: 0,
    water_ml: 0,
    is_craving: false,
    notes: '',
  });

  if (isLoading) return <CuteLoader message="Loading nutrition data..." />;

  const today = format(new Date(), 'yyyy-MM-dd');
  const todaySummary = getDailySummary(today);
  const weeklySummaries = getWeeklySummaries();

  const handleSubmit = async () => {
    if (!form.food_name.trim()) return;
    await addMeal({
      ...form,
      notes: form.notes || null,
    });
    setForm({ ...form, food_name: '', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, iron: 0, water_ml: 0, is_craving: false, notes: '' });
    setShowForm(false);
  };

  const todayLogs = nutritionLogs.filter(l => l.date === today);
  const macroData = [
    { name: 'Protein', value: todaySummary.totalProtein, unit: 'g' },
    { name: 'Carbs', value: todaySummary.totalCarbs, unit: 'g' },
    { name: 'Fat', value: todaySummary.totalFat, unit: 'g' },
    { name: 'Fiber', value: todaySummary.totalFiber, unit: 'g' },
  ].filter(d => d.value > 0);

  const calorieChartData = weeklySummaries.map(s => ({
    date: format(new Date(s.date), 'MMM dd'),
    calories: s.totalCalories,
  })).reverse();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Apple className="h-6 w-6 text-primary" /> Nutrition Tracker
            </h2>
            <p className="text-muted-foreground text-sm">Track meals, macros & cravings</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm" className="rounded-full">
            <Plus className="h-4 w-4 mr-1" /> Log Meal
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-primary/20">
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  <Select value={form.meal_type} onValueChange={v => setForm({ ...form, meal_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map(t => <SelectItem key={t} value={t}>{MEAL_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="Food name *" value={form.food_name} onChange={e => setForm({ ...form, food_name: e.target.value.slice(0, 100) })} />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Calories</label>
                    <Input type="number" min={0} max={5000} value={form.calories || ''} onChange={e => setForm({ ...form, calories: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Protein (g)</label>
                    <Input type="number" min={0} max={500} value={form.protein || ''} onChange={e => setForm({ ...form, protein: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Carbs (g)</label>
                    <Input type="number" min={0} max={500} value={form.carbs || ''} onChange={e => setForm({ ...form, carbs: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Fat (g)</label>
                    <Input type="number" min={0} max={300} value={form.fat || ''} onChange={e => setForm({ ...form, fat: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Fiber (g)</label>
                    <Input type="number" min={0} max={100} value={form.fiber || ''} onChange={e => setForm({ ...form, fiber: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Iron (mg)</label>
                    <Input type="number" min={0} max={100} value={form.iron || ''} onChange={e => setForm({ ...form, iron: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_craving} onChange={e => setForm({ ...form, is_craving: e.target.checked })} className="rounded" />
                    <Cookie className="h-4 w-4" /> Craving
                  </label>
                  <div className="flex-1">
                    <Input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value.slice(0, 200) })} />
                  </div>
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={!form.food_name.trim()}>Save Meal</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Calories', value: todaySummary.totalCalories, icon: Flame, color: 'text-orange-500' },
          { label: 'Protein', value: `${todaySummary.totalProtein}g`, icon: Beef, color: 'text-red-500' },
          { label: 'Carbs', value: `${todaySummary.totalCarbs}g`, icon: Wheat, color: 'text-amber-500' },
          { label: 'Water', value: `${todaySummary.totalWater}ml`, icon: Droplets, color: 'text-blue-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="text-center">
              <CardContent className="p-3">
                <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-3 mt-4">
          {todayLogs.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No meals logged today. Tap "Log Meal" to start!</CardContent></Card>
          ) : (
            todayLogs.map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{MEAL_ICONS[log.meal_type] || '🍽️'}</span>
                      <div>
                        <p className="font-medium text-foreground">{log.food_name}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{log.calories} cal</span>
                          {Number(log.protein) > 0 && <span>P:{log.protein}g</span>}
                          {Number(log.carbs) > 0 && <span>C:{log.carbs}g</span>}
                          {Number(log.fat) > 0 && <span>F:{log.fat}g</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.is_craving && <Badge variant="secondary"><Cookie className="h-3 w-3 mr-1" />Craving</Badge>}
                      <Button variant="ghost" size="icon" onClick={() => deleteMeal(log.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-4 mt-4">
          {macroData.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Today's Macros</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={macroData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={({ name, value }) => `${name}: ${value}g`}>
                      {macroData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          {calorieChartData.length > 1 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Weekly Calories</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>

                  <BarChart data={calorieChartData}>
                    <defs>
                      <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="calories" fill="url(#colorCalories)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3 mt-4">
          {nutritionLogs.slice(0, 30).map((log, i) => (
            <Card key={log.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{format(new Date(log.date), 'MMM dd')} · {MEAL_ICONS[log.meal_type]} {log.meal_type}</p>
                  <p className="font-medium text-sm text-foreground">{log.food_name}</p>
                  <p className="text-xs text-muted-foreground">{log.calories} cal</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMeal(log.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </CardContent>
            </Card>
          ))}
          {nutritionLogs.length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No nutrition history yet.</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
