import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, subDays, differenceInDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { 
  Share2, Copy, Check, Heart, Calendar, Moon, AlertTriangle, Sparkles, 
  Bell, BellOff, TrendingUp, Activity, Droplet, Brain, ChevronDown,
  Lightbulb, BarChart3, MessageCircleHeart, FileDown, Loader2
} from 'lucide-react';
import { InsightsGraph } from './InsightsGraph';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CyclePrediction, CycleStats, DayLog, Mood, Symptom } from '@/types/period';
import { CyclePhase } from '@/types/settings';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { generatePartnerSharePdf } from '@/utils/partnerSharePdf';
import { phaseInfo, moodLabels, symptomLabels } from '@/data/phaseData';
import { useAuth } from '@/contexts/AuthContext';
import { useWellnessJournal } from '@/hooks/useWellnessJournal';
import logoSrc from '@/assets/logo.png';

interface PartnerShareViewProps {
  predictions: CyclePrediction | null;
  stats: CycleStats | null;
  currentPhase: CyclePhase;
  daysUntilNextPeriod: number | null;
  currentCycleDay: number | null;
  logs?: DayLog[];
  userName?: string;
}

interface ShareSettings {
  showPeriodDates: boolean;
  showFertileWindow: boolean;
  showMoodTips: boolean;
  showCurrentPhase: boolean;
  showMoodInsights: boolean;
  showSymptomInsights: boolean;
}

// UI-specific icon and color mappings for phases
const phaseUIConfig: Record<CyclePhase, { 
  icon: React.ReactNode; 
  color: string;
  bgColor: string;
}> = {
  menstrual: {
    icon: <Moon className="h-5 w-5" />,
    color: 'text-coral',
    bgColor: 'bg-coral/10',
  },
  follicular: {
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-sage',
    bgColor: 'bg-sage/10',
  },
  ovulation: {
    icon: <Heart className="h-5 w-5" />,
    color: 'text-lavender',
    bgColor: 'bg-lavender/10',
  },
  luteal: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-peach',
    bgColor: 'bg-peach/10',
  },
};

export function PartnerShareView({
  predictions,
  stats,
  currentPhase,
  daysUntilNextPeriod,
  currentCycleDay,
  logs = [],
  userName: propUserName,
}: PartnerShareViewProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { entries: journalEntries } = useWellnessJournal();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    showPeriodDates: true,
    showFertileWindow: false,
    showMoodTips: true,
    showCurrentPhase: true,
    showMoodInsights: true,
    showSymptomInsights: true,
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Get user name from prop or metadata or email
  const userName = propUserName || user?.user_metadata?.name || user?.email?.split('@')[0] || undefined;

  const currentPhaseInfo = phaseInfo[currentPhase];
  const currentPhaseUI = phaseUIConfig[currentPhase];

  // Calculate recent mood and symptom insights (last 7 days)
  const recentInsights = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 7);
    
    const recentLogs = logs.filter(log => {
      const logDate = parseISO(log.date);
      return logDate >= sevenDaysAgo && logDate <= today;
    });

    const moodCounts: Record<Mood, number> = {} as Record<Mood, number>;
    const symptomCounts: Record<Symptom, number> = {} as Record<Symptom, number>;
    let totalSleep = 0;
    let sleepCount = 0;
    let totalWater = 0;
    let waterCount = 0;
    let periodDays = 0;

    recentLogs.forEach(log => {
      log.moods.forEach(mood => {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      });
      log.symptoms.forEach(symptom => {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });
      if (log.sleepHours) {
        totalSleep += log.sleepHours;
        sleepCount++;
      }
      if (log.waterIntake) {
        totalWater += log.waterIntake;
        waterCount++;
      }
      if (log.isPeriod) {
        periodDays++;
      }
    });

    const topMoods = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([mood]) => mood as Mood);

    const topSymptoms = Object.entries(symptomCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([symptom]) => symptom as Symptom);

    return {
      topMoods,
      topSymptoms,
      avgSleep: sleepCount > 0 ? Math.round((totalSleep / sleepCount) * 10) / 10 : null,
      avgWater: waterCount > 0 ? Math.round(totalWater / waterCount) : null,
      periodDays,
      daysLogged: recentLogs.length,
    };
  }, [logs]);

  // Calculate weekly/monthly summary
  const summaryData = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const weekLogs = logs.filter(log => {
      const logDate = parseISO(log.date);
      return logDate >= weekStart && logDate <= weekEnd;
    });

    const monthLogs = logs.filter(log => {
      const logDate = parseISO(log.date);
      return logDate >= monthStart && logDate <= monthEnd;
    });

    const calculateSummary = (logSet: DayLog[]) => {
      const allMoods: Mood[] = [];
      const allSymptoms: Symptom[] = [];
      let totalSleep = 0, sleepCount = 0;
      let totalWater = 0, waterCount = 0;
      let totalExercise = 0, exerciseCount = 0;
      let periodDays = 0;

      logSet.forEach(log => {
        allMoods.push(...log.moods);
        allSymptoms.push(...log.symptoms);
        if (log.sleepHours) { totalSleep += log.sleepHours; sleepCount++; }
        if (log.waterIntake) { totalWater += log.waterIntake; waterCount++; }
        if (log.exerciseMinutes) { totalExercise += log.exerciseMinutes; exerciseCount++; }
        if (log.isPeriod) periodDays++;
      });

      const moodCounts = allMoods.reduce((acc, m) => ({ ...acc, [m]: (acc[m] || 0) + 1 }), {} as Record<string, number>);
      const symptomCounts = allSymptoms.reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {} as Record<string, number>);

      return {
        periodDays,
        daysLogged: logSet.length,
        avgSleep: sleepCount > 0 ? Math.round((totalSleep / sleepCount) * 10) / 10 : null,
        avgWater: waterCount > 0 ? Math.round(totalWater / waterCount) : null,
        totalExercise: totalExercise,
        topMood: Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0]?.[0] as Mood | undefined,
        topSymptom: Object.entries(symptomCounts).sort(([,a], [,b]) => b - a)[0]?.[0] as Symptom | undefined,
      };
    };

    return {
      weekly: calculateSummary(weekLogs),
      monthly: calculateSummary(monthLogs),
    };
  }, [logs]);

  // Generate AI-powered care suggestions based on current state
  const personalizedSuggestions = useMemo(() => {
    const suggestions: string[] = [];

    // Based on recent mood patterns
    if (recentInsights.topMoods.includes('tired') || recentInsights.topMoods.includes('sad')) {
      suggestions.push('💤 Extra rest and emotional support would be especially helpful right now');
    }
    if (recentInsights.topMoods.includes('anxious')) {
      suggestions.push('🧘 Calm activities and gentle reassurance can help with anxiety');
    }
    if (recentInsights.topMoods.includes('irritable')) {
      suggestions.push('🤫 Give some space when needed and avoid taking reactions personally');
    }

    // Based on symptoms
    if (recentInsights.topSymptoms.includes('cramps')) {
      suggestions.push('🔥 A heating pad or warm compress would be appreciated');
    }
    if (recentInsights.topSymptoms.includes('headache')) {
      suggestions.push('🌑 Keep lights dim and reduce noise when possible');
    }
    if (recentInsights.topSymptoms.includes('fatigue')) {
      suggestions.push('☕ Offer to take on extra tasks to allow for rest');
    }
    if (recentInsights.topSymptoms.includes('cravings')) {
      suggestions.push('🍫 Keep their favorite comfort snacks stocked');
    }

    // Based on sleep
    if (recentInsights.avgSleep && recentInsights.avgSleep < 7) {
      suggestions.push('😴 Sleep has been limited - help create a calm bedtime environment');
    }

    // Based on hydration
    if (recentInsights.avgWater && recentInsights.avgWater < 6) {
      suggestions.push('💧 Gentle hydration reminders or offering drinks would be helpful');
    }

    // Phase-specific defaults if no data-driven suggestions
    if (suggestions.length === 0) {
      suggestions.push(...currentPhaseInfo.partnerTips.slice(0, 2).map(tip => `💝 ${tip}`));
    }

    return suggestions;
  }, [recentInsights, currentPhaseInfo]);

  const shareableText = useMemo(() => {
    const lines: string[] = ['💐 Cycle Update from Flow Index\n'];
    
    if (shareSettings.showCurrentPhase && currentPhaseInfo) {
      lines.push(`📍 Current Phase: ${currentPhaseInfo.title}`);
      if (currentCycleDay) {
        lines.push(`   Day ${currentCycleDay} of cycle`);
      }
      lines.push('');
    }
    
    if (shareSettings.showPeriodDates && predictions) {
      const nextStart = new Date(predictions.nextPeriodStart);
      lines.push(`📅 Next period expected: ${format(nextStart, 'MMM d')}`);
      if (daysUntilNextPeriod !== null) {
        lines.push(`   (${daysUntilNextPeriod} days away)`);
      }
      lines.push('');
    }
    
    if (shareSettings.showFertileWindow && predictions) {
      const fertileStart = new Date(predictions.fertileWindowStart);
      const fertileEnd = new Date(predictions.fertileWindowEnd);
      lines.push(`🌸 Fertile window: ${format(fertileStart, 'MMM d')} - ${format(fertileEnd, 'MMM d')}`);
      lines.push('');
    }

    if (shareSettings.showMoodInsights && recentInsights.topMoods.length > 0) {
      lines.push('💭 Recent mood patterns:');
      recentInsights.topMoods.forEach(mood => {
        const info = moodLabels[mood];
        lines.push(`   ${info.emoji} ${info.label}`);
      });
      lines.push('');
    }

    if (shareSettings.showSymptomInsights && recentInsights.topSymptoms.length > 0) {
      lines.push('🩺 Recent symptoms:');
      recentInsights.topSymptoms.forEach(symptom => {
        const info = symptomLabels[symptom];
        lines.push(`   ${info.emoji} ${info.label}`);
      });
      lines.push('');
    }
    
    if (shareSettings.showMoodTips) {
      lines.push('💝 How to support:');
      personalizedSuggestions.slice(0, 3).forEach(tip => {
        lines.push(`• ${tip.replace(/^[^\s]+ /, '')}`);
      });
    }
    
    return lines.join('\n');
  }, [shareSettings, predictions, currentPhaseInfo, currentCycleDay, daysUntilNextPeriod, recentInsights, personalizedSuggestions]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareableText);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Share this with your partner",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cycle Update',
          text: shareableText,
        });
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    toast({
      title: notificationsEnabled ? "Notifications disabled" : "Notifications enabled",
      description: notificationsEnabled 
        ? "Partner will no longer receive automatic updates" 
        : "Partner will receive updates when your cycle changes phases",
    });
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      // Convert logo to base64 for PDF embedding
      let logoBase64: string | undefined;
      try {
        const response = await fetch(logoSrc);
        const blob = await response.blob();
        logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn('Could not load logo:', e);
      }

      // Generate PDF using direct jsPDF method (supports multi-page)
      await generatePartnerSharePdf({
        predictions,
        stats,
        currentPhase,
        daysUntilNextPeriod,
        currentCycleDay,
        logs,
        userName,
        journalEntries,
        shareSettings
      }, logoBase64);

      toast({
        title: "PDF Downloaded",
        description: "Your partner share report has been saved",
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "Download Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg gradient-primary">
            <Share2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold">Partner Sharing</h2>
            <p className="text-sm text-muted-foreground">Advanced cycle insights for your partner</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleNotifications}
          className="gap-2"
        >
          {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          {notificationsEnabled ? 'On' : 'Off'}
        </Button>
      </div>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <Heart className="h-4 w-4 mr-1 hidden sm:inline" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="insights" className="text-xs sm:text-sm">
            <Brain className="h-4 w-4 mr-1 hidden sm:inline" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="summary" className="text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4 mr-1 hidden sm:inline" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="share" className="text-xs sm:text-sm">
            <MessageCircleHeart className="h-4 w-4 mr-1 hidden sm:inline" />
            Share
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card className="gradient-primary text-primary-foreground overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    {currentPhaseUI.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{currentPhaseInfo.title}</h3>
                    {currentCycleDay && (
                      <p className="text-primary-foreground/80 text-sm">
                        Day {currentCycleDay} of cycle
                        {daysUntilNextPeriod !== null && ` • ${daysUntilNextPeriod} days until next period`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {recentInsights.avgSleep && (
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <Moon className="h-4 w-4 mx-auto mb-1 opacity-80" />
                      <div className="text-lg font-semibold">{recentInsights.avgSleep}h</div>
                      <div className="text-xs opacity-80">Avg Sleep</div>
                    </div>
                  )}
                  {recentInsights.avgWater && (
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <Droplet className="h-4 w-4 mx-auto mb-1 opacity-80" />
                      <div className="text-lg font-semibold">{recentInsights.avgWater}</div>
                      <div className="text-xs opacity-80">Glasses/Day</div>
                    </div>
                  )}
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <Activity className="h-4 w-4 mx-auto mb-1 opacity-80" />
                    <div className="text-lg font-semibold">{recentInsights.daysLogged}/7</div>
                    <div className="text-xs opacity-80">Days Logged</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-primary-foreground/90">Partner tips for this phase:</p>
                  {currentPhaseInfo.partnerTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-primary-foreground/80">
                      <Heart className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Personalized Care Suggestions */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Personalized Care Suggestions
                </CardTitle>
                <CardDescription>Based on recent patterns and current phase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {personalizedSuggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-lg">{suggestion.split(' ')[0]}</span>
                    <span className="text-sm">{suggestion.replace(/^[^\s]+ /, '')}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Detailed Care Guide */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Care Guide for {currentPhaseInfo.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {currentPhaseInfo.careSuggestions.map((category, i) => (
                    <AccordionItem key={i} value={`item-${i}`}>
                      <AccordionTrigger className="text-sm font-medium">
                        {category.category}
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {category.suggestions.map((suggestion, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="text-primary">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {/* All-in-One Insights Graph */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  30-Day Wellness Overview
                </CardTitle>
                <CardDescription>Flow, moods, symptoms, sleep & water at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <InsightsGraph logs={logs} />
              </CardContent>
            </Card>
          </motion.div>
          {/* Recent Mood Patterns */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-lavender" />
                  Recent Mood Patterns
                </CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {recentInsights.topMoods.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {recentInsights.topMoods.map(mood => (
                      <Badge key={mood} variant="secondary" className="text-sm py-1.5 px-3">
                        {moodLabels[mood].emoji} {moodLabels[mood].label}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No mood data logged recently</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Symptoms */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-coral" />
                  Recent Symptoms
                </CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {recentInsights.topSymptoms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {recentInsights.topSymptoms.map(symptom => (
                      <Badge key={symptom} variant="outline" className="text-sm py-1.5 px-3">
                        {symptomLabels[symptom].emoji} {symptomLabels[symptom].label}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No symptoms logged recently</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* What This Means for Partners */}
          <motion.div variants={itemVariants}>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-primary" />
                  What This Means for Partners
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentInsights.topMoods.includes('tired') && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg">😴</span>
                    <div>
                      <p className="font-medium text-sm">Fatigue Present</p>
                      <p className="text-xs text-muted-foreground">Extra rest is needed. Consider taking on more household tasks.</p>
                    </div>
                  </div>
                )}
                {recentInsights.topMoods.includes('anxious') && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg">🧘</span>
                    <div>
                      <p className="font-medium text-sm">Anxiety Levels Up</p>
                      <p className="text-xs text-muted-foreground">Calm, supportive presence helps. Avoid adding pressure.</p>
                    </div>
                  </div>
                )}
                {recentInsights.topSymptoms.includes('cramps') && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg">🔥</span>
                    <div>
                      <p className="font-medium text-sm">Experiencing Cramps</p>
                      <p className="text-xs text-muted-foreground">Heat therapy and gentle care are appreciated.</p>
                    </div>
                  </div>
                )}
                {recentInsights.topMoods.length === 0 && recentInsights.topSymptoms.length === 0 && (
                  <p className="text-sm text-muted-foreground">Log more data to see personalized partner insights!</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          {/* Weekly Summary */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-sage" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Days Logged</p>
                    <p className="text-2xl font-semibold">{summaryData.weekly.daysLogged}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Period Days</p>
                    <p className="text-2xl font-semibold">{summaryData.weekly.periodDays}</p>
                  </div>
                  {summaryData.weekly.avgSleep && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Avg Sleep</p>
                      <p className="text-2xl font-semibold">{summaryData.weekly.avgSleep}h</p>
                    </div>
                  )}
                  {summaryData.weekly.totalExercise > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Exercise</p>
                      <p className="text-2xl font-semibold">{summaryData.weekly.totalExercise}m</p>
                    </div>
                  )}
                </div>
                {summaryData.weekly.topMood && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Most Common Mood</p>
                    <Badge variant="secondary">
                      {moodLabels[summaryData.weekly.topMood].emoji} {moodLabels[summaryData.weekly.topMood].label}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Monthly Summary */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-lavender" />
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Days Logged</p>
                    <p className="text-2xl font-semibold">{summaryData.monthly.daysLogged}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Period Days</p>
                    <p className="text-2xl font-semibold">{summaryData.monthly.periodDays}</p>
                  </div>
                  {summaryData.monthly.avgSleep && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Avg Sleep</p>
                      <p className="text-2xl font-semibold">{summaryData.monthly.avgSleep}h</p>
                    </div>
                  )}
                  {summaryData.monthly.avgWater && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Avg Water</p>
                      <p className="text-2xl font-semibold">{summaryData.monthly.avgWater}</p>
                    </div>
                  )}
                </div>
                {(summaryData.monthly.topMood || summaryData.monthly.topSymptom) && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {summaryData.monthly.topMood && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Most Common Mood</p>
                        <Badge variant="secondary">
                          {moodLabels[summaryData.monthly.topMood].emoji} {moodLabels[summaryData.monthly.topMood].label}
                        </Badge>
                      </div>
                    )}
                    {summaryData.monthly.topSymptom && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Most Common Symptom</p>
                        <Badge variant="outline">
                          {symptomLabels[summaryData.monthly.topSymptom].emoji} {symptomLabels[summaryData.monthly.topSymptom].label}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Cycle Stats */}
          {stats && (
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Cycle Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Avg Cycle Length</p>
                      <p className="text-2xl font-semibold">{stats.averageCycleLength} days</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Avg Period Length</p>
                      <p className="text-2xl font-semibold">{stats.averagePeriodLength} days</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Cycles Tracked</p>
                      <p className="text-2xl font-semibold">{stats.totalCycles}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Cycle Range</p>
                      <p className="text-2xl font-semibold">{stats.shortestCycle}-{stats.longestCycle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Share Tab */}
        <TabsContent value="share" className="space-y-4">
          {/* Share settings */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>What to Share</CardTitle>
                <CardDescription>Choose what information to include</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="phase" className="flex-1">Current phase & cycle day</Label>
                  <Switch
                    id="phase"
                    checked={shareSettings.showCurrentPhase}
                    onCheckedChange={(checked) => 
                      setShareSettings(prev => ({ ...prev, showCurrentPhase: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="period" className="flex-1">Next period dates</Label>
                  <Switch
                    id="period"
                    checked={shareSettings.showPeriodDates}
                    onCheckedChange={(checked) => 
                      setShareSettings(prev => ({ ...prev, showPeriodDates: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="fertile" className="flex-1">Fertile window</Label>
                  <Switch
                    id="fertile"
                    checked={shareSettings.showFertileWindow}
                    onCheckedChange={(checked) => 
                      setShareSettings(prev => ({ ...prev, showFertileWindow: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="mood-insights" className="flex-1">Recent mood patterns</Label>
                  <Switch
                    id="mood-insights"
                    checked={shareSettings.showMoodInsights}
                    onCheckedChange={(checked) => 
                      setShareSettings(prev => ({ ...prev, showMoodInsights: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="symptom-insights" className="flex-1">Recent symptoms</Label>
                  <Switch
                    id="symptom-insights"
                    checked={shareSettings.showSymptomInsights}
                    onCheckedChange={(checked) => 
                      setShareSettings(prev => ({ ...prev, showSymptomInsights: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="tips" className="flex-1">Personalized support tips</Label>
                  <Switch
                    id="tips"
                    checked={shareSettings.showMoodTips}
                    onCheckedChange={(checked) => 
                      setShareSettings(prev => ({ ...prev, showMoodTips: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {shareableText}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={handleDownloadPdf} 
                    disabled={isGeneratingPdf}
                    className="flex-1"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileDown className="h-4 w-4 mr-2" />
                        Share with Partner (PDF)
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleCopy} title="Copy as text">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* PDF Download */}
          <motion.div variants={itemVariants}>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileDown className="h-5 w-5 text-primary" />
                  Download Full Report
                </CardTitle>
                <CardDescription>
                  Share a beautifully formatted PDF with all your cycle data, charts, and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">Current Phase</Badge>
                    <Badge variant="secondary">Predictions</Badge>
                    <Badge variant="secondary">Mood Patterns</Badge>
                    <Badge variant="secondary">Symptom Charts</Badge>
                    <Badge variant="secondary">Weekly Summary</Badge>
                    <Badge variant="secondary">Cycle Stats</Badge>
                    <Badge variant="secondary">Care Tips</Badge>
                  </div>
                  
                  <Button 
                    onClick={handleDownloadPdf} 
                    disabled={isGeneratingPdf}
                    className="w-full"
                    size="lg"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <FileDown className="h-4 w-4 mr-2" />
                        Download PDF Report
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    PDF includes all data based on your sharing settings above
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notification Settings */}
          <motion.div variants={itemVariants}>
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5" />
                  Automatic Updates
                </CardTitle>
                <CardDescription>Keep your partner informed automatically</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Phase Change Notifications</p>
                    <p className="text-xs text-muted-foreground">Send updates when cycle phase changes</p>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={handleToggleNotifications}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Your partner will receive a summary when you enter a new phase
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
