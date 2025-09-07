#!/bin/bash

# FlightClock Setup Check Script
# This script checks if initial setup is required and starts hotspot if needed

CONFIG_FILE="/home/pi/flight-tracker/.env.local"
SETUP_FLAG_FILE="/home/pi/.flightclock-setup-complete"

echo "Checking FlightClock setup status..."

# Check if setup has been completed
if [ ! -f "$SETUP_FLAG_FILE" ]; then
    echo "First time setup required. Starting hotspot..."
    
    # Start hotspot mode
    ./setup-hotspot.sh
    
    echo "Hotspot started. Please connect to 'FlightClock-Setup' network."
    echo "Password: setup123"
    echo "Then visit: http://192.168.4.1:3000/setup"
    
else
    echo "Setup already completed. Starting normal operation..."
    
    # Ensure hotspot is disabled
    ./disable-hotspot.sh
    
    echo "FlightClock ready for normal operation."
fi