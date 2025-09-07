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
  onSettingsAccess: () => void;
}

const SwipeableScreens = ({ userConfig, onSettingsAccess }: SwipeableScreensProps) => {
  const [currentScreen, setCurrentScreen] = useState(0); // 0 = Clock, 1 = Radar
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [isRadarLoading, setIsRadarLoading] = useState(false);
  const [isClockLoading, setIsClockLoading] = useState(false);
  
  // Touch zones for screen navigation
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  
  // Settings access via long press
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showSettingsHint, setShowSettingsHint] = useState(false);
  
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


  // Simple touch zone handlers
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

  // Long press handlers for settings access
  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setShowSettingsHint(true);
    
    const timer = setTimeout(() => {
      onSettingsAccess();
      setShowSettingsHint(false);
    }, 2000); // 2 second long press
    
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setShowSettingsHint(false);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

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
            <div className="w-round h-round rounded-round bg-black border-2 border-white/20 flex items-center justify-center mx-auto">
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
            <div className="w-round h-round rounded-round bg-black border-2 border-white/20 flex items-center justify-center mx-auto">
              <div className="text-white/70 text-2xl font-medium text-center">Loading FlightRadar...</div>
            </div>
          ) : (
            <FlightRadar flightData={flightData} />
          )}
        </div>
      </motion.div>
      
      {/* Settings Access Overlay */}
      <div 
        className="absolute top-1/2 left-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 z-30"
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
      >
        {/* Invisible touch target for settings access */}
        <div className="w-full h-full"></div>
      </div>

      {/* Settings Hint */}
      {showSettingsHint && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
          <div className="bg-blue-600/90 backdrop-blur-sm rounded-full px-8 py-4 text-white text-xl font-bold">
            Hold for Settings
          </div>
        </div>
      )}
      
    </div>
  );
};

export default SwipeableScreens;
