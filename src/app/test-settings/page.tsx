'use client';

import { useState } from 'react';
import SimpleSettings from '@/components/SimpleSettings';
import type { AppConfig } from '@/lib/config';

export default function TestSettingsPage() {
  const [config, setConfig] = useState<AppConfig>({
    latitude: 55.979636,
    longitude: -3.577456,
    facingDirection: 'N',
    isSetupComplete: true
  });

  const handleConfigUpdate = (newConfig: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    console.log('Config updated:', newConfig);
  };

  const handleClose = () => {
    console.log('Settings closed');
  };

  return (
    <div className="w-full h-screen">
      <SimpleSettings
        currentConfig={config}
        onConfigUpdate={handleConfigUpdate}
        onClose={handleClose}
      />
    </div>
  );
}