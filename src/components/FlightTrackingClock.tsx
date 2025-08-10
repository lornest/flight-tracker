"use client";

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import Clock from './Clock';
import FlightAlert from './FlightAlert';
import { Flight, FlightInfo } from '@/types/flight';

interface FlightTrackingClockProps {
  sharedFlightData: {
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
  isAlertActive: boolean;
  setIsAlertActive: React.Dispatch<React.SetStateAction<boolean>>;
}

const FlightTrackingClock = ({ sharedFlightData, isAlertActive, setIsAlertActive }: FlightTrackingClockProps) => {
  const {
    flights,
    newFlights,
    newFlightsWithInfo,
    totalFlights,
    lastUpdate,
    userLocation,
    isLoading,
    error,
    hasNewFlight,
    clearNewFlightAlert,
    refetch
  } = sharedFlightData;

  // Manage alert state and polling frequency
  React.useEffect(() => {
    if (hasNewFlight) {
      setIsAlertActive(true);
      
      // Auto-dismiss alert after 30 seconds
      const timer = setTimeout(() => {
        clearNewFlightAlert();
        setIsAlertActive(false);
      }, 30000);
      
      return () => clearTimeout(timer);
    } else {
      setIsAlertActive(false);
    }
  }, [hasNewFlight, clearNewFlightAlert]);
  
  // Manual dismiss handler
  const handleDismiss = React.useCallback(() => {
    clearNewFlightAlert();
    setIsAlertActive(false);
  }, [clearNewFlightAlert]);

  // Log flight updates for debugging
  React.useEffect(() => {
    if (flights.length > 0) {
      console.log(`${flights.length} flights in area:`, flights.map(f => ({
        hex: f.hex,
        flight: f.flight || 'Unknown',
        alt: f.alt_baro || 'N/A'
      })));
    }
  }, [flights]);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {hasNewFlight ? (
          <FlightAlert
            key="alert"
            isVisible={hasNewFlight}
            flightCount={totalFlights}
            newFlights={newFlights}
            newFlightsWithInfo={newFlightsWithInfo}
            allFlights={flights}
            userLocation={userLocation}
            onDismiss={handleDismiss}
          />
        ) : (
          <Clock key="clock" />
        )}
      </AnimatePresence>
      
      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs p-2 rounded backdrop-blur-sm">
          <div>Flights: {totalFlights}</div>
          <div>New: {newFlights.join(', ') || 'None'}</div>
          <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
          <div>Error: {error || 'None'}</div>
          <div>Last: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}</div>
          <button 
            onClick={refetch}
            className="mt-1 px-2 py-1 bg-blue-600 rounded text-xs"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default FlightTrackingClock;