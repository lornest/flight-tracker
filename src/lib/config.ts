"use client";

export interface AppConfig {
  latitude: number;
  longitude: number;
  facingDirection: string;
}

const DEFAULT_CONFIG: AppConfig = {
  latitude: parseFloat(process.env.NEXT_PUBLIC_LATITUDE || '55.979636'),
  longitude: parseFloat(process.env.NEXT_PUBLIC_LONGITUDE || '-3.577456'),
  facingDirection: process.env.NEXT_PUBLIC_FACING_DIRECTION || 'N'
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