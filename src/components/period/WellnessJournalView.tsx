import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfDay, subDays } from 'date-fns';
import {
  BookHeart,
  Sparkles,
  Heart,
  Zap,
  ChevronLeft,
  ChevronRight,
  Flame,
  Star,
  Trash2,
  Bath,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useWellnessJournal, type JournalEntry } from '@/hooks/useWellnessJournal';

const MOOD_EMOJIS = [
  { value: 1, label: 'Rough', icon: '😔' },
  { value: 2, label: 'Low', icon: '😕' },
  { value: 3, label: 'Okay', icon: '😊' },
  { value: 4, label: 'Good', icon: '😄' },
  { value: 5, label: 'Great', icon: '🤩' },
];

const ENERGY_LEVELS = [
  { value: 1, label: 'Drained', color: 'bg-red-400' },
  { value: 2, label: 'Low', color: 'bg-orange-400' },
  { value: 3, label: 'Moderate', color: 'bg-yellow-400' },
  { value: 4, label: 'Energized', color: 'bg-lime-400' },
  { value: 5, label: 'Vibrant', color: 'bg-green-400' },
];

const JOURNAL_TAGS = [
  'Gratitude', 'Self-Love', 'Growth', 'Healing', 'Peace',
  'Joy', 'Strength', 'Calm', 'Creative', 'Mindful',
];

export function WellnessJournalView() {
  const { entries, isLoaded, getEntryForDate, saveEntry, deleteEntry, getStreak } = useWellnessJournal();
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [moodRating, setMoodRating] = useState<number | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [gratitude, setGratitude] = useState('');
  const [reflection, setReflection] = useState('');
  const [affirmation, setAffirmation] = useState('');
  const [selfCareDone, setSelfCareDone] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const streak = getStreak();
  const existingEntry = getEntryForDate(selectedDate);
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const loadEntryIntoForm = (entry: JournalEntry) => {
    setMoodRating(entry.mood_rating);
    setEnergyLevel(entry.energy_level);
    setGratitude(entry.gratitude || '');
    setReflection(entry.reflection || '');
    setAffirmation(entry.affirmation || '');
    setSelfCareDone(entry.self_care_done);
    setSelectedTags(entry.tags || []);
    setIsEditing(true);
  };

  const resetForm = () => {
    setMoodRating(null);
    setEnergyLevel(null);
    setGratitude('');
    setReflection('');
    setAffirmation('');
    setSelfCareDone(false);
    setSelectedTags([]);
    setIsEditing(false);
  };

  const navigateDate = (direction: -1 | 1) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    if (newDate > new Date()) return;
    setSelectedDate(startOfDay(newDate));
    resetForm();
  };

  const handleSave = async () => {
    await saveEntry(selectedDate, {
      mood_rating: moodRating,
      energy_level: energyLevel,
      gratitude: gratitude.trim() || null,
      reflection: reflection.trim() || null,
      affirmation: affirmation.trim() || null,
      self_care_done: selfCareDone,
      tags: selectedTags,
    });
    setIsEditing(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    if (!isEditing) setIsEditing(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 rounded-full gradient-primary animate-pulse-soft" />
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
      {/* Header with streak */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20">
            <BookHeart className="h-6 w-6 text-pink-500" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">Wellness Journal</h2>
            <p className="text-xs text-muted-foreground">Your daily reflection space</p>
          </div>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-600">{streak}</span>
          </div>
        )}
      </motion.div>

      {/* Date Navigator */}
      <motion.div variants={itemVariants} className="bg-card rounded-2xl p-4 shadow-card flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)} className="rounded-full">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <p className="font-semibold">{isToday ? 'Today' : format(selectedDate, 'EEEE')}</p>
          <p className="text-xs text-muted-foreground">{format(selectedDate, 'MMM d, yyyy')}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigateDate(1)} disabled={isToday} className="rounded-full">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* Show existing entry or form */}
      {existingEntry && !isEditing ? (
        <motion.div variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Today's Entry
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => loadEntryIntoForm(existingEntry)}>Edit</Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteEntry(existingEntry.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {existingEntry.mood_rating && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{MOOD_EMOJIS.find(m => m.value === existingEntry.mood_rating)?.icon}</span>
              <span className="text-sm font-medium">{MOOD_EMOJIS.find(m => m.value === existingEntry.mood_rating)?.label}</span>
            </div>
          )}

          {existingEntry.energy_level && (
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Energy: {ENERGY_LEVELS.find(e => e.value === existingEntry.energy_level)?.label}</span>
            </div>
          )}

          {existingEntry.gratitude && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Gratitude</p>
              <p className="text-sm bg-muted/50 rounded-lg p-3">{existingEntry.gratitude}</p>
            </div>
          )}

          {existingEntry.reflection && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Reflection</p>
              <p className="text-sm bg-muted/50 rounded-lg p-3">{existingEntry.reflection}</p>
            </div>
          )}

          {existingEntry.affirmation && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Affirmation</p>
              <p className="text-sm italic bg-muted/50 rounded-lg p-3">"{existingEntry.affirmation}"</p>
            </div>
          )}

          {existingEntry.self_care_done && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Bath className="h-4 w-4" />
              Self-care completed
            </div>
          )}

          {existingEntry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {existingEntry.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <>
          {/* Mood Rating */}
          <motion.div variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              How are you feeling?
            </h3>
            <div className="flex justify-between">
              {MOOD_EMOJIS.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => { setMoodRating(mood.value); if (!isEditing) setIsEditing(true); }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    moodRating === mood.value
                      ? 'bg-primary/10 scale-110 ring-2 ring-primary/30'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="text-2xl">{mood.icon}</span>
                  <span className="text-[10px] text-muted-foreground">{mood.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Energy Level */}
          <motion.div variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Energy Level
            </h3>
            <div className="flex gap-2">
              {ENERGY_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => { setEnergyLevel(level.value); if (!isEditing) setIsEditing(true); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    energyLevel === level.value
                      ? `${level.color} text-white scale-105 shadow-md`
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Gratitude */}
          <motion.div variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              What are you grateful for?
            </h3>
            <Textarea
              placeholder="Today I'm grateful for..."
              value={gratitude}
              onChange={e => { setGratitude(e.target.value); if (!isEditing) setIsEditing(true); }}
              className="min-h-[80px] resize-none"
            />
          </motion.div>

          {/* Reflection */}
          <motion.div variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold mb-3">Daily Reflection</h3>
            <Textarea
              placeholder="How was your day? What's on your mind?"
              value={reflection}
              onChange={e => { setReflection(e.target.value); if (!isEditing) setIsEditing(true); }}
              className="min-h-[80px] resize-none"
            />
          </motion.div>

          {/* Affirmation */}
          <motion.div variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold mb-3">Today's Affirmation</h3>
            <Textarea
              placeholder="I am..."
              value={affirmation}
              onChange={e => { setAffirmation(e.target.value); if (!isEditing) setIsEditing(true); }}
              className="min-h-[60px] resize-none"
            />
          </motion.div>

          {/* Self Care & Tags */}
          <motion.div variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Bath className="h-4 w-4 text-blue-500" />
                Did you practice self-care today?
              </Label>
              <Switch checked={selfCareDone} onCheckedChange={v => { setSelfCareDone(v); if (!isEditing) setIsEditing(true); }} />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {JOURNAL_TAGS.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Save */}
          <motion.div variants={itemVariants}>
            <Button
              className="w-full rounded-xl h-12 font-semibold text-base"
              onClick={handleSave}
              disabled={!moodRating && !gratitude.trim() && !reflection.trim() && !affirmation.trim()}
            >
              {existingEntry ? 'Update Entry' : 'Save Entry'}
            </Button>
          </motion.div>
        </>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <motion.div variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
          <h3 className="font-semibold mb-3">Recent Entries</h3>
          <div className="space-y-2">
            {entries.slice(0, 7).map(entry => (
              <button
                key={entry.id}
                onClick={() => {
                  setSelectedDate(startOfDay(new Date(entry.date)));
                  resetForm();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                  format(selectedDate, 'yyyy-MM-dd') === entry.date ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {entry.mood_rating && (
                    <span className="text-lg">{MOOD_EMOJIS.find(m => m.value === entry.mood_rating)?.icon}</span>
                  )}
                  <span className="text-sm">{format(new Date(entry.date), 'MMM d')}</span>
                </div>
                <div className="flex items-center gap-1">
                  {entry.self_care_done && <Bath className="h-3.5 w-3.5 text-blue-500" />}
                  {entry.tags.length > 0 && (
                    <span className="text-xs text-muted-foreground">{entry.tags.length} tags</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
