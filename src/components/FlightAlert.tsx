"use client";

import React, { useState, useEffect } from 'react';
import { Flight, FlightInfo } from '@/types/flight';
import { calculatePlaneRotation, calculateDistance } from '@/lib/utils/bearing';
import { getAirportData } from '@/lib/utils/airport';

const MAX_RADIUS_NM = parseInt(process.env.NEXT_PUBLIC_RADIUS_NM || '10');

// Route display component with airport data fetching
const RouteDisplay = ({ flightInfo }: { flightInfo: FlightInfo }) => {
  const [originData, setOriginData] = useState<{ location: string; name: string } | null>(null);
  const [destData, setDestData] = useState<{ location: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAirportData = async () => {
      setLoading(true);

      const originIcao = flightInfo.origin?.icao;
      if (originIcao) {
        const originAirport = await getAirportData(originIcao);
        setOriginData(originAirport ? { location: originAirport.location, name: originAirport.name } : null);
      }

      const destIcao = flightInfo.destination?.icao;
      if (destIcao) {
        const destAirport = await getAirportData(destIcao);
        setDestData(destAirport ? { location: destAirport.location, name: destAirport.name } : null);
      }

      setLoading(false);
    };

    fetchAirportData();
  }, [flightInfo]);

  if (loading) {
    return (
      <div className="text-white/50 text-lg text-center animate-pulse">
        Loading route...
      </div>
    );
  }

  if (!originData || !destData) {
    return (
      <div className="text-white/50 text-lg text-center">
        Route information unavailable
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 text-white/90 text-3xl font-medium">
        <div className="text-center">
          <div className="mb-1">{originData.location}</div>
          <div className="text-white/60 text-xl font-normal leading-tight break-words">
            {originData.name}
          </div>
        </div>

        <div className="flex items-center justify-center pt-1">
          <span className="text-white/70 text-2xl">&rarr;</span>
        </div>

        <div className="text-center">
          <div className="mb-1">{destData.location}</div>
          <div className="text-white/60 text-xl font-normal leading-tight break-words">
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
  const [preservedFlightInfo, setPreservedFlightInfo] = useState<Array<{ hexCode: string; flight: Flight; info?: FlightInfo }>>([]);

  useEffect(() => {
    if (newFlightsWithInfo && newFlightsWithInfo.length > 0) {
      setPreservedFlightInfo(prevInfo => {
        const existingHexCodes = prevInfo.map(f => f.hexCode);
        const newInfo = newFlightsWithInfo.filter(f => !existingHexCodes.includes(f.hexCode));
        return [...prevInfo, ...newInfo];
      });
    }
  }, [newFlightsWithInfo]);

  useEffect(() => {
    if (!isVisible) {
      setPreservedFlightInfo([]);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="w-round h-round rounded-round bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex flex-col items-center justify-center overflow-hidden relative shadow-2xl alert-container alert-enter"
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 alert-bg-spin">
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
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <svg className="w-6 h-6 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Main content */}
      <div className="text-center z-10 alert-content-fade">
        {/* Real-time beacons for all current flights */}
        {userLocation && allFlights && allFlights.slice(0, 8).map((flight) => {
          if (!flight.lat || !flight.lon) return null;

          const distanceNM = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            flight.lat,
            flight.lon
          );

          const maxRadiusNM = MAX_RADIUS_NM;

          const rotation = calculatePlaneRotation(
            userLocation.latitude,
            userLocation.longitude,
            flight.lat,
            flight.lon,
            userLocation.facingDirection
          );

          const maxScreenRadius = 240 * 0.85;
          const distanceRatio = Math.min(distanceNM / maxRadiusNM, 1);
          const screenRadius = distanceRatio * maxScreenRadius;

          const angleRad = (rotation - 90) * (Math.PI / 180);
          const x = Math.cos(angleRad) * screenRadius;
          const y = Math.sin(angleRad) * screenRadius;

          const isNewFlight = newFlights.includes(flight.hex);

          return (
            <div
              key={flight.hex}
              className={`absolute z-20 ${isNewFlight ? 'alert-beacon-new' : ''}`}
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
                transition: 'left 0.4s ease-out, top 0.4s ease-out'
              }}
            >
              {/* Triangle beacon pointing inward */}
              <div
                className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[14px] border-l-transparent border-r-transparent border-b-yellow-300"
                style={{
                  transform: `rotate(${rotation + 180}deg)`,
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
            </div>
          );
        })}

        {/* Flight details */}
        {preservedFlightInfo && preservedFlightInfo.length > 0 && (
          <div className="space-y-3 mb-4 alert-details-fade">
            {preservedFlightInfo.slice(0, 2).map((flightData) => {
              return (
                <div
                  key={flightData.hexCode}
                  className="bg-white/10 rounded-lg p-3 text-center"
                >
                  {flightData.flight.flight && (
                    <div className="text-white font-semibold text-4xl mb-3">
                      {flightData.flight.flight}
                    </div>
                  )}

                  {flightData.info ? (
                    <RouteDisplay flightInfo={flightData.info} />
                  ) : (
                    <div className="text-white/60 text-base">
                      Aircraft: {flightData.flight.type || 'Unknown'}
                    </div>
                  )}
                </div>
              );
            })}

            {preservedFlightInfo.length > 2 && (
              <div className="text-white/60 text-base">
                +{preservedFlightInfo.length - 2} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pulsing ring animation */}
      <div className="absolute inset-8 rounded-full border-2 border-white/20 alert-pulse-ring" />
    </div>
  );
};

export default FlightAlert;
