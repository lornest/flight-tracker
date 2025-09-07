import { NextResponse } from 'next/server';

// Mock WiFi networks for testing
const mockNetworks = [
  { ssid: 'HomeWiFi', security: 'WPA2', signal: 85, frequency: '2.4GHz', connected: false },
  { ssid: 'NeighborNet', security: 'WPA2', signal: 65, frequency: '5GHz', connected: false },
  { ssid: 'CoffeeShop_Guest', security: 'Open', signal: 45, frequency: '2.4GHz', connected: false },
  { ssid: 'MyRouter_5G', security: 'WPA3', signal: 75, frequency: '5GHz', connected: false },
  { ssid: 'TestNetwork', security: 'WPA2', signal: 55, frequency: '2.4GHz', connected: false }
];

export async function GET() {
  // Simulate network scan delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return NextResponse.json({
    success: true,
    networks: mockNetworks
  });
}