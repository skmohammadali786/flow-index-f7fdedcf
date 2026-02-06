import { useState, useEffect, useCallback } from 'react';
import { UserSettings, UserProfile, DEFAULT_SETTINGS, DEFAULT_PROFILE } from '@/types/settings';

const SETTINGS_KEY = 'period_tracker_settings';
const PROFILE_KEY = 'period_tracker_profile';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    const storedProfile = localStorage.getItem(PROFILE_KEY);

    if (storedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }

    if (storedProfile) {
      try {
        setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(storedProfile) });
      } catch (e) {
        console.error('Failed to parse profile', e);
      }
    }

    setIsLoaded(true);
  }, []);

  // Save settings
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  }, [settings, isLoaded]);

  // Save profile
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }
  }, [profile, isLoaded]);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const updateNotifications = useCallback((updates: Partial<UserSettings['notifications']>) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...updates }
    }));
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const exportData = useCallback(() => {
    const data = {
      settings,
      profile,
      logs: JSON.parse(localStorage.getItem('period_tracker_data') || '{}'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowindex-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setProfile(prev => ({ ...prev, lastBackup: new Date().toISOString() }));
  }, [settings, profile]);

  const importData = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          // Update settings
          if (data.settings) {
            const newSettings = { ...DEFAULT_SETTINGS, ...data.settings };
            setSettings(newSettings);
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
          }
          
          // Update profile
          if (data.profile) {
            const newProfile = { ...DEFAULT_PROFILE, ...data.profile };
            setProfile(newProfile);
            localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
          }
          
          // Update logs and reload to sync all data
          if (data.logs) {
            localStorage.setItem('period_tracker_data', JSON.stringify(data.logs));
            // Reload to ensure all hooks pick up the new data
            window.location.reload();
          }
          
          resolve(true);
        } catch {
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }, []);

  return {
    settings,
    profile,
    isLoaded,
    updateSettings,
    updateNotifications,
    updateProfile,
    resetSettings,
    exportData,
    importData,
  };
}
