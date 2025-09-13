'use client';

import { useState } from 'react';
import SwipeableScreens from '@/components/SwipeableScreens';
import type { AppConfig } from '@/lib/config';

export default function TestSettingsPage() {
  const [config, setConfig] = useState<AppConfig>({
    latitude: 55.979636,
    longitude: -3.577456,
    facingDirection: 'N'
  });

  const handleConfigUpdate = (newConfig: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    console.log('Config updated:', newConfig);
  };

  return (
    <div className="w-full h-screen relative">
      <SwipeableScreens
        userConfig={config}
        onConfigUpdate={handleConfigUpdate}
      />
      
      {/* Test Info */}
      <div className="absolute top-4 left-4 z-40 bg-black/80 backdrop-blur-sm rounded-lg p-4">
        <div className="text-white text-sm space-y-2">
          <div className="font-bold mb-2">Settings Test</div>
          <div>Double-tap center: direction settings</div>
          <div>Double-tap left/right: change screen</div>
          <div>Current: {config.facingDirection}</div>
        </div>
      </div>
    </div>
  );
}