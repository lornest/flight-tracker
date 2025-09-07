'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function WebSetupPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState({
    wifiSSID: '',
    wifiPassword: '',
    latitude: parseFloat(process.env.NEXT_PUBLIC_LATITUDE || '55.979636'),
    longitude: parseFloat(process.env.NEXT_PUBLIC_LONGITUDE || '-3.577456'),
    facingDirection: 'N'
  });
  const [availableNetworks, setAvailableNetworks] = useState<Array<{ ssid: string; security: string; signal: number; frequency: string; connected: boolean }>>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

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

  const presetLocations = [
    { name: 'Edinburgh', lat: 55.979636, lon: -3.577456 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Manchester', lat: 53.4808, lon: -2.2426 },
    { name: 'Glasgow', lat: 55.8642, lon: -4.2518 }
  ];

  const scanNetworks = async () => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/wifi/scan');
      const data = await response.json();
      if (data.networks) {
        setAvailableNetworks(data.networks);
      }
    } catch (error) {
      console.error('Failed to scan networks:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const completeSetup = async () => {
    setIsConnecting(true);
    try {
      // Connect to WiFi first
      const wifiResponse = await fetch('/api/wifi/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssid: setupData.wifiSSID,
          password: setupData.wifiPassword
        })
      });

      if (!wifiResponse.ok) {
        throw new Error('Failed to connect to WiFi');
      }

      // Save configuration
      const configResponse = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: setupData.latitude,
          longitude: setupData.longitude,
          facingDirection: setupData.facingDirection,
          setupComplete: true
        })
      });

      if (configResponse.ok) {
        // Show success and redirect
        alert('Setup complete! Your FlightClock will now restart and connect to your network.');
        // Trigger device restart
        await fetch('/api/system/restart', { method: 'POST' });
      }
    } catch (error) {
      alert('Setup failed. Please try again.');
      console.error('Setup error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const renderWiFiStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect to Wi-Fi</h2>
        <p className="text-gray-600">Choose your home network</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={scanNetworks}
          disabled={isScanning}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
        >
          {isScanning ? 'Scanning...' : 'Scan for Networks'}
        </button>

        {availableNetworks.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {availableNetworks.map((network) => (
              <button
                key={network.ssid}
                onClick={() => setSetupData(prev => ({ ...prev, wifiSSID: network.ssid }))}
                className={`w-full p-4 rounded-lg border text-left transition-all ${
                  setupData.wifiSSID === network.ssid
                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-800'
                }`}
              >
                <div className="font-semibold">{network.ssid}</div>
                <div className="text-sm text-gray-500">{network.security}</div>
              </button>
            ))}
          </div>
        )}

        {setupData.wifiSSID && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selected Network: {setupData.wifiSSID}
              </label>
              <input
                type="password"
                value={setupData.wifiPassword}
                onChange={(e) => setSetupData(prev => ({ ...prev, wifiPassword: e.target.value }))}
                placeholder="Enter Wi-Fi password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderLocationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Set Location</h2>
        <p className="text-gray-600">Where is your FlightClock located?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {presetLocations.map((location) => (
          <button
            key={location.name}
            onClick={() => setSetupData(prev => ({ 
              ...prev, 
              latitude: location.lat, 
              longitude: location.lon 
            }))}
            className={`p-4 rounded-lg border transition-all ${
              setupData.latitude === location.lat && setupData.longitude === location.lon
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : 'bg-white border-gray-200 hover:border-gray-300 text-gray-800'
            }`}
          >
            <div className="font-semibold">{location.name}</div>
            <div className="text-sm text-gray-500">
              {location.lat.toFixed(1)}, {location.lon.toFixed(1)}
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="text-center text-gray-600 text-sm">Or enter custom coordinates:</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={setupData.latitude || ''}
              onChange={(e) => setSetupData(prev => ({ 
                ...prev, 
                latitude: parseFloat(e.target.value) || 0 
              }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg text-center font-mono text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="55.979636"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={setupData.longitude || ''}
              onChange={(e) => setSetupData(prev => ({ 
                ...prev, 
                longitude: parseFloat(e.target.value) || 0 
              }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg text-center font-mono text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="-3.577456"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDirectionStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Facing Direction</h2>
        <p className="text-gray-600">Which way is your FlightClock facing?</p>
      </div>

      <div className="flex justify-center">
        <div className="relative w-80 h-80">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          
          {directions.map((dir) => {
            const angle = (dir.angle - 90) * (Math.PI / 180);
            const x = Math.cos(angle) * 120;
            const y = Math.sin(angle) * 120;
            
            return (
              <button
                key={dir.value}
                onClick={() => setSetupData(prev => ({ ...prev, facingDirection: dir.value }))}
                className={`absolute w-16 h-16 rounded-full border-2 flex items-center justify-center font-bold text-lg transition-all ${
                  setupData.facingDirection === dir.value
                    ? 'bg-blue-600 border-blue-400 text-white scale-110 shadow-lg'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-md'
                }`}
                style={{
                  left: `calc(50% + ${x}px - 32px)`,
                  top: `calc(50% + ${y}px - 32px)`
                }}
              >
                {dir.value}
              </button>
            );
          })}
          
          <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to Complete</h2>
        <p className="text-gray-600">Review your settings</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <div className="text-sm text-gray-600">Wi-Fi Network</div>
          <div className="font-semibold">{setupData.wifiSSID}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Location</div>
          <div className="font-mono">{setupData.latitude.toFixed(4)}, {setupData.longitude.toFixed(4)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Facing Direction</div>
          <div className="font-semibold">{setupData.facingDirection}</div>
        </div>
      </div>

      <button
        onClick={completeSetup}
        disabled={isConnecting}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-4 px-6 rounded-lg font-bold text-lg transition-colors"
      >
        {isConnecting ? 'Completing Setup...' : 'Complete Setup'}
      </button>
    </div>
  );

  const steps = ['Wi-Fi', 'Location', 'Direction', 'Complete'];
  const canProceed = () => {
    switch (currentStep) {
      case 0: return setupData.wifiSSID && setupData.wifiPassword;
      case 1: return setupData.latitude !== 0 && setupData.longitude !== 0;
      case 2: return setupData.facingDirection;
      case 3: return true;
      default: return false;
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderWiFiStep();
      case 1: return renderLocationStep();
      case 2: return renderDirectionStep();
      case 3: return renderCompleteStep();
      default: return renderWiFiStep();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">FlightClock Setup</h1>
          <p className="text-gray-600">Let&apos;s get your FlightClock configured</p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index === currentStep
                      ? 'bg-blue-600 text-white'
                      : index < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="ml-2 text-sm text-gray-600">{step}</div>
                {index < steps.length - 1 && <div className="w-8 h-px bg-gray-300 ml-2"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderCurrentStep()}
          </motion.div>
        </div>

        {/* Navigation */}
        {currentStep < 3 && (
          <div className="flex justify-between">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
            )}
            
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ml-auto ${
                canProceed()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}