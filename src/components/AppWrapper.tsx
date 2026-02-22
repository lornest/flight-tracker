"use client";

import React, { useState, useEffect } from 'react';
import SwipeableScreens from './SwipeableScreens';
import { getConfig, saveConfig, AppConfig } from '@/lib/config';

const AppWrapper = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const currentConfig = getConfig();
    setConfig(currentConfig);

    const textTimer = setTimeout(() => setShowText(true), 1750);
    const doneTimer = setTimeout(() => setIsLoading(false), 3000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  const handleConfigUpdate = (newConfig: Partial<AppConfig>) => {
    saveConfig(newConfig);
    const updatedConfig = getConfig();
    setConfig(updatedConfig);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-black">
        <div className="w-round h-round rounded-round border-2 border-white/20 flex items-center justify-center top-[6px] relative overflow-hidden">
          {/* Animated plane flying across */}
          <div className="absolute z-20 top-1/2 -translate-y-1/2 startup-plane">
            <svg className="w-20 h-20 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(45deg)' }}>
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </div>

          {/* Loading text */}
          <div
            className="text-white/60 text-6xl text-center transition-opacity duration-500"
            style={{ opacity: showText ? 1 : 0 }}
          >
            Starting up...
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
