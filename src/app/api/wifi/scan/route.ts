import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface WifiNetwork {
  ssid: string;
  signal: number;
  security: string;
  frequency: string;
  connected: boolean;
}

export async function GET() {
  try {
    const isLinux = process.platform === 'linux';
    
    if (!isLinux) {
      // Development fallback
      return NextResponse.json({
        networks: [
          { ssid: 'Home_WiFi', signal: 85, security: 'WPA2', frequency: '2.4GHz', connected: false },
          { ssid: 'Neighbor_Network', signal: 45, security: 'WPA2', frequency: '5GHz', connected: false },
          { ssid: 'Public_WiFi', signal: 30, security: 'Open', frequency: '2.4GHz', connected: false }
        ]
      });
    }

    let networks: WifiNetwork[] = [];
    
    try {
      // Try nmcli first (NetworkManager)
      const { stdout } = await execAsync('nmcli -f SSID,SIGNAL,SECURITY,FREQ,ACTIVE dev wifi list', { timeout: 10000 });
      
      const lines = stdout.trim().split('\n').slice(1); // Skip header
      networks = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        const ssid = parts[0] || '';
        const signal = parseInt(parts[1]) || 0;
        const security = parts[2] || 'Open';
        const frequency = parts[3] || '';
        const connected = parts[4] === 'yes';
        
        return {
          ssid,
          signal,
          security,
          frequency,
          connected
        };
      }).filter(network => network.ssid && network.ssid !== '--');
      
    } catch {
      console.log('nmcli failed, trying iwlist scan...');
      
      try {
        // Fallback to iwlist scan
        await execAsync('sudo iwlist scan > /tmp/wifi_scan.txt', { timeout: 15000 });
        const { stdout: scanOutput } = await execAsync('cat /tmp/wifi_scan.txt');
        
        // Parse iwlist output (simplified)
        const cells = scanOutput.split('Cell ').slice(1);
        networks = cells.map(cell => {
          const ssidMatch = cell.match(/ESSID:"([^"]+)"/);
          const signalMatch = cell.match(/Signal level=(-?\d+)/);
          const encryptionMatch = cell.match(/Encryption key:(on|off)/);
          
          if (!ssidMatch) return null;
          
          return {
            ssid: ssidMatch[1],
            signal: signalMatch ? Math.max(0, 100 + parseInt(signalMatch[1])) : 0,
            security: encryptionMatch && encryptionMatch[1] === 'on' ? 'WPA' : 'Open',
            frequency: '2.4GHz',
            connected: false
          };
        }).filter(Boolean) as WifiNetwork[];
        
      } catch (iwlistError) {
        console.error('Both nmcli and iwlist failed:', iwlistError);
        return NextResponse.json({ error: 'Failed to scan Wi-Fi networks' }, { status: 500 });
      }
    }

    // Remove duplicates and sort by signal strength
    const uniqueNetworks = networks.filter((network, index, self) => 
      index === self.findIndex(n => n.ssid === network.ssid)
    ).sort((a, b) => b.signal - a.signal);

    return NextResponse.json({ networks: uniqueNetworks });

  } catch (error) {
    console.error('Wi-Fi scan failed:', error);
    return NextResponse.json({ error: 'Wi-Fi scan failed' }, { status: 500 });
  }
}