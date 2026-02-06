import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  Edit2, 
  Check, 
  X,
  Sparkles,
  Heart,
  Award,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserProfile } from '@/types/settings';
import { CycleStats } from '@/types/period';
import { format, parseISO, differenceInDays } from 'date-fns';

interface ProfileViewProps {
  profile: UserProfile;
  stats: CycleStats | null;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

export function ProfileView({ profile, stats, onUpdateProfile }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);
  const [editedBirthDate, setEditedBirthDate] = useState(profile.birthDate || '');

  // Sync local state with profile when it changes (e.g., after import)
  useEffect(() => {
    setEditedName(profile.name);
    setEditedBirthDate(profile.birthDate || '');
  }, [profile.name, profile.birthDate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const handleSave = () => {
    onUpdateProfile({
      name: editedName,
      birthDate: editedBirthDate || undefined,
    });
    setIsEditing(false);
  };

  // Calculate days tracking properly - ensure it's at least 0
  const daysTracking = useMemo(() => {
    try {
      const created = parseISO(profile.createdAt);
      const diff = differenceInDays(new Date(), created);
      return Math.max(0, diff);
    } catch {
      return 0;
    }
  }, [profile.createdAt]);

  // Get actual logged days count
  const totalLoggedDays = useMemo(() => {
    // This would need to be passed from parent - for now estimate based on cycles
    return stats ? Math.max(stats.totalCycles * (stats.averagePeriodLength || 5), daysTracking > 0 ? 1 : 0) : 0;
  }, [stats, daysTracking]);

  // Calculate achievements based on actual data
  const achievements = useMemo(() => [
    {
      id: 'first_log',
      title: 'First Log',
      description: 'Logged your first period',
      icon: '🌸',
      earned: (stats?.totalCycles ?? 0) >= 1,
    },
    {
      id: 'consistent',
      title: 'Consistent Tracker',
      description: 'Tracked 3 complete cycles',
      icon: '📊',
      earned: (stats?.totalCycles ?? 0) >= 3,
    },
    {
      id: 'week_streak',
      title: 'Week Streak',
      description: 'Using app for 7+ days',
      icon: '🔥',
      earned: daysTracking >= 7,
    },
    {
      id: 'month_tracker',
      title: 'Monthly Master',
      description: 'Using app for 30+ days',
      icon: '🏆',
      earned: daysTracking >= 30,
    },
    {
      id: 'cycle_expert',
      title: 'Cycle Expert',
      description: 'Tracked 6 complete cycles',
      icon: '🎓',
      earned: (stats?.totalCycles ?? 0) >= 6,
    },
    {
      id: 'year_veteran',
      title: 'Year Veteran',
      description: 'Using app for a full year',
      icon: '💎',
      earned: daysTracking >= 365,
    },
  ], [stats, daysTracking]);

  const earnedAchievements = achievements.filter(a => a.earned);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Profile Card */}
      <motion.section variants={itemVariants} className="bg-card rounded-2xl p-6 shadow-card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-3xl text-primary-foreground font-display">
              {profile.name ? profile.name.charAt(0).toUpperCase() : '🌸'}
            </div>
            <div>
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter your name"
                  className="mb-2"
                />
              ) : (
                <h2 className="text-xl font-display font-semibold">
                  {profile.name || 'Welcome, Beautiful!'}
                </h2>
              )}
              <p className="text-sm text-muted-foreground">
                Tracking since {format(parseISO(profile.createdAt), 'MMM yyyy')}
              </p>
            </div>
          </div>

          {isEditing ? (
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={handleSave}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isEditing && (
          <div className="space-y-4 mb-4">
            <div>
              <Label>Birth Date (optional)</Label>
              <Input
                type="date"
                value={editedBirthDate}
                onChange={(e) => setEditedBirthDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-display font-semibold text-coral">
              {daysTracking}
            </p>
            <p className="text-xs text-muted-foreground">Days Tracking</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-semibold text-lavender">
              {stats?.totalCycles ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Cycles Logged</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-semibold text-sage">
              {earnedAchievements.length}
            </p>
            <p className="text-xs text-muted-foreground">Achievements</p>
          </div>
        </div>
      </motion.section>


      {/* Achievements */}
      <motion.section variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-peach-light">
            <Award className="h-5 w-5 text-peach" />
          </div>
          <h2 className="font-semibold">Achievements</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`text-center p-3 rounded-xl transition-all ${
                achievement.earned 
                  ? 'bg-gradient-to-br from-coral-light to-peach-light' 
                  : 'bg-muted/50 opacity-50'
              }`}
            >
              <div className="text-2xl mb-1">{achievement.icon}</div>
              <p className="text-xs font-medium">{achievement.title}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Health Summary */}
      {stats && (
        <motion.section variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-coral-light">
              <Heart className="h-5 w-5 text-coral" />
            </div>
            <h2 className="font-semibold">Cycle Health</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Cycle Regularity</span>
                <span className="font-medium">
                  {stats.longestCycle - stats.shortestCycle <= 7 ? 'Regular' : 'Variable'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full gradient-primary rounded-full"
                  style={{ 
                    width: `${Math.max(20, 100 - (stats.longestCycle - stats.shortestCycle) * 10)}%` 
                  }}
                />
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>
                Your cycle varies by {stats.longestCycle - stats.shortestCycle} days 
                ({stats.shortestCycle}-{stats.longestCycle} day range).
                {stats.longestCycle - stats.shortestCycle <= 7 
                  ? ' This is within the normal range.'
                  : ' Consider consulting a healthcare provider for irregular cycles.'}
              </p>
            </div>
          </div>
        </motion.section>
      )}

      {/* Privacy Notice */}
      <motion.section variants={itemVariants} className="bg-muted/50 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium text-sm">Your Privacy Matters</p>
            <p className="text-xs text-muted-foreground mt-1">
              All your data is stored locally on your device. We never access or share your personal health information.
            </p>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
