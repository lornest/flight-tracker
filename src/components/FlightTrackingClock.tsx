"use client";

import React, { useEffect, useCallback, useState } from 'react';
import Clock from './Clock';
import FlightAlert from './FlightAlert';
import { Flight, FlightInfo } from '@/types/flight';

interface FlightTrackingClockProps {
  sharedFlightData: {
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
  isAlertActive: boolean;
  setIsAlertActive: React.Dispatch<React.SetStateAction<boolean>>;
}

const FlightTrackingClock = ({ sharedFlightData, setIsAlertActive }: FlightTrackingClockProps) => {
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

  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (hasNewFlight) {
      setIsAlertActive(true);
      setShowAlert(true);

      const timer = setTimeout(() => {
        clearNewFlightAlert();
        setIsAlertActive(false);
        setShowAlert(false);
      }, 30000);

      return () => clearTimeout(timer);
    } else {
      setIsAlertActive(false);
      setShowAlert(false);
    }
  }, [hasNewFlight, clearNewFlightAlert, setIsAlertActive]);

  const handleDismiss = useCallback(() => {
    clearNewFlightAlert();
    setIsAlertActive(false);
    setShowAlert(false);
  }, [clearNewFlightAlert, setIsAlertActive]);

  return (
    <div className="relative">
      {showAlert && hasNewFlight ? (
        <FlightAlert
          isVisible={hasNewFlight}
          flightCount={totalFlights}
          newFlights={newFlights}
          newFlightsWithInfo={newFlightsWithInfo}
          allFlights={flights}
          userLocation={userLocation}
          onDismiss={handleDismiss}
        />
      ) : (
        <Clock />
      )}

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
