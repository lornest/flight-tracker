interface AirportData {
  alt_feet: number;
  alt_meters: number;
  countryiso2: string;
  iata: string;
  icao: string;
  lat: number;
  location: string;
  lon: number;
  name: string;
}

// Cache for airport data to avoid repeated API calls
const airportCache = new Map<string, AirportData | null>();

export async function getAirportData(icao: string): Promise<AirportData | null> {
  // Check cache first
  if (airportCache.has(icao)) {
    return airportCache.get(icao) || null;
  }

  try {
    const response = await fetch(`/api/airport/${icao.toUpperCase()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data: AirportData = await response.json();
    airportCache.set(icao, data);
    return data;
  } catch (error) {
    console.warn(`Failed to fetch airport data for ${icao}:`, error);
    airportCache.set(icao, null);
    return null;
  }
}

export function clearAirportCache() {
  airportCache.clear();
}