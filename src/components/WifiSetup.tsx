"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WifiNetwork {
  ssid: string;
  signal: number;
  security: string;
  frequency: string;
  connected: boolean;
}

interface WifiSetupProps {
  onWifiConnected: () => void;
  onSkip: () => void;
}

const WifiSetup = ({ onWifiConnected, onSkip }: WifiSetupProps) => {
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<WifiNetwork | null>(null);
  const [password, setPassword] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [currentSSID, setCurrentSSID] = useState('');

  useEffect(() => {
    scanNetworks();
    checkCurrentConnection();
  }, []);

  const checkCurrentConnection = async () => {
    try {
      const response = await fetch('/api/system/status');
      const data = await response.json();
      if (data.wifiConnected && data.networkName) {
        setCurrentSSID(data.networkName);
      }
    } catch (error) {
      console.error('Failed to check current connection:', error);
    }
  };

  const scanNetworks = async () => {
    setIsScanning(true);
    setError('');
    
    try {
      const response = await fetch('/api/wifi/scan');
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setNetworks(data.networks || []);
      }
    } catch (err) {
      setError('Failed to scan networks');
    } finally {
      setIsScanning(false);
    }
  };

  const connectToNetwork = async () => {
    if (!selectedNetwork) return;
    
    setIsConnecting(true);
    setError('');
    
    try {
      const response = await fetch('/api/wifi/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssid: selectedNetwork.ssid,
          password: selectedNetwork.security !== 'Open' ? password : undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentSSID(selectedNetwork.ssid);
        setTimeout(() => {
          onWifiConnected();
        }, 1500);
      } else {
        setError(data.error || 'Connection failed');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const getSignalIcon = (signal: number) => {
    if (signal > 75) return '📶';
    if (signal > 50) return '📶';
    if (signal > 25) return '📶';
    return '📶';
  };

  const getSignalBars = (signal: number) => {
    const bars = Math.ceil((signal / 100) * 4);
    return Array(4).fill(0).map((_, i) => (
      <div
        key={i}
        className={`w-1 ${i === 0 ? 'h-2' : i === 1 ? 'h-3' : i === 2 ? 'h-4' : 'h-5'} ${
          i < bars ? 'bg-white' : 'bg-white/30'
        } rounded-sm`}
      />
    ));
  };

  // If already connected, show status
  if (currentSSID && !selectedNetwork) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center p-8">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center">
            <div className="text-white text-2xl">📶</div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-white text-xl font-bold">Wi-Fi Connected</h2>
            <p className="text-white/70 text-sm">{currentSSID}</p>
          </div>

          <div className="space-y-3">
            <motion.button
              onClick={() => setCurrentSSID('')}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Change Network
            </motion.button>
            
            <motion.button
              onClick={onWifiConnected}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Continue Setup
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // Network selection screen
  if (!selectedNetwork) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center p-6 overflow-hidden">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-white text-xl font-bold">Wi-Fi Setup</h1>
            <p className="text-white/60 text-sm">Select your network</p>
          </div>

          {/* Scan button */}
          <motion.button
            onClick={scanNetworks}
            disabled={isScanning}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
          >
            {isScanning ? 'Scanning...' : 'Scan Networks'}
          </motion.button>

          {/* Networks list */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {networks.map((network) => (
              <motion.button
                key={network.ssid}
                onClick={() => setSelectedNetwork(network)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-3 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left flex-1">
                    <div className="text-white font-medium">{network.ssid}</div>
                    <div className="text-white/60 text-xs">
                      {network.security} • {network.frequency}
                    </div>
                  </div>
                  <div className="flex items-end space-x-1 ml-3">
                    {getSignalBars(network.signal)}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Skip option */}
          <motion.button
            onClick={onSkip}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
          >
            Skip Wi-Fi Setup
          </motion.button>
        </div>
      </div>
    );
  }

  // Password entry screen
  return (
    <div className="w-full h-full bg-black flex items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-white text-xl font-bold">Connect to Network</h2>
          <p className="text-white/70 text-sm">{selectedNetwork.ssid}</p>
        </div>

        {selectedNetwork.security !== 'Open' && (
          <div className="space-y-2">
            <label className="block text-white/70 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50"
              placeholder="Enter password"
              disabled={isConnecting}
            />
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <motion.button
            onClick={() => setSelectedNetwork(null)}
            disabled={isConnecting}
            whileTap={{ scale: 0.95 }}
            className="flex-1 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white py-3 px-4 rounded-lg transition-colors"
          >
            Back
          </motion.button>
          
          <motion.button
            onClick={connectToNetwork}
            disabled={isConnecting || (selectedNetwork.security !== 'Open' && !password)}
            whileTap={{ scale: 0.95 }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default WifiSetup;