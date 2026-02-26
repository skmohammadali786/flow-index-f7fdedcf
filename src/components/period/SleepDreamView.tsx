import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSleepTracker } from '@/hooks/useSleepTracker';
import { CuteLoader } from './CuteLoader';
import { format } from 'date-fns';
import { Plus, Trash2, Moon, Sun, Cloud, TrendingUp, TrendingDown, Minus, Sparkles, Brain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

const QUALITIES = ['poor', 'fair', 'good', 'excellent'];
const QUALITY_EMOJI: Record<string, string> = { poor: '😴', fair: '🙂', good: '😊', excellent: '🌟' };
const DREAM_MOODS = ['peaceful', 'exciting', 'scary', 'confusing', 'happy', 'sad', 'neutral'];
const DREAM_MOOD_EMOJI: Record<string, string> = { peaceful: '🕊️', exciting: '⚡', scary: '😰', confusing: '🌀', happy: '😄', sad: '😢', neutral: '😐' };

export function SleepDreamView() {
  const { sleepLogs, isLoading, addSleepLog, deleteSleepLog, getAverageSleep, getSleepTrend, getDreamStats } = useSleepTracker();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    bedtime: '22:00',
    wake_time: '07:00',
    sleep_hours: 8 as number | null,
    sleep_quality: 'good',
    sleep_score: null as number | null,
    dream_logged: false,
    dream_description: '',
    dream_mood: '',
    dream_tags: [] as string[],
    night_wakings: 0,
    sleep_aids: '',
    notes: '',
  });

  if (isLoading) return <CuteLoader message="Loading sleep data..." />;

  const avgSleep = getAverageSleep();
  const trend = getSleepTrend();
  const dreamStats = getDreamStats();
  const TrendIcon = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus;

  const handleSubmit = async () => {
    await addSleepLog({
      ...form,
      dream_description: form.dream_description || null,
      dream_mood: form.dream_mood || null,
      sleep_aids: form.sleep_aids || null,
      notes: form.notes || null,
    });
    setShowForm(false);
  };

  const sleepChartData = sleepLogs.slice(0, 14).map(l => ({
    date: format(new Date(l.date), 'MM/dd'),
    hours: Number(l.sleep_hours) || 0,
    quality: QUALITIES.indexOf(l.sleep_quality) + 1,
  })).reverse();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Moon className="h-6 w-6 text-primary" /> Sleep & Dream Journal
            </h2>
            <p className="text-muted-foreground text-sm">Track sleep patterns & dreams</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm" className="rounded-full">
            <Plus className="h-4 w-4 mr-1" /> Log Sleep
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Avg Sleep', value: `${avgSleep}h`, icon: Moon, color: 'text-indigo-500' },
          { label: 'Trend', value: trend, icon: TrendIcon, color: trend === 'improving' ? 'text-green-500' : trend === 'declining' ? 'text-red-500' : 'text-muted-foreground' },
          { label: 'Dreams', value: dreamStats.totalDreams, icon: Sparkles, color: 'text-purple-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
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

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-primary/20">
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  <div>
                    <label className="text-xs text-muted-foreground">Bedtime</label>
                    <Input type="time" value={form.bedtime} onChange={e => setForm({ ...form, bedtime: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Wake up</label>
                    <Input type="time" value={form.wake_time} onChange={e => setForm({ ...form, wake_time: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Hours</label>
                    <Input type="number" min={0} max={24} step={0.5} value={form.sleep_hours || ''} onChange={e => setForm({ ...form, sleep_hours: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Quality</label>
                    <Select value={form.sleep_quality} onValueChange={v => setForm({ ...form, sleep_quality: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {QUALITIES.map(q => <SelectItem key={q} value={q}>{QUALITY_EMOJI[q]} {q}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Night Wakings</label>
                    <Input type="number" min={0} max={20} value={form.night_wakings} onChange={e => setForm({ ...form, night_wakings: Number(e.target.value) })} />
                  </div>
                </div>

                {/* Dream Section */}
                <div className="border-t border-border pt-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <input type="checkbox" checked={form.dream_logged} onChange={e => setForm({ ...form, dream_logged: e.target.checked })} className="rounded" />
                    <Brain className="h-4 w-4 text-purple-500" /> Log a dream
                  </label>
                  {form.dream_logged && (
                    <div className="space-y-2">
                      <Select value={form.dream_mood} onValueChange={v => setForm({ ...form, dream_mood: v })}>
                        <SelectTrigger><SelectValue placeholder="Dream mood..." /></SelectTrigger>
                        <SelectContent>
                          {DREAM_MOODS.map(m => <SelectItem key={m} value={m}>{DREAM_MOOD_EMOJI[m]} {m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Textarea placeholder="Describe your dream..." value={form.dream_description} onChange={e => setForm({ ...form, dream_description: e.target.value.slice(0, 500) })} rows={3} />
                    </div>
                  )}
                </div>

                <Input placeholder="Sleep aids used (optional)" value={form.sleep_aids} onChange={e => setForm({ ...form, sleep_aids: e.target.value.slice(0, 100) })} />
                <Input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value.slice(0, 200) })} />
                <Button onClick={handleSubmit} className="w-full">Save Sleep Log</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">Recent</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="dreams">Dreams</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-3 mt-4">
          {sleepLogs.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No sleep logs yet. Start tracking!</CardContent></Card>
          ) : (
            sleepLogs.slice(0, 20).map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{QUALITY_EMOJI[log.sleep_quality] || '😴'}</div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{format(new Date(log.date), 'MMM dd, yyyy')}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{log.sleep_hours}h</span>
                          <span>{log.bedtime} → {log.wake_time}</span>
                          {log.night_wakings > 0 && <span>⚡{log.night_wakings} waking{log.night_wakings > 1 ? 's' : ''}</span>}
                        </div>
                        {log.dream_logged && <Badge variant="secondary" className="mt-1 text-xs"><Brain className="h-3 w-3 mr-1" />{DREAM_MOOD_EMOJI[log.dream_mood || ''] || ''} Dream</Badge>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteSleepLog(log.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-4 mt-4">
          {sleepChartData.length > 1 && (
            <>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Sleep Hours (Last 14 Days)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sleepChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <YAxis domain={[0, 12]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip />
                      <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Sleep Quality Trend</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={sleepChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <YAxis domain={[0, 4]} ticks={[1, 2, 3, 4]} tickFormatter={v => ['', 'Poor', 'Fair', 'Good', '★'][v]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="quality" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
          {sleepChartData.length <= 1 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Log at least 2 days to see charts.</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="dreams" className="space-y-3 mt-4">
          {sleepLogs.filter(l => l.dream_logged).length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              No dreams logged yet. Enable "Log a dream" when adding sleep!
            </CardContent></Card>
          ) : (
            sleepLogs.filter(l => l.dream_logged).map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                <Card className="border-purple-200/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{DREAM_MOOD_EMOJI[log.dream_mood || ''] || '💭'}</span>
                      <p className="text-sm font-medium text-foreground">{format(new Date(log.date), 'MMM dd, yyyy')}</p>
                      {log.dream_mood && <Badge variant="outline" className="text-xs">{log.dream_mood}</Badge>}
                    </div>
                    {log.dream_description && <p className="text-sm text-muted-foreground">{log.dream_description}</p>}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
