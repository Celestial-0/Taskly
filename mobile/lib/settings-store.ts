import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  // Appearance
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  viewDensity: 'compact' | 'comfortable';
  animationsEnabled: boolean;

  // AI Features
  aiEnabled: boolean;
  taskCategorization: boolean;
  smartSuggestions: boolean;
  priorityRecommendations: boolean;
  autoTagging: boolean;
  aiModel: 'gpt-4o' | 'claude' | 'gemini';

  // Notifications
  notificationsEnabled: boolean;
  taskReminders: boolean;
  dueDateAlerts: boolean;
  achievementNotifications: boolean;
  reminderTiming: '15min' | '1hr' | '1day';
}

const DEFAULT_SETTINGS: AppSettings = {
  // Appearance
  theme: 'system',
  fontSize: 'medium',
  viewDensity: 'comfortable',
  animationsEnabled: true,

  // AI Features
  aiEnabled: true,
  taskCategorization: true,
  smartSuggestions: true,
  priorityRecommendations: true,
  autoTagging: false,
  aiModel: 'gpt-4o',

  // Notifications
  notificationsEnabled: true,
  taskReminders: true,
  dueDateAlerts: true,
  achievementNotifications: true,
  reminderTiming: '1hr',
};

const SETTINGS_STORAGE_KEY = '@taskly_settings';

interface SettingsStore extends AppSettings {
  // Actions
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  loadSettings: () => Promise<void>;
  resetSettings: () => Promise<void>;

  // Loading state
  isLoading: boolean;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,
  isLoading: false,

  updateSetting: async (key, value) => {
    try {
      // Update store
      set({ [key]: value });

      // Get updated settings and persist to AsyncStorage
      const updatedSettings = get();
      const settingsToSave: AppSettings = {
        theme: updatedSettings.theme,
        fontSize: updatedSettings.fontSize,
        viewDensity: updatedSettings.viewDensity,
        animationsEnabled: updatedSettings.animationsEnabled,
        aiEnabled: updatedSettings.aiEnabled,
        taskCategorization: updatedSettings.taskCategorization,
        smartSuggestions: updatedSettings.smartSuggestions,
        priorityRecommendations: updatedSettings.priorityRecommendations,
        autoTagging: updatedSettings.autoTagging,
        aiModel: updatedSettings.aiModel,
        notificationsEnabled: updatedSettings.notificationsEnabled,
        taskReminders: updatedSettings.taskReminders,
        dueDateAlerts: updatedSettings.dueDateAlerts,
        achievementNotifications: updatedSettings.achievementNotifications,
        reminderTiming: updatedSettings.reminderTiming,
      };

      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsToSave));
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  },

  loadSettings: async () => {
    try {
      set({ isLoading: true });

      const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);

      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings) as Partial<AppSettings>;

        // Merge with defaults to ensure all settings exist
        const mergedSettings = { ...DEFAULT_SETTINGS, ...parsedSettings };

        set({ ...mergedSettings, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  resetSettings: async () => {
    try {
      await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
      set({ ...DEFAULT_SETTINGS });
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  },
}));