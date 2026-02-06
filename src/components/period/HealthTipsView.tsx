import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  Apple, 
  Dumbbell, 
  Heart, 
  Brain, 
  Moon,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { CyclePhase } from '@/types/settings';
import { getTipsForPhase, getPhaseInfo, healthTips } from '@/data/healthTips';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface HealthTipsViewProps {
  currentPhase: CyclePhase | null;
  currentCycleDay: number | null;
}

const categoryIcons = {
  nutrition: Apple,
  exercise: Dumbbell,
  wellness: Sparkles,
  mood: Heart,
  sleep: Moon,
};

const categoryColors = {
  nutrition: 'text-sage bg-sage-light',
  exercise: 'text-coral bg-coral-light',
  wellness: 'text-lavender bg-lavender-light',
  mood: 'text-peach bg-peach-light',
  sleep: 'text-lavender bg-lavender-light',
};

export function HealthTipsView({ currentPhase, currentCycleDay }: HealthTipsViewProps) {
  const phases: CyclePhase[] = ['menstrual', 'follicular', 'ovulation', 'luteal'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Current Phase Card */}
      {currentPhase && (
        <motion.div
          variants={itemVariants}
          className="gradient-primary rounded-2xl p-6 text-primary-foreground shadow-elevated"
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">Current Phase</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold mb-1">
                {getPhaseInfo(currentPhase).name}
              </h2>
              <p className="text-sm opacity-80">
                {currentCycleDay && `Day ${currentCycleDay} • `}
                {getPhaseInfo(currentPhase).days}
              </p>
            </div>
            <span className="text-4xl">{getPhaseInfo(currentPhase).emoji}</span>
          </div>
          <p className="text-sm opacity-90 mt-3">
            {getPhaseInfo(currentPhase).description}
          </p>
        </motion.div>
      )}

      {/* Phase Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue={currentPhase || 'menstrual'} className="w-full">
          <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-muted rounded-xl">
            {phases.map((phase) => {
              const info = getPhaseInfo(phase);
              return (
                <TabsTrigger
                  key={phase}
                  value={phase}
                  className={cn(
                    "flex flex-col py-2 px-1 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg",
                    currentPhase === phase && "ring-2 ring-coral ring-offset-1"
                  )}
                >
                  <span className="text-lg">{info.emoji}</span>
                  <span className="text-[10px] font-medium truncate w-full">{info.name.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {phases.map((phase) => {
            const tips = getTipsForPhase(phase);
            const info = getPhaseInfo(phase);
            
            return (
              <TabsContent key={phase} value={phase} className="mt-4 space-y-4">
                {/* Phase Overview */}
                <div className="bg-muted/50 rounded-xl p-4">
                  <h3 className="font-semibold mb-1">{info.name}</h3>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">Typical: {info.days}</p>
                </div>

                {/* Tips by Category */}
                <div className="space-y-3">
                  {tips.map((tip) => {
                    const Icon = categoryIcons[tip.category];
                    const colorClass = categoryColors[tip.category];
                    
                    return (
                      <motion.div
                        key={tip.id}
                        variants={itemVariants}
                        className="bg-card rounded-xl p-4 shadow-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg shrink-0", colorClass)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">{tip.icon}</span>
                              <h4 className="font-medium text-sm">{tip.title}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {tip.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </motion.div>

      {/* No Phase Data */}
      {!currentPhase && (
        <motion.div
          variants={itemVariants}
          className="bg-muted/50 rounded-2xl p-6 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-lavender-light flex items-center justify-center">
            <Lightbulb className="h-8 w-8 text-lavender" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">
            Personalized Tips Coming Soon
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Log your period to get personalized health tips based on your current cycle phase.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
