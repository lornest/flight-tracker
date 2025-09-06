"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WifiSetup from './WifiSetup';

interface SetupData {
  latitude: number;
  longitude: number;
  facingDirection: string;
}

interface RoundSetupProps {
  onSetupComplete: (data: SetupData) => void;
}

const RoundSetup = ({ onSetupComplete }: RoundSetupProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<SetupData>({
    latitude: parseFloat(process.env.NEXT_PUBLIC_LATITUDE || '0'),
    longitude: parseFloat(process.env.NEXT_PUBLIC_LONGITUDE || '0'),
    facingDirection: 'N'
  });
  const [systemInfo, setSystemInfo] = useState<{
    wifiConnected: boolean;
    networkName: string;
  }>({ wifiConnected: false, networkName: '' });

  // Check system status on mount
  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await fetch('/api/system/status');
      const data = await response.json();
      setSystemInfo(data);
      
      // If Wi-Fi is connected, skip Wi-Fi setup
      if (data.wifiConnected) {
        setCurrentStep(1); // Skip to location setup
      }
    } catch (error) {
      console.error('Failed to get system status:', error);
      setSystemInfo({ wifiConnected: false, networkName: '' });
    }
  };

  const handleWifiConnected = () => {
    setSystemInfo({ wifiConnected: true, networkName: 'Connected' });
    setCurrentStep(1); // Move to location setup
  };

  const handleWifiSkip = () => {
    setCurrentStep(1); // Skip to location setup
  };

  const directions = [
    { value: 'N', label: 'N', angle: 0 },
    { value: 'NE', label: 'NE', angle: 45 },
    { value: 'E', label: 'E', angle: 90 },
    { value: 'SE', label: 'SE', angle: 135 },
    { value: 'S', label: 'S', angle: 180 },
    { value: 'SW', label: 'SW', angle: 225 },
    { value: 'W', label: 'W', angle: 270 },
    { value: 'NW', label: 'NW', angle: 315 }
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else {
      onSetupComplete(setupData);
    }
  };

  const handleCoordinateInput = (lat: number, lon: number) => {
    setSetupData(prev => ({ ...prev, latitude: lat, longitude: lon }));
  };

  const presetLocations = [
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'NYC', lat: 40.7128, lon: -74.0060 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 }
  ];


  const renderLocationSetup = () => (
    <div className="w-full h-full bg-black flex items-center justify-center p-8">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="text-white text-xl font-bold">Location</div>
      
      {/* Quick presets */}
      <div className="grid grid-cols-2 gap-3">
        {presetLocations.map((location) => (
          <button
            key={location.name}
            onClick={() => handleCoordinateInput(location.lat, location.lon)}
            className={`p-3 rounded-lg border transition-all ${
              setupData.latitude === location.lat && setupData.longitude === location.lon
                ? 'bg-blue-600 border-blue-400 text-white'
                : 'bg-white/10 border-white/20 text-white hover:border-white/40'
            }`}
          >
            <div className="font-semibold">{location.name}</div>
            <div className="text-xs text-white/60">
              {location.lat.toFixed(1)}, {location.lon.toFixed(1)}
            </div>
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="space-y-3">
        <div className="text-white/70 text-sm">Or enter coordinates:</div>
        <div className="flex space-x-2">
          <input
            type="number"
            step="any"
            value={setupData.latitude || ''}
            onChange={(e) => handleCoordinateInput(parseFloat(e.target.value) || 0, setupData.longitude)}
            placeholder="Latitude"
            className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-center font-mono text-sm"
          />
          <input
            type="number"
            step="any"
            value={setupData.longitude || ''}
            onChange={(e) => handleCoordinateInput(setupData.latitude, parseFloat(e.target.value) || 0)}
            placeholder="Longitude"
            className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-center font-mono text-sm"
          />
        </div>
      </div>

        <button
          onClick={handleNext}
          disabled={!setupData.latitude || !setupData.longitude}
          className={`px-8 py-3 rounded-full font-semibold transition-all ${
            setupData.latitude && setupData.longitude
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-white/20 text-white/40 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderDirectionSetup = () => (
    <div className="w-full h-full bg-black flex items-center justify-center p-8">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="text-white text-xl font-bold">Facing Direction</div>
      <div className="text-white/60 text-sm">Which way are you looking?</div>
      
      {/* Compass circle */}
      <div className="relative w-48 h-48 mx-auto">
        <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
        
        {directions.map((dir) => {
          const angle = (dir.angle - 90) * (Math.PI / 180);
          const x = Math.cos(angle) * 80;
          const y = Math.sin(angle) * 80;
          
          return (
            <button
              key={dir.value}
              onClick={() => setSetupData(prev => ({ ...prev, facingDirection: dir.value }))}
              className={`absolute w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold transition-all ${
                setupData.facingDirection === dir.value
                  ? 'bg-blue-600 border-blue-400 text-white scale-110'
                  : 'bg-white/10 border-white/20 text-white hover:border-white/40'
              }`}
              style={{
                left: `calc(50% + ${x}px - 24px)`,
                top: `calc(50% + ${y}px - 24px)`
              }}
            >
              {dir.label}
            </button>
          );
        })}
        
        {/* Center indicator */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

        <button
          onClick={handleNext}
          className="px-8 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold transition-all"
        >
          Complete Setup
        </button>
      </div>
    </div>
  );

  // Render appropriate step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <WifiSetup onWifiConnected={handleWifiConnected} onSkip={handleWifiSkip} />;
      case 1:
        return renderLocationSetup();
      case 2:
        return renderDirectionSetup();
      default:
        return renderLocationSetup();
    }
  };

  return (
    <div className="w-full h-full bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {renderCurrentStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RoundSetup;