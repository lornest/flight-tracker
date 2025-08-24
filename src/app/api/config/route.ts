import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    latitude: parseFloat(process.env.NEXT_PUBLIC_LATITUDE || '55.978371'),
    longitude: parseFloat(process.env.NEXT_PUBLIC_LONGITUDE || '-3.59423'),
    radius: parseInt(process.env.NEXT_PUBLIC_RADIUS_NM || '10'),
    facingDirection: process.env.NEXT_PUBLIC_FACING_DIRECTION || 'N'
  };

  return NextResponse.json(config);
}