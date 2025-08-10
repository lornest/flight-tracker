import { NextRequest, NextResponse } from 'next/server';
import { fetchFlightsInRadius, filterValidFlights } from '@/lib/api/adsb';
import { flightTracker } from '@/lib/utils/flight-tracker';

const DEFAULT_LAT = parseFloat(process.env.NEXT_PUBLIC_LATITUDE || '55.978371');
const DEFAULT_LON = parseFloat(process.env.NEXT_PUBLIC_LONGITUDE || '-3.59423');
const DEFAULT_RADIUS = parseInt(process.env.NEXT_PUBLIC_RADIUS_NM || '10');
const USER_FACING_DIRECTION = process.env.NEXT_PUBLIC_FACING_DIRECTION || 'N';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || DEFAULT_LAT.toString());
    const lon = parseFloat(searchParams.get('lon') || DEFAULT_LON.toString());
    const radius = parseFloat(searchParams.get('radius') || DEFAULT_RADIUS.toString());

    // Fetch flights
    const adsbData = await fetchFlightsInRadius(lat, lon, radius);
    
    if (!adsbData.aircraft || adsbData.aircraft.length === 0) {
      return NextResponse.json({ 
        flights: [], 
        newFlights: [],
        total: 0,
        error: 'No aircraft data received'
      });
    }

    // Filter valid flights
    const validFlights = filterValidFlights(adsbData.aircraft);
    
    // Update flight tracker and detect new flights (now async)
    const newFlightIds = await flightTracker.updateFlights(validFlights);
    
    // Get new flights with their information
    const newFlightsWithInfo = flightTracker.getNewFlightsWithInfo();
    
    return NextResponse.json({
      flights: validFlights,
      newFlights: newFlightIds,
      newFlightsWithInfo: newFlightsWithInfo,
      total: validFlights.length,
      timestamp: Date.now(),
      lastUpdate: flightTracker.getLastUpdate(),
      userLocation: {
        latitude: lat,
        longitude: lon,
        facingDirection: USER_FACING_DIRECTION
      }
    });
    
  } catch (error) {
    console.error('Flights API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch flight data',
        details: error instanceof Error ? error.message : 'Unknown error',
        flights: [],
        newFlights: [],
        total: 0
      },
      { status: 500 }
    );
  }
}