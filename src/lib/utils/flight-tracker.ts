import { Flight, FlightState, FlightInfo } from '@/types/flight';
import { getFlightInfo } from '@/lib/api/hexdb';

// Maximum number of flight info entries to keep cached
const MAX_FLIGHT_INFO_ENTRIES = 50;

export class FlightTracker {
  private state: FlightState = {
    currentFlights: new Map(),
    newFlights: [],
    flightInfo: new Map(),
    lastUpdate: 0
  };

  // Evict oldest entries when flightInfo exceeds the cap
  private evictOldFlightInfo(): void {
    if (this.state.flightInfo.size <= MAX_FLIGHT_INFO_ENTRIES) return;

    const currentHexCodes = new Set(this.state.currentFlights.keys());
    // First pass: remove entries for flights no longer in range
    for (const hex of this.state.flightInfo.keys()) {
      if (!currentHexCodes.has(hex)) {
        this.state.flightInfo.delete(hex);
      }
    }

    // Second pass: if still over limit, remove oldest entries (first inserted)
    if (this.state.flightInfo.size > MAX_FLIGHT_INFO_ENTRIES) {
      const excess = this.state.flightInfo.size - MAX_FLIGHT_INFO_ENTRIES;
      let removed = 0;
      for (const hex of this.state.flightInfo.keys()) {
        if (removed >= excess) break;
        this.state.flightInfo.delete(hex);
        removed++;
      }
    }
  }

  async updateFlights(flights: Flight[]): Promise<string[]> {
    const now = Date.now();
    const previousFlightIds = new Set(this.state.currentFlights.keys());
    const newFlightIds: string[] = [];

    this.state.currentFlights.clear();

    for (const flight of flights) {
      if (flight.hex) {
        this.state.currentFlights.set(flight.hex, flight);

        if (!previousFlightIds.has(flight.hex)) {
          newFlightIds.push(flight.hex);
        }
      }
    }

    if (newFlightIds.length > 0) {
      // Batch concurrent flight-info fetches (max 3 at a time) to cap peak memory
      const BATCH_SIZE = 3;
      for (let i = 0; i < newFlightIds.length; i += BATCH_SIZE) {
        const batch = newFlightIds.slice(i, i + BATCH_SIZE).map(async (hexCode) => {
          const flight = this.state.currentFlights.get(hexCode);
          if (flight?.flight) {
            try {
              const flightInfo = await getFlightInfo(flight.flight);
              if (flightInfo) {
                this.state.flightInfo.set(hexCode, flightInfo);
              }
            } catch {
              // Flight info lookup failed, non-critical
            }
          }
        });

        await Promise.allSettled(batch);
      }
    }

    this.evictOldFlightInfo();

    this.state.newFlights = newFlightIds;
    this.state.lastUpdate = now;

    return newFlightIds;
  }

  getCurrentFlights(): Flight[] {
    return Array.from(this.state.currentFlights.values());
  }

  getNewFlights(): string[] {
    return this.state.newFlights;
  }

  clearNewFlights(): void {
    this.state.newFlights = [];
  }

  getFlightCount(): number {
    return this.state.currentFlights.size;
  }

  getLastUpdate(): number {
    return this.state.lastUpdate;
  }

  getFlightInfo(hexCode: string): FlightInfo | undefined {
    return this.state.flightInfo.get(hexCode);
  }

  getAllFlightInfo(): Record<string, FlightInfo> {
    return Object.fromEntries(this.state.flightInfo);
  }

  getNewFlightsWithInfo(): Array<{ hexCode: string; flight: Flight; info?: FlightInfo }> {
    return this.state.newFlights.map(hexCode => ({
      hexCode,
      flight: this.state.currentFlights.get(hexCode)!,
      info: this.state.flightInfo.get(hexCode)
    }));
  }
}

// Create global instance
export const flightTracker = new FlightTracker();
