import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area } from 'recharts';
import { TrendingUp, Activity, Heart, Droplets, Moon, Dumbbell, GlassWater, Thermometer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DayLog, CycleData, Symptom, Mood } from '@/types/period';

interface CycleChartsProps {
  logs: DayLog[];
  cycles: CycleData[];
}

export function CycleCharts({ logs, cycles }: CycleChartsProps) {
  // Get last 6 months of data
  const chartData = useMemo(() => {
    const months: { month: string; symptoms: number; moods: number; avgSleep: number; avgExercise: number; avgWater: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthStr = format(monthDate, 'MMM');
      
      const monthLogs = logs.filter(log => {
        const logDate = parseISO(log.date);
        return logDate >= monthStart && logDate <= monthEnd;
      });
      
      const totalSymptoms = monthLogs.reduce((sum, log) => sum + log.symptoms.length, 0);
      const totalMoods = monthLogs.reduce((sum, log) => sum + log.moods.length, 0);
      const sleepLogs = monthLogs.filter(log => log.sleepHours);
      const exerciseLogs = monthLogs.filter(log => log.exerciseMinutes);
      const waterLogs = monthLogs.filter(log => log.waterIntake);
      
      months.push({
        month: monthStr,
        symptoms: totalSymptoms,
        moods: totalMoods,
        avgSleep: sleepLogs.length > 0 
          ? Math.round(sleepLogs.reduce((sum, log) => sum + (log.sleepHours || 0), 0) / sleepLogs.length * 10) / 10 
          : 0,
        avgExercise: exerciseLogs.length > 0 
          ? Math.round(exerciseLogs.reduce((sum, log) => sum + (log.exerciseMinutes || 0), 0) / exerciseLogs.length) 
          : 0,
        avgWater: waterLogs.length > 0 
          ? Math.round(waterLogs.reduce((sum, log) => sum + (log.waterIntake || 0), 0) / waterLogs.length * 10) / 10 
          : 0,
      });
    }
    
    return months;
  }, [logs]);

  // Cycle length trend
  const cycleLengthData = useMemo(() => {
    const sortedCycles = [...cycles].sort((a, b) => 
      parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
    );
    
    const data: { cycle: string; length: number; periodLength: number }[] = [];
    
    for (let i = 1; i < sortedCycles.length && i <= 12; i++) {
      const currentStart = parseISO(sortedCycles[i].startDate);
      const prevStart = parseISO(sortedCycles[i - 1].startDate);
      const cycleLength = Math.round((currentStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (cycleLength > 20 && cycleLength < 45) {
        data.push({
          cycle: format(parseISO(sortedCycles[i].startDate), 'MMM d'),
          length: cycleLength,
          periodLength: sortedCycles[i].length || 5,
        });
      }
    }
    
    return data;
  }, [cycles]);

  // Symptom frequency by type
  const symptomFrequencyData = useMemo(() => {
    const frequency: Record<Symptom, number> = {} as Record<Symptom, number>;
    
    logs.forEach(log => {
      log.symptoms.forEach(symptom => {
        frequency[symptom] = (frequency[symptom] || 0) + 1;
      });
    });
    
    return Object.entries(frequency)
      .map(([symptom, count]) => ({
        symptom: symptom.replace('_', ' '),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [logs]);

  // Temperature tracking (if available)
  const temperatureData = useMemo(() => {
    const last30Days = logs
      .filter(log => log.temperature)
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(-30)
      .map(log => ({
        date: format(parseISO(log.date), 'MMM d'),
        temp: log.temperature,
      }));
    
    return last30Days;
  }, [logs]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (logs.length < 2) {
    return (
      <div className="bg-card rounded-2xl p-8 text-center shadow-card">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-display font-semibold text-lg mb-2">
          Not Enough Data Yet
        </h3>
        <p className="text-muted-foreground text-sm">
          Log at least 2 days of data to see trends and charts here.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <h2 className="font-display text-2xl font-semibold">Cycle Charts</h2>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cycles">Cycles</TabsTrigger>
          <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
          <TabsTrigger value="wellness">Wellness</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <motion.div variants={itemVariants} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-peach" />
                  Symptoms & Moods Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="symptoms" 
                        stroke="hsl(var(--peach))" 
                        fill="hsl(var(--peach-light))" 
                        name="Symptoms"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="moods" 
                        stroke="hsl(var(--sage))" 
                        fill="hsl(var(--sage-light))" 
                        name="Moods"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="cycles">
          <motion.div variants={itemVariants} className="space-y-4">
            {cycleLengthData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-coral" />
                    Cycle Length Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cycleLengthData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="cycle" />
                        <YAxis domain={[20, 40]} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="length" 
                          stroke="hsl(var(--coral))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--coral))' }}
                          name="Cycle Length (days)"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="periodLength" 
                          stroke="hsl(var(--lavender))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--lavender))' }}
                          name="Period Length (days)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Track at least 2 full cycles to see trends</p>
              </Card>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="symptoms">
          <motion.div variants={itemVariants} className="space-y-4">
            {symptomFrequencyData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-peach" />
                    Most Common Symptoms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={symptomFrequencyData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis type="number" />
                        <YAxis dataKey="symptom" type="category" width={100} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="hsl(var(--peach))" 
                          radius={[0, 4, 4, 0]}
                          name="Occurrences"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Log symptoms to see frequency data</p>
              </Card>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="wellness">
          <motion.div variants={itemVariants} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-lavender" />
                  Wellness Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="avgSleep" fill="hsl(var(--lavender))" name="Avg Sleep (hrs)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="avgWater" fill="hsl(var(--secondary))" name="Avg Water (glasses)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {temperatureData.length > 5 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-peach" />
                    Basal Body Temperature
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={temperatureData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[35.5, 37.5]} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="temp" 
                          stroke="hsl(var(--coral))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--coral))' }}
                          name="Temperature (°C)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}