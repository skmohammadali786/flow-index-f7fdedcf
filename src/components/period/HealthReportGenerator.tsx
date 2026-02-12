import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { parseISO, subMonths } from 'date-fns';
import { FileText, Download, Calendar, Activity, Heart, Droplets, Moon, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DayLog, CycleData, CycleStats } from '@/types/period';
import { generateHealthReportPdf, HealthReportOptions } from '@/utils/healthReportPdf';
import { loadLogo } from '@/utils/pdfUtils';
import logoSrc from '@/assets/logo.png';
import { useAuth } from '@/contexts/AuthContext';

interface HealthReportGeneratorProps {
  logs: DayLog[];
  cycles: CycleData[];
  stats: CycleStats | null;
  userName?: string;
}

export function HealthReportGenerator({ logs, cycles, stats, userName: propUserName }: HealthReportGeneratorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<HealthReportOptions>({
    period: '3',
    includeCycles: true,
    includeSymptoms: true,
    includeMoods: true,
    includeMedications: true,
    includeSleep: false,
    includeWater: false,
  });

  const userName = propUserName || user?.user_metadata?.name || user?.email?.split('@')[0];

  const reportData = useMemo(() => {
    const monthsAgo = parseInt(options.period);
    const startDate = subMonths(new Date(), monthsAgo);
    
    const filteredLogs = logs
      .filter(log => parseISO(log.date) >= startDate);
    const filteredCycles = cycles.filter(cycle => parseISO(cycle.startDate) >= startDate);
    
    return {
      totalDaysLogged: filteredLogs.length,
      cycles: filteredCycles.length,
    };
  }, [logs, cycles, options.period]);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const logoBase64 = await loadLogo(logoSrc);

      await generateHealthReportPdf({
        logs,
        cycles,
        stats,
        options,
        userName
      }, logoBase64);

      toast({
        title: "Report generated",
        description: "Your health report has been downloaded.",
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "Generation failed",
        description: "Could not generate the health report.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
          Report will be downloaded as a PDF file
        </p>
      </motion.div>
    </motion.div>
  );
}
