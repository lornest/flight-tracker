import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Check if we're running on a Raspberry Pi/Linux system
    const isLinux = process.platform === 'linux';
    
    if (!isLinux) {
      // Development fallback
      return NextResponse.json({
        wifiConnected: true,
        networkName: 'Development Mode',
        ipAddress: '192.168.1.100'
      });
    }

    // Get Wi-Fi connection status using iwgetid
    let wifiConnected = false;
    let networkName = '';
    let ipAddress = '';

    try {
      // Check if connected to Wi-Fi
      const { stdout: ssidOutput } = await execAsync('iwgetid -r', { timeout: 5000 });
      networkName = ssidOutput.trim();
      wifiConnected = networkName.length > 0;
    } catch {
      // iwgetid failed, try alternative method
      try {
        const { stdout: iwconfigOutput } = await execAsync('iwconfig 2>/dev/null | grep ESSID', { timeout: 5000 });
        const essidMatch = iwconfigOutput.match(/ESSID:"([^"]+)"/);
        if (essidMatch && essidMatch[1] !== 'off/any') {
          networkName = essidMatch[1];
          wifiConnected = true;
        }
      } catch {
        console.log('Both iwgetid and iwconfig failed, checking nmcli');
        
        // Try NetworkManager
        try {
          const { stdout: nmcliOutput } = await execAsync('nmcli -t -f active,ssid dev wifi | grep "^yes"', { timeout: 5000 });
          if (nmcliOutput.trim()) {
            networkName = nmcliOutput.split(':')[1] || 'Connected';
            wifiConnected = true;
          }
        } catch {
          console.log('All Wi-Fi detection methods failed');
        }
      }
    }

    // Get IP address if connected
    if (wifiConnected) {
      try {
        const { stdout: ipOutput } = await execAsync("hostname -I | awk '{print $1}'", { timeout: 3000 });
        ipAddress = ipOutput.trim();
      } catch (ipError) {
        console.log('Failed to get IP address:', ipError);
      }
    }

    return NextResponse.json({
      wifiConnected,
      networkName: networkName || (wifiConnected ? 'Connected' : ''),
      ipAddress: ipAddress || '',
      system: 'linux'
    });

  } catch (error) {
    console.error('System status check failed:', error);
    
    // Fallback response
    return NextResponse.json({
      wifiConnected: false,
      networkName: '',
      ipAddress: '',
      error: 'System check failed'
    }, { status: 500 });
  }
}