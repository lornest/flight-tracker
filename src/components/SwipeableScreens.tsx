"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import FlightTrackingClock from './FlightTrackingClock';
import FlightRadar from './FlightRadar';
import { useFlightTracking } from '@/hooks/useFlightTracking';

interface SwipeableScreensProps {
  userConfig: {
    latitude: number;
    longitude: number;
    facingDirection: string;
  };
  onConfigUpdate: (config: { facingDirection: string }) => void;
}

const SwipeableScreens = ({ userConfig, onConfigUpdate }: SwipeableScreensProps) => {
  const [currentScreen, setCurrentScreen] = useState(0); // 0 = Clock, 1 = Radar
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [isRadarLoading, setIsRadarLoading] = useState(false);
  const [isClockLoading, setIsClockLoading] = useState(false);
  
  // Touch zones for screen navigation
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  
  // Double-tap detection for facing direction settings and navigation
  const [showDirectionSelector, setShowDirectionSelector] = useState(false);
  const lastTapRef = useRef<number>(0);
  const lastTapLocationRef = useRef<{ x: number; y: number } | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add delay when switching screens to prevent API rate limiting
  useEffect(() => {
    // Skip loading on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (currentScreen === 1) {
      // Switching to radar
      setIsRadarLoading(true);
      setIsClockLoading(false);
      const timer = setTimeout(() => {
        setIsRadarLoading(false);
      }, 1500); // 1.5 second delay
      
      return () => clearTimeout(timer);
    } else if (currentScreen === 0) {
      // Switching to clock
      setIsClockLoading(true);
      setIsRadarLoading(false);
      const timer = setTimeout(() => {
        setIsClockLoading(false);
      }, 1500); // 1.5 second delay
      
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  // Determine polling interval based on screen and alert state
  const getPollingInterval = useCallback(() => {
    if (currentScreen === 0 && !isClockLoading) {
      // Clock screen (not loading): conditional polling based on alert state
      return isAlertActive ? 5000 : 30000;
    } else if (currentScreen === 1 && !isRadarLoading) {
      // Radar screen (not loading): continuous 5s polling
      return 5000;
    } else {
      // Loading state: use slower polling
      return 30000;
    }
  }, [currentScreen, isAlertActive, isRadarLoading, isClockLoading]);
  
  // Single shared flight tracking instance (disabled during any loading)
  const isAnyLoading = isRadarLoading || isClockLoading;
  
  
  const flightData = useFlightTracking(
    isAnyLoading ? 60000 : getPollingInterval(), // Use very slow interval when loading
    isAnyLoading, // Disable API completely when loading
    userConfig // Pass user configuration to hook
  );


  // Touch zone handlers with double-tap detection
  const handleTouchZone = (e: React.MouseEvent | React.TouchEvent) => {
    // Check if the clicked element is a flight beacon or modal element
    const target = e.target as HTMLElement;
    
    // Don't navigate if clicking on interactive elements
    if (target.closest('.radar-beacon') || 
        target.closest('[data-flight-modal]') || 
        target.closest('button') ||
        target.classList.contains('cursor-pointer')) {
      return;
    }
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Get touch/click position - handle both touch and mouse events
    let clientX: number, clientY: number;
    
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      // Touch event
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if ('clientX' in e) {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      // Fallback - shouldn't happen
      return;
    }
    
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    const screenWidth = rect.width;
    const screenHeight = rect.height;
    
    // Simple top-left positioning - components are positioned at top-left of their areas
    // For touch detection, use the round display area (480x480) in top-left
    const displaySize = 480;
    const centerX = Math.min(displaySize, screenWidth) / 2;
    const centerY = Math.min(displaySize, screenHeight) / 2;
    const centerRadius = Math.min(displaySize, screenWidth, screenHeight) * 0.15;
    
    const distanceFromCenter = Math.sqrt(
      Math.pow(relativeX - centerX, 2) + Math.pow(relativeY - centerY, 2)
    );
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    const lastLocation = lastTapLocationRef.current;
    
    // Check if this tap is in roughly the same location as the last tap (within 50px)
    const isSameLocation = lastLocation && 
      Math.abs(relativeX - lastLocation.x) < 50 && 
      Math.abs(relativeY - lastLocation.y) < 50;
    
    if (distanceFromCenter <= centerRadius) {
      // Center tap - check for double-tap for facing direction
      if (timeSinceLastTap < 500 && timeSinceLastTap > 50 && isSameLocation) {
        // Double-tap detected in center
        setShowDirectionSelector(true);
        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
        }
        return;
      }
    } else {
      // Outside center - check for double-tap for navigation
      if (timeSinceLastTap < 500 && timeSinceLastTap > 50 && isSameLocation) {
        // Double-tap detected outside center - navigate screens
        if (relativeX < centerX) {
          // Left side double-tapped - go back
          if (currentScreen === 1) {
            setCurrentScreen(0);
          }
        } else {
          // Right side double-tapped - go forward  
          if (currentScreen === 0) {
            setCurrentScreen(1);
          }
        }
        return;
      }
    }
    
    // Store tap location and time for next tap comparison
    lastTapRef.current = now;
    lastTapLocationRef.current = { x: relativeX, y: relativeY };
  };

  // Direction selection handler
  const handleDirectionSelect = (direction: string) => {
    onConfigUpdate({ facingDirection: direction });
    setShowDirectionSelector(false);
  };

  // Clean up tap timeout on unmount
  useEffect(() => {
    const currentTimeout = tapTimeoutRef.current;
    return () => {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
    };
  }, []);

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
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      onTouchEnd={handleTouchZone}
      onClick={handleTouchZone}
    >
      <motion.div
        className="flex h-full swipe-container"
        style={{ width: 'calc(200% + 0px)', cursor: 'default' }}
        animate={{ x: currentScreen === 0 ? '0%' : '-50%' }}
        transition={{ 
          type: "tween", 
          duration: 0.3, 
          ease: "easeOut"
        }}
      >
        {/* Screen 1: Flight Tracking Clock */}
        <div className="h-full flex-shrink-0" style={{ width: '50%' }}>
          {isClockLoading ? (
            <div className="w-round h-round rounded-round bg-black border-2 border-white/20 flex items-center justify-center">
              <div className="text-white/70 text-2xl font-medium text-center">Loading FlightClock...</div>
            </div>
          ) : (
            <FlightTrackingClock 
              sharedFlightData={flightData}
              isAlertActive={isAlertActive}
              setIsAlertActive={setIsAlertActive}
            />
          )}
        </div>
        
        {/* Screen 2: Flight Radar */}
        <div className="h-full flex-shrink-0" style={{ width: '50%' }}>
          {isRadarLoading ? (
            <div className="w-round h-round rounded-round bg-black border-2 border-white/20 flex items-center justify-center">
              <div className="text-white/70 text-2xl font-medium text-center">Loading FlightRadar...</div>
            </div>
          ) : (
            <FlightRadar flightData={flightData} userConfig={userConfig} />
          )}
        </div>
      </motion.div>
      
      {/* Positioning markers for debugging */}
      <div className="absolute top-0 left-0 z-40 pointer-events-none">
        {/* Top edge markers */}
        <div className="absolute top-0 left-60 w-1 h-8 bg-red-500 opacity-50"></div>
        <div className="absolute top-0 left-80 w-1 h-8 bg-orange-500 opacity-50"></div>
        <div className="absolute top-0 left-100 w-1 h-8 bg-yellow-500 opacity-50"></div>
        
        {/* Offset markers - different vertical positions */}
        <div className="absolute top-2 left-40 w-8 h-1 bg-red-500 opacity-50"></div>
        <div className="absolute top-4 left-40 w-8 h-1 bg-orange-500 opacity-50"></div>
        <div className="absolute top-6 left-40 w-8 h-1 bg-yellow-500 opacity-50"></div>
        <div className="absolute top-8 left-40 w-8 h-1 bg-green-500 opacity-50"></div>
        <div className="absolute top-10 left-40 w-8 h-1 bg-blue-500 opacity-50"></div>
        <div className="absolute top-12 left-40 w-8 h-1 bg-purple-500 opacity-50"></div>
        
        {/* Corner reference */}
        <div className="absolute top-0 left-0 w-4 h-4 bg-white opacity-50"></div>
      </div>
      
      {/* Direction Selector Modal */}
      {showDirectionSelector && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="w-round h-round rounded-round bg-black/95 border-2 border-white/20 flex items-center justify-center relative">

            {/* Direction selector */}
            <div className="text-center">
              <div className="relative w-[420px] h-[420px]">
                {/* Center circle */}
                <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                
                {directions.map((dir) => {
                  const angle = (dir.angle - 90) * (Math.PI / 180);
                  const x = Math.cos(angle) * 175;
                  const y = Math.sin(angle) * 175;
                  
                  return (
                    <button
                      key={dir.value}
                      onClick={() => handleDirectionSelect(dir.value)}
                      className={`absolute w-24 h-24 rounded-full border-2 flex items-center justify-center font-bold text-2xl transition-all ${
                        userConfig.facingDirection === dir.value
                          ? 'bg-blue-600 border-blue-400 text-white scale-110 shadow-lg'
                          : 'bg-black/90 border-white/50 text-white hover:border-white/70 hover:bg-black/95 hover:shadow-md'
                      }`}
                      style={{
                        left: `calc(50% + ${x}px - 48px)`,
                        top: `calc(50% + ${y}px - 48px)`
                      }}
                    >
                      {dir.value}
                    </button>
                  );
                })}
                
                {/* Center close button */}
                <button
                  onClick={() => setShowDirectionSelector(false)}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <span className="text-white/70 text-4xl font-bold">×</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default SwipeableScreens;
