"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import FlightTrackingClock from './FlightTrackingClock';
import FlightRadar from './FlightRadar';
import { useFlightTracking } from '@/hooks/useFlightTracking';

const SwipeableScreens = () => {
  const [currentScreen, setCurrentScreen] = useState(0); // 0 = Clock, 1 = Radar
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [isRadarLoading, setIsRadarLoading] = useState(false);
  
  // Touch zones for screen navigation
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Add delay when switching to radar to prevent API rate limiting
  useEffect(() => {
    if (currentScreen === 1) {
      setIsRadarLoading(true);
      const timer = setTimeout(() => {
        setIsRadarLoading(false);
      }, 1500); // 1.5 second delay
      
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  // Determine polling interval based on screen and alert state
  const getPollingInterval = useCallback(() => {
    if (currentScreen === 0 || isRadarLoading) {
      // Clock screen or radar loading: conditional polling based on alert state
      return isAlertActive ? 5000 : 30000;
    } else {
      // Radar screen: continuous 5s polling
      return 5000;
    }
  }, [currentScreen, isAlertActive, isRadarLoading]);
  
  // Single shared flight tracking instance (disabled during radar loading)
  const flightData = useFlightTracking(getPollingInterval(), isRadarLoading);


  // Simple touch zone handlers
  const handleTouchZone = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Get touch/click position - handle both touch and mouse events
    let clientX: number;
    
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      // Touch event
      clientX = e.changedTouches[0].clientX;
    } else if ('clientX' in e) {
      // Mouse event
      clientX = e.clientX;
    } else {
      // Fallback - shouldn't happen
      return;
    }
    
    const relativeX = clientX - rect.left;
    const screenWidth = rect.width;
    
    // Left half goes back, right half goes forward
    if (relativeX < screenWidth / 2) {
      // Left side touched - go back
      if (currentScreen === 1) {
        setCurrentScreen(0);
      }
    } else {
      // Right side touched - go forward  
      if (currentScreen === 0) {
        setCurrentScreen(1);
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      onTouchEnd={handleTouchZone}
      onClick={handleTouchZone}
    >
      <motion.div
        className="flex h-full swipe-container"
        style={{ width: '200vw', cursor: 'default' }}
        animate={{ x: currentScreen === 0 ? '0vw' : '-100vw' }}
        transition={{ 
          type: "tween", 
          duration: 0.3, 
          ease: "easeOut"
        }}
      >
        {/* Screen 1: Flight Tracking Clock */}
        <div className="h-full flex-shrink-0" style={{ width: '100vw' }}>
          <FlightTrackingClock 
            sharedFlightData={flightData}
            isAlertActive={isAlertActive}
            setIsAlertActive={setIsAlertActive}
          />
        </div>
        
        {/* Screen 2: Flight Radar */}
        <div className="h-full flex-shrink-0" style={{ width: '100vw' }}>
          {isRadarLoading ? (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <div className="text-center">
                <div className="w-round h-round rounded-round border-2 border-white/20 relative mx-auto mb-4 flex items-center justify-center">
                  <div className="text-white/60 text-sm">Loading radar...</div>
                </div>
              </div>
            </div>
          ) : (
            <FlightRadar flightData={flightData} />
          )}
        </div>
      </motion.div>
      
    </div>
  );
};

export default SwipeableScreens;
