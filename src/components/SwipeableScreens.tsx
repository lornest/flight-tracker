"use client";

import React, { useState, useEffect, useRef } from 'react';
import FlightTrackingClock from './FlightTrackingClock';
import FlightRadar from './FlightRadar';
import { useFlightTracking } from '@/hooks/useFlightTracking';

const DIRECTIONS = [
  { value: 'N', label: 'North', angle: 0 },
  { value: 'NE', label: 'Northeast', angle: 45 },
  { value: 'E', label: 'East', angle: 90 },
  { value: 'SE', label: 'Southeast', angle: 135 },
  { value: 'S', label: 'South', angle: 180 },
  { value: 'SW', label: 'Southwest', angle: 225 },
  { value: 'W', label: 'West', angle: 270 },
  { value: 'NW', label: 'Northwest', angle: 315 }
] as const;

interface SwipeableScreensProps {
  userConfig: {
    latitude: number;
    longitude: number;
    facingDirection: string;
  };
  onConfigUpdate: (config: { facingDirection: string }) => void;
}

const SwipeableScreens = ({ userConfig, onConfigUpdate }: SwipeableScreensProps) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [isRadarLoading, setIsRadarLoading] = useState(false);
  const [isClockLoading, setIsClockLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const [showDirectionSelector, setShowDirectionSelector] = useState(false);
  const lastTapRef = useRef<number>(0);
  const lastTapLocationRef = useRef<{ x: number; y: number } | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (currentScreen === 1) {
      setIsRadarLoading(true);
      setIsClockLoading(false);
      const timer = setTimeout(() => setIsRadarLoading(false), 1500);
      return () => clearTimeout(timer);
    } else if (currentScreen === 0) {
      setIsClockLoading(true);
      setIsRadarLoading(false);
      const timer = setTimeout(() => setIsClockLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const isAnyLoading = isRadarLoading || isClockLoading;

  // Target polling interval based on current screen and alert state
  const targetInterval = currentScreen === 1
    ? 5000
    : (isAlertActive ? 5000 : 30000);

  // Debounce polling interval changes to avoid effect churn during transitions
  const [stableInterval, setStableInterval] = useState(targetInterval);
  const [stableDisabled, setStableDisabled] = useState(false);

  useEffect(() => {
    if (isAnyLoading) {
      // Immediately disable polling during loading
      setStableDisabled(true);
      return;
    }
    // Debounce re-enabling polling after loading settles
    const timer = setTimeout(() => {
      setStableDisabled(false);
      setStableInterval(targetInterval);
    }, 200);
    return () => clearTimeout(timer);
  }, [isAnyLoading, targetInterval]);

  const flightData = useFlightTracking(
    stableInterval,
    stableDisabled,
    userConfig
  );

  const handleTouchZone = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;

    if (target.closest('.radar-beacon') ||
        target.closest('[data-flight-modal]') ||
        target.closest('button') ||
        target.classList.contains('cursor-pointer')) {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    let clientX: number, clientY: number;

    if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }

    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    const screenWidth = rect.width;
    const screenHeight = rect.height;

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

    const isSameLocation = lastLocation &&
      Math.abs(relativeX - lastLocation.x) < 50 &&
      Math.abs(relativeY - lastLocation.y) < 50;

    if (distanceFromCenter <= centerRadius) {
      if (timeSinceLastTap < 500 && timeSinceLastTap > 50 && isSameLocation) {
        setShowDirectionSelector(true);
        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
        }
        return;
      }
    } else {
      if (timeSinceLastTap < 500 && timeSinceLastTap > 50 && isSameLocation) {
        if (relativeX < centerX) {
          if (currentScreen === 1) setCurrentScreen(0);
        } else {
          if (currentScreen === 0) setCurrentScreen(1);
        }
        return;
      }
    }

    lastTapRef.current = now;
    lastTapLocationRef.current = { x: relativeX, y: relativeY };
  };

  const handleDirectionSelect = (direction: string) => {
    onConfigUpdate({ facingDirection: direction });
    setShowDirectionSelector(false);
  };

  useEffect(() => {
    const currentTimeout = tapTimeoutRef.current;
    return () => {
      if (currentTimeout) clearTimeout(currentTimeout);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      onTouchEnd={handleTouchZone}
      onClick={handleTouchZone}
    >
      <div
        className="flex h-full swipe-container"
        style={{
          width: 'calc(200% + 0px)',
          cursor: 'default',
          transform: currentScreen === 0 ? 'translateX(0%)' : 'translateX(-50%)',
          transition: 'transform 0.3s ease-out'
        }}
      >
        {/* Screen 1: Flight Tracking Clock */}
        <div className="h-full flex-shrink-0 top-[6px] relative" style={{ width: '50%' }}>
          {isClockLoading ? (
            <div className="w-round h-round rounded-round bg-black border-2 border-white/20 flex items-center justify-center">
              <div className="text-white/70 text-5xl font-medium text-center">Loading FlightClock...</div>
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
        <div className="h-full flex-shrink-0 top-[6px] relative" style={{ width: '50%' }}>
          {isRadarLoading ? (
            <div className="w-round h-round rounded-round bg-black border-2 border-white/20 flex items-center justify-center">
              <div className="text-white/70 text-5xl font-medium text-center">Loading FlightRadar...</div>
            </div>
          ) : (
            <FlightRadar flightData={flightData} userConfig={userConfig} />
          )}
        </div>
      </div>

      {/* Direction Selector Modal */}
      {showDirectionSelector && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="w-round h-round rounded-round bg-black/95 border-2 border-white/20 flex items-center justify-center relative top-[6px]">
            <div className="text-center">
              <div className="relative w-[420px] h-[420px]">
                <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>

                {DIRECTIONS.map((dir) => {
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

                <button
                  onClick={() => setShowDirectionSelector(false)}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <span className="text-white/70 text-4xl font-bold">&times;</span>
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
