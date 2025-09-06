"use client";

export interface AppConfig {
  latitude: number;
  longitude: number;
  facingDirection: string;
  isSetupComplete: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
  latitude: 0,
  longitude: 0,
  facingDirection: 'N',
  isSetupComplete: false
};

const CONFIG_KEY = 'flight_tracker_config';

export const getConfig = (): AppConfig => {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG;
  }

  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  
  return DEFAULT_CONFIG;
};

export const saveConfig = (config: Partial<AppConfig>): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const currentConfig = getConfig();
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
  } catch (error) {
    console.error('Error saving config:', error);
  }
};

export const isFirstTimeSetup = (): boolean => {
  const config = getConfig();
  return !config.isSetupComplete;
};

export const markSetupComplete = (): void => {
  saveConfig({ isSetupComplete: true });
};

export const resetConfig = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(CONFIG_KEY);
  } catch (error) {
    console.error('Error resetting config:', error);
  }
};