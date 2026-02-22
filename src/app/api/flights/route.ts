import { NextRequest, NextResponse } from 'next/server';
import { fetchFlightsInRadius, filterValidFlights } from '@/lib/api/adsb';
import { flightTracker } from '@/lib/utils/flight-tracker';
import { Flight } from '@/types/flight';

const DEFAULT_LAT = parseFloat(process.env.NEXT_PUBLIC_LATITUDE || '55.978371');
const DEFAULT_LON = parseFloat(process.env.NEXT_PUBLIC_LONGITUDE || '-3.59423');
const DEFAULT_RADIUS = parseInt(process.env.NEXT_PUBLIC_RADIUS_NM || '10');
const USER_FACING_DIRECTION = process.env.NEXT_PUBLIC_FACING_DIRECTION || 'N';

// Strip fields the client never uses to reduce JSON size and GC pressure
function slimFlight(f: Flight) {
  return {
    hex: f.hex,
    flight: f.flight,
    lat: f.lat,
    lon: f.lon,
    alt_baro: f.alt_baro,
    gs: f.gs,
    track: f.track,
    baro_rate: f.baro_rate,
    type: f.t || f.type
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || DEFAULT_LAT.toString());
    const lon = parseFloat(searchParams.get('lon') || DEFAULT_LON.toString());
    const radius = parseFloat(searchParams.get('radius') || DEFAULT_RADIUS.toString());
    const facing = searchParams.get('facing') || USER_FACING_DIRECTION;

    const adsbData = await fetchFlightsInRadius(lat, lon, radius);

    const userLocation = { latitude: lat, longitude: lon, facingDirection: facing };

    if (!adsbData.aircraft || adsbData.aircraft.length === 0) {
      return NextResponse.json({
        flights: [],
        newFlights: [],
        newFlightsWithInfo: [],
        allFlightInfo: flightTracker.getAllFlightInfo(),
        total: 0,
        timestamp: Date.now(),
        lastUpdate: flightTracker.getLastUpdate(),
        userLocation
      });
    }

    const validFlights = filterValidFlights(adsbData.aircraft);

    const newFlightIds = await flightTracker.updateFlights(validFlights);

    const newFlightsWithInfo = flightTracker.getNewFlightsWithInfo();

    return NextResponse.json({
      flights: validFlights.map(slimFlight),
      newFlights: newFlightIds,
      newFlightsWithInfo,
      allFlightInfo: flightTracker.getAllFlightInfo(),
      total: validFlights.length,
      timestamp: Date.now(),
      lastUpdate: flightTracker.getLastUpdate(),
      userLocation
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
