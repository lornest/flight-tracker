#!/bin/bash

# FlightClock Disable Hotspot Script
# This script disables hotspot mode and connects to configured WiFi

echo "Disabling FlightClock hotspot..."

# Stop hotspot services
sudo systemctl stop hostapd
sudo systemctl stop dnsmasq
sudo systemctl disable hostapd
sudo systemctl disable dnsmasq

# Remove static IP configuration from dhcpcd.conf
sudo sed -i '/# Static IP configuration for hotspot/,$d' /etc/dhcpcd.conf

# Restart dhcpcd and wpa_supplicant
sudo systemctl restart dhcpcd
sudo systemctl restart wpa_supplicant

echo "Hotspot disabled. Normal WiFi connectivity restored."