"use client";

import React, { useState, useEffect } from 'react';
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

  const selectedFlight = selectedFlightHex ? flights.find(f => f.hex === selectedFlightHex) : null;

  useEffect(() => {
    if (selectedFlightHex && !selectedFlight) {
      setSelectedFlightHex(null);
    }
  }, [selectedFlightHex, selectedFlight]);

  const getFlightInfo = (flight: Flight) => {
    return allFlightInfo.get(flight.hex) || newFlightsWithInfo.find(info => info.hexCode === flight.hex)?.info;
  };

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
          const ringRadius = ratio * 240 * 0.85;

          return (
            <div
              key={ratio}
              className="absolute rounded-full border border-white/20"
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
          <div className="bg-blue-600/80 rounded-lg px-8 py-4 text-white text-xl font-bold border border-white/20">
            &uarr; {userConfig.facingDirection}
          </div>
        </div>

        {/* Flight beacons */}
        {userLocation && flights && flights.map((flight) => {
          if (!flight.lat || !flight.lon) return null;

          const currentLocation = {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            facingDirection: userConfig.facingDirection
          };

          const distanceNM = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            flight.lat,
            flight.lon
          );

          const maxRadiusNM = parseInt(process.env.NEXT_PUBLIC_RADIUS_NM || '10');

          if (distanceNM > maxRadiusNM) return null;

          const rotation = calculatePlaneRotation(
            currentLocation.latitude,
            currentLocation.longitude,
            flight.lat,
            flight.lon,
            currentLocation.facingDirection
          );

          const maxScreenRadius = 240 * 0.85;
          const distanceRatio = Math.min(distanceNM / maxRadiusNM, 1);
          const screenRadius = distanceRatio * maxScreenRadius;

          const angleRad = (rotation - 90) * (Math.PI / 180);
          const x = Math.cos(angleRad) * screenRadius;
          const y = Math.sin(angleRad) * screenRadius;

          return (
            <div
              key={flight.hex}
              className="absolute z-20 radar-beacon cursor-pointer hover:scale-110"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
                transition: 'left 0.4s ease-out, top 0.4s ease-out'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFlightHex(flight.hex);
              }}
            >
              {/* White triangle beacon */}
              <div
                className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[15px] border-l-transparent border-r-transparent border-b-white"
                style={{
                  transform: `rotate(${rotation + 180}deg)`,
                  filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))'
                }}
              />
              {/* Flight number and distance label */}
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
            </div>
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
            <div className="bg-white/10 rounded-full px-8 py-4 text-white/90 text-xl font-medium">
              Clear skies
            </div>
          </div>
        )}

        {/* Flight Info Modal */}
        {selectedFlight && (
          <div
            data-flight-modal="true"
            className="absolute inset-4 flex items-center justify-center z-50"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFlightHex(null);
            }}
          >
            <div
              className="bg-black/95 rounded-lg p-6 max-w-sm w-full border border-white/40 flex flex-col justify-center"
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
                  &times;
                </button>
              </div>

              {/* Flight Details */}
              <div className="space-y-2 text-xl">
                {(() => {
                  const flightInfo = getFlightInfo(selectedFlight);
                  if (flightInfo?.origin && flightInfo?.destination) {
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-white/70">From:</span>
                          <span className="text-white text-right font-mono">
                            {flightInfo.origin.airport || flightInfo.origin.iata}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">To:</span>
                          <span className="text-white text-right font-mono">
                            {flightInfo.destination.airport || flightInfo.destination.iata}
                          </span>
                        </div>
                      </>
                    );
                  }
                  return (
                    <div className="text-white/50 text-lg text-center">
                      Route information unavailable
                    </div>
                  );
                })()}

                {selectedFlight.alt_baro && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Altitude:</span>
                    <span className="text-white">{selectedFlight.alt_baro.toLocaleString()} ft</span>
                  </div>
                )}

                {selectedFlight.gs && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Speed:</span>
                    <span className="text-white">{selectedFlight.gs} kts</span>
                  </div>
                )}

                {selectedFlight.baro_rate && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Vertical Speed:</span>
                    <span className="text-white">
                      {selectedFlight.baro_rate > 0 ? '\u2197' : selectedFlight.baro_rate < 0 ? '\u2198' : '\u2192'} {Math.abs(selectedFlight.baro_rate)} ft/min
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default FlightRadar;
