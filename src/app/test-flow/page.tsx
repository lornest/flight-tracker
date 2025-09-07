'use client';

import { useState } from 'react';
import { SetupQR } from '@/components/SetupQR';
import SimpleSettings from '@/components/SimpleSettings';
import SwipeableScreens from '@/components/SwipeableScreens';
import type { AppConfig } from '@/lib/config';

type TestMode = 'qr' | 'setup-web' | 'main' | 'settings';

export default function TestFlowPage() {
  const [mode, setMode] = useState<TestMode>('qr');
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

  const renderCurrentMode = () => {
    switch (mode) {
      case 'qr':
        return <SetupQR />;
      
      case 'setup-web':
        return (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Web Setup Interface</h2>
              <p className="text-gray-600">Visit <a href="/setup" className="text-blue-600 underline">localhost:3000/setup</a> to test</p>
              <button
                onClick={() => setMode('main')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Simulate Setup Complete
              </button>
            </div>
          </div>
        );
      
      case 'main':
        return (
          <SwipeableScreens
            userConfig={config}
            onSettingsAccess={() => setMode('settings')}
          />
        );
      
      case 'settings':
        return (
          <SimpleSettings
            currentConfig={config}
            onConfigUpdate={handleConfigUpdate}
            onClose={() => setMode('main')}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-screen relative">
      {renderCurrentMode()}
      
      {/* Test Controls */}
      <div className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4">
        <div className="text-white text-sm space-y-2">
          <div className="font-bold mb-3">Test Mode Controls</div>
          <button
            onClick={() => setMode('qr')}
            className={`block w-full text-left px-3 py-1 rounded ${mode === 'qr' ? 'bg-blue-600' : 'hover:bg-white/20'}`}
          >
            QR Setup
          </button>
          <button
            onClick={() => setMode('setup-web')}
            className={`block w-full text-left px-3 py-1 rounded ${mode === 'setup-web' ? 'bg-blue-600' : 'hover:bg-white/20'}`}
          >
            Web Setup
          </button>
          <button
            onClick={() => setMode('main')}
            className={`block w-full text-left px-3 py-1 rounded ${mode === 'main' ? 'bg-blue-600' : 'hover:bg-white/20'}`}
          >
            Main App
          </button>
          <button
            onClick={() => setMode('settings')}
            className={`block w-full text-left px-3 py-1 rounded ${mode === 'settings' ? 'bg-blue-600' : 'hover:bg-white/20'}`}
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}