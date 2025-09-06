"use client";

import React, { useState, useEffect } from 'react';
import SwipeableScreens from './SwipeableScreens';
import RoundSetup from './RoundSetup';
import QuickSettings from './QuickSettings';
import { getConfig, saveConfig, isFirstTimeSetup, markSetupComplete, AppConfig } from '@/lib/config';

type AppMode = 'setup' | 'main' | 'settings';

const AppWrapper = () => {
  const [appMode, setAppMode] = useState<AppMode>('setup');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check setup state on mount
    const loadConfig = () => {
      const currentConfig = getConfig();
      setConfig(currentConfig);
      
      if (isFirstTimeSetup()) {
        setAppMode('setup');
      } else {
        setAppMode('main');
      }
      
      setIsLoading(false);
    };

    loadConfig();
  }, []);

  const handleSetupComplete = (setupData: { latitude: number; longitude: number; facingDirection: string }) => {
    const newConfig = {
      latitude: setupData.latitude,
      longitude: setupData.longitude,
      facingDirection: setupData.facingDirection
    };
    
    saveConfig(newConfig);
    markSetupComplete();
    
    const updatedConfig = getConfig();
    setConfig(updatedConfig);
    setAppMode('main');
  };

  const handleConfigUpdate = (newConfig: Partial<AppConfig>) => {
    saveConfig(newConfig);
    const updatedConfig = getConfig();
    setConfig(updatedConfig);
  };

  const handleSettingsAccess = () => {
    setAppMode('settings');
  };

  const handleSettingsClose = () => {
    setAppMode('main');
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-round h-round rounded-round border-2 border-white/20 relative mx-auto mb-4 flex items-center justify-center">
            <div className="text-white/60 text-sm">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate screen based on app mode
  switch (appMode) {
    case 'setup':
      return <RoundSetup onSetupComplete={handleSetupComplete} />;
    
    case 'settings':
      return (
        <QuickSettings
          currentConfig={config!}
          onConfigUpdate={handleConfigUpdate}
          onClose={handleSettingsClose}
        />
      );
    
    case 'main':
    default:
      return (
        <SwipeableScreens 
          userConfig={config!}
          onSettingsAccess={handleSettingsAccess}
        />
      );
  }
};

export default AppWrapper;