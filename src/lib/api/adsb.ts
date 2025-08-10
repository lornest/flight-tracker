import { Flight, ADSBResponse } from '@/types/flight';

export async function fetchFlightsInRadius(
  latitude: number = 55.979636, 
  longitude: number = -3.577456, 
  radiusNM: number = 7
): Promise<ADSBResponse> {
  const openDataUrl = `https://opendata.adsb.fi/api/v2/lat/${latitude}/lon/${longitude}/dist/${radiusNM}`;
  
  try {
    const response = await fetch(openDataUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ADSB API error: ${response.status} ${response.statusText}`);
    }

    const data: ADSBResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ADSB data:', error);
    throw error;
  }
}

export function filterValidFlights(flights: Flight[]): Flight[] {
  return flights.filter(flight => 
    flight.hex && 
    flight.lat && 
    flight.lon &&
    Math.abs(flight.lat) <= 90 && 
    Math.abs(flight.lon) <= 180
  );
}