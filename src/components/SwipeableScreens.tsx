"use client";

import React, { useState, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import FlightTrackingClock from './FlightTrackingClock';
import FlightRadar from './FlightRadar';
import { useFlightTracking } from '@/hooks/useFlightTracking';

const SwipeableScreens = () => {
  const [currentScreen, setCurrentScreen] = useState(0); // 0 = Clock, 1 = Radar
  const [isDragging, setIsDragging] = useState(false);
  const [isAlertActive, setIsAlertActive] = useState(false);
  
  // Determine polling interval based on screen and alert state
  const getPollingInterval = useCallback(() => {
    if (currentScreen === 0) {
      // Clock screen: conditional polling based on alert state
      return isAlertActive ? 5000 : 30000;
    } else {
      // Radar screen: continuous 5s polling
      return 5000;
    }
  }, [currentScreen, isAlertActive]);
  
  // Single shared flight tracking instance
  const flightData = useFlightTracking(getPollingInterval());

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    // Determine swipe direction and threshold
    const swipeThreshold = 100;
    const swipeVelocityThreshold = 500;
    
    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > swipeVelocityThreshold) {
      if (info.offset.x > 0 && currentScreen === 1) {
        // Swipe right: Radar → Clock
        setCurrentScreen(0);
      } else if (info.offset.x < 0 && currentScreen === 0) {
        // Swipe left: Clock → Radar
        setCurrentScreen(1);
      }
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <motion.div
        className="flex w-[200vw] h-full"
        animate={{ x: currentScreen === 0 ? 0 : '-50%' }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        drag="x"
        dragConstraints={{ left: -1000, right: 0 }}
        dragElastic={0.1}
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
          <FlightRadar flightData={flightData} />
        </div>
      </motion.div>
      
      {/* Screen indicator dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-50">
        <div 
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            currentScreen === 0 ? 'bg-white' : 'bg-white/30'
          }`}
        />
        <div 
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            currentScreen === 1 ? 'bg-white' : 'bg-white/30'
          }`}
        />
      </div>
    </div>
  );
};

export default SwipeableScreens;
