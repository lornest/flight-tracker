import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // First, disable the hotspot
    try {
      await execAsync('sudo systemctl stop hostapd');
      await execAsync('sudo systemctl stop dnsmasq');
    } catch (error) {
      console.log('Failed to stop hotspot services:', error);
    }

    // Schedule a system restart in 3 seconds to allow the response to be sent
    setTimeout(() => {
      exec('sudo reboot', (error) => {
        if (error) {
          console.error('Failed to restart system:', error);
        }
      });
    }, 3000);

    return NextResponse.json({ 
      success: true, 
      message: 'System restart scheduled' 
    });
    
  } catch (error) {
    console.error('Restart API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to restart system',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}