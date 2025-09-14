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

  // Starting screen
  if (isLoading) {
    return (
      <div className="w-full h-full bg-black">
        <div className="w-round h-round rounded-round border-2 border-white/20 flex items-center justify-center top-2 relative">
          <div className="text-white/60 text-2xl">Starting up...</div>
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