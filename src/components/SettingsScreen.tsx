"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AppConfig, resetConfig } from '@/lib/config';
import RoundSetup from './RoundSetup';

interface SettingsScreenProps {
  currentConfig: AppConfig;
  onConfigUpdate: (config: Partial<AppConfig>) => void;
  onClose: () => void;
}

const SettingsScreen = ({ currentConfig, onConfigUpdate, onClose }: SettingsScreenProps) => {
  const [showSetup, setShowSetup] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSetupComplete = (data: { latitude: number; longitude: number; facingDirection: string }) => {
    onConfigUpdate({
      latitude: data.latitude,
      longitude: data.longitude,
      facingDirection: data.facingDirection
    });
    setShowSetup(false);
  };

  const handleReset = () => {
    resetConfig();
    // Reload the page to restart setup
    window.location.reload();
  };

  if (showSetup) {
    return (
      <RoundSetup 
        onSetupComplete={handleSetupComplete}
      />
    );
  }

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
            Settings
          </motion.h1>
          <motion.p 
            className="text-white/60 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Configure your flight tracker
          </motion.p>
        </div>

        {/* Current Settings */}
        <motion.div 
          className="space-y-4 bg-white/5 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-white text-lg font-semibold mb-3">Current Settings</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">Location:</span>
              <span className="text-white font-mono">
                {currentConfig.latitude !== 0 && currentConfig.longitude !== 0
                  ? `${currentConfig.latitude.toFixed(4)}, ${currentConfig.longitude.toFixed(4)}`
                  : 'Not set'
                }
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/70">Facing Direction:</span>
              <span className="text-white">{currentConfig.facingDirection}</span>
            </div>
          </div>
        </motion.div>

        {/* Settings Menu */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => setShowSetup(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold transition-colors"
          >
            Change Settings
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 py-4 px-6 rounded-lg font-semibold transition-colors"
          >
            Reset to Factory Settings
          </button>
        </motion.div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-gray-900 border border-red-500/50 rounded-lg p-6 max-w-sm w-full"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
            >
              <h3 className="text-white text-lg font-semibold mb-3">Reset Settings?</h3>
              <p className="text-white/70 text-sm mb-6">
                This will erase all your settings and restart the setup process. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Close Button */}
        <motion.button
          onClick={onClose}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-4 px-6 rounded-lg font-semibold transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Close Settings
        </motion.button>
      </div>
    </div>
  );
};

export default SettingsScreen;