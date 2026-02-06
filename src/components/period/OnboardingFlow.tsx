import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { ChevronRight, ChevronLeft, Flower2, Calendar, Droplets, Target, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  lastPeriodDate: Date;
  averageCycleLength: number;
  averagePeriodLength: number;
  trackingGoals: string[];
}

const trackingGoalOptions = [
  { id: 'predict', label: 'Predict my next period', icon: '📅' },
  { id: 'symptoms', label: 'Track symptoms', icon: '📝' },
  { id: 'fertility', label: 'Monitor fertility', icon: '🌸' },
  { id: 'health', label: 'Improve overall health', icon: '💪' },
  { id: 'mood', label: 'Understand mood patterns', icon: '😊' },
  { id: 'share', label: 'Share with partner/doctor', icon: '👥' },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [lastPeriodDate, setLastPeriodDate] = useState<Date>(subDays(new Date(), 14));
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['predict']);

  const steps = [
    {
      title: 'Welcome to Bloom',
      description: 'Your personal cycle companion. Let\'s set things up to give you the best experience.',
      icon: <Flower2 className="h-12 w-12" />,
    },
    {
      title: 'When did your last period start?',
      description: 'This helps us predict your next cycle accurately.',
      icon: <Calendar className="h-8 w-8" />,
    },
    {
      title: 'Your cycle length',
      description: 'How many days is your typical cycle? (From period start to the next period start)',
      icon: <Droplets className="h-8 w-8" />,
    },
    {
      title: 'What would you like to track?',
      description: 'Select all that apply. You can change these later.',
      icon: <Target className="h-8 w-8" />,
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete({
        lastPeriodDate,
        averageCycleLength: cycleLength,
        averagePeriodLength: periodLength,
        trackingGoals: selectedGoals,
      });
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div className="min-h-screen gradient-soft flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: i === step ? 1.2 : 1,
                backgroundColor: i <= step ? 'hsl(var(--coral))' : 'hsl(var(--muted))',
              }}
              className="w-2 h-2 rounded-full"
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="bg-card rounded-2xl shadow-elevated p-8"
          >
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-primary flex items-center justify-center text-primary-foreground">
                  {currentStep.icon}
                </div>
                <h1 className="font-display text-3xl font-bold mb-3">{currentStep.title}</h1>
                <p className="text-muted-foreground mb-8">{currentStep.description}</p>
                
                <div className="space-y-3 text-left mb-8">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Check className="h-5 w-5 text-sage" />
                    <span className="text-sm">Track periods & symptoms</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Check className="h-5 w-5 text-sage" />
                    <span className="text-sm">Get accurate predictions</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Check className="h-5 w-5 text-sage" />
                    <span className="text-sm">Understand your patterns</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Last Period */}
            {step === 1 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-coral-light text-coral">
                    {currentStep.icon}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold">{currentStep.title}</h2>
                    <p className="text-sm text-muted-foreground">{currentStep.description}</p>
                  </div>
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-14",
                        !lastPeriodDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {lastPeriodDate ? format(lastPeriodDate, "MMMM d, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={lastPeriodDate}
                      onSelect={(date) => date && setLastPeriodDate(date)}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Step 2: Cycle Length */}
            {step === 2 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-lavender-light text-lavender">
                    {currentStep.icon}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold">{currentStep.title}</h2>
                    <p className="text-sm text-muted-foreground">{currentStep.description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Cycle length (days)</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCycleLength(Math.max(21, cycleLength - 1))}
                      >
                        -
                      </Button>
                      <div className="flex-1 text-center">
                        <span className="text-4xl font-display font-bold">{cycleLength}</span>
                        <p className="text-xs text-muted-foreground">days</p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCycleLength(Math.min(45, cycleLength + 1))}
                      >
                        +
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Average is 28 days
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Period length (days)</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPeriodLength(Math.max(2, periodLength - 1))}
                      >
                        -
                      </Button>
                      <div className="flex-1 text-center">
                        <span className="text-4xl font-display font-bold">{periodLength}</span>
                        <p className="text-xs text-muted-foreground">days</p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPeriodLength(Math.min(10, periodLength + 1))}
                      >
                        +
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Average is 5 days
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Goals */}
            {step === 3 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-sage-light text-sage">
                    {currentStep.icon}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold">{currentStep.title}</h2>
                    <p className="text-sm text-muted-foreground">{currentStep.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {trackingGoalOptions.map((goal) => (
                    <motion.button
                      key={goal.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleGoal(goal.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-left",
                        selectedGoals.includes(goal.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-2xl mb-2 block">{goal.icon}</span>
                      <span className="text-sm">{goal.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button onClick={handleNext} className="flex-1 gradient-primary text-primary-foreground border-0">
                {step === steps.length - 1 ? 'Get Started' : 'Continue'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}