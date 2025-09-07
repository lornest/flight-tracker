import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { ssid, password } = body;
  
  // Simulate connection delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock success for testing
  if (ssid && (password || ssid === 'CoffeeShop_Guest')) {
    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${ssid}`
    });
  }
  
  return NextResponse.json(
    { 
      success: false,
      error: 'Invalid credentials or network not found' 
    },
    { status: 400 }
  );
}