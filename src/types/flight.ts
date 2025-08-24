export interface Flight {
    hex: string;           // Aircraft hex code (unique identifier)
    type?: string;         // ADS-B message type
    flight?: string;       // Flight number/callsign
    r?: string;           // Registration
    t?: string;           // Aircraft type
    desc?: string;        // Aircraft description
    lat: number;          // Latitude
    lon: number;          // Longitude
    alt_baro?: number;    // Barometric altitude in feet
    alt_geom?: number;    // Geometric altitude in feet
    gs?: number;          // Ground speed in knots
    ias?: number;         // Indicated airspeed
    tas?: number;         // True airspeed
    mach?: number;        // Mach number
    wd?: number;          // Wind direction
    ws?: number;          // Wind speed
    track?: number;       // Track/heading in degrees
    track_rate?: number;  // Rate of track change
    roll?: number;        // Roll angle
    mag_heading?: number; // Magnetic heading
    true_heading?: number; // True heading
    baro_rate?: number;   // Barometric rate of climb/descent
    geom_rate?: number;   // Geometric rate of climb/descent
    squawk?: string;      // Transponder code
    emergency?: string;   // Emergency status
    category?: string;    // Aircraft category
    nav_qnh?: number;     // QNH setting
    nav_altitude_mcp?: number; // MCP/FCU selected altitude
    nav_altitude_fms?: number; // FMS selected altitude
    nav_heading?: number; // Selected heading
    nic?: number;         // Navigation Integrity Category
    rc?: number;          // Radius of Containment
    seen_pos?: number;    // Time since last position update
    version?: number;     // ADS-B version
    nic_baro?: number;    // NIC for barometric altitude
    nac_p?: number;       // Navigation Accuracy Category for Position
    nac_v?: number;       // Navigation Accuracy Category for Velocity
    sil?: number;         // Source Integrity Level
    sil_type?: string;    // SIL type
    gva?: number;         // Geometric Vertical Accuracy
    sda?: number;         // System Design Assurance
    alert?: number;       // Alert flag
    spi?: number;         // Special Position Identification
    mlat?: unknown[];     // Multilateration data
    tisb?: unknown[];     // TIS-B data
    messages?: number;    // Number of messages received
    seen?: number;        // Time since last message
    rssi?: number;        // Signal strength
    dst?: number;         // Distance from receiver
    dir?: number;         // Direction from receiver
  }
  
  export interface ADSBResponse {
    now: number;          // Current timestamp
    aircraft: Flight[];   // Array of aircraft
    resultCount: number;  // Number of aircraft in result
    ptime: number;        // Processing time
  }
  
  export interface FlightRoute {
    flight: string;       // Flight number
    route: string;        // Route in format "ORIGIN-DESTINATION"
    updatetime: number;   // Last update timestamp
  }
  
  export interface Airport {
    country_code: string; // Country code (e.g., "ES")
    region_name: string;  // Region name (e.g., "Andalucia")
    iata: string;         // IATA code (e.g., "AGP")
    icao: string;         // ICAO code (e.g., "LEMG")
    airport: string;      // Airport name (e.g., "Malaga Airport")
    latitude: number;     // Airport latitude
    longitude: number;    // Airport longitude
  }
  
  export interface FlightInfo {
    flight: string;       // Flight number
    origin?: Airport;     // Origin airport
    destination?: Airport; // Destination airport
    route?: string;       // Raw route string
  }
  
  export interface FlightState {
    currentFlights: Map<string, Flight>;
    newFlights: string[]; // Hex codes of newly detected flights
    flightInfo: Map<string, FlightInfo>; // Flight information by hex code
    lastUpdate: number;
  }

  // adsb.lol API types (fallback for HexDB)
  export interface AdsbLolAirport {
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

  export interface AdsbLolRouteResponse {
    _airport_codes_iata: string;
    _airports: AdsbLolAirport[];
    airline_code: string;
    airport_codes: string;
    callsign: string;
    number: string;
    plausible: number;
  }