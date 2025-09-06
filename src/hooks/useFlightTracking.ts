"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
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

interface UserConfig {
  latitude: number;
  longitude: number;
  facingDirection: string;
}

export function useFlightTracking(intervalMs: number = 10000, disabled: boolean = false, userConfig?: UserConfig) {
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
  
  // Use ref to always have latest config without causing effect recreation
  const configRef = useRef(userConfig);
  const isFetchingRef = useRef(false);
  
  // Update ref when userConfig changes
  useEffect(() => {
    configRef.current = userConfig;
  }, [userConfig]);

  const fetchFlights = useCallback(async () => {
    // Prevent overlapping requests
    if (isFetchingRef.current) {
      console.log('Fetch already in progress, skipping');
      return;
    }
    
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query params with user config if available
      const params = new URLSearchParams();
      const config = configRef.current;
      if (config?.latitude) params.set('lat', config.latitude.toString());
      if (config?.longitude) params.set('lon', config.longitude.toString());
      if (config?.facingDirection) params.set('facing', config.facingDirection);
      
      const url = `/api/flights${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
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
      isFetchingRef.current = false;
    }
  }, []); // No dependencies needed since we use configRef

  // Clear new flight notification
  const clearNewFlightAlert = useCallback(() => {
    setHasNewFlight(false);
  }, []);

  // Auto-fetch flights at specified interval (only when not disabled)
  useEffect(() => {
    if (disabled) {
      console.log('Flight tracking disabled, skipping fetch');
      return;
    }
    
    console.log('Flight tracking enabled, starting fetch with interval:', intervalMs);
    
    // Initial fetch with a small delay to avoid rapid-fire requests
    const initialTimeout = setTimeout(() => {
      fetchFlights();
    }, 500);
    
    const interval = setInterval(fetchFlights, intervalMs);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [intervalMs, disabled]); // Removed fetchFlights from deps to prevent recreation loops

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