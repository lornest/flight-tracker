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

// Bounded cache for airport data
const MAX_AIRPORT_CACHE = 100;
const airportCache = new Map<string, AirportData | null>();

function evictIfNeeded() {
  if (airportCache.size <= MAX_AIRPORT_CACHE) return;
  // Remove oldest entries (first inserted in Map iteration order)
  const excess = airportCache.size - MAX_AIRPORT_CACHE;
  let removed = 0;
  for (const key of airportCache.keys()) {
    if (removed >= excess) break;
    airportCache.delete(key);
    removed++;
  }
}

export async function getAirportData(icao: string): Promise<AirportData | null> {
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
    evictIfNeeded();
    return data;
  } catch {
    airportCache.set(icao, null);
    evictIfNeeded();
    return null;
  }
}

export function clearAirportCache() {
  airportCache.clear();
}
