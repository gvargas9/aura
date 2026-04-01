import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silently fail for non-critical storage
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Silently fail
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch {
      // Silently fail
    }
  },
};

// Storage keys
export const STORAGE_KEYS = {
  BOX_CONFIG: 'aura_box_config',
  SELECTED_TIER: 'aura_selected_tier',
  ONBOARDING_COMPLETE: 'aura_onboarding_complete',
} as const;
