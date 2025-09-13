"use client";

import React, { useState, useEffect } from 'react';
import SwipeableScreens from './SwipeableScreens';
import { getConfig, saveConfig, AppConfig } from '@/lib/config';

const AppWrapper = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load config on mount
    const loadConfig = () => {
      const currentConfig = getConfig();
      setConfig(currentConfig);
      setIsLoading(false);
    };

    loadConfig();
  }, []);

  const handleConfigUpdate = (newConfig: Partial<AppConfig>) => {
    saveConfig(newConfig);
    const updatedConfig = getConfig();
    setConfig(updatedConfig);
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-round h-round rounded-round border-2 border-white/20 relative mx-auto mb-4 flex items-center justify-center">
            <div className="text-white/60 text-2xl">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SwipeableScreens 
      userConfig={config!}
      onConfigUpdate={handleConfigUpdate}
    />
  );
};

export default AppWrapper;