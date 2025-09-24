#!/bin/bash

# Pi5 Supernode - Complete Installation Script
# Version: 2.1.0
# Description: Automated installation of all required packages for Pi5 Supernode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root. Please run as a regular user with sudo privileges."
fi

# Check if running on Raspberry Pi 5
if ! grep -q "Raspberry Pi 5" /proc/cpuinfo 2>/dev/null; then
    warn "This script is designed for Raspberry Pi 5. Continuing anyway..."
fi

log "Starting Pi5 Supernode installation..."

# Update system packages
log "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install network management tools
log "Installing network management tools..."
sudo apt install -y \
    iproute2 \
    bridge-utils \
    vlan \
    ethtool \
    net-tools \
    wireless-tools \
    wpasupplicant \
    hostapd \
    dnsmasq \
    netplan.io \
    ifupdown

# Install interface utilities and drivers
log "Installing interface utilities and drivers..."
sudo apt install -y \
    usb-modeswitch \
    usb-modeswitch-data \
    usbutils \
    pciutils \
    firmware-realtek \
    firmware-atheros \
    firmware-iwlwifi

# Install VPN software
log "Installing VPN software..."
sudo apt install -y \
    openvpn \
    easy-rsa \
    wireguard \
    strongswan \
    strongswan-pki \
    libstrongswan-extra-plugins

# Install monitoring tools
log "Installing monitoring tools..."
sudo apt install -y \
    iftop \
    nload \
    vnstat \
    tcpdump \
    wireshark-common \
    iperf3 \
    speedtest-cli \
    htop \
    iotop

# Install security packages
log "Installing security packages..."
sudo apt install -y \
    iptables \
    iptables-persistent \
    fail2ban \
    ufw \
    rkhunter \
    chkrootkit

# Install development tools and dependencies
log "Installing development tools..."
sudo apt install -y \
    git \
    curl \
    wget \
    build-essential \
    python3 \
    python3-pip \
    python3-dev \
    nodejs \
    npm \
    nginx \
    supervisor

# Install Python packages for network management
log "Installing Python network packages..."
pip3 install --user \
    psutil \
    netifaces \
    scapy \
    netaddr \
    requests \
    flask \
    fastapi \
    uvicorn

# Enable and configure services
log "Configuring services..."

# Enable IP forwarding
echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv6.conf.all.forwarding=1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configure vnstat
sudo systemctl enable vnstat
sudo systemctl start vnstat

# Create pi5-supernode user and directories
log "Setting up Pi5 Supernode environment..."
sudo useradd -r -s /bin/false pi5-supernode || true
sudo mkdir -p /opt/pi5-supernode
sudo mkdir -p /var/log/pi5-supernode
sudo mkdir -p /etc/pi5-supernode
sudo chown -R pi5-supernode:pi5-supernode /opt/pi5-supernode
sudo chown -R pi5-supernode:pi5-supernode /var/log/pi5-supernode

# Create systemd service file
log "Creating systemd service..."
sudo tee /etc/systemd/system/pi5-supernode.service > /dev/null <<EOF
[Unit]
Description=Pi5 Supernode Network Management Service
After=network.target
Wants=network.target

[Service]
Type=simple
User=pi5-supernode
Group=pi5-supernode
WorkingDirectory=/opt/pi5-supernode
ExecStart=/opt/pi5-supernode/start.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Set up log rotation
log "Setting up log rotation..."
sudo tee /etc/logrotate.d/pi5-supernode > /dev/null <<EOF
/var/log/pi5-supernode/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF

# Create backup directory
sudo mkdir -p /var/backups/pi5-supernode
sudo chown pi5-supernode:pi5-supernode /var/backups/pi5-supernode

# Install completion
log "Installation completed successfully!"
log "Next steps:"
echo -e "  ${BLUE}1.${NC} Reboot your Pi5: sudo reboot"
echo -e "  ${BLUE}2.${NC} Run the verification script: ./pi5-verify-install.sh"
echo -e "  ${BLUE}3.${NC} Configure your network interfaces using the web interface"
echo -e "  ${BLUE}4.${NC} Check logs: sudo journalctl -u pi5-supernode -f"

log "Pi5 Supernode installation complete!"