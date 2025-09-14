"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';
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
    };

    loadConfig();

    // Start animation, then finish loading after animation completes
    const animationTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 second animation + small buffer

    return () => clearTimeout(animationTimer);
  }, []);

  const handleConfigUpdate = (newConfig: Partial<AppConfig>) => {
    saveConfig(newConfig);
    const updatedConfig = getConfig();
    setConfig(updatedConfig);
  };

  // Starting screen with plane animation
  if (isLoading) {
    return (
      <div className="w-full h-full bg-black">
        <div className="w-round h-round rounded-round border-2 border-white/20 flex items-center justify-center top-[6px] relative overflow-hidden">
          
          {/* Animated plane flying from off-screen left to off-screen right */}
          <motion.div
            className="absolute z-20 top-1/2 transform -translate-y-1/2"
            initial={{ 
              x: -280, // Start completely off-screen left (beyond the 480px round area)
              rotate: 45  // Plane pointing right
            }}
            animate={{ 
              x: 280,  // End completely off-screen right
              rotate: 45
            }}
            transition={{ 
              duration: 2.5,
              ease: "linear"
            }}
          >
            <Plane className="w-20 h-20 text-white" />
          </motion.div>

          {/* Animated loading text */}
          <motion.div 
            className="text-white/60 text-6xl text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.75, duration: 0.5 }}
          >
            Starting up...
          </motion.div>
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