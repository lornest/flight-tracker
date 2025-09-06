"use client";

import React, { useState } from 'react';
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

  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);

  // Only show error for actual connection/API errors, not "no flights" scenarios
  if (error && !error.toLowerCase().includes('no flight') && !error.toLowerCase().includes('no aircraft')) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-red-400 text-center">
          <div className="text-xl mb-2">Connection Error</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden relative">
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
          
          // Calculate distance from user location to aircraft
          const distanceNM = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            flight.lat,
            flight.lon
          );
          
          // Get the maximum radius from environment variable (default 10 NM)
          const maxRadiusNM = parseInt(process.env.NEXT_PUBLIC_RADIUS_NM || '10');
          
          // Skip flights that are beyond our radar range
          if (distanceNM > maxRadiusNM) return null;
          
          const rotation = calculatePlaneRotation(
            userLocation.latitude,
            userLocation.longitude,
            flight.lat,
            flight.lon,
            userLocation.facingDirection
          );
          
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
              className="absolute z-20 radar-beacon cursor-pointer hover:scale-110 transition-transform"
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
                duration: 0.4,
                ease: "easeOut"
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFlight(flight);
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
        
        {/* Clear skies message when no flights */}
        {flights.length === 0 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/90 text-sm">
              Clear skies
            </div>
          </div>
        )}

        {/* Flight Info Modal */}
        {selectedFlight && (
          <motion.div
            data-flight-modal="true"
            className="absolute inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFlight(null);
            }}
          >
            <motion.div
              className="bg-black/95 backdrop-blur-md rounded-lg p-6 max-w-sm w-full mx-4 border border-white/40"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-lg font-semibold">
                  {selectedFlight.flight || selectedFlight.hex}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFlight(null);
                  }}
                  className="text-white/60 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>

              {/* Flight Details */}
              <div className="space-y-3 text-sm">
                {/* Aircraft Info */}
                {selectedFlight.t && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Aircraft:</span>
                    <span className="text-white">{selectedFlight.t}</span>
                  </div>
                )}
                
                {selectedFlight.r && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Registration:</span>
                    <span className="text-white">{selectedFlight.r}</span>
                  </div>
                )}

                {/* Position Info */}
                <div className="flex justify-between">
                  <span className="text-white/70">Position:</span>
                  <span className="text-white text-xs font-mono">
                    {selectedFlight.lat.toFixed(4)}°, {selectedFlight.lon.toFixed(4)}°
                  </span>
                </div>

                {/* Altitude */}
                {selectedFlight.alt_baro && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Altitude:</span>
                    <span className="text-white">{selectedFlight.alt_baro.toLocaleString()} ft</span>
                  </div>
                )}

                {/* Speed */}
                {selectedFlight.gs && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Speed:</span>
                    <span className="text-white">{selectedFlight.gs} kts</span>
                  </div>
                )}

                {/* Heading */}
                {selectedFlight.track && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Heading:</span>
                    <span className="text-white">{selectedFlight.track}°</span>
                  </div>
                )}

                {/* Squawk */}
                {selectedFlight.squawk && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Squawk:</span>
                    <span className="text-white font-mono">{selectedFlight.squawk}</span>
                  </div>
                )}

                {/* Distance from user */}
                {userLocation && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Distance:</span>
                    <span className="text-white">
                      {calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        selectedFlight.lat,
                        selectedFlight.lon
                      ).toFixed(1)} nm
                    </span>
                  </div>
                )}

                {/* Vertical Speed */}
                {selectedFlight.baro_rate && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Vertical Speed:</span>
                    <span className="text-white">
                      {selectedFlight.baro_rate > 0 ? '↗' : selectedFlight.baro_rate < 0 ? '↘' : '→'} {Math.abs(selectedFlight.baro_rate)} ft/min
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FlightRadar;
