import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { X, Droplets, Heart, Activity, FileText, GlassWater, Pill, Moon, Dumbbell, Thermometer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { DayLog, FlowIntensity, Mood, Symptom, Medication, SleepQuality } from '@/types/period';

interface DayDetailSheetProps {
  date: Date | null;
  log: DayLog | undefined;
  isOpen: boolean;
  onClose: () => void;
  onLogPeriod: (date: Date, isPeriod: boolean, intensity?: FlowIntensity) => void;
  onLogMood: (date: Date, mood: Mood) => void;
  onLogSymptom: (date: Date, symptom: Symptom) => void;
  onLogNotes: (date: Date, notes: string) => void;
  onLogWaterIntake?: (date: Date, glasses: number) => void;
  onLogMedication?: (date: Date, medication: Medication) => void;
  onLogSleep?: (date: Date, hours: number, quality?: SleepQuality) => void;
  onLogExercise?: (date: Date, minutes: number) => void;
  onLogTemperature?: (date: Date, temp: number) => void;
}

const flowOptions: { value: FlowIntensity; label: string; icon: string }[] = [
  { value: 'spotting', label: 'Spotting', icon: '💧' },
  { value: 'light', label: 'Light', icon: '🩸' },
  { value: 'medium', label: 'Medium', icon: '🩸🩸' },
  { value: 'heavy', label: 'Heavy', icon: '🩸🩸🩸' },
];

const moodOptions: { value: Mood; label: string; icon: string }[] = [
  { value: 'happy', label: 'Happy', icon: '😊' },
  { value: 'calm', label: 'Calm', icon: '😌' },
  { value: 'sad', label: 'Sad', icon: '😢' },
  { value: 'anxious', label: 'Anxious', icon: '😰' },
  { value: 'irritable', label: 'Irritable', icon: '😤' },
  { value: 'energetic', label: 'Energetic', icon: '⚡' },
  { value: 'tired', label: 'Tired', icon: '😴' },
];

const symptomOptions: { value: Symptom; label: string; icon: string }[] = [
  { value: 'cramps', label: 'Cramps', icon: '😣' },
  { value: 'headache', label: 'Headache', icon: '🤕' },
  { value: 'backache', label: 'Backache', icon: '🔙' },
  { value: 'bloating', label: 'Bloating', icon: '🎈' },
  { value: 'breast_tenderness', label: 'Breast tenderness', icon: '💔' },
  { value: 'acne', label: 'Acne', icon: '🔴' },
  { value: 'fatigue', label: 'Fatigue', icon: '😩' },
  { value: 'insomnia', label: 'Insomnia', icon: '🌙' },
  { value: 'nausea', label: 'Nausea', icon: '🤢' },
  { value: 'cravings', label: 'Cravings', icon: '🍫' },
];

const sleepQualityOptions: { value: SleepQuality; label: string; icon: string }[] = [
  { value: 'poor', label: 'Poor', icon: '😫' },
  { value: 'fair', label: 'Fair', icon: '😐' },
  { value: 'good', label: 'Good', icon: '🙂' },
  { value: 'excellent', label: 'Excellent', icon: '😴' },
];

const commonMedications = [
  { name: 'Pain reliever', dosage: '' },
  { name: 'Birth control', dosage: '' },
  { name: 'Iron supplement', dosage: '' },
  { name: 'Vitamin D', dosage: '' },
];

// Custom hook for debounced value
function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedCallback;
}

export function DayDetailSheet({
  date,
  log,
  isOpen,
  onClose,
  onLogPeriod,
  onLogMood,
  onLogSymptom,
  onLogNotes,
  onLogWaterIntake,
  onLogMedication,
  onLogSleep,
  onLogExercise,
  onLogTemperature,
}: DayDetailSheetProps) {
  // Local state for sliders to prevent lag
  const [localWater, setLocalWater] = useState(0);
  const [localSleep, setLocalSleep] = useState(0);
  const [localExercise, setLocalExercise] = useState(0);
  const [localNotes, setLocalNotes] = useState('');
  const [localTemp, setLocalTemp] = useState<number | undefined>(undefined);

  // Sync local state when log changes
  useEffect(() => {
    setLocalWater(log?.waterIntake ?? 0);
    setLocalSleep(log?.sleepHours ?? 0);
    setLocalExercise(log?.exerciseMinutes ?? 0);
    setLocalNotes(log?.notes ?? '');
    setLocalTemp(log?.temperature);
  }, [log, date]);

  // Debounced save functions (500ms delay)
  const debouncedSaveWater = useDebouncedCallback(
    (d: Date, value: number) => onLogWaterIntake?.(d, value),
    500
  );
  
  const debouncedSaveSleep = useDebouncedCallback(
    (d: Date, hours: number, quality?: SleepQuality) => onLogSleep?.(d, hours, quality),
    500
  );
  
  const debouncedSaveExercise = useDebouncedCallback(
    (d: Date, minutes: number) => onLogExercise?.(d, minutes),
    500
  );
  
  const debouncedSaveNotes = useDebouncedCallback(
    (d: Date, notes: string) => onLogNotes(d, notes),
    500
  );
  
  const debouncedSaveTemp = useDebouncedCallback(
    (d: Date, temp: number) => onLogTemperature?.(d, temp),
    500
  );

  if (!date) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto bg-card">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-2xl">
            {format(date, 'EEEE, MMMM d')}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-8">
          {/* Period tracking */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-coral-light">
                <Droplets className="h-5 w-5 text-coral" />
              </div>
              <h3 className="font-semibold text-lg">Period</h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {!log?.isPeriod ? (
                <Button
                  variant="outline"
                  onClick={() => onLogPeriod(date, true, 'medium')}
                  className="col-span-2 border-coral text-coral hover:bg-coral hover:text-primary-foreground"
                >
                  <Droplets className="h-4 w-4 mr-2" />
                  Log Period
                </Button>
              ) : (
                <>
                  {flowOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onLogPeriod(date, true, option.value)}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all text-sm",
                        log.flowIntensity === option.value
                          ? "border-coral bg-coral-light"
                          : "border-border hover:border-coral/50"
                      )}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <p className="mt-1">{option.label}</p>
                    </motion.button>
                  ))}
                  <Button
                    variant="ghost"
                    onClick={() => onLogPeriod(date, false)}
                    className="col-span-2 text-muted-foreground"
                  >
                    Remove period log
                  </Button>
                </>
              )}
            </div>
          </section>

          {/* Mood tracking */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-sage-light">
                <Heart className="h-5 w-5 text-sage" />
              </div>
              <h3 className="font-semibold text-lg">Mood</h3>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {moodOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onLogMood(date, option.value)}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all flex flex-col items-center",
                    log?.moods.includes(option.value)
                      ? "border-sage bg-sage-light"
                      : "border-border hover:border-sage/50"
                  )}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <p className="text-xs mt-1 text-muted-foreground">{option.label}</p>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Symptom tracking */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-peach-light">
                <Activity className="h-5 w-5 text-peach" />
              </div>
              <h3 className="font-semibold text-lg">Symptoms</h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {symptomOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onLogSymptom(date, option.value)}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all flex items-center gap-2",
                    log?.symptoms.includes(option.value)
                      ? "border-peach bg-peach-light"
                      : "border-border hover:border-peach/50"
                  )}
                >
                  <span className="text-lg">{option.icon}</span>
                  <p className="text-sm">{option.label}</p>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Water Intake */}
          {onLogWaterIntake && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-secondary">
                  <GlassWater className="h-5 w-5 text-secondary-foreground" />
                </div>
                <h3 className="font-semibold text-lg">Water Intake</h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Slider
                    value={[localWater]}
                    min={0}
                    max={12}
                    step={1}
                    onValueChange={(value) => {
                      setLocalWater(value[0]);
                      debouncedSaveWater(date, value[0]);
                    }}
                    className="w-full"
                  />
                </div>
                <div className="text-center min-w-[60px]">
                  <span className="text-2xl font-semibold">{localWater}</span>
                  <p className="text-xs text-muted-foreground">glasses</p>
                </div>
              </div>
              
              <div className="flex gap-1 mt-3 justify-center">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setLocalWater(i + 1);
                      onLogWaterIntake?.(date, i + 1);
                    }}
                    className={cn(
                      "w-6 h-8 rounded transition-colors",
                      i < localWater ? "bg-secondary" : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Sleep Tracking */}
          {onLogSleep && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-lavender-light">
                  <Moon className="h-5 w-5 text-lavender" />
                </div>
                <h3 className="font-semibold text-lg">Sleep</h3>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <Slider
                    value={[localSleep]}
                    min={0}
                    max={12}
                    step={0.5}
                    onValueChange={(value) => {
                      setLocalSleep(value[0]);
                      debouncedSaveSleep(date, value[0], log?.sleepQuality);
                    }}
                    className="w-full"
                  />
                </div>
                <div className="text-center min-w-[60px]">
                  <span className="text-2xl font-semibold">{localSleep}</span>
                  <p className="text-xs text-muted-foreground">hours</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {sleepQualityOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onLogSleep?.(date, localSleep || 7, option.value)}
                    className={cn(
                      "p-2 rounded-xl border-2 transition-all flex flex-col items-center",
                      log?.sleepQuality === option.value
                        ? "border-lavender bg-lavender-light"
                        : "border-border hover:border-lavender/50"
                    )}
                  >
                    <span className="text-xl">{option.icon}</span>
                    <p className="text-xs mt-1 text-muted-foreground">{option.label}</p>
                  </motion.button>
                ))}
              </div>
            </section>
          )}

          {/* Exercise */}
          {onLogExercise && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-sage-light">
                  <Dumbbell className="h-5 w-5 text-sage" />
                </div>
                <h3 className="font-semibold text-lg">Exercise</h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Slider
                    value={[localExercise]}
                    min={0}
                    max={120}
                    step={5}
                    onValueChange={(value) => {
                      setLocalExercise(value[0]);
                      debouncedSaveExercise(date, value[0]);
                    }}
                    className="w-full"
                  />
                </div>
                <div className="text-center min-w-[60px]">
                  <span className="text-2xl font-semibold">{localExercise}</span>
                  <p className="text-xs text-muted-foreground">minutes</p>
                </div>
              </div>

              <div className="flex gap-2 mt-3 justify-center flex-wrap">
                {[15, 30, 45, 60, 90].map((mins) => (
                  <Button
                    key={mins}
                    variant={localExercise === mins ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setLocalExercise(mins);
                      onLogExercise?.(date, mins);
                    }}
                    className="text-xs"
                  >
                    {mins} min
                  </Button>
                ))}
              </div>
            </section>
          )}

          {/* Medications */}
          {onLogMedication && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-coral-light">
                  <Pill className="h-5 w-5 text-coral" />
                </div>
                <h3 className="font-semibold text-lg">Medications</h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {commonMedications.map((med) => {
                  const loggedMed = log?.medications?.find(m => m.name === med.name);
                  return (
                    <motion.button
                      key={med.name}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onLogMedication(date, { ...med, taken: true })}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all flex items-center gap-2",
                        loggedMed?.taken
                          ? "border-coral bg-coral-light"
                          : "border-border hover:border-coral/50"
                      )}
                    >
                      <Pill className="h-4 w-4" />
                      <p className="text-sm">{med.name}</p>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Temperature */}
          {onLogTemperature && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-peach-light">
                  <Thermometer className="h-5 w-5 text-peach" />
                </div>
                <h3 className="font-semibold text-lg">Basal Temperature</h3>
              </div>

              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  step="0.1"
                  min="35"
                  max="40"
                  placeholder="36.5"
                  value={localTemp ?? ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setLocalTemp(isNaN(value) ? undefined : value);
                    if (!isNaN(value)) {
                      debouncedSaveTemp(date, value);
                    }
                  }}
                  className="flex-1"
                />
                <span className="text-muted-foreground">°C</span>
              </div>
            </section>
          )}

          {/* Notes */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-lavender-light">
                <FileText className="h-5 w-5 text-lavender" />
              </div>
              <h3 className="font-semibold text-lg">Notes</h3>
            </div>

            <Textarea
              placeholder="Add any notes for this day..."
              value={localNotes}
              onChange={(e) => {
                // Sanitize input: remove control characters and limit length
                const sanitizedValue = e.target.value
                  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
                  .slice(0, 500); // Limit to 500 characters
                setLocalNotes(sanitizedValue);
                debouncedSaveNotes(date, sanitizedValue);
              }}
              maxLength={500}
              className="min-h-[100px] resize-none border-lavender/30 focus:border-lavender"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {localNotes.length}/500 characters
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}