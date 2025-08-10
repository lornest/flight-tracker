"use client";

import { motion } from 'framer-motion';
import { Plane, X, MapPin } from 'lucide-react';
import { Flight, FlightInfo } from '@/types/flight';
import { calculatePlaneRotation, getRelativeDirection } from '@/lib/utils/bearing';

interface FlightAlertProps {
  isVisible: boolean;
  flightCount: number;
  newFlights: string[];
  newFlightsWithInfo?: Array<{ hexCode: string; flight: Flight; info?: FlightInfo }>;
  userLocation?: {
    latitude: number;
    longitude: number;
    facingDirection: string;
  };
  onDismiss: () => void;
}

const FlightAlert = ({ isVisible, flightCount, newFlights, newFlightsWithInfo, userLocation, onDismiss }: FlightAlertProps) => {
  if (!isVisible) return null;

  // Calculate rotation for the main plane icon (first new flight)
  const mainPlaneRotation = userLocation && newFlightsWithInfo && newFlightsWithInfo.length > 0 
    ? calculatePlaneRotation(
        userLocation.latitude,
        userLocation.longitude,
        newFlightsWithInfo[0].flight.lat || 0,
        newFlightsWithInfo[0].flight.lon || 0,
        userLocation.facingDirection
      )
    : 0;

  return (
    <motion.div
      className="w-round h-round rounded-round bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex flex-col items-center justify-center overflow-hidden relative shadow-2xl"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
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
        <X className="w-4 h-4 text-white/70" />
      </button>

      {/* Main content */}
      <motion.div
        className="text-center z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Animated plane icon */}
        <motion.div
          className="mb-6"
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, 0, -5, 0]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <Plane className="w-16 h-16 text-white mx-auto" />
        </motion.div>

        {/* Directional beacons for each new flight */}
        {userLocation && newFlightsWithInfo && newFlightsWithInfo.slice(0, 4).map((flightData, index) => {
          const rotation = calculatePlaneRotation(
            userLocation.latitude,
            userLocation.longitude,
            flightData.flight.lat || 0,
            flightData.flight.lon || 0,
            userLocation.facingDirection
          );
          
          // Calculate position on the clock face (radius from center to edge)
          const radius = 180; // Increased radius to reach the perimeter
          const angleRad = (rotation - 90) * (Math.PI / 180); // -90 to make 0° point up
          const x = Math.cos(angleRad) * radius;
          const y = Math.sin(angleRad) * radius;
          
          return (
            <motion.div
              key={flightData.hexCode}
              className="absolute z-20"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              {/* Triangle beacon pointing inward */}
              <div
                className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-yellow-400"
                style={{
                  transform: `rotate(${rotation + 180}deg)`, // +180 to point inward toward center
                  filter: 'drop-shadow(0 0 4px rgba(255, 255, 0, 0.6))'
                }}
              />
              {/* Flight number label */}
              {flightData.flight.flight && (
                <div 
                  className="absolute text-xs text-yellow-300 font-semibold whitespace-nowrap"
                  style={{
                    left: '50%',
                    top: '100%',
                    transform: 'translate(-50%, 4px)',
                    textShadow: '0 0 4px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  {flightData.flight.flight}
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Alert text */}
        <motion.h1
          className="text-3xl font-light text-white mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          New Flight!
        </motion.h1>
        
        {/* Flight details */}
        {newFlightsWithInfo && newFlightsWithInfo.length > 0 ? (
          <motion.div
            className="space-y-3 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {newFlightsWithInfo.slice(0, 2).map((flightData, index) => {
              // Get relative direction description
              const relativeDirection = userLocation 
                ? getRelativeDirection(
                    userLocation.latitude,
                    userLocation.longitude,
                    flightData.flight.lat || 0,
                    flightData.flight.lon || 0,
                    userLocation.facingDirection
                  )
                : "nearby";

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
                    <div className="text-white font-semibold text-lg mb-1">
                      {flightData.flight.flight}
                    </div>
                  )}
                  
                  {/* Direction indicator */}
                  <div className="text-white/60 text-xs mb-2 italic">
                    Look {relativeDirection}
                  </div>
                
                {/* Route information */}
                {flightData.info ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{flightData.info.origin?.airport || flightData.info.origin?.iata || 'Unknown'}</span>
                      </div>
                      <span>→</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{flightData.info.destination?.airport || flightData.info.destination?.iata || 'Unknown'}</span>
                      </div>
                    </div>
                    {flightData.info.route && (
                      <div className="text-white/60 text-xs">
                        {flightData.info.route}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-white/60 text-sm">
                    Aircraft: {flightData.flight.type || 'Unknown'}
                  </div>
                )}
                </motion.div>
              );
            })}
            
            {newFlightsWithInfo.length > 2 && (
              <motion.div
                className="text-white/60 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                +{newFlightsWithInfo.length - 2} more
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.p
            className="text-white/70 text-lg mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {newFlights.length === 1 
              ? 'Aircraft entered your area'
              : `${newFlights.length} aircraft entered your area`
            }
          </motion.p>
        )}

        {/* Flight count */}
        <motion.div
          className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 text-white/90"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
        >
          {flightCount} flight{flightCount !== 1 ? 's' : ''} in area
        </motion.div>
      </motion.div>

      {/* Pulsing ring animation */}
      <motion.div
        className="absolute inset-8 rounded-full border-2 border-white/20"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
    </motion.div>
  );
};

export default FlightAlert;