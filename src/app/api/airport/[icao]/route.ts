import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ icao: string }> }
) {
  const { icao } = await params;

  if (!icao) {
    return NextResponse.json(
      { error: 'ICAO code is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`https://api.adsb.lol/api/0/airport/${icao.toUpperCase()}`, {
      headers: {
        'User-Agent': 'flight-tracker-app'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: AirportData = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Failed to fetch airport data for ${icao}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch airport data' },
      { status: 500 }
    );
  }
}