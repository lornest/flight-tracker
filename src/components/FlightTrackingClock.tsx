"use client";

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import Clock from './Clock';
import FlightAlert from './FlightAlert';
import { useFlightTracking } from '@/hooks/useFlightTracking';

const FlightTrackingClock = () => {
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
  } = useFlightTracking(10000); // Poll every 10 seconds

  // Auto-dismiss alert after 5 seconds
  React.useEffect(() => {
    if (hasNewFlight) {
      const timer = setTimeout(() => {
        clearNewFlightAlert();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [hasNewFlight, clearNewFlightAlert]);

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
            userLocation={userLocation}
            onDismiss={clearNewFlightAlert}
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