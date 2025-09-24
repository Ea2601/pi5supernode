#!/bin/bash

# Pi5 Supernode - Uninstall Script
# Version: 1.0.0
# Description: Remove Pi5 Supernode and optionally remove installed packages

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

echo -e "${RED}Pi5 Supernode Uninstall Script${NC}"
echo "==============================="
echo
warn "This will remove Pi5 Supernode from your system."
echo
echo "Options:"
echo "1. Remove Pi5 Supernode only (keep system packages)"
echo "2. Remove Pi5 Supernode and all installed packages"
echo "3. Cancel"
echo
read -p "Please select an option (1-3): " choice

case $choice in
    1)
        REMOVE_PACKAGES=false
        ;;
    2)
        REMOVE_PACKAGES=true
        warn "This will remove ALL packages installed by the Pi5 Supernode installer!"
        read -p "Are you sure? (yes/no): " confirm
        if [[ $confirm != "yes" ]]; then
            echo "Cancelled."
            exit 0
        fi
        ;;
    3)
        echo "Cancelled."
        exit 0
        ;;
    *)
        error "Invalid option selected."
        exit 1
        ;;
esac

log "Starting Pi5 Supernode removal..."

# Stop and disable services
log "Stopping Pi5 Supernode services..."
sudo systemctl stop pi5-supernode 2>/dev/null || true
sudo systemctl disable pi5-supernode 2>/dev/null || true

# Remove service files
log "Removing service files..."
sudo rm -f /etc/systemd/system/pi5-supernode.service
sudo systemctl daemon-reload

# Remove Pi5 Supernode directories and files
log "Removing Pi5 Supernode files..."
sudo rm -rf /opt/pi5-supernode
sudo rm -rf /var/log/pi5-supernode
sudo rm -rf /etc/pi5-supernode
sudo rm -rf /var/backups/pi5-supernode
sudo rm -f /etc/logrotate.d/pi5-supernode

# Remove user
log "Removing Pi5 Supernode user..."
sudo userdel pi5-supernode 2>/dev/null || true

if [[ $REMOVE_PACKAGES == true ]]; then
    log "Removing installed packages..."
    
    # Remove Python packages
    log "Removing Python packages..."
    pip3 uninstall -y psutil netifaces scapy netaddr requests flask fastapi uvicorn 2>/dev/null || true
    
    # Remove system packages
    log "Removing system packages..."
    sudo apt remove -y \
        supervisor \
        nginx \
        rkhunter \
        chkrootkit \
        ufw \
        fail2ban \
        iptables-persistent \
        strongswan-pki \
        libstrongswan-extra-plugins \
        strongswan \
        wireguard \
        easy-rsa \
        openvpn \
        iotop \
        htop \
        speedtest-cli \
        iperf3 \
        wireshark-common \
        tcpdump \
        vnstat \
        nload \
        iftop \
        netplan.io \
        ifupdown \
        dnsmasq \
        hostapd \
        wpasupplicant \
        wireless-tools \
        net-tools \
        ethtool \
        vlan \
        bridge-utils 2>/dev/null || true
    
    # Clean up
    log "Cleaning up package cache..."
    sudo apt autoremove -y
    sudo apt autoclean
fi

# Restore sysctl settings
log "Restoring system settings..."
sudo sed -i '/net.ipv4.ip_forward=1/d' /etc/sysctl.conf
sudo sed -i '/net.ipv6.conf.all.forwarding=1/d' /etc/sysctl.conf
sudo sysctl -p

log "Pi5 Supernode has been removed successfully!"

if [[ $REMOVE_PACKAGES == false ]]; then
    echo
    echo "Note: System packages were kept. To remove them later, run:"
    echo "  sudo apt remove [package-name]"
fi

echo
echo "System cleanup complete. You may want to reboot your system."