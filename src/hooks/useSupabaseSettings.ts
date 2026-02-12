import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserSettings, UserProfile, DEFAULT_SETTINGS, DEFAULT_PROFILE } from '@/types/settings';
import { generateExportDataPdf } from '@/utils/exportDataPdf';
import { loadLogo } from '@/utils/pdfUtils';
import logoSrc from '@/assets/logo.png';
import { toast } from 'sonner';

export function useSupabaseSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch data from database
  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setProfile(DEFAULT_PROFILE);
      setIsLoaded(true);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profileData) {
          setProfile({
            name: profileData.name || '',
            birthDate: profileData.birth_date || undefined,
            createdAt: profileData.created_at,
            lastBackup: undefined,
          });
        }

        // Fetch settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (settingsError && settingsError.code !== 'PGRST116') {
          throw settingsError;
        }

        if (settingsData) {
          setSettings({
            cycleLength: settingsData.cycle_length,
            periodLength: settingsData.period_length,
            lutealPhaseLength: settingsData.luteal_phase_length,
            trackingGoal: settingsData.tracking_goal as UserSettings['trackingGoal'],
            showFertileWindow: settingsData.show_fertile_window,
            showOvulation: settingsData.show_ovulation,
            firstDayOfWeek: settingsData.first_day_of_week as 0 | 1,
            dateFormat: settingsData.date_format as UserSettings['dateFormat'],
            theme: 'system', // Default theme since it's not stored in DB
            notifications: {
              periodReminder: settingsData.period_reminder,
              periodReminderDays: settingsData.period_reminder_days,
              fertileWindowReminder: settingsData.fertile_window_reminder,
              ovulationReminder: settingsData.ovulation_reminder,
              dailyLogReminder: settingsData.daily_log_reminder,
              dailyLogReminderTime: settingsData.daily_log_reminder_time,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  }, [user]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user) return;

    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    const { error } = await supabase
      .from('user_settings')
      .update({
        cycle_length: newSettings.cycleLength,
        period_length: newSettings.periodLength,
        luteal_phase_length: newSettings.lutealPhaseLength,
        tracking_goal: newSettings.trackingGoal,
        show_fertile_window: newSettings.showFertileWindow,
        show_ovulation: newSettings.showOvulation,
        first_day_of_week: newSettings.firstDayOfWeek,
        date_format: newSettings.dateFormat,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating settings:', error);
    }
  }, [user, settings]);

  const updateNotifications = useCallback(async (updates: Partial<UserSettings['notifications']>) => {
    if (!user) return;

    const newNotifications = { ...settings.notifications, ...updates };
    const newSettings = { ...settings, notifications: newNotifications };
    setSettings(newSettings);

    const { error } = await supabase
      .from('user_settings')
      .update({
        period_reminder: newNotifications.periodReminder,
        period_reminder_days: newNotifications.periodReminderDays,
        fertile_window_reminder: newNotifications.fertileWindowReminder,
        ovulation_reminder: newNotifications.ovulationReminder,
        daily_log_reminder: newNotifications.dailyLogReminder,
        daily_log_reminder_time: newNotifications.dailyLogReminderTime,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating notifications:', error);
    }
  }, [user, settings]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;

    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);

    const { error } = await supabase
      .from('profiles')
      .update({
        name: newProfile.name,
        birth_date: newProfile.birthDate || null,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
    }
  }, [user, profile]);

  const resetSettings = useCallback(async () => {
    if (!user) return;

    setSettings(DEFAULT_SETTINGS);

    const { error } = await supabase
      .from('user_settings')
      .update({
        cycle_length: DEFAULT_SETTINGS.cycleLength,
        period_length: DEFAULT_SETTINGS.periodLength,
        luteal_phase_length: DEFAULT_SETTINGS.lutealPhaseLength,
        tracking_goal: DEFAULT_SETTINGS.trackingGoal,
        show_fertile_window: DEFAULT_SETTINGS.showFertileWindow,
        show_ovulation: DEFAULT_SETTINGS.showOvulation,
        first_day_of_week: DEFAULT_SETTINGS.firstDayOfWeek,
        date_format: DEFAULT_SETTINGS.dateFormat,
        period_reminder: DEFAULT_SETTINGS.notifications.periodReminder,
        period_reminder_days: DEFAULT_SETTINGS.notifications.periodReminderDays,
        fertile_window_reminder: DEFAULT_SETTINGS.notifications.fertileWindowReminder,
        ovulation_reminder: DEFAULT_SETTINGS.notifications.ovulationReminder,
        daily_log_reminder: DEFAULT_SETTINGS.notifications.dailyLogReminder,
        daily_log_reminder_time: DEFAULT_SETTINGS.notifications.dailyLogReminderTime,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error resetting settings:', error);
    }
  }, [user]);

  const exportDataPdf = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch logs, cycles, assessments (raw DB data)
      const [logsResult, cyclesResult, clinicalResult] = await Promise.all([
        supabase
          .from('period_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('cycles')
          .select('*')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false }),
        supabase
          .from('clinical_assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
      ]);

      const logoBase64 = await loadLogo(logoSrc);

      // Use local state for profile and settings to ensure correct casing (camelCase)
      // logsResult, cyclesResult, clinicalResult are from DB (snake_case), which matches DBPeriodLog etc.
      await generateExportDataPdf({
        profile: profile,
        settings: settings,
        logs: (logsResult.data || []) as any[],
        cycles: (cyclesResult.data || []) as any[],
        assessments: (clinicalResult.data || []) as any[],
      }, logoBase64);

      toast.success("Data export downloaded successfully");
    } catch (error) {
      console.error('Export failed:', error);
      toast.error("Failed to generate export PDF");
    }
  }, [user, settings, profile]);

  return {
    settings,
    profile,
    isLoaded,
    updateSettings,
    updateNotifications,
    updateProfile,
    resetSettings,
    exportDataPdf,
  };
}
