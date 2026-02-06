import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  Brain,
  Sparkles
} from 'lucide-react';
import { SymptomPattern, MoodPattern, CyclePhase } from '@/types/settings';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface SymptomAnalyticsViewProps {
  symptomPatterns: SymptomPattern[];
  moodPatterns: MoodPattern[];
  symptomsByPhase: Record<CyclePhase, Record<string, number>>;
  moodsByPhase: Record<CyclePhase, Record<string, number>>;
}

const symptomLabels: Record<string, { label: string; emoji: string }> = {
  cramps: { label: 'Cramps', emoji: '😣' },
  headache: { label: 'Headache', emoji: '🤕' },
  backache: { label: 'Backache', emoji: '💆' },
  bloating: { label: 'Bloating', emoji: '🎈' },
  breast_tenderness: { label: 'Breast Tenderness', emoji: '💗' },
  acne: { label: 'Acne', emoji: '🔴' },
  fatigue: { label: 'Fatigue', emoji: '😴' },
  insomnia: { label: 'Insomnia', emoji: '🌙' },
  nausea: { label: 'Nausea', emoji: '🤢' },
  cravings: { label: 'Cravings', emoji: '🍫' },
};

const moodLabels: Record<string, { label: string; emoji: string }> = {
  happy: { label: 'Happy', emoji: '😊' },
  calm: { label: 'Calm', emoji: '😌' },
  sad: { label: 'Sad', emoji: '😢' },
  anxious: { label: 'Anxious', emoji: '😰' },
  irritable: { label: 'Irritable', emoji: '😤' },
  energetic: { label: 'Energetic', emoji: '⚡' },
  tired: { label: 'Tired', emoji: '😩' },
};

const phaseColors: Record<CyclePhase, string> = {
  menstrual: 'bg-coral',
  follicular: 'bg-sage',
  ovulation: 'bg-lavender',
  luteal: 'bg-peach',
};

const phaseLabels: Record<CyclePhase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulation: 'Ovulation',
  luteal: 'Luteal',
};

export function SymptomAnalyticsView({
  symptomPatterns,
  moodPatterns,
  symptomsByPhase,
  moodsByPhase,
}: SymptomAnalyticsViewProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const maxSymptomFreq = Math.max(...symptomPatterns.map(s => s.frequency), 1);
  const maxMoodFreq = Math.max(...moodPatterns.map(m => m.frequency), 1);

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'increasing') return <TrendingUp className="h-3 w-3 text-coral" />;
    if (trend === 'decreasing') return <TrendingDown className="h-3 w-3 text-sage" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const hasData = symptomPatterns.length > 0 || moodPatterns.length > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-coral" />
            <span className="text-sm text-muted-foreground">Symptoms Tracked</span>
          </div>
          <p className="text-3xl font-display font-bold">{symptomPatterns.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-lavender" />
            <span className="text-sm text-muted-foreground">Moods Tracked</span>
          </div>
          <p className="text-3xl font-display font-bold">{moodPatterns.length}</p>
        </div>
      </motion.div>

      {hasData ? (
        <Tabs defaultValue="symptoms" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
            <TabsTrigger value="moods">Moods</TabsTrigger>
          </TabsList>

          {/* Symptoms Tab */}
          <TabsContent value="symptoms" className="mt-4 space-y-4">
            {symptomPatterns.length > 0 ? (
              <>
                {/* Top Symptoms */}
                <motion.div variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-coral" />
                    Most Common Symptoms
                  </h3>
                  <div className="space-y-4">
                    {symptomPatterns.slice(0, 5).map((pattern) => {
                      const info = symptomLabels[pattern.symptom] || { label: pattern.symptom, emoji: '•' };
                      return (
                        <div key={pattern.symptom}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span>{info.emoji}</span>
                              <span className="text-sm font-medium">{info.label}</span>
                              <TrendIcon trend={pattern.trend} />
                            </div>
                            <span className="text-xs text-muted-foreground">{pattern.frequency}x</span>
                          </div>
                          <Progress 
                            value={(pattern.frequency / maxSymptomFreq) * 100} 
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Most common in {phaseLabels[pattern.mostCommonPhase]} phase, ~day {pattern.averageDayInCycle}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Symptoms by Phase */}
                <motion.div variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
                  <h3 className="font-semibold mb-4">Symptoms by Phase</h3>
                  <div className="space-y-4">
                    {(Object.keys(symptomsByPhase) as CyclePhase[]).map((phase) => {
                      const symptoms = Object.entries(symptomsByPhase[phase])
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 3);
                      
                      if (symptoms.length === 0) return null;
                      
                      return (
                        <div key={phase}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn("w-3 h-3 rounded-full", phaseColors[phase])} />
                            <span className="text-sm font-medium">{phaseLabels[phase]}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 pl-5">
                            {symptoms.map(([symptom, count]) => {
                              const info = symptomLabels[symptom] || { label: symptom, emoji: '•' };
                              return (
                                <span 
                                  key={symptom}
                                  className="text-xs bg-muted px-2 py-1 rounded-full"
                                >
                                  {info.emoji} {info.label} ({count})
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No symptom data yet. Log symptoms to see patterns.</p>
              </div>
            )}
          </TabsContent>

          {/* Moods Tab */}
          <TabsContent value="moods" className="mt-4 space-y-4">
            {moodPatterns.length > 0 ? (
              <>
                {/* Top Moods */}
                <motion.div variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-lavender" />
                    Most Common Moods
                  </h3>
                  <div className="space-y-4">
                    {moodPatterns.slice(0, 5).map((pattern) => {
                      const info = moodLabels[pattern.mood] || { label: pattern.mood, emoji: '•' };
                      return (
                        <div key={pattern.mood}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span>{info.emoji}</span>
                              <span className="text-sm font-medium">{info.label}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{pattern.frequency}x</span>
                          </div>
                          <Progress 
                            value={(pattern.frequency / maxMoodFreq) * 100} 
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Most common in {phaseLabels[pattern.mostCommonPhase]} phase, ~day {pattern.averageDayInCycle}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Moods by Phase */}
                <motion.div variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
                  <h3 className="font-semibold mb-4">Moods by Phase</h3>
                  <div className="space-y-4">
                    {(Object.keys(moodsByPhase) as CyclePhase[]).map((phase) => {
                      const moods = Object.entries(moodsByPhase[phase])
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 3);
                      
                      if (moods.length === 0) return null;
                      
                      return (
                        <div key={phase}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn("w-3 h-3 rounded-full", phaseColors[phase])} />
                            <span className="text-sm font-medium">{phaseLabels[phase]}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 pl-5">
                            {moods.map(([mood, count]) => {
                              const info = moodLabels[mood] || { label: mood, emoji: '•' };
                              return (
                                <span 
                                  key={mood}
                                  className="text-xs bg-muted px-2 py-1 rounded-full"
                                >
                                  {info.emoji} {info.label} ({count})
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No mood data yet. Log moods to see patterns.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <motion.div
          variants={itemVariants}
          className="bg-muted/50 rounded-2xl p-6 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-lavender-light flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-lavender" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">
            Start Discovering Patterns
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Log your symptoms and moods daily to uncover patterns in your cycle.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
