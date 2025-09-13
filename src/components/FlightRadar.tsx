"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flight, FlightInfo } from '@/types/flight';
import { calculatePlaneRotation, calculateDistance } from '@/lib/utils/bearing';

interface FlightRadarProps {
  flightData: {
    flights: Flight[];
    newFlights: string[];
    newFlightsWithInfo: Array<{ hexCode: string; flight: Flight; info?: FlightInfo }>;
    allFlightInfo: Map<string, FlightInfo>;
    totalFlights: number;
    lastUpdate: number;
    userLocation: { latitude: number; longitude: number; facingDirection: string } | undefined;
    isLoading: boolean;
    error: string | null;
    hasNewFlight: boolean;
    clearNewFlightAlert: () => void;
    refetch: () => Promise<void>;
  };
  userConfig: {
    latitude: number;
    longitude: number;
    facingDirection: string;
  };
}

const FlightRadar = ({ flightData, userConfig }: FlightRadarProps) => {
  const {
    flights,
    newFlightsWithInfo,
    allFlightInfo,
    userLocation,
    isLoading,
    error
  } = flightData;


  const [selectedFlightHex, setSelectedFlightHex] = useState<string | null>(null);
  
  // Get current flight data for selected flight
  const selectedFlight = selectedFlightHex ? flights.find(f => f.hex === selectedFlightHex) : null;
  
  // Auto-close modal if selected flight is no longer in range
  useEffect(() => {
    if (selectedFlightHex && !selectedFlight) {
      setSelectedFlightHex(null);
    }
  }, [selectedFlightHex, selectedFlight]);

  // Helper function to get flight info for a specific flight
  const getFlightInfo = (flight: Flight) => {
    // First check persistent flight info, then fallback to new flight info
    return allFlightInfo.get(flight.hex) || newFlightsWithInfo.find(info => info.hexCode === flight.hex)?.info;
  };

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
    <div className="w-round h-round rounded-round bg-black flex items-center justify-center overflow-hidden relative border-2 border-white/20">
        {/* Distance rings */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((ratio) => {
          const ringRadius = ratio * 240 * 0.85; // 85% of full radius to match flight display area
          
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
            />
          );
        })}
        
        {/* Center dot */}
        <div className="absolute w-2 h-2 bg-white rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
        
        {/* Facing direction indicator */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-blue-600/80 backdrop-blur-sm rounded-lg px-8 py-4 text-white text-xl font-bold border border-white/20">
            ↑ {userConfig.facingDirection}
          </div>
        </div>
        
        {/* Flight beacons */}
        {userLocation && flights && flights.map((flight) => {
          // Skip flights without valid coordinates
          if (!flight.lat || !flight.lon) return null;
          
          // Use coordinates from userLocation but facing direction from userConfig
          const currentLocation = {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            facingDirection: userConfig.facingDirection
          };
          
          // Calculate distance from user location to aircraft
          const distanceNM = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            flight.lat,
            flight.lon
          );
          
          // Get the maximum radius from environment variable (default 10 NM)
          const maxRadiusNM = parseInt(process.env.NEXT_PUBLIC_RADIUS_NM || '10');
          
          // Skip flights that are beyond our radar range
          if (distanceNM > maxRadiusNM) return null;
          
          const rotation = calculatePlaneRotation(
            currentLocation.latitude,
            currentLocation.longitude,
            flight.lat,
            flight.lon,
            currentLocation.facingDirection
          );
          
          // Calculate position on the radar circle based on actual distance
          // If aircraft is at center (0 distance), beacon is at center
          // If aircraft is at edge (maxRadiusNM distance), beacon is at edge
          // Use 85% of screen radius to provide padding for beacons and labels at the edge
          const maxScreenRadius = 240 * 0.85; // 85% of full radius to keep beacons/text visible
          const distanceRatio = Math.min(distanceNM / maxRadiusNM, 1); // Cap at 1.0 for aircraft beyond our radius
          const screenRadius = distanceRatio * maxScreenRadius;
          
          // Use rotation directly - it's already relative to user's facing direction
          // 0° = straight ahead (up on screen), 90° = right, 180° = behind, 270° = left
          const angleRad = (rotation - 90) * (Math.PI / 180); // -90 to convert to screen coordinates
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
                setSelectedFlightHex(flight.hex);
              }}
            >
              {/* White triangle beacon pointing inward - larger for visibility */}
              <div
                className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[15px] border-l-transparent border-r-transparent border-b-white"
                style={{
                  transform: `rotate(${rotation + 180}deg)`, // +180 to point inward toward center
                  filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))'
                }}
              />
              {/* Flight number and distance label - larger text */}
              {flight.flight && (
                <div 
                  className="absolute text-sm text-white font-bold whitespace-nowrap text-center"
                  style={{
                    left: '50%',
                    top: '100%',
                    transform: 'translate(-50%, 6px)',
                    textShadow: '0 0 6px rgba(0, 0, 0, 0.9)'
                  }}
                >
                  <div className="text-base">{flight.flight}</div>
                  <div className="text-white/70 text-sm font-mono">
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
            <div className="text-white/60 text-xl font-medium">Updating...</div>
          </div>
        )}
        
        {/* Clear skies message when no flights */}
        {flights.length === 0 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-8 py-4 text-white/90 text-xl font-medium">
              Clear skies
            </div>
          </div>
        )}

        {/* Flight Info Modal */}
        {selectedFlight && (
          <motion.div
            data-flight-modal="true"
            className="absolute inset-4 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFlightHex(null);
            }}
          >
            <motion.div
              className="bg-black/95 backdrop-blur-md rounded-lg p-6 max-w-sm w-full border border-white/40 flex flex-col justify-center"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white text-xl font-bold truncate">
                  {selectedFlight.flight || selectedFlight.hex}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFlightHex(null);
                  }}
                  className="text-white/60 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Flight Details */}
              <div className="space-y-4 text-base">
                {/* Route Information */}
                {(() => {
                  const flightInfo = getFlightInfo(selectedFlight);
                  if (flightInfo?.origin && flightInfo?.destination) {
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-white/70">From:</span>
                          <span className="text-white text-right font-mono">
                            {flightInfo.origin.iata || flightInfo.origin.icao}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">To:</span>
                          <span className="text-white text-right font-mono">
                            {flightInfo.destination.iata || flightInfo.destination.icao}
                          </span>
                        </div>
                      </>
                    );
                  }
                  return (
                    <div className="text-white/50 text-sm text-center">
                      Route information unavailable
                    </div>
                  );
                })()}

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
  );
};

export default FlightRadar;
