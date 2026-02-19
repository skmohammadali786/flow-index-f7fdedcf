import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Calendar, Edit2, Check, X, Sparkles, Heart, Award, Shield, LogOut,
  Camera, Upload, Loader2, Activity, TrendingUp, Clock, Dumbbell, Brain,
  Mail, MapPin, Cake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserProfile } from '@/types/settings';
import { CycleStats } from '@/types/period';
import { format, parseISO, differenceInDays, differenceInYears } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface ProfileViewProps {
  profile: UserProfile;
  stats: CycleStats | null;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

export function ProfileView({ profile, stats, onUpdateProfile }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);
  const [editedBirthDate, setEditedBirthDate] = useState(profile.birthDate || '');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, signOut } = useAuth();

  // Activity counts from DB
  const [activityCounts, setActivityCounts] = useState({
    periodLogs: 0, wellnessEntries: 0, workouts: 0, fertilityLogs: 0, clinicalAssessments: 0
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, w, wk, f, c] = await Promise.all([
        supabase.from('period_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('wellness_journal').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('workout_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('fertility_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('clinical_assessments').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      setActivityCounts({
        periodLogs: p.count || 0,
        wellnessEntries: w.count || 0,
        workouts: wk.count || 0,
        fertilityLogs: f.count || 0,
        clinicalAssessments: c.count || 0,
      });
    })();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
  };

  useEffect(() => {
    setEditedName(profile.name);
    setEditedBirthDate(profile.birthDate || '');
  }, [profile.name, profile.birthDate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const handleSave = () => {
    onUpdateProfile({ name: editedName, birthDate: editedBirthDate || undefined });
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      // Delete old avatar if exists
      await supabase.storage.from('avatars').remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      onUpdateProfile({ avatarUrl });
      toast.success('Profile photo updated!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setIsUploading(true);
    try {
      const { data: files } = await supabase.storage.from('avatars').list(user.id);
      if (files?.length) {
        await supabase.storage.from('avatars').remove(files.map(f => `${user.id}/${f.name}`));
      }
      onUpdateProfile({ avatarUrl: undefined });
      toast.success('Profile photo removed');
    } catch (error) {
      toast.error('Failed to remove photo');
    } finally {
      setIsUploading(false);
    }
  };

  const daysTracking = useMemo(() => {
    try {
      return Math.max(0, differenceInDays(new Date(), parseISO(profile.createdAt)));
    } catch { return 0; }
  }, [profile.createdAt]);

  const age = useMemo(() => {
    if (!profile.birthDate) return null;
    try { return differenceInYears(new Date(), parseISO(profile.birthDate)); }
    catch { return null; }
  }, [profile.birthDate]);

  const totalActivities = activityCounts.periodLogs + activityCounts.wellnessEntries + activityCounts.workouts + activityCounts.fertilityLogs + activityCounts.clinicalAssessments;

  const achievements = useMemo(() => [
    { id: 'first_log', title: 'First Log', description: 'Logged your first period', icon: '🌸', earned: (stats?.totalCycles ?? 0) >= 1 },
    { id: 'consistent', title: 'Consistent Tracker', description: 'Tracked 3 complete cycles', icon: '📊', earned: (stats?.totalCycles ?? 0) >= 3 },
    { id: 'week_streak', title: 'Week Streak', description: 'Using app for 7+ days', icon: '🔥', earned: daysTracking >= 7 },
    { id: 'month_tracker', title: 'Monthly Master', description: 'Using app for 30+ days', icon: '🏆', earned: daysTracking >= 30 },
    { id: 'cycle_expert', title: 'Cycle Expert', description: 'Tracked 6 complete cycles', icon: '🎓', earned: (stats?.totalCycles ?? 0) >= 6 },
    { id: 'year_veteran', title: 'Year Veteran', description: 'Using app for a full year', icon: '💎', earned: daysTracking >= 365 },
    { id: 'wellness_writer', title: 'Wellness Writer', description: '10+ journal entries', icon: '📝', earned: activityCounts.wellnessEntries >= 10 },
    { id: 'fitness_fan', title: 'Fitness Fan', description: '20+ workouts logged', icon: '💪', earned: activityCounts.workouts >= 20 },
    { id: 'data_devotee', title: 'Data Devotee', description: '50+ total entries logged', icon: '🧠', earned: totalActivities >= 50 },
  ], [stats, daysTracking, activityCounts, totalActivities]);

  const earnedAchievements = achievements.filter(a => a.earned);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Profile Card with Avatar */}
      <motion.section variants={itemVariants} className="bg-card rounded-2xl p-6 shadow-card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar with upload */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden gradient-primary flex items-center justify-center text-3xl text-primary-foreground font-display shadow-lg">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile.name ? profile.name.charAt(0).toUpperCase() : '🌸'
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
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
                {age !== null && <span>{age} years old • </span>}
                Tracking since {format(parseISO(profile.createdAt), 'MMM yyyy')}
              </p>
              {user?.email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Mail className="h-3 w-3" /> {user.email}
                </p>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={handleSave}><Check className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}><X className="h-4 w-4" /></Button>
            </div>
          ) : (
            <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}><Edit2 className="h-4 w-4" /></Button>
          )}
        </div>

        {isEditing && (
          <div className="space-y-4 mb-4">
            <div>
              <Label>Birth Date (optional)</Label>
              <Input type="date" value={editedBirthDate} onChange={(e) => setEditedBirthDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              {profile.avatarUrl && (
                <Button variant="outline" size="sm" onClick={handleRemoveAvatar} disabled={isUploading}>
                  Remove Photo
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <Upload className="h-3 w-3 mr-1" />
                {profile.avatarUrl ? 'Change Photo' : 'Upload Photo'}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-display font-semibold text-coral">{daysTracking}</p>
            <p className="text-xs text-muted-foreground">Days Tracking</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-semibold text-lavender">{stats?.totalCycles ?? 0}</p>
            <p className="text-xs text-muted-foreground">Cycles Logged</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-semibold text-sage">{earnedAchievements.length}</p>
            <p className="text-xs text-muted-foreground">Achievements</p>
          </div>
        </div>
      </motion.section>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="achievements">Awards</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Health Summary */}
          {stats && (
            <motion.section variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-coral-light"><Heart className="h-5 w-5 text-coral" /></div>
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
                  <Progress value={Math.max(20, 100 - (stats.longestCycle - stats.shortestCycle) * 10)} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-lg font-semibold text-coral">{stats.averageCycleLength || '—'}</p>
                    <p className="text-xs text-muted-foreground">Avg Cycle</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-lg font-semibold text-lavender">{stats.averagePeriodLength || '—'}</p>
                    <p className="text-xs text-muted-foreground">Avg Period</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-lg font-semibold text-sage">{stats.shortestCycle}–{stats.longestCycle}</p>
                    <p className="text-xs text-muted-foreground">Cycle Range</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-lg font-semibold text-peach">{stats.totalCycles}</p>
                    <p className="text-xs text-muted-foreground">Total Cycles</p>
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

          {/* Account Info */}
          <motion.section variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-lavender-light"><User className="h-5 w-5 text-lavender" /></div>
              <h2 className="font-semibold">Account Details</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> Email</span>
                <span className="text-sm font-medium">{user?.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center gap-2"><Cake className="h-3.5 w-3.5" /> Birthday</span>
                <span className="text-sm font-medium">{profile.birthDate ? format(parseISO(profile.birthDate), 'MMM d, yyyy') : 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Member Since</span>
                <span className="text-sm font-medium">{format(parseISO(profile.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2"><Activity className="h-3.5 w-3.5" /> Total Entries</span>
                <span className="text-sm font-medium">{totalActivities}</span>
              </div>
            </div>
          </motion.section>

          {/* Privacy */}
          <motion.section variants={itemVariants} className="bg-muted/50 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">Your Privacy Matters</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All your data is stored securely on your account. We never access or share your personal health information.
                </p>
              </div>
            </div>
          </motion.section>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4 mt-4">
          <motion.section variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-sage-light"><TrendingUp className="h-5 w-5 text-sage" /></div>
              <h2 className="font-semibold">Activity Summary</h2>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Period Logs', count: activityCounts.periodLogs, icon: '🩸', color: 'bg-coral' },
                { label: 'Wellness Journal', count: activityCounts.wellnessEntries, icon: '📝', color: 'bg-lavender' },
                { label: 'Workouts', count: activityCounts.workouts, icon: '🏋️', color: 'bg-sage' },
                { label: 'Fertility Logs', count: activityCounts.fertilityLogs, icon: '🌡️', color: 'bg-peach' },
                { label: 'Clinical Assessments', count: activityCounts.clinicalAssessments, icon: '🏥', color: 'bg-coral' },
              ].map((item) => {
                const maxCount = Math.max(...Object.values(activityCounts), 1);
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm flex items-center gap-2">
                        <span>{item.icon}</span> {item.label}
                      </span>
                      <span className="text-sm font-semibold">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${(item.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-border text-center">
              <p className="text-2xl font-display font-semibold text-foreground">{totalActivities}</p>
              <p className="text-xs text-muted-foreground">Total Entries Across All Features</p>
            </div>
          </motion.section>

          {/* Engagement Score */}
          <motion.section variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-peach-light"><Sparkles className="h-5 w-5 text-peach" /></div>
              <h2 className="font-semibold">Engagement Score</h2>
            </div>
            {(() => {
              const categoriesUsed = [
                activityCounts.periodLogs > 0,
                activityCounts.wellnessEntries > 0,
                activityCounts.workouts > 0,
                activityCounts.fertilityLogs > 0,
                activityCounts.clinicalAssessments > 0,
              ].filter(Boolean).length;
              const score = Math.min(100, Math.round((categoriesUsed / 5) * 60 + Math.min(totalActivities, 100) * 0.4));
              return (
                <div className="text-center space-y-3">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-28 h-28" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                      <circle
                        cx="50" cy="50" r="42"
                        stroke="hsl(var(--primary))" strokeWidth="8" fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${score * 2.64} 264`}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute text-2xl font-display font-bold">{score}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {score >= 80 ? '🌟 Outstanding! You\'re a health tracking pro!' :
                     score >= 50 ? '💪 Great progress! Keep exploring more features.' :
                     score >= 20 ? '🌱 Good start! Try logging more data types.' :
                     '✨ Begin your journey by logging some data!'}
                  </p>
                  <p className="text-xs text-muted-foreground">{categoriesUsed}/5 features used</p>
                </div>
              );
            })()}
          </motion.section>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4 mt-4">
          <motion.section variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-peach-light"><Award className="h-5 w-5 text-peach" /></div>
              <h2 className="font-semibold">Achievements ({earnedAchievements.length}/{achievements.length})</h2>
            </div>
            <Progress value={(earnedAchievements.length / achievements.length) * 100} className="h-2 mb-4" />
            <div className="grid grid-cols-3 gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`text-center p-3 rounded-xl transition-all ${
                    achievement.earned 
                      ? 'bg-gradient-to-br from-coral-light to-peach-light shadow-sm' 
                      : 'bg-muted/50 opacity-50'
                  }`}
                >
                  <div className="text-2xl mb-1">{achievement.icon}</div>
                  <p className="text-xs font-medium">{achievement.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{achievement.description}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </TabsContent>
      </Tabs>

      {/* Logout Button */}
      <motion.section variants={itemVariants}>
        <Button
          variant="outline"
          className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log Out
        </Button>
      </motion.section>
    </motion.div>
  );
}
