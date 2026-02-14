import { motion } from 'framer-motion';
import { 
  Brain, 
  Focus, 
  Zap, 
  CloudFog, 
  Timer, 
  Coffee,
  Moon,
  Activity,
  Clock,
  Target,
  Sparkles,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Droplets,
  Heart,
  Info,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { CuteLoader } from '@/components/period/CuteLoader';
import { CyclePhase } from '@/types/settings';
import { DayLog, CycleData } from '@/types/period';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useBrainForecast } from '@/hooks/useBrainForecast';
import { useClinicalAssessments } from '@/hooks/useClinicalAssessments';

interface BrainForecastViewProps {
  currentPhase: CyclePhase | null;
  currentCycleDay: number | null;
  logs: DayLog[];
  cycles: CycleData[];
}

interface BrainBreak {
  id: string;
  name: string;
  duration: string;
  description: string;
  icon: typeof Brain;
  type: 'movement' | 'rest' | 'stimulation' | 'grounding';
}

interface WorkSchedule {
  bestDeepWorkTime: string;
  bestMeetingTime: string;
  breakFrequency: string;
  taskType: string;
  avoidTime: string;
}

const getBrainBreaks = (phase: CyclePhase): BrainBreak[] => {
  const breaks: Record<CyclePhase, BrainBreak[]> = {
    menstrual: [
      { id: '1', name: 'Gentle Stretching', duration: '5 min', description: 'Slow, restorative movements to improve blood flow without strain', icon: Activity, type: 'movement' },
      { id: '2', name: 'Breathing Box', duration: '4 min', description: '4-4-4-4 breathing pattern to calm the nervous system', icon: Moon, type: 'rest' },
      { id: '3', name: 'Warm Tea Ritual', duration: '10 min', description: 'Mindful tea preparation and sipping for grounding', icon: Coffee, type: 'grounding' },
      { id: '4', name: 'Body Scan', duration: '8 min', description: 'Progressive relaxation to release physical tension', icon: Sparkles, type: 'rest' },
    ],
    follicular: [
      { id: '1', name: 'Power Walk', duration: '10 min', description: 'Brisk walking to capitalize on rising energy levels', icon: Activity, type: 'movement' },
      { id: '2', name: 'Creative Brainstorm', duration: '5 min', description: 'Free-form idea generation on a new project', icon: Sparkles, type: 'stimulation' },
      { id: '3', name: 'Dance Break', duration: '5 min', description: 'Upbeat movement to boost dopamine and motivation', icon: Zap, type: 'movement' },
      { id: '4', name: 'Learn Something New', duration: '10 min', description: 'Quick tutorial or article to leverage enhanced learning', icon: Brain, type: 'stimulation' },
    ],
    ovulation: [
      { id: '1', name: 'Social Connection', duration: '10 min', description: 'Quick call or chat with a friend or colleague', icon: Target, type: 'stimulation' },
      { id: '2', name: 'HIIT Micro-Session', duration: '7 min', description: 'High-intensity bursts to match peak energy', icon: Zap, type: 'movement' },
      { id: '3', name: 'Presentation Practice', duration: '10 min', description: 'Leverage verbal fluency for communication tasks', icon: Focus, type: 'stimulation' },
      { id: '4', name: 'Networking Task', duration: '10 min', description: 'Reach out for collaborations or new connections', icon: Activity, type: 'stimulation' },
    ],
    luteal: [
      { id: '1', name: 'Mindful Walking', duration: '10 min', description: 'Slow, intentional walking to process thoughts', icon: Activity, type: 'grounding' },
      { id: '2', name: 'Detail Review', duration: '15 min', description: 'Channel heightened attention to detail for editing tasks', icon: Focus, type: 'stimulation' },
      { id: '3', name: 'Calming Visualization', duration: '5 min', description: 'Mental imagery to reduce PMS-related anxiety', icon: Moon, type: 'rest' },
      { id: '4', name: 'Organization Session', duration: '10 min', description: 'Declutter workspace or organize digital files', icon: Target, type: 'grounding' },
    ],
  };
  return breaks[phase];
};

const getWorkSchedule = (phase: CyclePhase): WorkSchedule => {
  const schedules: Record<CyclePhase, WorkSchedule> = {
    menstrual: {
      bestDeepWorkTime: '10:00 AM - 12:00 PM',
      bestMeetingTime: '2:00 PM - 3:00 PM (limit meetings)',
      breakFrequency: 'Every 25 minutes',
      taskType: 'Reflective work, planning, journaling',
      avoidTime: 'Early morning & late evening',
    },
    follicular: {
      bestDeepWorkTime: '9:00 AM - 1:00 PM',
      bestMeetingTime: '2:00 PM - 5:00 PM',
      breakFrequency: 'Every 50 minutes',
      taskType: 'New projects, learning, brainstorming',
      avoidTime: 'None - maximize this phase!',
    },
    ovulation: {
      bestDeepWorkTime: '8:00 AM - 12:00 PM',
      bestMeetingTime: '1:00 PM - 5:00 PM (peak communication)',
      breakFrequency: 'Every 60 minutes',
      taskType: 'Presentations, negotiations, leadership tasks',
      avoidTime: 'Avoid over-committing',
    },
    luteal: {
      bestDeepWorkTime: '10:00 AM - 12:00 PM',
      bestMeetingTime: '1:00 PM - 2:00 PM (limited)',
      breakFrequency: 'Every 35 minutes',
      taskType: 'Detail work, editing, solo projects',
      avoidTime: 'Late afternoon when energy dips',
    },
  };
  return schedules[phase];
};

const getProgressColor = (value: number): string => {
  if (value >= 75) return 'bg-sage';
  if (value >= 50) return 'bg-peach';
  if (value >= 25) return 'bg-coral';
  return 'bg-lavender';
};

const breakTypeColors = {
  movement: 'bg-coral-light text-coral',
  rest: 'bg-lavender-light text-lavender',
  stimulation: 'bg-sage-light text-sage',
  grounding: 'bg-peach-light text-peach',
};

export function BrainForecastView({ currentPhase, currentCycleDay, logs, cycles }: BrainForecastViewProps) {
  const { historicalAssessments, isLoading: assessmentsLoading } = useClinicalAssessments();
  
  const {
    todayStatus,
    personalizedForecast,
    personalizedInsight,
    recommendations,
    phaseHistory,
  } = useBrainForecast(logs, cycles, currentPhase, currentCycleDay, historicalAssessments);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  if (assessmentsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CuteLoader size="sm" message="Loading forecast..." />
      </div>
    );
  }

  if (!currentPhase || !personalizedForecast || !personalizedInsight) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div
          variants={itemVariants}
          className="bg-muted/50 rounded-2xl p-6 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-lavender-light flex items-center justify-center">
            <Brain className="h-8 w-8 text-lavender" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">
            Cognitive Forecast Coming Soon
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Log your period to get personalized cognitive forecasts based on your cycle phase.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  const brainBreaks = getBrainBreaks(currentPhase);
  const workSchedule = getWorkSchedule(currentPhase);

  const cognitiveMetrics = [
    { name: 'Focus', value: personalizedForecast.focus, icon: Focus },
    { name: 'Processing Speed', value: personalizedForecast.processingSpeed, icon: Zap },
    { name: 'Mental Clarity', value: personalizedForecast.mentalClarity, icon: CloudFog },
    { name: 'Energy', value: personalizedForecast.energy, icon: Activity },
    { name: 'Creativity', value: personalizedForecast.creativity, icon: Sparkles },
    { name: 'Emotional Resilience', value: personalizedForecast.emotionalResilience, icon: Target },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header Card */}
      <motion.div
        variants={itemVariants}
        className="gradient-primary rounded-2xl p-6 text-primary-foreground shadow-elevated"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">Cognitive Forecast</span>
          </div>
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs",
              personalizedForecast.confidence === 'high' ? 'bg-sage/20 text-sage-foreground' :
              personalizedForecast.confidence === 'medium' ? 'bg-peach/20 text-peach-foreground' :
              'bg-white/20'
            )}
          >
            {personalizedForecast.confidence === 'high' ? 'High accuracy' :
             personalizedForecast.confidence === 'medium' ? 'Building data' : 
             'Getting started'}
          </Badge>
        </div>
        <h2 className="text-2xl font-display font-bold mb-1">{personalizedInsight.title}</h2>
        <p className="text-sm opacity-80 mb-3">
          {currentCycleDay && `Day ${currentCycleDay} • `}{personalizedInsight.keyHormone}
        </p>
        <p className="text-sm opacity-90">{personalizedInsight.description}</p>
      </motion.div>

      {/* Today's Status */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-coral" />
              Today's Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <Moon className="h-4 w-4 text-lavender" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Sleep</p>
                  <p className="text-sm font-medium truncate">
                    {todayStatus.sleepHours ? `${todayStatus.sleepHours}h` : 'Not logged'}
                    {todayStatus.sleepQuality && ` (${todayStatus.sleepQuality})`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <Activity className="h-4 w-4 text-sage" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Exercise</p>
                  <p className="text-sm font-medium truncate">
                    {todayStatus.exerciseMinutes ? `${todayStatus.exerciseMinutes} min` : 'Not logged'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <Droplets className="h-4 w-4 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Water</p>
                  <p className="text-sm font-medium truncate">
                    {todayStatus.waterIntake ? `${todayStatus.waterIntake} glasses` : 'Not logged'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <Zap className="h-4 w-4 text-peach" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Symptoms</p>
                  <p className="text-sm font-medium truncate">
                    {todayStatus.currentSymptoms.length > 0 
                      ? `${todayStatus.currentSymptoms.length} logged` 
                      : 'None logged'}
                  </p>
                </div>
              </div>
            </div>

            {/* VAS Summary if data exists */}
            {(todayStatus.painLevel > 0 || todayStatus.fatigueLevel > 0 || todayStatus.moodLevel > 0) && (
              <div className="mt-3 p-3 bg-coral-light/30 rounded-lg">
                <p className="text-xs font-medium mb-2">Clinical Assessment Impact</p>
                <div className="flex flex-wrap gap-2">
                  {todayStatus.painLevel > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Pain: {todayStatus.painLevel}/100
                    </Badge>
                  )}
                  {todayStatus.fatigueLevel > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Fatigue: {todayStatus.fatigueLevel}/100
                    </Badge>
                  )}
                  {todayStatus.moodLevel > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Mood: {todayStatus.moodLevel}/100
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-lavender" />
                Personalized Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recommendations.map((rec, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex items-start gap-2 p-3 rounded-lg",
                    rec.type === 'warning' ? 'bg-coral-light/30' :
                    rec.type === 'boost' ? 'bg-sage-light/50' :
                    'bg-peach-light/30'
                  )}
                >
                  {rec.type === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-coral mt-0.5 shrink-0" />
                  ) : rec.type === 'boost' ? (
                    <CheckCircle2 className="h-4 w-4 text-sage mt-0.5 shrink-0" />
                  ) : (
                    <Info className="h-4 w-4 text-peach mt-0.5 shrink-0" />
                  )}
                  <p className="text-sm">{rec.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Cognitive Metrics */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-coral" />
              Cognitive Forecast
              {personalizedForecast.dataPoints > 0 && (
                <Badge variant="outline" className="text-xs ml-auto">
                  Based on {personalizedForecast.dataPoints} data points
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cognitiveMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{metric.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{metric.value}%</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn('h-full', getProgressColor(metric.value))}
                    />
                  </div>
                </div>
              );
            })}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong>Brain Effect:</strong> {personalizedInsight.brainEffect}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Personal Pattern Note */}
      {personalizedInsight.personalNote && (
        <motion.div variants={itemVariants}>
          <div className="bg-gradient-to-br from-lavender-light to-sage-light rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-card rounded-lg shadow-sm">
                <TrendingUp className="h-5 w-5 text-lavender" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Your Pattern Insights</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {personalizedInsight.personalNote}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Optimal Work Schedule */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-sage" />
              Optimal Work Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-sage-light/50 rounded-lg">
                <Timer className="h-5 w-5 text-sage mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Best Deep Work Time</p>
                  <p className="text-sm text-muted-foreground">{workSchedule.bestDeepWorkTime}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-peach-light/50 rounded-lg">
                <Target className="h-5 w-5 text-peach mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Best Meeting Time</p>
                  <p className="text-sm text-muted-foreground">{workSchedule.bestMeetingTime}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-lavender-light/50 rounded-lg">
                <Coffee className="h-5 w-5 text-lavender mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Break Frequency</p>
                  <p className="text-sm text-muted-foreground">{workSchedule.breakFrequency}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-coral-light/50 rounded-lg">
                <Sparkles className="h-5 w-5 text-coral mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Ideal Task Type</p>
                  <p className="text-sm text-muted-foreground">{workSchedule.taskType}</p>
                </div>
              </div>
            </div>
            <div className="p-3 border border-dashed rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>⚠️ Avoid:</strong> {workSchedule.avoidTime}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Brain Breaks */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Moon className="h-5 w-5 text-lavender" />
              Recommended Brain Breaks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {brainBreaks.map((breakItem) => {
              const Icon = breakItem.icon;
              return (
                <motion.div
                  key={breakItem.id}
                  variants={itemVariants}
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={cn('p-2 rounded-lg shrink-0', breakTypeColors[breakItem.type])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm">{breakItem.name}</h4>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {breakItem.duration}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{breakItem.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Neuroscience Tip */}
      <motion.div variants={itemVariants}>
        <div className="bg-gradient-to-br from-lavender-light to-sage-light rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-card rounded-lg shadow-sm">
              <Brain className="h-5 w-5 text-lavender" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Neuroscience Insight</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your brain's prefrontal cortex is directly influenced by estrogen and progesterone levels. 
                By aligning your work with these natural rhythms, you can optimize productivity while reducing mental fatigue.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
