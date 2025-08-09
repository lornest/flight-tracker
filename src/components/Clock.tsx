"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Clock = () => {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [secondRotations, setSecondRotations] = useState(0);

  useEffect(() => {
    setMounted(true);
    let prevSeconds = new Date().getSeconds();
    
    const timer = setInterval(() => {
      const newTime = new Date();
      const currentSeconds = newTime.getSeconds();
      
      // Check if seconds wrapped from 59 to 0
      if (prevSeconds === 59 && currentSeconds === 0) {
        setSecondRotations(prev => prev + 360);
      }
      
      setTime(newTime);
      prevSeconds = currentSeconds;
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-round h-round rounded-round bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center overflow-hidden relative">
        <div className="text-white/20">Loading...</div>
      </div>
    );
  }

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const day = time.getDate();
  const month = time.toLocaleDateString('en-US', { month: 'short' });
  const year = time.getFullYear();
  const weekday = time.toLocaleDateString('en-US', { weekday: 'long' });

  // Calculate angles for clock hands
  const secondAngle = (seconds * 6) - 90 + secondRotations; // 6 degrees per second + accumulated rotations
  const minuteAngle = (minutes * 6) + (seconds * 0.1) - 90; // 6 degrees per minute + smooth second movement
  const hourAngle = ((hours % 12) * 30) + (minutes * 0.5) - 90; // 30 degrees per hour + smooth minute movement

  // Generate all 60 minute markers
  const minuteMarkers = Array.from({ length: 60 }, (_, i) => ({
    angle: i * 6, // 6 degrees per minute
    isFiveMinute: i % 5 === 0 // Every 5th minute (0, 5, 10, 15, etc.)
  }));

  return (
    <div className="w-round h-round rounded-round bg-black flex items-center justify-center overflow-hidden relative">
      {/* Minute markers */}
      <div className="absolute inset-0 rounded-full">
        {minuteMarkers.map(({ angle, isFiveMinute }) => (
          <div
            key={angle}
            className={`absolute bg-white origin-bottom ${
              isFiveMinute 
                ? 'w-0.5 h-6' // Longer, thicker markers for 5-minute intervals
                : 'w-px h-3'   // Shorter, thinner markers for single minutes
            }`}
            style={{
              top: isFiveMinute ? '16px' : '19px',
              left: '50%',
              transform: `translateX(-50%) rotate(${angle}deg)`,
              transformOrigin: `50% ${isFiveMinute ? '224px' : '221px'}`
            }}
          />
        ))}
      </div>

      {/* Clock hands */}
      <div className="absolute inset-0 rounded-full">
        {/* Hour hand */}
        <motion.div
          className="absolute w-1.5 bg-white origin-bottom"
          style={{
            height: '120px',
            top: '120px',
            left: '50%',
            transform: `translateX(-50%) rotate(${hourAngle}deg)`,
            transformOrigin: '50% 120px'
          }}
          animate={{ rotate: hourAngle + 90 }}
          transition={{ type: "spring", damping: 50, stiffness: 100 }}
        />
        
        {/* Minute hand */}
        <motion.div
          className="absolute w-1 bg-white origin-bottom"
          style={{
            height: '160px',
            top: '80px',
            left: '50%',
            transform: `translateX(-50%) rotate(${minuteAngle}deg)`,
            transformOrigin: '50% 160px'
          }}
          animate={{ rotate: minuteAngle + 90 }}
          transition={{ type: "spring", damping: 50, stiffness: 100 }}
        />
        
        {/* Second hand */}
        <motion.div
          className="absolute w-px bg-white origin-bottom"
          style={{
            height: '180px',
            top: '60px',
            left: '50%',
            transform: `translateX(-50%) rotate(${secondAngle}deg)`,
            transformOrigin: '50% 180px'
          }}
          animate={{ rotate: secondAngle + 90 }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
        />
      </div>

      {/* Center dot */}
      <div className="absolute w-2 h-2 bg-white rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
    </div>
  );
};

export default Clock;