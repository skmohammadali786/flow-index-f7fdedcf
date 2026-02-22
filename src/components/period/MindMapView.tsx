import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Sparkles, Heart, Moon, Dumbbell, Droplets, Apple, Shield,
  CheckCircle2, XCircle, TrendingUp, Clock, Download, RefreshCw,
  ChevronDown, ChevronRight, Zap, BedDouble, AlertTriangle, Star,
  Calendar, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DayLog } from '@/types/period';
import { CycleData } from '@/types/period';
import { CyclePhase } from '@/types/settings';
import { generateMindMapPdf } from '@/utils/mindMapPdf';
import type { ClinicalAssessment } from '@/hooks/useClinicalAssessments';
import type { WorkoutLog } from '@/hooks/useWorkoutTracker';
import type { JournalEntry } from '@/hooks/useWellnessJournal';

interface MindMapViewProps {
  logs: DayLog[];
  cycles: CycleData[];
  currentPhase: CyclePhase;
  currentCycleDay: number | null;
  clinicalAssessments?: ClinicalAssessment[];
  workoutLogs?: WorkoutLog[];
  journalEntries?: JournalEntry[];
  userName?: string;
}

interface MindMapAnalysis {
  overallScore: number;
  scoreLabel: string;
  summary: string;
  cycleHealth: { score: number; status: string; insight: string };
  mentalHealth: { score: number; status: string; insight: string };
  physicalHealth: { score: number; status: string; insight: string };
  sleepHealth: { score: number; status: string; insight: string };
  predictions: Array<{ title: string; description: string; confidence: string; timeframe: string }>;
  doList: Array<{ title: string; description: string; priority: string; category: string }>;
  dontList: Array<{ title: string; reason: string; severity: string }>;
  weeklyPlan: Array<{ day: string; focus: string; tip: string }>;
  phaseAdvice: {
    currentPhase: string;
    daysRemaining: string;
    nutrition: string[];
    exercise: string[];
    selfCare: string[];
  };
}

const categoryIcons: Record<string, any> = {
  nutrition: Apple,
  exercise: Dumbbell,
  wellness: Heart,
  sleep: BedDouble,
  mood: Moon,
};

const priorityColors: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  low: 'bg-sage/10 text-sage border-sage/20',
};

const confidenceColors: Record<string, string> = {
  high: 'bg-sage/10 text-sage',
  medium: 'bg-amber-500/10 text-amber-600',
  low: 'bg-muted text-muted-foreground',
};

const ScoreRing = ({ score, size = 120, strokeWidth = 8, label }: { score: number; size?: number; strokeWidth?: number; label?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'hsl(var(--sage))' : score >= 60 ? 'hsl(var(--coral))' : 'hsl(var(--destructive))';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: "spring" }}
          className="text-3xl font-display font-bold"
        >
          {score}
        </motion.span>
        {label && <span className="text-[10px] text-muted-foreground font-medium">{label}</span>}
      </div>
    </div>
  );
};

export function MindMapView({ logs, cycles, currentPhase, currentCycleDay, clinicalAssessments, workoutLogs, journalEntries, userName }: MindMapViewProps) {
  const [analysis, setAnalysis] = useState<MindMapAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const [exporting, setExporting] = useState(false);

  const generateAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const last30Logs = logs.slice(-30);
      const recentWorkouts = (workoutLogs || []).slice(-14);
      const recentJournal = (journalEntries || []).slice(-7);
      const recentClinical = (clinicalAssessments || []).slice(-7);

      const healthData = {
        currentPhase,
        currentCycleDay,
        cycleCount: cycles.length,
        recentLogs: last30Logs.map(l => ({
          date: l.date,
          isPeriod: l.isPeriod,
          flow: l.flowIntensity,
          moods: l.moods,
          symptoms: l.symptoms,
          sleepHours: l.sleepHours,
          sleepQuality: l.sleepQuality,
          waterIntake: l.waterIntake,
          exerciseMinutes: l.exerciseMinutes,
          temperature: l.temperature,
        })),
        avgCycleLength: cycles.length > 1
          ? Math.round(cycles.reduce((sum, c) => sum + (c.length || 28), 0) / cycles.length)
          : 28,
        workouts: recentWorkouts.map(w => ({
          date: w.date,
          type: w.workout_type,
          duration: w.duration_minutes,
          intensity: w.intensity,
          calories: w.calories_burned,
        })),
        journal: recentJournal.map(j => ({
          date: j.date,
          moodRating: j.mood_rating,
          energyLevel: j.energy_level,
          selfCareDone: j.self_care_done,
        })),
        clinical: recentClinical.map(c => ({
          date: c.date,
          painVas: c.painVas,
          fatigueVas: c.fatigueVas,
          moodVas: c.moodVas,
          bloatingVas: c.bloatingVas,
        })),
      };

      const { data, error } = await supabase.functions.invoke('mind-map-analysis', {
        body: { healthData },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setAnalysis(data);
      setExpandedSection('overview');
    } catch (err: any) {
      console.error('Mind map analysis error:', err);
      toast.error('Failed to generate analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [logs, cycles, currentPhase, currentCycleDay, workoutLogs, journalEntries, clinicalAssessments]);

  const handleExportPdf = async () => {
    if (!analysis) return;
    setExporting(true);
    try {
      await generateMindMapPdf(analysis, userName);
      toast.success('Mind Map PDF exported!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sections = [
    { id: 'overview', label: 'Health Overview', icon: Activity },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
    { id: 'do', label: 'What to Do', icon: CheckCircle2 },
    { id: 'dont', label: 'What to Avoid', icon: XCircle },
    { id: 'weekly', label: 'Weekly Plan', icon: Calendar },
    { id: 'phase', label: 'Phase Advice', icon: Sparkles },
  ];

  // Initial empty state
  if (!analysis && !loading) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20"
            />
            <div className="absolute inset-2 rounded-full gradient-primary flex items-center justify-center shadow-elevated">
              <Brain className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">AI Mind Map</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Get a comprehensive AI-powered analysis of your health data with personalized predictions, recommendations, and a weekly wellness plan.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8 max-w-sm mx-auto">
            {[
              { icon: <TrendingUp className="h-5 w-5 text-coral" />, label: 'Predictions' },
              { icon: <CheckCircle2 className="h-5 w-5 text-sage" />, label: 'Do\'s & Don\'ts' },
              { icon: <Calendar className="h-5 w-5 text-lavender" />, label: 'Weekly Plan' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex flex-col items-center gap-2 p-3 bg-card rounded-xl border border-border/30 shadow-card"
              >
                {item.icon}
                <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
              </motion.div>
            ))}
          </div>

          <Button
            onClick={generateAnalysis}
            className="h-14 px-8 rounded-xl gradient-primary text-primary-foreground border-0 shadow-lg text-base font-semibold"
          >
            <Brain className="h-5 w-5 mr-2" />
            Generate Mind Map
            <Sparkles className="h-4 w-4 ml-2" />
          </Button>
          <p className="text-[10px] text-muted-foreground mt-3">Powered by AI • Analyzes your last 30 days of data</p>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative w-20 h-20 mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
          />
          <div className="absolute inset-3 rounded-full gradient-primary flex items-center justify-center">
            <Brain className="h-7 w-7 text-white" />
          </div>
        </div>
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-sm font-medium text-muted-foreground"
        >
          Analyzing your health data...
        </motion.p>
        <p className="text-[10px] text-muted-foreground mt-1">This may take a few seconds</p>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Mind Map
          </h2>
          <p className="text-xs text-muted-foreground">AI-powered health analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generateAnalysis} disabled={loading} className="rounded-xl">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={exporting} className="rounded-xl">
            <Download className="h-3.5 w-3.5 mr-1" />
            PDF
          </Button>
        </div>
      </motion.div>

      {/* Overall Score Card */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Card className="p-6 bg-card/90 backdrop-blur-md border-border/30 shadow-elevated rounded-2xl">
          <div className="flex items-center gap-6">
            <ScoreRing score={analysis.overallScore} label={analysis.scoreLabel} />
            <div className="flex-1">
              <h3 className="font-display text-lg font-bold mb-1">Overall Wellness</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{analysis.summary}</p>
            </div>
          </div>

          {/* Sub-scores */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Cycle', score: analysis.cycleHealth.score, color: 'bg-coral' },
              { label: 'Mental', score: analysis.mentalHealth.score, color: 'bg-lavender' },
              { label: 'Physical', score: analysis.physicalHealth.score, color: 'bg-sage' },
              { label: 'Sleep', score: analysis.sleepHealth.score, color: 'bg-peach' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="text-center"
              >
                <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-1.5">
                  <motion.div
                    className={cn("h-full rounded-full", item.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
                <span className="text-xs font-bold block">{item.score}</span>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Expandable sections */}
      {sections.map((section, idx) => {
        const Icon = section.icon;
        const isExpanded = expandedSection === section.id;
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.05 }}
          >
            <Card className="overflow-hidden rounded-2xl border-border/30 shadow-card">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                  <Icon className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="font-medium text-sm flex-1 text-left">{section.label}</span>
                <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {section.id === 'overview' && (
                        <>
                          {[
                            { data: analysis.cycleHealth, label: 'Cycle Health', icon: <Droplets className="h-4 w-4 text-coral" /> },
                            { data: analysis.mentalHealth, label: 'Mental Health', icon: <Moon className="h-4 w-4 text-lavender" /> },
                            { data: analysis.physicalHealth, label: 'Physical Health', icon: <Dumbbell className="h-4 w-4 text-sage" /> },
                            { data: analysis.sleepHealth, label: 'Sleep Health', icon: <BedDouble className="h-4 w-4 text-peach" /> },
                          ].map((item, i) => (
                            <div key={i} className="p-3 bg-muted/30 rounded-xl border border-border/20">
                              <div className="flex items-center gap-2 mb-1">
                                {item.icon}
                                <span className="text-sm font-medium">{item.label}</span>
                                <Badge variant="secondary" className="text-[10px] ml-auto">{item.data.status}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{item.data.insight}</p>
                            </div>
                          ))}
                        </>
                      )}

                      {section.id === 'predictions' && analysis.predictions.map((pred, i) => (
                        <div key={i} className="p-3 bg-muted/30 rounded-xl border border-border/20">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium flex-1">{pred.title}</span>
                            <Badge className={cn("text-[10px]", confidenceColors[pred.confidence])}>{pred.confidence}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{pred.description}</p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{pred.timeframe}</span>
                          </div>
                        </div>
                      ))}

                      {section.id === 'do' && analysis.doList.map((item, i) => {
                        const CatIcon = categoryIcons[item.category] || CheckCircle2;
                        return (
                          <div key={i} className="p-3 bg-sage/5 rounded-xl border border-sage/20">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-7 h-7 rounded-lg bg-sage/10 flex items-center justify-center">
                                <CatIcon className="h-3.5 w-3.5 text-sage" />
                              </div>
                              <span className="text-sm font-medium flex-1">{item.title}</span>
                              <Badge className={cn("text-[10px]", priorityColors[item.priority])}>{item.priority}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground ml-9">{item.description}</p>
                          </div>
                        );
                      })}

                      {section.id === 'dont' && analysis.dontList.map((item, i) => (
                        <div key={i} className="p-3 bg-destructive/5 rounded-xl border border-destructive/15">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                            </div>
                            <span className="text-sm font-medium flex-1">{item.title}</span>
                            <Badge className={cn("text-[10px]", priorityColors[item.severity])}>{item.severity}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground ml-9">{item.reason}</p>
                        </div>
                      ))}

                      {section.id === 'weekly' && (
                        <div className="space-y-2">
                          {analysis.weeklyPlan.map((day, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/20"
                            >
                              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {day.day.slice(0, 3)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{day.focus}</div>
                                <div className="text-[10px] text-muted-foreground truncate">{day.tip}</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {section.id === 'phase' && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <div>
                              <div className="text-sm font-medium">{analysis.phaseAdvice.currentPhase} Phase</div>
                              <div className="text-[10px] text-muted-foreground">{analysis.phaseAdvice.daysRemaining}</div>
                            </div>
                          </div>
                          
                          {[
                            { label: 'Nutrition', items: analysis.phaseAdvice.nutrition, icon: <Apple className="h-4 w-4 text-sage" /> },
                            { label: 'Exercise', items: analysis.phaseAdvice.exercise, icon: <Dumbbell className="h-4 w-4 text-coral" /> },
                            { label: 'Self Care', items: analysis.phaseAdvice.selfCare, icon: <Heart className="h-4 w-4 text-lavender" /> },
                          ].map((cat, i) => (
                            <div key={i} className="p-3 bg-muted/30 rounded-xl border border-border/20">
                              <div className="flex items-center gap-2 mb-2">
                                {cat.icon}
                                <span className="text-sm font-medium">{cat.label}</span>
                              </div>
                              <ul className="space-y-1 ml-6">
                                {cat.items.map((item, j) => (
                                  <li key={j} className="text-xs text-muted-foreground list-disc">{item}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
