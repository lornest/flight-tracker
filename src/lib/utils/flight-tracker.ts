import { Flight, FlightState, FlightInfo } from '@/types/flight';
import { getFlightInfo } from '@/lib/api/hexdb';

export class FlightTracker {
  private state: FlightState = {
    currentFlights: new Map(),
    newFlights: [],
    flightInfo: new Map(),
    lastUpdate: 0
  };

  async updateFlights(flights: Flight[]): Promise<string[]> {
    const now = Date.now();
    const previousFlightIds = new Set(this.state.currentFlights.keys());
    const newFlightIds: string[] = [];
    
    // Update current flights map
    this.state.currentFlights.clear();
    
    flights.forEach(flight => {
      if (flight.hex) {
        this.state.currentFlights.set(flight.hex, flight);
        
        // Check if this is a new flight
        if (!previousFlightIds.has(flight.hex)) {
          newFlightIds.push(flight.hex);
        }
      }
    });
    
    // Fetch flight information for new flights
    if (newFlightIds.length > 0) {
      console.log(`Fetching info for ${newFlightIds.length} new flights:`, newFlightIds);
      
      // Process new flights to get their information
      const flightInfoPromises = newFlightIds.map(async (hexCode) => {
        const flight = this.state.currentFlights.get(hexCode);
        if (flight?.flight) {
          try {
            const flightInfo = await getFlightInfo(flight.flight);
            if (flightInfo) {
              this.state.flightInfo.set(hexCode, flightInfo);
              console.log(`Flight info for ${flight.flight}:`, flightInfo);
            }
          } catch (error) {
            console.error(`Failed to fetch info for flight ${flight.flight}:`, error);
          }
        }
      });
      
      // Execute all flight info requests in parallel
      await Promise.allSettled(flightInfoPromises);
    }
    
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

  getAllFlightInfo(): Map<string, FlightInfo> {
    return new Map(this.state.flightInfo);
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