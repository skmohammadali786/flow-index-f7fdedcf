import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Bell, 
  Calendar, 
  Download, 
  RotateCcw,
  ChevronRight,
  Target,
  Eye,
  Trash2,
  AlertTriangle,
  Loader2,
  Mail,
  ExternalLink,
  HeadphonesIcon,
  FileText,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserSettings } from '@/types/settings';
import { toast } from 'sonner';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (updates: Partial<UserSettings>) => void;
  onUpdateNotifications: (updates: Partial<UserSettings['notifications']>) => void;
  onExportData: () => void;
  onExportPdf: () => void;
  onResetSettings: () => void;
}

export function SettingsView({
  settings,
  onUpdateSettings,
  onUpdateNotifications,
  onExportData,
  onExportPdf,
  onResetSettings,
}: SettingsViewProps) {
  const { signOut } = useAuth();
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to delete your account');
        return;
      }

      const response = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to delete account');
      }

      toast.success('Your account has been deleted');
      // Clear local storage
      localStorage.clear();
      // Sign out and redirect
      await signOut();
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteConfirmText('');
    }
  };

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
      {/* Cycle Preferences */}
      <motion.section variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-coral-light">
            <Calendar className="h-5 w-5 text-coral" />
          </div>
          <h2 className="font-semibold">Cycle Preferences</h2>
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-2">
              <Label>Average Cycle Length</Label>
              <span className="text-sm font-medium text-coral">{settings.cycleLength} days</span>
            </div>
            <Slider
              value={[settings.cycleLength]}
              onValueChange={([value]) => onUpdateSettings({ cycleLength: value })}
              min={21}
              max={40}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label>Average Period Length</Label>
              <span className="text-sm font-medium text-coral">{settings.periodLength} days</span>
            </div>
            <Slider
              value={[settings.periodLength]}
              onValueChange={([value]) => onUpdateSettings({ periodLength: value })}
              min={2}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label>Luteal Phase Length</Label>
              <span className="text-sm font-medium text-coral">{settings.lutealPhaseLength} days</span>
            </div>
            <Slider
              value={[settings.lutealPhaseLength]}
              onValueChange={([value]) => onUpdateSettings({ lutealPhaseLength: value })}
              min={10}
              max={18}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </motion.section>

      {/* Tracking Goal */}
      <motion.section variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-lavender-light">
            <Target className="h-5 w-5 text-lavender" />
          </div>
          <h2 className="font-semibold">Tracking Goal</h2>
        </div>

        <Select 
          value={settings.trackingGoal} 
          onValueChange={(value: UserSettings['trackingGoal']) => onUpdateSettings({ trackingGoal: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="health">General Health Tracking</SelectItem>
            <SelectItem value="pregnancy">Trying to Conceive</SelectItem>
            <SelectItem value="avoid_pregnancy">Avoiding Pregnancy</SelectItem>
          </SelectContent>
        </Select>
      </motion.section>

      {/* Display Settings */}
      <motion.section variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-sage-light">
            <Eye className="h-5 w-5 text-sage" />
          </div>
          <h2 className="font-semibold">Display</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Show Fertile Window</Label>
            <Switch
              checked={settings.showFertileWindow}
              onCheckedChange={(checked) => onUpdateSettings({ showFertileWindow: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Show Ovulation Day</Label>
            <Switch
              checked={settings.showOvulation}
              onCheckedChange={(checked) => onUpdateSettings({ showOvulation: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>First Day of Week</Label>
            <Select 
              value={String(settings.firstDayOfWeek)}
              onValueChange={(value) => onUpdateSettings({ firstDayOfWeek: Number(value) as 0 | 1 })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Date Format</Label>
            <Select 
              value={settings.dateFormat}
              onValueChange={(value: UserSettings['dateFormat']) => onUpdateSettings({ dateFormat: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.section>

      {/* Notifications */}
      <motion.section variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-peach-light">
            <Bell className="h-5 w-5 text-peach" />
          </div>
          <h2 className="font-semibold">Notifications</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Period Reminder</Label>
              <p className="text-xs text-muted-foreground">Get reminded before your period</p>
            </div>
            <Switch
              checked={settings.notifications.periodReminder}
              onCheckedChange={(checked) => onUpdateNotifications({ periodReminder: checked })}
            />
          </div>

          {settings.notifications.periodReminder && (
            <div className="flex items-center justify-between pl-4 border-l-2 border-coral-light">
              <Label className="text-sm">Days before</Label>
              <Select 
                value={String(settings.notifications.periodReminderDays)}
                onValueChange={(value) => onUpdateNotifications({ periodReminderDays: Number(value) })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((day) => (
                    <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Fertile Window Reminder</Label>
              <p className="text-xs text-muted-foreground">Notify when fertile window begins</p>
            </div>
            <Switch
              checked={settings.notifications.fertileWindowReminder}
              onCheckedChange={(checked) => onUpdateNotifications({ fertileWindowReminder: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Ovulation Reminder</Label>
              <p className="text-xs text-muted-foreground">Notify on predicted ovulation day</p>
            </div>
            <Switch
              checked={settings.notifications.ovulationReminder}
              onCheckedChange={(checked) => onUpdateNotifications({ ovulationReminder: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Daily Log Reminder</Label>
              <p className="text-xs text-muted-foreground">Remind to log daily</p>
            </div>
            <Switch
              checked={settings.notifications.dailyLogReminder}
              onCheckedChange={(checked) => onUpdateNotifications({ dailyLogReminder: checked })}
            />
          </div>

          {settings.notifications.dailyLogReminder && (
            <div className="flex items-center justify-between pl-4 border-l-2 border-coral-light">
              <Label className="text-sm">Reminder time</Label>
              <input
                type="time"
                value={settings.notifications.dailyLogReminderTime}
                onChange={(e) => onUpdateNotifications({ dailyLogReminderTime: e.target.value })}
                className="px-3 py-1 rounded-lg border border-input bg-background text-sm"
              />
            </div>
          )}
        </div>
      </motion.section>

      {/* Data Management */}
      <motion.section variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-muted">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="font-semibold">Data Management</h2>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={onExportPdf}
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Export Data (PDF)
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={onExportData}
          >
            <span className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Data (JSON)
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="w-full justify-between text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm('Are you sure you want to reset all settings?')) {
                onResetSettings();
                toast.success('Settings reset to defaults');
              }
            }}
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset Settings
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.section>

      {/* Contact Support */}
      <motion.section variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <HeadphonesIcon className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-semibold">Contact Support</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Need help or have feedback? Reach out to our support team and we'll get back to you as soon as possible.
        </p>

        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => window.open('mailto:connect@skmohammadali.in?subject=Flow%20Index%20Support', '_blank')}
        >
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            connect@skmohammadali.in
          </span>
          <ExternalLink className="h-4 w-4" />
        </Button>
      </motion.section>

      {/* Danger Zone */}
      <motion.section variants={itemVariants} className="bg-card rounded-2xl p-5 shadow-card border border-destructive/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <h2 className="font-semibold text-destructive">Danger Zone</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete Account Permanently
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  This will permanently delete your account and all your data, including:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Your profile information</li>
                  <li>All period logs and cycle history</li>
                  <li>Clinical assessments and health data</li>
                  <li>Settings and preferences</li>
                </ul>
                <p className="font-medium text-destructive">
                  This action cannot be undone.
                </p>
                <div className="pt-2">
                  <p className="text-sm mb-2">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm:
                  </p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="border-destructive/50 focus:border-destructive"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setDeleteConfirmText('')}
                disabled={isDeleting}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.section>
    </motion.div>
  );
}
