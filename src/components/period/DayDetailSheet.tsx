import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { X, Droplets, Heart, Activity, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { DayLog, FlowIntensity, Mood, Symptom } from '@/types/period';

interface DayDetailSheetProps {
  date: Date | null;
  log: DayLog | undefined;
  isOpen: boolean;
  onClose: () => void;
  onLogPeriod: (date: Date, isPeriod: boolean, intensity?: FlowIntensity) => void;
  onLogMood: (date: Date, mood: Mood) => void;
  onLogSymptom: (date: Date, symptom: Symptom) => void;
  onLogNotes: (date: Date, notes: string) => void;
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

export function DayDetailSheet({
  date,
  log,
  isOpen,
  onClose,
  onLogPeriod,
  onLogMood,
  onLogSymptom,
  onLogNotes,
}: DayDetailSheetProps) {
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
              value={log?.notes || ''}
              onChange={(e) => onLogNotes(date, e.target.value)}
              className="min-h-[100px] resize-none border-lavender/30 focus:border-lavender"
            />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
