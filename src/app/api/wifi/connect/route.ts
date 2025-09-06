import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { ssid, password } = await request.json();
    
    if (!ssid) {
      return NextResponse.json({ error: 'SSID is required' }, { status: 400 });
    }

    const isLinux = process.platform === 'linux';
    
    if (!isLinux) {
      // Development simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({ 
        success: true, 
        message: 'Connected to network (development mode)',
        ssid 
      });
    }

    try {
      // Use NetworkManager to connect
      let nmcliCommand = '';
      
      if (password) {
        // WPA/WPA2 network
        nmcliCommand = `nmcli dev wifi connect "${ssid}" password "${password}"`;
      } else {
        // Open network
        nmcliCommand = `nmcli dev wifi connect "${ssid}"`;
      }
      
      console.log('Attempting to connect to Wi-Fi...');
      const { stdout, stderr } = await execAsync(nmcliCommand, { timeout: 30000 });
      
      if (stderr && stderr.includes('Error')) {
        throw new Error(stderr);
      }
      
      // Verify connection
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        const { stdout: statusOutput } = await execAsync('nmcli -t -f active,ssid dev wifi | grep "^yes"');
        const connectedSSID = statusOutput.split(':')[1];
        
        if (connectedSSID === ssid) {
          // Get IP address
          const { stdout: ipOutput } = await execAsync("hostname -I | awk '{print $1}'");
          const ipAddress = ipOutput.trim();
          
          return NextResponse.json({ 
            success: true, 
            message: `Successfully connected to ${ssid}`,
            ssid,
            ipAddress
          });
        } else {
          throw new Error('Connection verification failed');
        }
        
      } catch (verifyError) {
        console.error('Connection verification failed:', verifyError);
        return NextResponse.json({ 
          error: 'Connected but verification failed',
          details: verifyError instanceof Error ? verifyError.message : 'Unknown error'
        }, { status: 500 });
      }
      
    } catch (connectError) {
      console.error('Wi-Fi connection failed:', connectError);
      
      let errorMessage = 'Connection failed';
      if (connectError instanceof Error) {
        if (connectError.message.includes('password')) {
          errorMessage = 'Incorrect password';
        } else if (connectError.message.includes('not found')) {
          errorMessage = 'Network not found';
        } else if (connectError.message.includes('timeout')) {
          errorMessage = 'Connection timeout';
        } else {
          errorMessage = connectError.message;
        }
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: connectError instanceof Error ? connectError.message : 'Unknown error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Wi-Fi connection request failed:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}