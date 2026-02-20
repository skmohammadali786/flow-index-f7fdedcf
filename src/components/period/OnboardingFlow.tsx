import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { ChevronRight, ChevronLeft, Flower2, Calendar, Sparkles, Heart, Shield, BarChart3, Moon, Droplets, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  userName?: string;
}

export interface OnboardingData {
  name: string;
  birthDate?: string;
  lastPeriodDate: Date;
  averageCycleLength: number;
  averagePeriodLength: number;
  trackingGoals: string[];
}

const trackingGoalOptions = [
  { id: 'predict', label: 'Predict periods', icon: <Calendar className="h-5 w-5" />, color: 'text-coral' },
  { id: 'symptoms', label: 'Track symptoms', icon: <Heart className="h-5 w-5" />, color: 'text-rose-400' },
  { id: 'fertility', label: 'Fertility tracking', icon: <Flower2 className="h-5 w-5" />, color: 'text-lavender' },
  { id: 'health', label: 'Overall health', icon: <Shield className="h-5 w-5" />, color: 'text-sage' },
  { id: 'mood', label: 'Mood patterns', icon: <Moon className="h-5 w-5" />, color: 'text-amber-400' },
  { id: 'share', label: 'Share reports', icon: <BarChart3 className="h-5 w-5" />, color: 'text-sky-400' },
];

// Floating blob background animation
const FloatingBlob = ({ delay, className }: { delay: number; className: string }) => (
  <motion.div
    className={cn("absolute rounded-full opacity-20 blur-3xl", className)}
    animate={{
      y: [0, -30, 0, 30, 0],
      x: [0, 20, -20, 10, 0],
      scale: [1, 1.1, 0.9, 1.05, 1],
    }}
    transition={{ duration: 8, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

export function OnboardingFlow({ onComplete, userName }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [birthDate, setBirthDate] = useState('');
  const [lastPeriodDate, setLastPeriodDate] = useState<Date>(subDays(new Date(), 14));
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['predict']);

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete({
        name: userName || '',
        birthDate: birthDate || undefined,
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

  const canProceed = () => {
    if (step === 1) return !!lastPeriodDate;
    if (step === 2) return selectedGoals.length > 0;
    return true;
  };

  const pageVariants = {
    initial: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 80 : -80,
      scale: 0.95,
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? -80 : 80,
      scale: 0.95,
    }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => {
    setDirection(1);
    handleNext();
  };

  const goBack = () => {
    setDirection(-1);
    handleBack();
  };

  return (
    <div className="min-h-screen gradient-soft flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background blobs */}
      <FloatingBlob delay={0} className="w-64 h-64 bg-coral -top-20 -left-20" />
      <FloatingBlob delay={2} className="w-48 h-48 bg-lavender top-1/3 -right-10" />
      <FloatingBlob delay={4} className="w-56 h-56 bg-sage -bottom-20 left-1/4" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Step {step + 1} of {totalSteps}</span>
            <span className="text-xs font-medium text-muted-foreground">
              {step === 0 ? 'Welcome' : step === 1 ? 'Your Cycle' : 'Your Goals'}
            </span>
          </div>
          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full rounded-full gradient-primary"
              initial={{ width: '0%' }}
              animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {/* Step 1: Welcome & Introduction */}
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="bg-card/90 backdrop-blur-md rounded-3xl shadow-elevated p-8 border border-border/30"
            >
              <div className="text-center">
                {/* Animated logo */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-3xl overflow-hidden shadow-elevated"
                >
                  <img src={logo} alt="Flow Index" className="w-full h-full object-cover" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="font-display text-3xl font-bold mb-2"
                >
                  Welcome{userName ? `, ${userName}` : ''}! 🌸
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground mb-8"
                >
                  Let's personalize your experience in just a few steps
                </motion.p>

                {/* Feature highlights with staggered animation */}
                <div className="space-y-3 text-left mb-6">
                  {[
                    { icon: <Droplets className="h-5 w-5 text-coral" />, text: 'Accurate period predictions & tracking', delay: 0.6 },
                    { icon: <Heart className="h-5 w-5 text-rose-400" />, text: 'Symptom insights & wellness journal', delay: 0.7 },
                    { icon: <Sparkles className="h-5 w-5 text-lavender" />, text: 'Smart health reports & analytics', delay: 0.8 },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: item.delay, duration: 0.3 }}
                      className="flex items-center gap-3 p-3.5 bg-muted/50 rounded-xl border border-border/20"
                    >
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Optional birth date */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="text-left"
                >
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date of Birth (optional)</Label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-12 rounded-xl border-border/30 bg-muted/30"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Cycle Information */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="bg-card/90 backdrop-blur-md rounded-3xl shadow-elevated p-8 border border-border/30"
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground shadow-lg"
                >
                  <Calendar className="h-8 w-8" />
                </motion.div>
                <h2 className="font-display text-2xl font-bold">Your Cycle Details</h2>
                <p className="text-sm text-muted-foreground mt-1">This helps us predict accurately</p>
              </div>

              <div className="space-y-6">
                {/* Last period date */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">When did your last period start?</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 rounded-xl border-border/30",
                          !lastPeriodDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4 text-coral" />
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

                {/* Cycle length */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Cycle length</Label>
                  <div className="flex items-center gap-4 bg-muted/30 rounded-2xl p-4 border border-border/20">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCycleLength(Math.max(21, cycleLength - 1))}
                      className="w-10 h-10 rounded-xl bg-background shadow-sm flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors"
                    >
                      −
                    </motion.button>
                    <div className="flex-1 text-center">
                      <motion.span
                        key={cycleLength}
                        initial={{ scale: 1.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl font-display font-bold text-coral"
                      >
                        {cycleLength}
                      </motion.span>
                      <p className="text-xs text-muted-foreground mt-0.5">days (avg 28)</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCycleLength(Math.min(45, cycleLength + 1))}
                      className="w-10 h-10 rounded-xl bg-background shadow-sm flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors"
                    >
                      +
                    </motion.button>
                  </div>
                </div>

                {/* Period length */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Period length</Label>
                  <div className="flex items-center gap-4 bg-muted/30 rounded-2xl p-4 border border-border/20">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setPeriodLength(Math.max(2, periodLength - 1))}
                      className="w-10 h-10 rounded-xl bg-background shadow-sm flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors"
                    >
                      −
                    </motion.button>
                    <div className="flex-1 text-center">
                      <motion.span
                        key={periodLength}
                        initial={{ scale: 1.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl font-display font-bold text-lavender"
                      >
                        {periodLength}
                      </motion.span>
                      <p className="text-xs text-muted-foreground mt-0.5">days (avg 5)</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setPeriodLength(Math.min(10, periodLength + 1))}
                      className="w-10 h-10 rounded-xl bg-background shadow-sm flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors"
                    >
                      +
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Goals */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="bg-card/90 backdrop-blur-md rounded-3xl shadow-elevated p-8 border border-border/30"
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sage/20 flex items-center justify-center shadow-lg"
                >
                  <Target className="h-8 w-8 text-sage" />
                </motion.div>
                <h2 className="font-display text-2xl font-bold">What matters to you?</h2>
                <p className="text-sm text-muted-foreground mt-1">Select all that apply — you can change later</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {trackingGoalOptions.map((goal, i) => (
                  <motion.button
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleGoal(goal.id)}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group",
                      selectedGoals.includes(goal.id)
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border/30 hover:border-primary/40 bg-muted/20"
                    )}
                  >
                    {selectedGoals.includes(goal.id) && (
                      <motion.div
                        layoutId="goal-check"
                        className="absolute top-2 right-2 w-5 h-5 rounded-full gradient-primary flex items-center justify-center"
                      >
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                    <div className={cn("mb-2", goal.color)}>{goal.icon}</div>
                    <span className="text-sm font-medium">{goal.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Encouraging message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-center"
              >
                <p className="text-xs text-muted-foreground">
                  🎉 You're all set! Tap "Get Started" to begin your journey
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3 mt-6"
        >
          {step > 0 && (
            <Button
              variant="outline"
              onClick={goBack}
              className="flex-1 h-12 rounded-xl border-border/30 bg-card/50 backdrop-blur-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <Button
            onClick={goNext}
            disabled={!canProceed()}
            className="flex-1 h-12 rounded-xl gradient-primary text-primary-foreground border-0 shadow-lg"
          >
            {step === totalSteps - 1 ? (
              <>
                Get Started
                <Sparkles className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
