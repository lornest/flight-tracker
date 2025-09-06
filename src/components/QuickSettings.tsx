"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppConfig } from '@/lib/config';

interface QuickSettingsProps {
  currentConfig: AppConfig;
  onConfigUpdate: (config: Partial<AppConfig>) => void;
  onClose: () => void;
}

type EditMode = 'menu' | 'location' | 'direction' | 'reset-confirm';

const QuickSettings = ({ currentConfig, onConfigUpdate, onClose }: QuickSettingsProps) => {
  const [editMode, setEditMode] = useState<EditMode>('menu');
  const [tempLocation, setTempLocation] = useState({
    latitude: currentConfig.latitude || parseFloat(process.env.NEXT_PUBLIC_LATITUDE || '0'),
    longitude: currentConfig.longitude || parseFloat(process.env.NEXT_PUBLIC_LONGITUDE || '0')
  });
  const [tempDirection, setTempDirection] = useState(currentConfig.facingDirection);

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

  const presetLocations = [
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'NYC', lat: 40.7128, lon: -74.0060 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 }
  ];

  const handleLocationSave = () => {
    onConfigUpdate({
      latitude: tempLocation.latitude,
      longitude: tempLocation.longitude
    });
    setEditMode('menu');
  };

  const handleDirectionSave = () => {
    onConfigUpdate({ facingDirection: tempDirection });
    setEditMode('menu');
  };

  const handleReset = () => {
    localStorage.removeItem('flight_tracker_config');
    window.location.reload();
  };

  const renderMenu = () => (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-white text-xl font-bold">Settings</h1>
        <p className="text-white/60 text-sm">Tap to edit</p>
      </div>

      {/* Current Settings Cards */}
      <div className="space-y-3">
        {/* Location Card */}
        <motion.button
          onClick={() => setEditMode('location')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-4 transition-all"
        >
          <div className="text-left">
            <div className="text-white/70 text-sm mb-1">Location</div>
            <div className="text-white font-mono text-sm">
              {currentConfig.latitude !== 0 && currentConfig.longitude !== 0
                ? `${currentConfig.latitude.toFixed(4)}, ${currentConfig.longitude.toFixed(4)}`
                : 'Not set'
              }
            </div>
          </div>
        </motion.button>

        {/* Direction Card */}
        <motion.button
          onClick={() => setEditMode('direction')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-4 transition-all"
        >
          <div className="text-left">
            <div className="text-white/70 text-sm mb-1">Facing Direction</div>
            <div className="text-white text-lg font-semibold">{currentConfig.facingDirection}</div>
          </div>
        </motion.button>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <motion.button
          onClick={() => setEditMode('reset-confirm')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 py-3 px-6 rounded-lg font-semibold transition-colors"
        >
          Factory Reset
        </motion.button>

        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
        >
          Done
        </motion.button>
      </div>
    </div>
  );

  const renderLocationEdit = () => (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <h2 className="text-white text-xl font-bold">Edit Location</h2>
        <p className="text-white/60 text-sm">Current: {currentConfig.latitude.toFixed(4)}, {currentConfig.longitude.toFixed(4)}</p>
      </div>

      {/* Quick presets */}
      <div className="grid grid-cols-2 gap-2">
        {presetLocations.map((location) => (
          <button
            key={location.name}
            onClick={() => setTempLocation({ latitude: location.lat, longitude: location.lon })}
            className={`p-3 rounded-lg border text-sm transition-all ${
              tempLocation.latitude === location.lat && tempLocation.longitude === location.lon
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

      {/* Manual input */}
      <div className="space-y-3">
        <div className="text-white/70 text-sm">Or enter coordinates:</div>
        <div className="flex space-x-2">
          <input
            type="number"
            step="any"
            value={tempLocation.latitude || ''}
            onChange={(e) => setTempLocation(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
            placeholder="Latitude"
            className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-center font-mono text-sm"
          />
          <input
            type="number"
            step="any"
            value={tempLocation.longitude || ''}
            onChange={(e) => setTempLocation(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
            placeholder="Longitude"
            className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-center font-mono text-sm"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex space-x-3">
        <motion.button
          onClick={() => setEditMode('menu')}
          whileTap={{ scale: 0.95 }}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Cancel
        </motion.button>
        <motion.button
          onClick={handleLocationSave}
          whileTap={{ scale: 0.95 }}
          disabled={tempLocation.latitude === 0 || tempLocation.longitude === 0}
          className={`flex-1 py-3 px-4 rounded-lg transition-colors ${
            tempLocation.latitude !== 0 && tempLocation.longitude !== 0
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-white/20 text-white/40 cursor-not-allowed'
          }`}
        >
          Save
        </motion.button>
      </div>
    </div>
  );

  const renderDirectionEdit = () => (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <h2 className="text-white text-xl font-bold">Facing Direction</h2>
        <p className="text-white/60 text-sm">Currently: {currentConfig.facingDirection}</p>
      </div>

      {/* Compass circle */}
      <div className="relative w-40 h-40 mx-auto">
        <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
        
        {directions.map((dir) => {
          const angle = (dir.angle - 90) * (Math.PI / 180);
          const x = Math.cos(angle) * 60;
          const y = Math.sin(angle) * 60;
          
          return (
            <button
              key={dir.value}
              onClick={() => setTempDirection(dir.value)}
              className={`absolute w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold text-sm transition-all ${
                tempDirection === dir.value
                  ? 'bg-blue-600 border-blue-400 text-white scale-110'
                  : 'bg-white/10 border-white/20 text-white hover:border-white/40'
              }`}
              style={{
                left: `calc(50% + ${x}px - 20px)`,
                top: `calc(50% + ${y}px - 20px)`
              }}
            >
              {dir.label}
            </button>
          );
        })}
        
        {/* Center indicator */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Buttons */}
      <div className="flex space-x-3">
        <motion.button
          onClick={() => setEditMode('menu')}
          whileTap={{ scale: 0.95 }}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Cancel
        </motion.button>
        <motion.button
          onClick={handleDirectionSave}
          whileTap={{ scale: 0.95 }}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Save
        </motion.button>
      </div>
    </div>
  );

  const renderResetConfirm = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-red-600 rounded-full flex items-center justify-center">
        <div className="text-white text-2xl">⚠️</div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-white text-lg font-semibold">Factory Reset?</h3>
        <p className="text-white/70 text-sm">
          This will erase all settings and restart setup
        </p>
      </div>

      <div className="flex space-x-3">
        <motion.button
          onClick={() => setEditMode('menu')}
          whileTap={{ scale: 0.95 }}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Cancel
        </motion.button>
        <motion.button
          onClick={handleReset}
          whileTap={{ scale: 0.95 }}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Reset
        </motion.button>
      </div>
    </div>
  );

  const renderCurrentMode = () => {
    switch (editMode) {
      case 'menu':
        return renderMenu();
      case 'location':
        return renderLocationEdit();
      case 'direction':
        return renderDirectionEdit();
      case 'reset-confirm':
        return renderResetConfirm();
      default:
        return renderMenu();
    }
  };

  return (
    <div className="w-full h-full bg-black flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={editMode}
            initial={{ opacity: 0, x: editMode === 'menu' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: editMode === 'menu' ? 20 : -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderCurrentMode()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuickSettings;