"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, PanInfo } from 'framer-motion';
import FlightTrackingClock from './FlightTrackingClock';
import FlightRadar from './FlightRadar';
import { useFlightTracking } from '@/hooks/useFlightTracking';

const SwipeableScreens = () => {
  const [currentScreen, setCurrentScreen] = useState(0); // 0 = Clock, 1 = Radar
  const [isDragging, setIsDragging] = useState(false);
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [isRadarLoading, setIsRadarLoading] = useState(false);
  
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

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    // Calculate screen width (480px for your Pi Zero 2W)
    const screenWidth = 480;
    const swipeThreshold = screenWidth * 0.1; // 10% of screen width
    const swipeVelocityThreshold = 500;
    
    // Determine if we should switch screens based on drag distance or velocity
    const shouldSwitchScreens = 
      Math.abs(info.offset.x) > swipeThreshold || 
      Math.abs(info.velocity.x) > swipeVelocityThreshold;
    
    if (shouldSwitchScreens) {
      if (info.offset.x > 0 && currentScreen === 1) {
        // Swipe right: Radar → Clock
        setCurrentScreen(0);
      } else if (info.offset.x < 0 && currentScreen === 0) {
        // Swipe left: Clock → Radar
        setCurrentScreen(1);
      }
    }
    // If threshold not met, screen will automatically snap back to current position
    // due to the animate prop forcing the correct position
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <motion.div
        className="flex w-[200vw] h-full swipe-container"
        animate={{ x: currentScreen === 0 ? 0 : '-50%' }}
        transition={{ 
          type: "tween", 
          duration: 0.3, 
          ease: "easeOut",
          // Force completion - don't allow partial states
          when: "afterChildren"
        }}
        drag="x"
        dragConstraints={{ left: -480, right: 480 }} // Limit to one screen width
        dragElastic={0.15}
        dragMomentum={false} // Disable momentum for precise control
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Screen 1: Flight Tracking Clock */}
        <div className="w-screen h-screen flex-shrink-0">
          <FlightTrackingClock 
            sharedFlightData={flightData}
            isAlertActive={isAlertActive}
            setIsAlertActive={setIsAlertActive}
          />
        </div>
        
        {/* Screen 2: Flight Radar */}
        <div className="w-screen h-screen flex-shrink-0">
          {isRadarLoading ? (
            <div className="w-screen h-screen bg-black flex items-center justify-center">
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
