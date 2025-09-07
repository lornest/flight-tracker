# FlightClock Hotspot Setup

This document explains how to configure the FlightClock to use hotspot-based setup for first-time configuration.

## Overview

Instead of configuring WiFi, location, and facing direction on the small 2.1" display, FlightClock now uses a hotspot approach:

1. On first boot, the device creates a WiFi hotspot called "FlightClock-Setup"
2. Users connect to this hotspot with their phone/computer
3. A QR code on the display directs them to a web-based setup interface
4. After setup, the device connects to the user's WiFi and operates normally

## Installation Steps

### 1. Make Scripts Executable

```bash
chmod +x scripts/*.sh
```

### 2. Run Initial Setup (One Time)

```bash
# Run this once to configure the Pi for hotspot capability
sudo ./scripts/setup-hotspot.sh
```

### 3. Create Systemd Service (Optional)

Create `/etc/systemd/system/flightclock-setup.service`:

```ini
[Unit]
Description=FlightClock Setup Check
After=network.target
Wants=network.target

[Service]
Type=oneshot
ExecStart=/home/pi/flight-tracker/scripts/check-setup.sh
WorkingDirectory=/home/pi/flight-tracker/scripts
User=root
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

Enable the service:
```bash
sudo systemctl enable flightclock-setup.service
```

## How It Works

### First Boot / Factory Reset
1. The device boots and checks for `/home/pi/.flightclock-setup-complete`
2. If the file doesn't exist, hotspot mode is activated
3. The FlightClock display shows a QR code and connection instructions
4. Users connect to "FlightClock-Setup" (password: setup123)
5. They visit http://192.168.4.1:3000/setup or scan the QR code
6. Web interface guides them through:
   - WiFi network selection and password
   - Location setting (presets or manual coordinates)
   - Facing direction selection
7. After completion, the device connects to their WiFi and creates the setup complete flag

### Normal Operation
1. Setup complete flag exists
2. Hotspot is disabled
3. Device connects to configured WiFi
4. FlightClock operates normally
5. Settings can be adjusted via long-press (location and facing direction only)

## Manual Commands

### Force Setup Mode
```bash
sudo rm /home/pi/.flightclock-setup-complete
sudo ./scripts/setup-hotspot.sh
```

### Force Normal Mode
```bash
sudo touch /home/pi/.flightclock-setup-complete
sudo ./scripts/disable-hotspot.sh
```

### Check Hotspot Status
```bash
sudo systemctl status hostapd
sudo systemctl status dnsmasq
```

## Network Configuration

- **Hotspot SSID**: FlightClock-Setup
- **Hotspot Password**: setup123
- **Hotspot IP**: 192.168.4.1
- **DHCP Range**: 192.168.4.2 - 192.168.4.20
- **Setup URL**: http://192.168.4.1:3000/setup

## Troubleshooting

### Hotspot Not Starting
```bash
sudo systemctl status hostapd
sudo journalctl -u hostapd
```

### Can't Connect to Hotspot
```bash
# Check if services are running
sudo systemctl status hostapd dnsmasq

# Restart services
sudo systemctl restart hostapd dnsmasq
```

### Setup Web Page Not Loading
```bash
# Check if Next.js is running
ps aux | grep next

# Check if port 3000 is open
sudo netstat -tlnp | grep 3000
```

## Security Notes

- The hotspot password is hardcoded as "setup123"
- The hotspot is only active during initial setup
- After setup, the hotspot is disabled and normal WiFi connectivity is restored
- The setup web interface is only accessible during setup mode

## Development

The hotspot system consists of:

- **SetupQR.tsx**: React component showing QR code and instructions
- **setup/page.tsx**: Web-based setup interface
- **SimpleSettings.tsx**: Simplified settings (location and direction only)
- **setup-hotspot.sh**: Script to enable hotspot mode
- **disable-hotspot.sh**: Script to disable hotspot mode
- **check-setup.sh**: Script to check setup status on boot