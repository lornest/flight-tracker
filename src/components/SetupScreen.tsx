"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SetupData {
  wifiSSID: string;
  wifiPassword: string;
  latitude: number;
  longitude: number;
  facingDirection: string;
}

interface SetupScreenProps {
  onSetupComplete: (data: SetupData) => void;
  isFirstTime?: boolean;
}

const SetupScreen = ({ onSetupComplete, isFirstTime = true }: SetupScreenProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<SetupData>({
    wifiSSID: '',
    wifiPassword: '',
    latitude: 0,
    longitude: 0,
    facingDirection: 'N'
  });

  const steps = [
    {
      title: 'Wi-Fi Setup',
      subtitle: 'Connect to your network',
      component: 'wifi'
    },
    {
      title: 'Location',
      subtitle: 'Set your coordinates',
      component: 'location'
    },
    {
      title: 'Facing Direction',
      subtitle: 'Which way are you looking?',
      component: 'direction'
    },
    {
      title: 'Complete',
      subtitle: 'Setup finished!',
      component: 'complete'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSetupComplete(setupData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Wi-Fi
        return setupData.wifiSSID.length > 0 && setupData.wifiPassword.length > 0;
      case 1: // Location
        return setupData.latitude !== 0 && setupData.longitude !== 0;
      case 2: // Direction
        return setupData.facingDirection.length > 0;
      case 3: // Complete
        return true;
      default:
        return false;
    }
  };

  const renderWifiStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-white/70 text-sm mb-2">Wi-Fi Network</label>
          <input
            type="text"
            value={setupData.wifiSSID}
            onChange={(e) => setSetupData(prev => ({ ...prev, wifiSSID: e.target.value }))}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 text-lg"
            placeholder="Network name"
          />
        </div>
        <div>
          <label className="block text-white/70 text-sm mb-2">Password</label>
          <input
            type="password"
            value={setupData.wifiPassword}
            onChange={(e) => setSetupData(prev => ({ ...prev, wifiPassword: e.target.value }))}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 text-lg"
            placeholder="Wi-Fi password"
          />
        </div>
      </div>
    </div>
  );

  const renderLocationStep = () => (
    <div className="space-y-6">
      <div className="text-center text-white/60 text-sm mb-4">
        Enter your exact coordinates for accurate flight tracking
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-white/70 text-sm mb-2">Latitude</label>
          <input
            type="number"
            step="any"
            value={setupData.latitude || ''}
            onChange={(e) => setSetupData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 text-lg text-center font-mono"
            placeholder="e.g. 51.4778"
          />
        </div>
        <div>
          <label className="block text-white/70 text-sm mb-2">Longitude</label>
          <input
            type="number"
            step="any"
            value={setupData.longitude || ''}
            onChange={(e) => setSetupData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 text-lg text-center font-mono"
            placeholder="e.g. -0.0015"
          />
        </div>
      </div>
      <div className="text-center text-white/40 text-xs">
        Use GPS coordinates or find them online
      </div>
    </div>
  );

  const renderDirectionStep = () => {
    const directions = [
      { value: 'N', label: 'North', angle: 0 },
      { value: 'NE', label: 'Northeast', angle: 45 },
      { value: 'E', label: 'East', angle: 90 },
      { value: 'SE', label: 'Southeast', angle: 135 },
      { value: 'S', label: 'South', angle: 180 },
      { value: 'SW', label: 'Southwest', angle: 225 },
      { value: 'W', label: 'West', angle: 270 },
      { value: 'NW', label: 'Northwest', angle: 315 }
    ];

    return (
      <div className="space-y-6">
        <div className="text-center text-white/60 text-sm mb-4">
          Which direction are you facing when looking at the screen?
        </div>
        <div className="grid grid-cols-2 gap-3">
          {directions.map((dir) => (
            <button
              key={dir.value}
              onClick={() => setSetupData(prev => ({ ...prev, facingDirection: dir.value }))}
              className={`p-4 rounded-lg border-2 transition-all ${
                setupData.facingDirection === dir.value
                  ? 'bg-blue-600 border-blue-400 text-white'
                  : 'bg-white/10 border-white/20 text-white/80 hover:border-white/40'
              }`}
            >
              <div className="text-lg font-semibold">{dir.value}</div>
              <div className="text-xs">{dir.label}</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center">
        <div className="text-white text-2xl">✓</div>
      </div>
      <div className="space-y-2">
        <h3 className="text-white text-lg font-semibold">Setup Complete!</h3>
        <p className="text-white/60 text-sm">
          Your flight tracker is ready to use
        </p>
      </div>
      <div className="space-y-2 text-xs text-white/40">
        <div>Network: {setupData.wifiSSID}</div>
        <div>Location: {setupData.latitude.toFixed(4)}, {setupData.longitude.toFixed(4)}</div>
        <div>Facing: {setupData.facingDirection}</div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderWifiStep();
      case 1:
        return renderLocationStep();
      case 2:
        return renderDirectionStep();
      case 3:
        return renderCompleteStep();
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center">
          <motion.h1 
            className="text-white text-2xl font-bold mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isFirstTime ? 'Welcome!' : 'Settings'}
          </motion.h1>
          <motion.h2 
            className="text-white text-lg font-semibold"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {steps[currentStep].title}
          </motion.h2>
          <motion.p 
            className="text-white/60 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {steps[currentStep].subtitle}
          </motion.p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center space-x-2">
          {steps.slice(0, -1).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-blue-500' : 
                index < currentStep ? 'bg-green-500' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[200px]"
          >
            {renderCurrentStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex justify-between space-x-4">
          {currentStep > 0 && currentStep < 3 && (
            <button
              onClick={handleBack}
              className="flex-1 bg-white/10 border border-white/20 text-white py-3 px-6 rounded-lg hover:bg-white/20 transition-colors"
            >
              Back
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              canProceed()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {currentStep === 3 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;