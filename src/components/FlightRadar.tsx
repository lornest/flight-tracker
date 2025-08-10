"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Flight, FlightInfo } from '@/types/flight';
import { calculatePlaneRotation, calculateDistance } from '@/lib/utils/bearing';

interface FlightRadarProps {
  flightData: {
    flights: Flight[];
    newFlights: string[];
    newFlightsWithInfo: Array<{ hexCode: string; flight: Flight; info?: FlightInfo }>;
    totalFlights: number;
    lastUpdate: number;
    userLocation: { latitude: number; longitude: number; facingDirection: string } | undefined;
    isLoading: boolean;
    error: string | null;
    hasNewFlight: boolean;
    clearNewFlightAlert: () => void;
    refetch: () => Promise<void>;
  };
}

const FlightRadar = ({ flightData }: FlightRadarProps) => {
  const {
    flights,
    userLocation,
    isLoading,
    error
  } = flightData;

  if (error) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-center">
          <div className="text-xl mb-2">Error</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden relative">
      {/* Radar circle */}
      <div className="w-round h-round rounded-round border-2 border-white/20 relative">
        {/* Distance rings */}
        {[0.25, 0.5, 0.75].map((ratio) => {
          const ringRadius = ratio * 180; // 180px is the max radius
          const maxRadiusNM = parseInt(process.env.NEXT_PUBLIC_RADIUS_NM || '10');
          const ringDistanceNM = ratio * maxRadiusNM;
          
          return (
            <div
              key={ratio}
              className="absolute rounded-full border border-white/10"
              style={{
                width: `${ringRadius * 2}px`,
                height: `${ringRadius * 2}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Distance label */}
              <div 
                className="absolute text-xs text-white/40 font-mono"
                style={{
                  right: '-20px',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              >
                {ringDistanceNM.toFixed(1)}nm
              </div>
            </div>
          );
        })}
        
        {/* Center dot */}
        <div className="absolute w-2 h-2 bg-white rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
        
        {/* Flight beacons */}
        {userLocation && flights && flights.map((flight, index) => {
          // Skip flights without valid coordinates
          if (!flight.lat || !flight.lon) return null;
          
          const rotation = calculatePlaneRotation(
            userLocation.latitude,
            userLocation.longitude,
            flight.lat,
            flight.lon,
            userLocation.facingDirection
          );
          
          // Calculate distance from user location to aircraft
          const distanceNM = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            flight.lat,
            flight.lon
          );
          
          // Get the maximum radius from environment variable (default 10 NM)
          const maxRadiusNM = parseInt(process.env.NEXT_PUBLIC_RADIUS_NM || '10');
          
          // Calculate position on the radar circle based on actual distance
          // If aircraft is at center (0 distance), beacon is at center
          // If aircraft is at edge (maxRadiusNM distance), beacon is at edge
          const maxScreenRadius = 180; // Maximum radius of the radar circle in pixels
          const distanceRatio = Math.min(distanceNM / maxRadiusNM, 1); // Cap at 1.0 for aircraft beyond our radius
          const screenRadius = distanceRatio * maxScreenRadius;
          
          const angleRad = (rotation - 90) * (Math.PI / 180); // -90 to make 0° point up
          const x = Math.cos(angleRad) * screenRadius;
          const y = Math.sin(angleRad) * screenRadius;
          
          return (
            <motion.div
              key={flight.hex}
              className="absolute z-20"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`
              }}
              transition={{ 
                duration: 0.8,
                ease: "easeOut"
              }}
            >
              {/* White triangle beacon pointing inward */}
              <div
                className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-white"
                style={{
                  transform: `rotate(${rotation + 180}deg)`, // +180 to point inward toward center
                  filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))'
                }}
              />
              {/* Flight number and distance label */}
              {flight.flight && (
                <div 
                  className="absolute text-xs text-white font-semibold whitespace-nowrap text-center"
                  style={{
                    left: '50%',
                    top: '100%',
                    transform: 'translate(-50%, 4px)',
                    textShadow: '0 0 4px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  <div>{flight.flight}</div>
                  <div className="text-white/60 text-xs font-mono">
                    {distanceNM.toFixed(1)}nm
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="text-white/60 text-sm">Updating...</div>
          </div>
        )}
        
        {/* Flight count */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/90 text-sm">
            {flights.length} aircraft tracked
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightRadar;
