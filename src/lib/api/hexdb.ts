import { FlightRoute, Airport, FlightInfo, AdsbLolRouteResponse, AdsbLolAirport } from '@/types/flight';

const HEXDB_BASE_URL = 'https://hexdb.io/api/v1';
const ADSB_LOL_API_URL = 'https://api.adsb.lol/api/0/routeset';

/**
 * Fetch flight route information from HexDB
 */
export async function fetchFlightRoute(flightNumber: string): Promise<FlightRoute | null> {
  try {
    const response = await fetch(`${HEXDB_BASE_URL}/route/icao/${flightNumber.trim()}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch route for flight ${flightNumber}: ${response.status}`);
      return null;
    }
    
    const data: FlightRoute = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching route for flight ${flightNumber}:`, error);
    return null;
  }
}

/**
 * Fetch airport information from HexDB
 */
export async function fetchAirportInfo(icaoCode: string): Promise<Airport | null> {
  try {
    const response = await fetch(`${HEXDB_BASE_URL}/airport/icao/${icaoCode.trim()}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch airport info for ${icaoCode}: ${response.status}`);
      return null;
    }
    
    const data: Airport = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching airport info for ${icaoCode}:`, error);
    return null;
  }
}

/**
 * Fetch flight route information from adsb.lol as fallback
 */
async function fetchRouteFromAdsbLol(callsign: string): Promise<FlightInfo | null> {
  try {
    const response = await fetch(ADSB_LOL_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        planes: [{
          callsign: callsign.trim(),
          lat: 0,
          lng: 0
        }]
      })
    });

    if (!response.ok) {
      console.warn(`Failed to fetch route from adsb.lol for ${callsign}: ${response.status}`);
      return null;
    }

    const data: AdsbLolRouteResponse[] = await response.json();
    
    if (!data || data.length === 0) {
      console.warn(`No route data from adsb.lol for ${callsign}`);
      return null;
    }

    const routeData = data[0];
    const airports = routeData._airports;
    
    if (!airports || airports.length < 2) {
      console.warn(`Insufficient airport data from adsb.lol for ${callsign}`);
      return null;
    }

    // Convert adsb.lol airport format to our Airport interface
    const convertAirport = (adsbAirport: AdsbLolAirport): Airport => ({
      country_code: adsbAirport.countryiso2,
      region_name: adsbAirport.location,
      iata: adsbAirport.iata,
      icao: adsbAirport.icao,
      airport: adsbAirport.name,
      latitude: adsbAirport.lat,
      longitude: adsbAirport.lon
    });

    return {
      flight: callsign.trim(),
      origin: convertAirport(airports[0]),
      destination: convertAirport(airports[1]),
      route: routeData.airport_codes
    };

  } catch (error) {
    console.error(`Error fetching route from adsb.lol for ${callsign}:`, error);
    return null;
  }
}

/**
 * Get complete flight information including route and airport details
 */
export async function getFlightInfo(flightNumber: string): Promise<FlightInfo | null> {
  try {
    // Clean up flight number (remove trailing spaces)
    const cleanFlightNumber = flightNumber.trim();
    
    if (!cleanFlightNumber) {
      return null;
    }
    
    console.log(`Fetching flight info for: ${cleanFlightNumber}`);
    
    // Fetch route information from HexDB first
    const routeInfo = await fetchFlightRoute(cleanFlightNumber);
    
    if (!routeInfo || !routeInfo.route) {
      console.warn(`No route found from HexDB for flight ${cleanFlightNumber}, trying adsb.lol fallback`);
      
      // Try adsb.lol as fallback
      const fallbackInfo = await fetchRouteFromAdsbLol(cleanFlightNumber);
      if (fallbackInfo) {
        console.log(`Successfully fetched route from adsb.lol for ${cleanFlightNumber}`);
        return fallbackInfo;
      }
      
      console.warn(`No route found from either HexDB or adsb.lol for flight ${cleanFlightNumber}`);
      return {
        flight: cleanFlightNumber,
        route: undefined
      };
    }
    
    // Parse origin and destination from route (format: "ORIGIN-DESTINATION")
    const [originIcao, destinationIcao] = routeInfo.route.split('-');
    
    if (!originIcao || !destinationIcao) {
      console.warn(`Invalid route format for flight ${cleanFlightNumber}: ${routeInfo.route}`);
      return {
        flight: cleanFlightNumber,
        route: routeInfo.route
      };
    }
    
    // Fetch airport information for both origin and destination
    const [originAirport, destinationAirport] = await Promise.all([
      fetchAirportInfo(originIcao),
      fetchAirportInfo(destinationIcao)
    ]);
    
    return {
      flight: cleanFlightNumber,
      origin: originAirport || undefined,
      destination: destinationAirport || undefined,
      route: routeInfo.route
    };
    
  } catch (error) {
    console.error(`Error getting flight info for ${flightNumber}:`, error);
    return null;
  }
}