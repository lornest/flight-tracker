"use client";

import { useState, useEffect, useCallback } from 'react';
import { Flight, FlightInfo } from '@/types/flight';

interface FlightData {
  flights: Flight[];
  newFlights: string[];
  newFlightsWithInfo?: Array<{ hexCode: string; flight: Flight; info?: FlightInfo }>;
  total: number;
  timestamp: number;
  lastUpdate: number;
  userLocation?: {
    latitude: number;
    longitude: number;
    facingDirection: string;
  };
  error?: string;
}

export function useFlightTracking(intervalMs: number = 10000) {
  const [flightData, setFlightData] = useState<FlightData>({
    flights: [],
    newFlights: [],
    total: 0,
    timestamp: 0,
    lastUpdate: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNewFlight, setHasNewFlight] = useState(false);

  const fetchFlights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/flights');
      const data: FlightData = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setFlightData(data);
        
        // Check for new flights
        if (data.newFlights && data.newFlights.length > 0) {
          setHasNewFlight(true);
          console.log('New flights detected:', data.newFlights);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flights');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear new flight notification
  const clearNewFlightAlert = useCallback(() => {
    setHasNewFlight(false);
  }, []);

  // Auto-fetch flights at specified interval
  useEffect(() => {
    fetchFlights(); // Initial fetch
    
    const interval = setInterval(fetchFlights, intervalMs);
    return () => clearInterval(interval);
  }, [fetchFlights, intervalMs]);

  return {
    flights: flightData.flights,
    newFlights: flightData.newFlights,
    newFlightsWithInfo: flightData.newFlightsWithInfo || [],
    totalFlights: flightData.total,
    lastUpdate: flightData.lastUpdate,
    userLocation: flightData.userLocation,
    isLoading,
    error,
    hasNewFlight,
    clearNewFlightAlert,
    refetch: fetchFlights
  };
}