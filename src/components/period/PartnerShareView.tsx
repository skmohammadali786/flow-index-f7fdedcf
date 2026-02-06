import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, addDays } from 'date-fns';
import { Share2, Copy, Check, Heart, Calendar, Moon, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CyclePrediction, CycleStats } from '@/types/period';
import { CyclePhase } from '@/types/settings';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PartnerShareViewProps {
  predictions: CyclePrediction | null;
  stats: CycleStats | null;
  currentPhase: CyclePhase;
  daysUntilNextPeriod: number | null;
  currentCycleDay: number | null;
}

interface ShareSettings {
  showPeriodDates: boolean;
  showFertileWindow: boolean;
  showMoodTips: boolean;
  showCurrentPhase: boolean;
}

const phaseInfo: Record<CyclePhase, { 
  title: string; 
  icon: React.ReactNode; 
  color: string;
  partnerTips: string[];
}> = {
  menstrual: {
    title: 'Menstrual Phase',
    icon: <Moon className="h-5 w-5" />,
    color: 'text-coral',
    partnerTips: [
      'Extra rest and comfort may be appreciated',
      'Offer to help with physical tasks',
      'Warm drinks and cozy time together',
      'Be patient with mood fluctuations',
    ],
  },
  follicular: {
    title: 'Follicular Phase',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-sage',
    partnerTips: [
      'Great time for planning activities together',
      'Energy levels are typically rising',
      'Good time for trying new things',
      'Creativity and sociability often peak',
    ],
  },
  ovulation: {
    title: 'Ovulation Phase',
    icon: <Heart className="h-5 w-5" />,
    color: 'text-lavender',
    partnerTips: [
      'Highest energy and confidence time',
      'Great for social activities and dates',
      'Communication may be extra effective',
      'Peak fertility window',
    ],
  },
  luteal: {
    title: 'Luteal Phase',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-peach',
    partnerTips: [
      'PMS symptoms may appear later in this phase',
      'Extra patience and understanding helps',
      'Comfort foods might be craved',
      'Quiet, relaxing activities are good',
    ],
  },
};

export function PartnerShareView({
  predictions,
  stats,
  currentPhase,
  daysUntilNextPeriod,
  currentCycleDay,
}: PartnerShareViewProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    showPeriodDates: true,
    showFertileWindow: false,
    showMoodTips: true,
    showCurrentPhase: true,
  });

  const currentPhaseInfo = phaseInfo[currentPhase];

  const shareableText = useMemo(() => {
    const lines: string[] = ['💐 Cycle Update from Bloom\n'];
    
    if (shareSettings.showCurrentPhase && currentPhaseInfo) {
      lines.push(`Current Phase: ${currentPhaseInfo.title}`);
      if (currentCycleDay) {
        lines.push(`Day ${currentCycleDay} of cycle`);
      }
      lines.push('');
    }
    
    if (shareSettings.showPeriodDates && predictions) {
      const nextStart = new Date(predictions.nextPeriodStart);
      lines.push(`📅 Next period expected: ${format(nextStart, 'MMM d')}`);
      if (daysUntilNextPeriod !== null) {
        lines.push(`(${daysUntilNextPeriod} days away)`);
      }
      lines.push('');
    }
    
    if (shareSettings.showFertileWindow && predictions) {
      const fertileStart = new Date(predictions.fertileWindowStart);
      const fertileEnd = new Date(predictions.fertileWindowEnd);
      lines.push(`🌸 Fertile window: ${format(fertileStart, 'MMM d')} - ${format(fertileEnd, 'MMM d')}`);
      lines.push('');
    }
    
    if (shareSettings.showMoodTips && currentPhaseInfo) {
      lines.push('💝 How to support:');
      currentPhaseInfo.partnerTips.slice(0, 2).forEach(tip => {
        lines.push(`• ${tip}`);
      });
    }
    
    return lines.join('\n');
  }, [shareSettings, predictions, currentPhaseInfo, currentCycleDay, daysUntilNextPeriod]);

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
          <Share2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold">Partner Sharing</h2>
          <p className="text-sm text-muted-foreground">Share cycle info with your partner</p>
        </div>
      </div>

      {/* Current phase card for partner */}
      <motion.div variants={itemVariants}>
        <Card className="gradient-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                {currentPhaseInfo.icon}
              </div>
              <div>
                <h3 className="font-semibold">{currentPhaseInfo.title}</h3>
                {currentCycleDay && (
                  <p className="text-primary-foreground/80 text-sm">
                    Day {currentCycleDay} of cycle
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary-foreground/90">Partner tips:</p>
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
              <Label htmlFor="tips" className="flex-1">Support tips</Label>
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
            <div className="bg-muted rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
              {shareableText}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={handleShare} className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}