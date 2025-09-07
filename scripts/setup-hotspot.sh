#!/bin/bash

# FlightClock Hotspot Setup Script
# This script should be run on first boot to set up hotspot mode

# Configuration
SSID="FlightClock-Setup"
PASSWORD="setup123"
INTERFACE="wlan0"

echo "Setting up FlightClock hotspot..."

# Stop any existing network services
sudo systemctl stop wpa_supplicant
sudo systemctl stop dhcpcd

# Install required packages
sudo apt-get update
sudo apt-get install -y hostapd dnsmasq

# Configure hostapd
sudo tee /etc/hostapd/hostapd.conf > /dev/null << EOF
interface=$INTERFACE
driver=nl80211
ssid=$SSID
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=$PASSWORD
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
EOF

# Configure dnsmasq
sudo tee /etc/dnsmasq.conf > /dev/null << EOF
interface=$INTERFACE
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
EOF

# Configure static IP for the interface
sudo tee -a /etc/dhcpcd.conf > /dev/null << EOF

# Static IP configuration for hotspot
interface $INTERFACE
static ip_address=192.168.4.1/24
nohook wpa_supplicant
EOF

# Enable IP forwarding
echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf

# Configure iptables for NAT
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo iptables -A FORWARD -i eth0 -o $INTERFACE -m state --state RELATED,ESTABLISHED -j ACCEPT
sudo iptables -A FORWARD -i $INTERFACE -o eth0 -j ACCEPT

# Save iptables rules
sudo sh -c "iptables-save > /etc/iptables.ipv4.nat"

# Create script to restore iptables on boot
sudo tee /etc/rc.local > /dev/null << EOF
#!/bin/bash
iptables-restore < /etc/iptables.ipv4.nat
exit 0
EOF
sudo chmod +x /etc/rc.local

# Enable services
sudo systemctl unmask hostapd
sudo systemctl enable hostapd
sudo systemctl enable dnsmasq

# Start services
sudo systemctl start hostapd
sudo systemctl start dnsmasq

echo "Hotspot setup complete!"
echo "SSID: $SSID"
echo "Password: $PASSWORD"
echo "Setup URL: http://192.168.4.1:3000/setup"