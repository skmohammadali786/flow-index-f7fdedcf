import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download,
  ClipboardList,
  Stethoscope,
  AlertTriangle,
  Activity,
  Calendar,
  Copy,
  Check,
  Info,
  BarChart3,
  Heart,
  Thermometer,
  Droplets,
  Moon,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { DayLog, CycleData, CycleStats, Symptom, Mood } from '@/types/period';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useClinicalAssessments } from '@/hooks/useClinicalAssessments';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateClinicalReportPdf } from '@/utils/clinicalReportPdf';
import { loadLogo } from '@/utils/pdfUtils';
import logoSrc from '@/assets/logo.png';
import { useAuth } from '@/contexts/AuthContext';

interface ClinicalEvidenceViewProps {
  logs: DayLog[];
  cycles: CycleData[];
  stats: CycleStats | null;
}

interface VASScaleDisplay {
  id: string;
  name: string;
  description: string;
  clinicalTerm: string;
  icon: typeof Activity;
}

const vasScaleDisplays: VASScaleDisplay[] = [
  { id: 'pain', name: 'Pain Intensity', description: 'Overall menstrual pain level', clinicalTerm: 'Visual Analog Scale - Pain', icon: Activity },
  { id: 'fatigue', name: 'Fatigue Level', description: 'Energy and tiredness', clinicalTerm: 'Fatigue Severity Scale', icon: Moon },
  { id: 'mood', name: 'Mood Disturbance', description: 'Emotional well-being', clinicalTerm: 'Mood Rating Scale', icon: Heart },
  { id: 'bloating', name: 'Bloating Severity', description: 'Abdominal discomfort', clinicalTerm: 'Bloating Severity Scale', icon: Droplets },
];

const symptomToClinicalTerm: Record<Symptom, string> = {
  cramps: 'Dysmenorrhea (menstrual cramping)',
  headache: 'Cephalgia (headache)',
  backache: 'Lumbago (lower back pain)',
  bloating: 'Abdominal distension',
  breast_tenderness: 'Mastodynia (breast tenderness)',
  acne: 'Acne vulgaris',
  fatigue: 'Asthenia (fatigue/weakness)',
  insomnia: 'Insomnia (sleep disturbance)',
  nausea: 'Nausea',
  cravings: 'Increased appetite/food cravings',
};

const moodToClinicalTerm: Record<Mood, string> = {
  happy: 'Euthymic (normal/positive mood)',
  calm: 'Euthymic/relaxed state',
  sad: 'Depressed mood',
  anxious: 'Anxiety',
  irritable: 'Irritability',
  energetic: 'Elevated energy',
  tired: 'Fatigue/low energy',
};

const getVASDescription = (value: number): string => {
  if (value === 0) return 'No pain/symptom';
  if (value <= 3) return 'Mild';
  if (value <= 6) return 'Moderate';
  if (value <= 8) return 'Severe';
  return 'Very Severe';
};

const redFlagSymptoms = [
  { symptom: 'Heavy bleeding (soaking through a pad/tampon every hour)', condition: 'Menorrhagia' },
  { symptom: 'Bleeding lasting more than 7 days', condition: 'Prolonged menstruation' },
  { symptom: 'Severe pelvic pain that interferes with daily activities', condition: 'Possible Endometriosis' },
  { symptom: 'Irregular cycles (less than 21 or more than 35 days)', condition: 'Oligomenorrhea/Polymenorrhea' },
  { symptom: 'Pain during intercourse', condition: 'Dyspareunia' },
  { symptom: 'Spotting between periods', condition: 'Metrorrhagia' },
];

export function ClinicalEvidenceView({ logs, cycles, stats }: ClinicalEvidenceViewProps) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { assessment, historicalAssessments, isLoading, isSaving, updateVasScale, updateNotes } = useClinicalAssessments();
  const { user } = useAuth();

  // Prepare chart data from historical assessments
  const chartData = useMemo(() => {
    return historicalAssessments.map(a => ({
      date: format(parseISO(a.date), 'MMM d'),
      fullDate: a.date,
      pain: a.painVas,
      fatigue: a.fatigueVas,
      mood: a.moodVas,
      bloating: a.bloatingVas,
    }));
  }, [historicalAssessments]);

  // Helper to get VAS value by id
  const getVasValue = (id: string): number => {
    switch (id) {
      case 'pain': return assessment.painVas;
      case 'fatigue': return assessment.fatigueVas;
      case 'mood': return assessment.moodVas;
      case 'bloating': return assessment.bloatingVas;
      default: return 0;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Analyze logs for clinical patterns
  const clinicalAnalysis = useMemo(() => {
    if (logs.length === 0) return null;

    const last90Days = logs.filter(log => {
      const logDate = parseISO(log.date);
      const daysDiff = differenceInDays(new Date(), logDate);
      return daysDiff <= 90;
    });

    const symptomFrequency: Record<string, number> = {};
    const moodFrequency: Record<string, number> = {};
    let totalPeriodDays = 0;
    let heavyFlowDays = 0;

    last90Days.forEach(log => {
      if (log.isPeriod) totalPeriodDays++;
      if (log.flowIntensity === 'heavy') heavyFlowDays++;
      
      log.symptoms.forEach(symptom => {
        symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
      });
      
      log.moods.forEach(mood => {
        moodFrequency[mood] = (moodFrequency[mood] || 0) + 1;
      });
    });

    const topSymptoms = Object.entries(symptomFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([symptom, count]) => ({
        symptom: symptom as Symptom,
        count,
        clinicalTerm: symptomToClinicalTerm[symptom as Symptom],
        frequency: `${Math.round((count / last90Days.length) * 100)}%`,
      }));

    const topMoods = Object.entries(moodFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([mood, count]) => ({
        mood: mood as Mood,
        count,
        clinicalTerm: moodToClinicalTerm[mood as Mood],
        frequency: `${Math.round((count / last90Days.length) * 100)}%`,
      }));

    return {
      totalDaysTracked: last90Days.length,
      totalPeriodDays,
      heavyFlowDays,
      heavyFlowPercentage: totalPeriodDays > 0 ? Math.round((heavyFlowDays / totalPeriodDays) * 100) : 0,
      topSymptoms,
      topMoods,
    };
  }, [logs]);

  // VAS scales are now managed by useClinicalAssessments hook

  const generateClinicalReport = (): string => {
    const now = new Date();
    let report = `MENSTRUAL HEALTH CLINICAL SUMMARY\n`;
    report += `Generated: ${format(now, 'MMMM d, yyyy')}\n`;
    report += `${'='.repeat(50)}\n\n`;

    // Cycle Statistics
    report += `MENSTRUAL CYCLE STATISTICS\n`;
    report += `${'-'.repeat(30)}\n`;
    if (stats) {
      report += `Average Cycle Length: ${stats.averageCycleLength} days\n`;
      report += `Average Period Duration: ${stats.averagePeriodLength} days\n`;
      report += `Cycle Range: ${stats.shortestCycle}-${stats.longestCycle} days\n`;
      report += `Total Cycles Recorded: ${stats.totalCycles}\n`;
    } else {
      report += `Insufficient data for cycle statistics\n`;
    }
    report += `\n`;

    // VAS Scores
    report += `VISUAL ANALOG SCALE ASSESSMENTS\n`;
    report += `${'-'.repeat(30)}\n`;
    vasScaleDisplays.forEach(scale => {
      const value = getVasValue(scale.id);
      report += `${scale.clinicalTerm}: ${value}/10 (${getVASDescription(value)})\n`;
    });
    report += `\n`;

    // Symptom Analysis
    if (clinicalAnalysis) {
      report += `SYMPTOM FREQUENCY ANALYSIS (Last 90 Days)\n`;
      report += `${'-'.repeat(30)}\n`;
      report += `Days Tracked: ${clinicalAnalysis.totalDaysTracked}\n`;
      report += `Period Days: ${clinicalAnalysis.totalPeriodDays}\n`;
      report += `Heavy Flow Days: ${clinicalAnalysis.heavyFlowDays} (${clinicalAnalysis.heavyFlowPercentage}% of period days)\n\n`;

      report += `Top Reported Symptoms:\n`;
      clinicalAnalysis.topSymptoms.forEach((item, idx) => {
        report += `  ${idx + 1}. ${item.clinicalTerm} - ${item.frequency} of tracked days\n`;
      });
      report += `\n`;

      report += `Mood Patterns:\n`;
      clinicalAnalysis.topMoods.forEach((item, idx) => {
        report += `  ${idx + 1}. ${item.clinicalTerm} - ${item.frequency} of tracked days\n`;
      });
      report += `\n`;
    }

    // Additional Notes
    if (assessment.additionalNotes?.trim()) {
      report += `PATIENT NOTES\n`;
      report += `${'-'.repeat(30)}\n`;
      report += `${assessment.additionalNotes}\n\n`;
    }

    // Disclaimer
    report += `${'='.repeat(50)}\n`;
    report += `DISCLAIMER: This report is generated from self-reported data\n`;
    report += `and is intended to facilitate patient-provider communication.\n`;
    report += `It does not constitute a medical diagnosis.\n`;

    return report;
  };

  const copyToClipboard = async () => {
    const report = generateClinicalReport();
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      toast.success('Report copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy report');
    }
  };

  const downloadReport = async () => {
    setIsGenerating(true);
    try {
      const logoBase64 = await loadLogo(logoSrc);
      const userName = user?.user_metadata?.name || user?.email?.split('@')[0];

      await generateClinicalReportPdf({
        logs,
        cycles,
        stats,
        assessment,
        userName
      }, logoBase64);

      toast.success('Report downloaded');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="gradient-primary rounded-2xl p-6 text-primary-foreground shadow-elevated"
      >
        <div className="flex items-center gap-2 mb-2">
          <Stethoscope className="h-5 w-5" />
          <span className="text-sm font-medium opacity-90">Clinical Evidence Module</span>
        </div>
        <h2 className="text-2xl font-display font-bold mb-1">Medical Documentation Tool</h2>
        <p className="text-sm opacity-90">
          Translate your health data into standardized medical terminology for healthcare providers.
        </p>
      </motion.div>

      <Tabs defaultValue="vas" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="vas" title="VAS Scales">
            <BarChart3 className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger value="trends" title="Trends">
            <TrendingUp className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger value="symptoms" title="Analysis">
            <ClipboardList className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger value="report" title="Report">
            <FileText className="h-5 w-5" />
          </TabsTrigger>
        </TabsList>

        {/* VAS Scales Tab */}
        <TabsContent value="vas" className="space-y-4 mt-4">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-coral" />
                  Visual Analog Scales
                </CardTitle>
                <CardDescription>
                  Rate your current symptoms on a scale of 0-10. These standardized scales are used in clinical settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  vasScaleDisplays.map((scale) => {
                    const Icon = scale.icon;
                    const value = getVasValue(scale.id);
                    return (
                      <div key={scale.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <Label className="font-medium">{scale.name}</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                            <Badge variant={value > 6 ? 'destructive' : value > 3 ? 'secondary' : 'outline'}>
                              {value}/10 - {getVASDescription(value)}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{scale.description}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground w-12">None</span>
                          <Slider
                            value={[value]}
                            onValueChange={(v) => updateVasScale(scale.id, v[0])}
                            max={10}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-12 text-right">Severe</span>
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          Clinical term: {scale.clinicalTerm}
                        </p>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Red Flags */}
          <motion.div variants={itemVariants}>
            <Card className="border-coral/30 bg-coral-light/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-coral">
                  <AlertTriangle className="h-5 w-5" />
                  Red Flag Symptoms
                </CardTitle>
                <CardDescription>
                  Discuss with your healthcare provider if you experience any of these symptoms.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {redFlagSymptoms.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-coral shrink-0 mt-0.5" />
                      <div>
                        <span className="text-foreground">{item.symptom}</span>
                        <span className="text-muted-foreground"> — {item.condition}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* VAS Trends Tab */}
        <TabsContent value="trends" className="space-y-4 mt-4">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-sage" />
                  VAS Score Trends
                </CardTitle>
                <CardDescription>
                  Track how your symptom scores change over time (last 30 days)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length < 2 ? (
                  <div className="py-8 text-center">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Not Enough Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Log at least 2 days of VAS scores to see trends. Keep rating your symptoms daily!
                    </p>
                  </div>
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10 }}
                          className="text-muted-foreground"
                        />
                        <YAxis 
                          domain={[0, 10]} 
                          tick={{ fontSize: 10 }}
                          className="text-muted-foreground"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="pain" 
                          name="Pain"
                          stroke="hsl(var(--coral))" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="fatigue" 
                          name="Fatigue"
                          stroke="hsl(var(--lavender))" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="mood" 
                          name="Mood"
                          stroke="hsl(var(--peach))" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="bloating" 
                          name="Bloating"
                          stroke="hsl(var(--sage))" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Historical Data Table */}
          {chartData.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-lavender" />
                    Assessment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-medium">Date</th>
                          <th className="text-center py-2 px-2 font-medium">Pain</th>
                          <th className="text-center py-2 px-2 font-medium">Fatigue</th>
                          <th className="text-center py-2 px-2 font-medium">Mood</th>
                          <th className="text-center py-2 px-2 font-medium">Bloating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...chartData].reverse().slice(0, 7).map((row, idx) => (
                          <tr key={row.fullDate} className={cn("border-b last:border-0", idx === 0 && "bg-muted/30")}>
                            <td className="py-2 px-2">{row.date}</td>
                            <td className="text-center py-2 px-2">
                              <Badge variant={row.pain > 6 ? 'destructive' : row.pain > 3 ? 'secondary' : 'outline'} className="w-8 justify-center">
                                {row.pain}
                              </Badge>
                            </td>
                            <td className="text-center py-2 px-2">
                              <Badge variant={row.fatigue > 6 ? 'destructive' : row.fatigue > 3 ? 'secondary' : 'outline'} className="w-8 justify-center">
                                {row.fatigue}
                              </Badge>
                            </td>
                            <td className="text-center py-2 px-2">
                              <Badge variant={row.mood > 6 ? 'destructive' : row.mood > 3 ? 'secondary' : 'outline'} className="w-8 justify-center">
                                {row.mood}
                              </Badge>
                            </td>
                            <td className="text-center py-2 px-2">
                              <Badge variant={row.bloating > 6 ? 'destructive' : row.bloating > 3 ? 'secondary' : 'outline'} className="w-8 justify-center">
                                {row.bloating}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Trend Insights */}
          {chartData.length >= 2 && (
            <motion.div variants={itemVariants}>
              <div className="bg-gradient-to-br from-sage-light to-lavender-light rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-card rounded-lg shadow-sm">
                    <Info className="h-5 w-5 text-sage" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Understanding Your Trends</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Tracking VAS scores over time helps identify patterns in your symptoms. Share these trends with your healthcare provider 
                      to help them understand your condition better and make more informed treatment decisions.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </TabsContent>

        {/* Symptoms Analysis Tab */}
        <TabsContent value="symptoms" className="space-y-4 mt-4">
          {clinicalAnalysis ? (
            <>
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-sage" />
                      Symptom Frequency Analysis
                    </CardTitle>
                    <CardDescription>
                      Based on your last 90 days of tracking ({clinicalAnalysis.totalDaysTracked} days logged)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-coral">{clinicalAnalysis.totalPeriodDays}</p>
                        <p className="text-xs text-muted-foreground">Period Days</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-lavender">{clinicalAnalysis.heavyFlowPercentage}%</p>
                        <p className="text-xs text-muted-foreground">Heavy Flow Days</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Thermometer className="h-4 w-4" />
                        Top Reported Symptoms
                      </h4>
                      {clinicalAnalysis.topSymptoms.map((item, idx) => (
                        <div key={item.symptom} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                            <div>
                              <p className="text-sm font-medium">{item.clinicalTerm}</p>
                              <p className="text-xs text-muted-foreground capitalize">{item.symptom.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">{item.frequency}</Badge>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Mood Patterns
                      </h4>
                      {clinicalAnalysis.topMoods.map((item, idx) => (
                        <div key={item.mood} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                            <div>
                              <p className="text-sm font-medium">{item.clinicalTerm}</p>
                              <p className="text-xs text-muted-foreground capitalize">{item.mood}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">{item.frequency}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          ) : (
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="py-8 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Data Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Start logging your symptoms to see clinical analysis.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report" className="space-y-4 mt-4">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-lavender" />
                  Clinical Report
                </CardTitle>
                <CardDescription>
                  Generate a formatted report to share with your healthcare provider.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Additional Notes for Your Doctor</Label>
                    {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  </div>
                  <Textarea
                    placeholder="Add any specific concerns, questions, or symptoms you'd like to discuss with your healthcare provider..."
                    value={assessment.additionalNotes}
                    onChange={(e) => updateNotes(e.target.value)}
                    className="min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {assessment.additionalNotes?.length || 0}/500
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy Report'}
                  </Button>
                  <Button
                    onClick={downloadReport}
                    className="flex-1"
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Download
                  </Button>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><strong>How to use this report:</strong></p>
                      <ul className="list-disc list-inside space-y-0.5 pl-2">
                        <li>Complete the VAS scales before your appointment</li>
                        <li>Review the symptom analysis for patterns</li>
                        <li>Add any specific concerns in the notes section</li>
                        <li>Share the report with your provider via copy/download</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Report Preview */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Report Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted/50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                  {generateClinicalReport()}
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Bridge the Gap Info */}
      <motion.div variants={itemVariants}>
        <div className="bg-gradient-to-br from-lavender-light to-peach-light rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-card rounded-lg shadow-sm">
              <Stethoscope className="h-5 w-5 text-lavender" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Bridging the Diagnosis Gap</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Conditions like Endometriosis and PCOS often take years to diagnose. This tool helps you document your symptoms 
                using standardized medical terminology and validated clinical scales, making it easier for healthcare providers 
                to understand your experience and take your concerns seriously.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
