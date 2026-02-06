import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, subMonths } from 'date-fns';
import { FileText, Download, Calendar, Activity, Heart, Droplets, Moon, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DayLog, CycleData, CycleStats } from '@/types/period';

interface HealthReportGeneratorProps {
  logs: DayLog[];
  cycles: CycleData[];
  stats: CycleStats | null;
}

interface ReportOptions {
  period: '1' | '3' | '6' | '12';
  includeCycles: boolean;
  includeSymptoms: boolean;
  includeMoods: boolean;
  includeMedications: boolean;
  includeSleep: boolean;
  includeWater: boolean;
}

export function HealthReportGenerator({ logs, cycles, stats }: HealthReportGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<ReportOptions>({
    period: '3',
    includeCycles: true,
    includeSymptoms: true,
    includeMoods: true,
    includeMedications: true,
    includeSleep: false,
    includeWater: false,
  });

  const reportData = useMemo(() => {
    const monthsAgo = parseInt(options.period);
    const startDate = subMonths(new Date(), monthsAgo);
    
    const filteredLogs = logs.filter(log => parseISO(log.date) >= startDate);
    const filteredCycles = cycles.filter(cycle => parseISO(cycle.startDate) >= startDate);
    
    // Calculate symptom frequencies
    const symptomCounts: Record<string, number> = {};
    filteredLogs.forEach(log => {
      log.symptoms.forEach(symptom => {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });
    });
    
    // Calculate mood frequencies
    const moodCounts: Record<string, number> = {};
    filteredLogs.forEach(log => {
      log.moods.forEach(mood => {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      });
    });
    
    // Calculate averages
    const sleepLogs = filteredLogs.filter(log => log.sleepHours);
    const waterLogs = filteredLogs.filter(log => log.waterIntake);
    const avgSleep = sleepLogs.length > 0 
      ? sleepLogs.reduce((sum, log) => sum + (log.sleepHours || 0), 0) / sleepLogs.length 
      : 0;
    const avgWater = waterLogs.length > 0 
      ? waterLogs.reduce((sum, log) => sum + (log.waterIntake || 0), 0) / waterLogs.length 
      : 0;
    
    // Medication tracking
    const medicationLogs: Record<string, number> = {};
    filteredLogs.forEach(log => {
      log.medications?.forEach(med => {
        if (med.taken) {
          medicationLogs[med.name] = (medicationLogs[med.name] || 0) + 1;
        }
      });
    });
    
    return {
      dateRange: {
        start: format(startDate, 'MMM d, yyyy'),
        end: format(new Date(), 'MMM d, yyyy'),
      },
      totalDaysLogged: filteredLogs.length,
      cycles: filteredCycles.length,
      symptomCounts,
      moodCounts,
      avgSleep: Math.round(avgSleep * 10) / 10,
      avgWater: Math.round(avgWater * 10) / 10,
      medicationLogs,
    };
  }, [logs, cycles, options.period]);

  const generateReport = () => {
    setIsGenerating(true);
    
    // Build report content
    let report = `
╔══════════════════════════════════════════════════════════════╗
║                  FLOW INDEX HEALTH REPORT                     ║
╚══════════════════════════════════════════════════════════════╝

Report Period: ${reportData.dateRange.start} - ${reportData.dateRange.end}
Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}
Total Days Logged: ${reportData.totalDaysLogged}

`;

    if (options.includeCycles && stats) {
      report += `
═══════════════════════════════════════════════════════════════
                        CYCLE SUMMARY
═══════════════════════════════════════════════════════════════

Cycles Tracked: ${stats.totalCycles}
Average Cycle Length: ${stats.averageCycleLength} days
Average Period Length: ${stats.averagePeriodLength} days
Cycle Range: ${stats.shortestCycle} - ${stats.longestCycle} days

`;
    }

    if (options.includeSymptoms && Object.keys(reportData.symptomCounts).length > 0) {
      report += `
═══════════════════════════════════════════════════════════════
                      SYMPTOM FREQUENCY
═══════════════════════════════════════════════════════════════

`;
      Object.entries(reportData.symptomCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([symptom, count]) => {
          const bar = '█'.repeat(Math.min(count, 20));
          report += `${symptom.replace('_', ' ').padEnd(20)} ${bar} (${count} days)\n`;
        });
    }

    if (options.includeMoods && Object.keys(reportData.moodCounts).length > 0) {
      report += `
═══════════════════════════════════════════════════════════════
                       MOOD PATTERNS
═══════════════════════════════════════════════════════════════

`;
      Object.entries(reportData.moodCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([mood, count]) => {
          const bar = '█'.repeat(Math.min(count, 20));
          report += `${mood.padEnd(20)} ${bar} (${count} days)\n`;
        });
    }

    if (options.includeMedications && Object.keys(reportData.medicationLogs).length > 0) {
      report += `
═══════════════════════════════════════════════════════════════
                    MEDICATION TRACKING
═══════════════════════════════════════════════════════════════

`;
      Object.entries(reportData.medicationLogs)
        .forEach(([med, count]) => {
          report += `${med.padEnd(20)} Taken ${count} days\n`;
        });
    }

    if (options.includeSleep && reportData.avgSleep > 0) {
      report += `
═══════════════════════════════════════════════════════════════
                      SLEEP PATTERNS
═══════════════════════════════════════════════════════════════

Average Sleep: ${reportData.avgSleep} hours per night

`;
    }

    if (options.includeWater && reportData.avgWater > 0) {
      report += `
═══════════════════════════════════════════════════════════════
                      HYDRATION
═══════════════════════════════════════════════════════════════

Average Water Intake: ${reportData.avgWater} glasses per day

`;
    }

    report += `
═══════════════════════════════════════════════════════════════
                         NOTES
═══════════════════════════════════════════════════════════════

This report was generated by Flow Index Period Tracker. 
The data is based on user-entered information and should not 
be considered medical advice. Please consult with your 
healthcare provider for any medical concerns.

───────────────────────────────────────────────────────────────
                    End of Report
───────────────────────────────────────────────────────────────
`;

    // Download as text file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowindex-health-report-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    setIsGenerating(false);
    toast({
      title: "Report generated",
      description: "Your health report has been downloaded.",
    });
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
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg gradient-primary">
          <FileText className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold">Health Report</h2>
          <p className="text-sm text-muted-foreground">Generate a report to share with your doctor</p>
        </div>
      </div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-coral" />
            <p className="text-2xl font-semibold">{reportData.totalDaysLogged}</p>
            <p className="text-xs text-muted-foreground">Days Logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Droplets className="h-6 w-6 mx-auto mb-2 text-lavender" />
            <p className="text-2xl font-semibold">{reportData.cycles}</p>
            <p className="text-xs text-muted-foreground">Cycles</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Report Options */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Report Options</CardTitle>
            <CardDescription>Choose what to include in your report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Time Period</Label>
              <Select
                value={options.period}
                onValueChange={(value: '1' | '3' | '6' | '12') => 
                  setOptions(prev => ({ ...prev, period: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last month</SelectItem>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Include in Report</Label>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  id="cycles"
                  checked={options.includeCycles}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeCycles: !!checked }))
                  }
                />
                <Label htmlFor="cycles" className="flex items-center gap-2 cursor-pointer">
                  <Droplets className="h-4 w-4 text-coral" />
                  Cycle data
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="symptoms"
                  checked={options.includeSymptoms}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeSymptoms: !!checked }))
                  }
                />
                <Label htmlFor="symptoms" className="flex items-center gap-2 cursor-pointer">
                  <Activity className="h-4 w-4 text-peach" />
                  Symptoms
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="moods"
                  checked={options.includeMoods}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeMoods: !!checked }))
                  }
                />
                <Label htmlFor="moods" className="flex items-center gap-2 cursor-pointer">
                  <Heart className="h-4 w-4 text-sage" />
                  Moods
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="medications"
                  checked={options.includeMedications}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeMedications: !!checked }))
                  }
                />
                <Label htmlFor="medications" className="flex items-center gap-2 cursor-pointer">
                  <Pill className="h-4 w-4 text-coral" />
                  Medications
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="sleep"
                  checked={options.includeSleep}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeSleep: !!checked }))
                  }
                />
                <Label htmlFor="sleep" className="flex items-center gap-2 cursor-pointer">
                  <Moon className="h-4 w-4 text-lavender" />
                  Sleep data
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Generate Button */}
      <motion.div variants={itemVariants}>
        <Button 
          onClick={generateReport} 
          disabled={isGenerating}
          className="w-full gradient-primary text-primary-foreground border-0 h-14"
        >
          <Download className="h-5 w-5 mr-2" />
          {isGenerating ? 'Generating...' : 'Download Health Report'}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Report will be downloaded as a text file
        </p>
      </motion.div>
    </motion.div>
  );
}