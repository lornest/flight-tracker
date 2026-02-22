import { FlightRoute, Airport, FlightInfo, AdsbLolRouteResponse, AdsbLolAirport } from '@/types/flight';

const HEXDB_BASE_URL = 'https://hexdb.io/api/v1';
const ADSB_LOL_API_URL = 'https://api.adsb.lol/api/0/routeset';
const isDev = process.env.NODE_ENV === 'development';

export async function fetchFlightRoute(flightNumber: string): Promise<FlightRoute | null> {
  try {
    const response = await fetch(`${HEXDB_BASE_URL}/route/icao/${flightNumber.trim()}`);

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchAirportInfo(icaoCode: string): Promise<Airport | null> {
  try {
    const response = await fetch(`${HEXDB_BASE_URL}/airport/icao/${icaoCode.trim()}`);

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

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

    if (!response.ok) return null;

    const data: AdsbLolRouteResponse[] = await response.json();

    if (!data || data.length === 0) return null;

    const routeData = data[0];
    const airports = routeData._airports;

    if (!airports || airports.length < 2) return null;

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

  } catch {
    return null;
  }
}

export async function getFlightInfo(flightNumber: string): Promise<FlightInfo | null> {
  try {
    const cleanFlightNumber = flightNumber.trim();

    if (!cleanFlightNumber) return null;

    if (isDev) console.log(`Fetching flight info for: ${cleanFlightNumber}`);

    const routeInfo = await fetchFlightRoute(cleanFlightNumber);

    if (!routeInfo || !routeInfo.route) {
      const fallbackInfo = await fetchRouteFromAdsbLol(cleanFlightNumber);
      if (fallbackInfo) return fallbackInfo;

      return { flight: cleanFlightNumber, route: undefined };
    }

    const [originIcao, destinationIcao] = routeInfo.route.split('-');

    if (!originIcao || !destinationIcao) {
      return { flight: cleanFlightNumber, route: routeInfo.route };
    }

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

  } catch {
    return null;
  }
}
