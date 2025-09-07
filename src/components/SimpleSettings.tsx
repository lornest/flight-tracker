'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppConfig } from '@/lib/config';

interface SimpleSettingsProps {
  currentConfig: AppConfig;
  onConfigUpdate: (config: Partial<AppConfig>) => void;
  onClose: () => void;
}

type EditMode = 'menu' | 'location' | 'direction';

const SimpleSettings = ({ currentConfig, onConfigUpdate, onClose }: SimpleSettingsProps) => {
  const [editMode, setEditMode] = useState<EditMode>('menu');
  const [tempLocation, setTempLocation] = useState({
    latitude: currentConfig.latitude || parseFloat(process.env.NEXT_PUBLIC_LATITUDE || '55.979636'),
    longitude: currentConfig.longitude || parseFloat(process.env.NEXT_PUBLIC_LONGITUDE || '-3.577456')
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
    { name: 'Edinburgh', lat: 55.979636, lon: -3.577456 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Manchester', lat: 53.4808, lon: -2.2426 },
    { name: 'Glasgow', lat: 55.8642, lon: -4.2518 }
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

  const renderMenu = () => (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-white text-2xl font-bold">Settings</h1>
        <p className="text-white/70 text-base">Tap to edit</p>
      </div>

      {/* Current Settings Cards */}
      <div className="space-y-4">
        {/* Location Card */}
        <motion.button
          onClick={() => setEditMode('location')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-5 transition-all"
        >
          <div className="text-left">
            <div className="text-white/70 text-base mb-2">Location</div>
            <div className="text-white font-mono text-base">
              {currentConfig.latitude !== 0 && currentConfig.longitude !== 0
                ? `${currentConfig.latitude.toFixed(3)}, ${currentConfig.longitude.toFixed(3)}`
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
          className="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-5 transition-all"
        >
          <div className="text-left">
            <div className="text-white/70 text-base mb-2">Facing Direction</div>
            <div className="text-white text-xl font-bold">{currentConfig.facingDirection}</div>
          </div>
        </motion.button>
      </div>

      {/* Action Button */}
      <div className="space-y-3">
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-4 px-6 rounded-lg font-bold text-base transition-colors"
        >
          Done
        </motion.button>
      </div>
    </div>
  );

  const renderLocationEdit = () => (
    <div className="text-center space-y-5">
      <div className="space-y-2">
        <h2 className="text-white text-2xl font-bold">Edit Location</h2>
        <p className="text-white/70 text-base">Current: {currentConfig.latitude.toFixed(3)}, {currentConfig.longitude.toFixed(3)}</p>
      </div>

      {/* Quick presets */}
      <div className="grid grid-cols-2 gap-2">
        {presetLocations.map((location) => (
          <button
            key={location.name}
            onClick={() => setTempLocation({ latitude: location.lat, longitude: location.lon })}
            className={`p-4 rounded-lg border text-base transition-all ${
              tempLocation.latitude === location.lat && tempLocation.longitude === location.lon
                ? 'bg-blue-600 border-blue-400 text-white'
                : 'bg-white/10 border-white/20 text-white hover:border-white/40'
            }`}
          >
            <div className="font-bold">{location.name}</div>
            <div className="text-sm text-white/70">
              {location.lat.toFixed(1)}, {location.lon.toFixed(1)}
            </div>
          </button>
        ))}
      </div>

      {/* Manual input */}
      <div className="space-y-3">
        <div className="text-white/70 text-base">Or enter coordinates:</div>
        <div className="flex space-x-2">
          <input
            type="number"
            step="any"
            value={tempLocation.latitude || ''}
            onChange={(e) => setTempLocation(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
            placeholder="Latitude"
            className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-3 text-white text-center font-mono text-base"
          />
          <input
            type="number"
            step="any"
            value={tempLocation.longitude || ''}
            onChange={(e) => setTempLocation(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
            placeholder="Longitude"
            className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-3 text-white text-center font-mono text-base"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex space-x-3">
        <motion.button
          onClick={() => setEditMode('menu')}
          whileTap={{ scale: 0.95 }}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 px-4 rounded-lg transition-colors text-base font-medium"
        >
          Cancel
        </motion.button>
        <motion.button
          onClick={handleLocationSave}
          whileTap={{ scale: 0.95 }}
          disabled={tempLocation.latitude === 0 || tempLocation.longitude === 0}
          className={`flex-1 py-4 px-4 rounded-lg transition-colors text-base font-bold ${
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
    <div className="text-center space-y-5">
      <div className="space-y-2">
        <h2 className="text-white text-2xl font-bold">Facing Direction</h2>
        <p className="text-white/70 text-base">Currently: {currentConfig.facingDirection}</p>
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
              className={`absolute w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-base transition-all ${
                tempDirection === dir.value
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

      {/* Buttons */}
      <div className="flex space-x-3">
        <motion.button
          onClick={() => setEditMode('menu')}
          whileTap={{ scale: 0.95 }}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 px-4 rounded-lg transition-colors text-base font-medium"
        >
          Cancel
        </motion.button>
        <motion.button
          onClick={handleDirectionSave}
          whileTap={{ scale: 0.95 }}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 px-4 rounded-lg transition-colors text-base font-bold"
        >
          Save
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
      default:
        return renderMenu();
    }
  };

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="w-round h-round rounded-round flex items-center justify-center p-8 overflow-hidden">
        <div className="w-full max-w-xs">
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
    </div>
  );
};

export default SimpleSettings;