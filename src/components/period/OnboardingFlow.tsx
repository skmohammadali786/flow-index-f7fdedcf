import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { 
  ChevronRight, ChevronLeft, Flower2, Calendar, Sparkles, Heart, Shield, 
  BarChart3, Moon, Droplets, Target, Brain, Dumbbell, Baby, BookHeart,
  CheckCircle2, Zap, Star, Sun, CloudRain
} from 'lucide-react';
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
  { id: 'predict', label: 'Period Prediction', description: 'Know when your period is coming', icon: <Calendar className="h-5 w-5" />, color: 'from-coral to-peach' },
  { id: 'symptoms', label: 'Symptom Tracking', description: 'Monitor and understand your symptoms', icon: <Heart className="h-5 w-5" />, color: 'from-rose-400 to-pink-500' },
  { id: 'fertility', label: 'Fertility Awareness', description: 'Track your fertile window', icon: <Flower2 className="h-5 w-5" />, color: 'from-lavender to-purple-400' },
  { id: 'health', label: 'Wellness Insights', description: 'Holistic health monitoring', icon: <Shield className="h-5 w-5" />, color: 'from-sage to-emerald-400' },
  { id: 'mood', label: 'Mood Tracking', description: 'Understand emotional patterns', icon: <Moon className="h-5 w-5" />, color: 'from-amber-400 to-orange-400' },
  { id: 'fitness', label: 'Fitness & Activity', description: 'Sync workouts with your cycle', icon: <Dumbbell className="h-5 w-5" />, color: 'from-sky-400 to-blue-500' },
  { id: 'share', label: 'Partner Reports', description: 'Share insights with your partner', icon: <BarChart3 className="h-5 w-5" />, color: 'from-teal-400 to-cyan-500' },
  { id: 'mindmap', label: 'AI Mind Map', description: 'Get AI-powered health insights', icon: <Brain className="h-5 w-5" />, color: 'from-violet-400 to-purple-500' },
];

const lifestyleOptions = [
  { id: 'active', label: 'Active', icon: <Zap className="h-5 w-5" />, description: 'Regular exercise routine' },
  { id: 'moderate', label: 'Moderate', icon: <Sun className="h-5 w-5" />, description: 'Some physical activity' },
  { id: 'sedentary', label: 'Relaxed', icon: <CloudRain className="h-5 w-5" />, description: 'Light activity lifestyle' },
];

// Animated particles
const Particle = ({ index }: { index: number }) => {
  const size = Math.random() * 6 + 2;
  const startX = Math.random() * 100;
  const duration = Math.random() * 4 + 6;
  const delay = Math.random() * 3;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        background: `hsl(${355 + Math.random() * 30} ${50 + Math.random() * 30}% ${60 + Math.random() * 30}% / ${0.15 + Math.random() * 0.2})`,
      }}
      initial={{ y: '110vh', opacity: 0 }}
      animate={{ y: '-10vh', opacity: [0, 0.8, 0.8, 0] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
};

const FloatingBlob = ({ delay, className }: { delay: number; className: string }) => (
  <motion.div
    className={cn("absolute rounded-full opacity-15 blur-3xl", className)}
    animate={{
      y: [0, -30, 0, 30, 0],
      x: [0, 20, -20, 10, 0],
      scale: [1, 1.15, 0.9, 1.05, 1],
    }}
    transition={{ duration: 10, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

// Pulsing ring animation
const PulsingRing = ({ delay: d, size }: { delay: number; size: number }) => (
  <motion.div
    className="absolute rounded-full border border-primary/10"
    style={{ width: size, height: size }}
    initial={{ scale: 0.8, opacity: 0.6 }}
    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 0, 0.6] }}
    transition={{ duration: 3, delay: d, repeat: Infinity, ease: "easeInOut" }}
  />
);

export function OnboardingFlow({ onComplete, userName }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [birthDate, setBirthDate] = useState('');
  const [displayName, setDisplayName] = useState(userName || '');
  const [lastPeriodDate, setLastPeriodDate] = useState<Date>(subDays(new Date(), 14));
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['predict']);
  const [lifestyle, setLifestyle] = useState('moderate');
  const [direction, setDirection] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);

  const totalSteps = 5;

  useEffect(() => {
    if (step === totalSteps - 1) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete({
        name: displayName || userName || '',
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
    if (step === 0) return displayName.trim().length > 0;
    if (step === 2) return !!lastPeriodDate;
    if (step === 3) return selectedGoals.length > 0;
    return true;
  };

  const pageVariants = {
    initial: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 100 : -100,
      scale: 0.92,
      rotateY: dir > 0 ? 5 : -5,
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      rotateY: 0,
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -100 : 100,
      scale: 0.92,
      rotateY: dir > 0 ? -5 : 5,
    }),
  };

  const goNext = () => { setDirection(1); handleNext(); };
  const goBack = () => { setDirection(-1); handleBack(); };

  const stepLabels = ['Profile', 'Lifestyle', 'Your Cycle', 'Goals', 'Ready!'];

  return (
    <div className="relative h-screen w-full gradient-soft overflow-hidden">
      {/* Background Layer - Fixed */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <Particle key={i} index={i} />
        ))}

        {/* Blobs */}
        <FloatingBlob delay={0} className="w-72 h-72 bg-coral -top-24 -left-24" />
        <FloatingBlob delay={2} className="w-56 h-56 bg-lavender top-1/4 -right-16" />
        <FloatingBlob delay={4} className="w-64 h-64 bg-sage -bottom-24 left-1/3" />
        <FloatingBlob delay={6} className="w-40 h-40 bg-peach top-2/3 -left-10" />
      </div>

      {/* Confetti Layer - Fixed */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={`confetti-${i}`}
              className="absolute rounded-sm"
              style={{
                width: Math.random() * 8 + 4,
                height: Math.random() * 8 + 4,
                left: '50%',
                top: '40%',
                background: `hsl(${Math.random() * 360} ${60 + Math.random() * 30}% ${55 + Math.random() * 25}%)`,
              }}
              initial={{ scale: 0 }}
              animate={{
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                rotate: Math.random() * 720,
                scale: [0, 1, 0.5],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 2, delay: Math.random() * 0.3, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      {/* Content Layer - Scrollable */}
      <div className="relative z-10 h-full w-full overflow-y-auto">
        <div className="min-h-full w-full flex flex-col items-center p-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md my-auto"
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
        {/* Step indicator dots */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <motion.div
                  animate={{
                    scale: i === step ? 1 : 0.8,
                    backgroundColor: i <= step ? 'hsl(355 70% 65%)' : 'hsl(30 30% 88%)',
                  }}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors",
                    i === step && "ring-4 ring-primary/20"
                  )}
                />
                {i < stepLabels.length - 1 && (
                  <motion.div
                    animate={{ backgroundColor: i < step ? 'hsl(355 70% 65%)' : 'hsl(30 30% 88%)' }}
                    className="w-6 h-0.5 rounded-full"
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs font-medium text-muted-foreground">{stepLabels[step]}</p>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {/* Step 1: Profile Setup */}
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-card/90 backdrop-blur-xl rounded-3xl shadow-elevated p-8 border border-border/30"
            >
              <div className="text-center">
                {/* Logo with pulsing rings */}
                <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                  <PulsingRing delay={0} size={112} />
                  <PulsingRing delay={1} size={140} />
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                    className="w-24 h-24 rounded-3xl overflow-hidden shadow-elevated relative z-10"
                  >
                    <img src={logo} alt="Flow Index" className="w-full h-full object-cover" />
                  </motion.div>
                </div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="font-display text-3xl font-bold mb-2"
                >
                  Welcome to Flow Index
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground mb-6 text-sm"
                >
                  Your intelligent health companion. Let's get to know you.
                </motion.p>

                {/* Name input with floating label effect */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-left space-y-4"
                >
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">What should we call you?</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="h-12 rounded-xl border-border/30 bg-muted/30 text-base"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date of Birth (optional)</Label>
                    <Input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="h-12 rounded-xl border-border/30 bg-muted/30"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </motion.div>

                {/* Feature preview cards */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-6 grid grid-cols-3 gap-2"
                >
                  {[
                    { icon: <Droplets className="h-4 w-4 text-coral" />, label: 'Track' },
                    { icon: <Brain className="h-4 w-4 text-lavender" />, label: 'Predict' },
                    { icon: <Heart className="h-4 w-4 text-rose-400" />, label: 'Thrive' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + i * 0.1 }}
                      className="flex flex-col items-center gap-1.5 p-3 bg-muted/40 rounded-xl border border-border/20"
                    >
                      {item.icon}
                      <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Lifestyle */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-card/90 backdrop-blur-xl rounded-3xl shadow-elevated p-8 border border-border/30"
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-peach to-coral flex items-center justify-center text-white shadow-lg"
                >
                  <Star className="h-8 w-8" />
                </motion.div>
                <h2 className="font-display text-2xl font-bold">Your Lifestyle</h2>
                <p className="text-sm text-muted-foreground mt-1">Help us tailor recommendations for you</p>
              </div>

              <div className="space-y-3">
                {lifestyleOptions.map((option, i) => (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setLifestyle(option.id)}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4",
                      lifestyle === option.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border/30 hover:border-primary/30 bg-muted/20"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      lifestyle === option.id ? "gradient-primary text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                    {lifestyle === option.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Quick health question */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-5 p-4 bg-muted/30 rounded-xl border border-border/20"
              >
                <p className="text-xs text-muted-foreground text-center">
                  💡 We'll personalize health tips, workout suggestions, and cycle predictions based on your lifestyle
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* Step 3: Cycle Information */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-card/90 backdrop-blur-xl rounded-3xl shadow-elevated p-8 border border-border/30"
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

              <div className="space-y-5">
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

                {/* Cycle length with visual ring */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Cycle length</Label>
                  <div className="flex items-center gap-4 bg-muted/30 rounded-2xl p-4 border border-border/20">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCycleLength(Math.max(21, cycleLength - 1))}
                      className="w-11 h-11 rounded-xl bg-background shadow-sm flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors"
                    >
                      −
                    </motion.button>
                    <div className="flex-1 text-center relative">
                      <div className="relative w-20 h-20 mx-auto">
                        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                          <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                          <motion.circle
                            cx="40" cy="40" r="34" fill="none"
                            stroke="hsl(var(--coral))" strokeWidth="4"
                            strokeDasharray={`${(cycleLength / 45) * 213.6} 213.6`}
                            strokeLinecap="round"
                            initial={{ strokeDasharray: '0 213.6' }}
                            animate={{ strokeDasharray: `${(cycleLength / 45) * 213.6} 213.6` }}
                            transition={{ duration: 0.3 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.span
                            key={cycleLength}
                            initial={{ scale: 1.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-2xl font-display font-bold text-coral"
                          >
                            {cycleLength}
                          </motion.span>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">days</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCycleLength(Math.min(45, cycleLength + 1))}
                      className="w-11 h-11 rounded-xl bg-background shadow-sm flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors"
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
                      className="w-11 h-11 rounded-xl bg-background shadow-sm flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors"
                    >
                      −
                    </motion.button>
                    <div className="flex-1 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              height: i < periodLength ? 24 : 8,
                              backgroundColor: i < periodLength ? 'hsl(280 40% 75%)' : 'hsl(var(--muted))',
                            }}
                            className="w-2 rounded-full"
                            transition={{ duration: 0.2, delay: i * 0.03 }}
                          />
                        ))}
                      </div>
                      <motion.span
                        key={periodLength}
                        initial={{ scale: 1.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-xl font-display font-bold text-lavender mt-2 block"
                      >
                        {periodLength} days
                      </motion.span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setPeriodLength(Math.min(10, periodLength + 1))}
                      className="w-11 h-11 rounded-xl bg-background shadow-sm flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors"
                    >
                      +
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Goals */}
          {step === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-card/90 backdrop-blur-xl rounded-3xl shadow-elevated p-8 border border-border/30"
            >
              <div className="text-center mb-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sage/20 flex items-center justify-center shadow-lg"
                >
                  <Target className="h-8 w-8 text-sage" />
                </motion.div>
                <h2 className="font-display text-2xl font-bold">What matters to you?</h2>
                <p className="text-sm text-muted-foreground mt-1">Select all that apply</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                {trackingGoalOptions.map((goal, i) => (
                  <motion.button
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleGoal(goal.id)}
                    className={cn(
                      "p-3.5 rounded-2xl border-2 transition-all text-left relative overflow-hidden",
                      selectedGoals.includes(goal.id)
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border/30 hover:border-primary/30 bg-muted/20"
                    )}
                  >
                    {selectedGoals.includes(goal.id) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full gradient-primary flex items-center justify-center"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center mb-2 bg-gradient-to-br text-white",
                      goal.color
                    )}>
                      {goal.icon}
                    </div>
                    <span className="text-xs font-semibold block">{goal.label}</span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5 leading-tight">{goal.description}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 5: All Set - Summary */}
          {step === 4 && (
            <motion.div
              key="step-4"
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-card/90 backdrop-blur-xl rounded-3xl shadow-elevated p-8 border border-border/30"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-5 rounded-full gradient-primary flex items-center justify-center shadow-elevated"
                >
                  <Sparkles className="h-10 w-10 text-white" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="font-display text-2xl font-bold"
                >
                  You're all set, {displayName || 'there'}! 🎉
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-muted-foreground mt-2 mb-6"
                >
                  Here's your personalized setup
                </motion.p>

                {/* Summary cards */}
                <div className="space-y-2.5 text-left">
                  {[
                    { label: 'Cycle', value: `${cycleLength} day cycle, ${periodLength} day period`, icon: <Calendar className="h-4 w-4 text-coral" /> },
                    { label: 'Last Period', value: format(lastPeriodDate, 'MMM d, yyyy'), icon: <Droplets className="h-4 w-4 text-lavender" /> },
                    { label: 'Goals', value: `${selectedGoals.length} tracking goals`, icon: <Target className="h-4 w-4 text-sage" /> },
                    { label: 'Lifestyle', value: lifestyleOptions.find(l => l.id === lifestyle)?.label || 'Moderate', icon: <Zap className="h-4 w-4 text-peach" /> },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="flex items-center gap-3 p-3.5 bg-muted/40 rounded-xl border border-border/20"
                    >
                      <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shadow-sm shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{item.label}</div>
                        <div className="text-sm font-medium">{item.value}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="text-xs text-muted-foreground mt-5"
                >
                  ✨ Tap "Get Started" to begin your wellness journey
                </motion.p>
              </div>
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
            className="flex-1 h-14 rounded-xl gradient-primary text-primary-foreground border-0 shadow-lg text-base font-semibold"
          >
            {step === totalSteps - 1 ? (
              <>
                Get Started
                <Sparkles className="h-5 w-5 ml-2" />
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
      </div>
    </div>
  );
}
