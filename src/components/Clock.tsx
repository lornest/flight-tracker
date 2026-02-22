"use client";

import React, { useState, useEffect, useRef } from 'react';

const Clock = () => {
  const [mounted, setMounted] = useState(false);
  const secondHandRef = useRef<HTMLDivElement>(null);
  const minuteHandRef = useRef<HTMLDivElement>(null);
  const hourHandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const updateHands = () => {
      const now = new Date();
      const seconds = now.getSeconds();
      const minutes = now.getMinutes();
      const hours = now.getHours();

      const secondAngle = seconds * 6;
      const minuteAngle = minutes * 6 + seconds * 0.1;
      const hourAngle = (hours % 12) * 30 + minutes * 0.5;

      if (secondHandRef.current) {
        secondHandRef.current.style.transform = `translateX(-50%) rotate(${secondAngle}deg)`;
      }
      if (minuteHandRef.current) {
        minuteHandRef.current.style.transform = `translateX(-50%) rotate(${minuteAngle}deg)`;
      }
      if (hourHandRef.current) {
        hourHandRef.current.style.transform = `translateX(-50%) rotate(${hourAngle}deg)`;
      }
    };

    updateHands();
    const timer = setInterval(updateHands, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="w-round h-round rounded-round bg-black flex items-center justify-center overflow-hidden relative">
        <div className="text-white/20">Loading...</div>
      </div>
    );
  }

  // Generate all 60 minute markers
  const minuteMarkers = Array.from({ length: 60 }, (_, i) => ({
    angle: i * 6,
    isFiveMinute: i % 5 === 0
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
                ? 'w-1 h-8'
                : 'w-0.5 h-4'
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
        <div
          ref={hourHandRef}
          className="absolute w-2 bg-white clock-hand"
          style={{
            height: '120px',
            top: '120px',
            left: '50%',
            transformOrigin: '50% 120px',
            transition: 'transform 0.5s ease-out'
          }}
        />

        {/* Minute hand */}
        <div
          ref={minuteHandRef}
          className="absolute w-1.5 bg-white clock-hand"
          style={{
            height: '160px',
            top: '80px',
            left: '50%',
            transformOrigin: '50% 160px',
            transition: 'transform 0.5s ease-out'
          }}
        />

        {/* Second hand */}
        <div
          ref={secondHandRef}
          className="absolute w-0.5 bg-white clock-hand"
          style={{
            height: '180px',
            top: '60px',
            left: '50%',
            transformOrigin: '50% 180px',
            transition: 'transform 0.2s ease-out'
          }}
        />
      </div>

      {/* Center dot */}
      <div className="absolute w-3 h-3 bg-white rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
    </div>
  );
};

export default Clock;
