"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Flight, FlightInfo } from '@/types/flight';
import { calculatePlaneRotation } from '@/lib/utils/bearing';
import { getAirportData } from '@/lib/utils/airport';

// Route display component with airport data fetching
const RouteDisplay = ({ flightInfo }: { flightInfo: FlightInfo }) => {
  const [originData, setOriginData] = useState<{ location: string; name: string } | null>(null);
  const [destData, setDestData] = useState<{ location: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAirportData = async () => {
      setLoading(true);
      
      console.log('RouteDisplay - flightInfo:', flightInfo); // Debug log
      
      // Fetch origin airport data
      const originIcao = flightInfo.origin?.icao;
      if (originIcao) {
        console.log('Fetching origin airport data for:', originIcao);
        const originAirport = await getAirportData(originIcao);
        setOriginData(originAirport ? { location: originAirport.location, name: originAirport.name } : null);
      }
      
      // Fetch destination airport data
      const destIcao = flightInfo.destination?.icao;
      if (destIcao) {
        console.log('Fetching destination airport data for:', destIcao);
        const destAirport = await getAirportData(destIcao);
        setDestData(destAirport ? { location: destAirport.location, name: destAirport.name } : null);
      }
      
      setLoading(false);
    };

    fetchAirportData();
  }, [flightInfo]);

  if (loading) {
    return (
      <div className="text-white/50 text-sm text-center animate-pulse">
        Loading route...
      </div>
    );
  }

  if (!originData || !destData) {
    return (
      <div className="text-white/50 text-sm text-center">
        Route information unavailable
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 text-white/90 text-lg font-medium">
        <div className="text-center">
          <div className="mb-1">{originData.location}</div>
          <div className="text-white/60 text-sm font-normal leading-tight break-words">
            {originData.name}
          </div>
        </div>
        
        <div className="flex items-center justify-center pt-1">
          <span className="text-white/70">→</span>
        </div>
        
        <div className="text-center">
          <div className="mb-1">{destData.location}</div>
          <div className="text-white/60 text-sm font-normal leading-tight break-words">
            {destData.name}
          </div>
        </div>
      </div>
    </div>
  );
};

interface FlightAlertProps {
  isVisible: boolean;
  flightCount: number;
  newFlights: string[];
  newFlightsWithInfo?: Array<{ hexCode: string; flight: Flight; info?: FlightInfo }>;
  allFlights: Flight[];
  userLocation?: {
    latitude: number;
    longitude: number;
    facingDirection: string;
  };
  onDismiss: () => void;
}

const FlightAlert = ({ isVisible, newFlights, newFlightsWithInfo, allFlights, userLocation, onDismiss }: FlightAlertProps) => {
  // Preserve flight info during the alert period to prevent loss of route information
  const [preservedFlightInfo, setPreservedFlightInfo] = useState<Array<{ hexCode: string; flight: Flight; info?: FlightInfo }>>([]);
  
  // Update preserved flight info when new flights with info arrive
  useEffect(() => {
    if (newFlightsWithInfo && newFlightsWithInfo.length > 0) {
      // Merge new flight info with existing preserved info, avoiding duplicates
      setPreservedFlightInfo(prevInfo => {
        const existingHexCodes = prevInfo.map(f => f.hexCode);
        const newInfo = newFlightsWithInfo.filter(f => !existingHexCodes.includes(f.hexCode));
        return [...prevInfo, ...newInfo];
      });
    }
  }, [newFlightsWithInfo]);
  
  // Clear preserved info when alert is dismissed
  useEffect(() => {
    if (!isVisible) {
      setPreservedFlightInfo([]);
    }
  }, [isVisible]);
  
  if (!isVisible) return null;


  return (
    <motion.div
      className="w-round h-round rounded-round bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex flex-col items-center justify-center overflow-hidden relative shadow-2xl alert-container"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      transition={{ type: "tween", duration: 0.4, ease: "easeOut" }}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-full bg-white"
              style={{
                left: '50%',
                transformOrigin: '50% 50%',
                transform: `translateX(-50%) rotate(${i * 45}deg)`
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6 text-white/70" />
      </button>

      {/* Main content */}
      <motion.div
        className="text-center z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >

        {/* Real-time beacons for all current flights */}
        {userLocation && allFlights && allFlights.slice(0, 8).map((flight, index) => {
          // Skip flights without valid coordinates
          if (!flight.lat || !flight.lon) return null;
          
          const rotation = calculatePlaneRotation(
            userLocation.latitude,
            userLocation.longitude,
            flight.lat,
            flight.lon,
            userLocation.facingDirection
          );
          
          // Calculate position on the clock face (radius from center to edge)
          const radius = 180;
          const angleRad = (rotation - 90) * (Math.PI / 180); // -90 to make 0° point up
          const x = Math.cos(angleRad) * radius;
          const y = Math.sin(angleRad) * radius;
          
          // Determine if this is a new flight for highlighting
          const isNewFlight = newFlights.includes(flight.hex);
          
          return (
            <motion.div
              key={flight.hex}
              className="absolute z-20"
              style={{
                transform: 'translate(-50%, -50%)'
              }}
              initial={{ 
                scale: 0, 
                opacity: 0,
                left: '50%',
                top: '50%'
              }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`
              }}
              transition={{ 
                delay: isNewFlight ? 0.3 + index * 0.05 : 0,
                duration: 0.4,
                ease: "easeOut"
              }}
            >
              {/* Triangle beacon pointing inward */}
              <div
                className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[14px] border-l-transparent border-r-transparent border-b-yellow-300"
                style={{
                  transform: `rotate(${rotation + 180}deg)`, // +180 to point inward toward center
                  filter: 'drop-shadow(0 0 6px rgba(255, 255, 0, 0.8))'
                }}
              />
              {/* Flight number label */}
              {flight.flight && (
                <div 
                  className="absolute text-sm font-semibold whitespace-nowrap text-yellow-300"
                  style={{
                    left: '50%',
                    top: '100%',
                    transform: 'translate(-50%, 4px)',
                    textShadow: '0 0 4px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  {flight.flight}
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Alert text */}
        {/* <motion.h1
          className="text-4xl font-light text-white mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          New Flight!
        </motion.h1> */}
        
        {/* Flight details */}
        {preservedFlightInfo && preservedFlightInfo.length > 0 && (
          <motion.div
            className="space-y-3 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {preservedFlightInfo.slice(0, 2).map((flightData, index) => {
              return (
                <motion.div
                  key={flightData.hexCode}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  {/* Flight number */}
                  {flightData.flight.flight && (
                    <div className="text-white font-semibold text-2xl mb-3">
                      {flightData.flight.flight}
                    </div>
                  )}
                  
                
                {/* Route information */}
                {flightData.info ? (
                  <RouteDisplay flightInfo={flightData.info} />
                ) : (
                  <div className="text-white/60 text-base">
                    Aircraft: {flightData.flight.type || 'Unknown'}
                  </div>
                )}
                </motion.div>
              );
            })}
            
            {preservedFlightInfo.length > 2 && (
              <motion.div
                className="text-white/60 text-base"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                +{preservedFlightInfo.length - 2} more
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Pulsing ring animation */}
      <motion.div
        className="absolute inset-8 rounded-full border-2 border-white/20"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
    </motion.div>
  );
};

export default FlightAlert;