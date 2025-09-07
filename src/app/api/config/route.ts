import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function GET() {
  const config = {
    latitude: parseFloat(process.env.NEXT_PUBLIC_LATITUDE || '55.978371'),
    longitude: parseFloat(process.env.NEXT_PUBLIC_LONGITUDE || '-3.59423'),
    radius: parseInt(process.env.NEXT_PUBLIC_RADIUS_NM || '10'),
    facingDirection: process.env.NEXT_PUBLIC_FACING_DIRECTION || 'N'
  };

  return NextResponse.json(config);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitude, longitude, facingDirection, setupComplete } = body;

    // Update environment variables
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = `NEXT_PUBLIC_LATITUDE=${latitude}
NEXT_PUBLIC_LONGITUDE=${longitude}
NEXT_PUBLIC_FACING_DIRECTION=${facingDirection}
NEXT_PUBLIC_RADIUS_NM=10
`;

    await writeFile(envPath, envContent);

    if (setupComplete) {
      // Create setup complete flag file
      try {
        await execAsync('touch /home/pi/.flightclock-setup-complete');
        console.log('Setup complete flag created');
      } catch (error) {
        console.error('Failed to create setup complete flag:', error);
      }

      // Disable hotspot (this will be done by the restart API)
      console.log('Setup completed, system will restart to apply changes');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Configuration saved' 
    });

  } catch (error) {
    console.error('Config save error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}