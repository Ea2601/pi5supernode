#!/bin/bash

# Pi5 Supernode - Installation Verification Script
# Version: 1.0.0
# Description: Verify that all required packages and services are properly installed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Test function
test_command() {
    local cmd="$1"
    local description="$2"
    local warning_only="$3"
    
    if eval "$cmd" >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
        return 0
    else
        if [[ "$warning_only" == "true" ]]; then
            echo -e "${YELLOW}⚠${NC} $description (optional)"
            ((WARNINGS++))
        else
            echo -e "${RED}✗${NC} $description"
            ((FAILED++))
        fi
        return 1
    fi
}

test_package() {
    local package="$1"
    local description="$2"
    local warning_only="$3"
    
    test_command "dpkg -l | grep -q '^ii.*$package'" "$description" "$warning_only"
}

test_service() {
    local service="$1"
    local description="$2"
    local warning_only="$3"
    
    test_command "systemctl is-active --quiet $service" "$description" "$warning_only"
}

echo -e "${BLUE}Pi5 Supernode Installation Verification${NC}"
echo "========================================"
echo

echo "Testing Network Management Tools:"
test_package "iproute2" "IP routing utilities"
test_package "bridge-utils" "Bridge utilities"
test_package "vlan" "VLAN configuration tools"
test_package "ethtool" "Ethernet tools"
test_package "net-tools" "Network tools"
test_package "wireless-tools" "Wireless tools"
test_package "wpasupplicant" "WPA supplicant"
test_package "hostapd" "Host access point daemon"
test_package "dnsmasq" "DNS masquerading"
echo

echo "Testing Interface Utilities:"
test_package "usb-modeswitch" "USB mode switch"
test_package "usbutils" "USB utilities"
test_package "pciutils" "PCI utilities"
test_command "lsusb" "USB device listing"
test_command "lspci" "PCI device listing" "true"
echo

echo "Testing VPN Software:"
test_package "openvpn" "OpenVPN"
test_package "wireguard" "WireGuard VPN"
test_package "strongswan" "StrongSwan IPsec"
test_command "which wg" "WireGuard tools"
echo

echo "Testing Monitoring Tools:"
test_package "iftop" "Interface top"
test_package "nload" "Network load monitor"
test_package "vnstat" "Network statistics"
test_package "tcpdump" "Packet capture"
test_package "iperf3" "Network performance testing"
test_package "htop" "Process monitor"
echo

echo "Testing Security Packages:"
test_package "iptables" "IP tables firewall"
test_package "fail2ban" "Intrusion prevention"
test_package "ufw" "Uncomplicated firewall"
test_service "fail2ban" "Fail2ban service"
echo

echo "Testing Development Tools:"
test_package "git" "Git version control"
test_package "curl" "HTTP client"
test_package "wget" "Web retrieval tool"
test_package "build-essential" "Build tools"
test_package "python3" "Python 3"
test_package "nodejs" "Node.js"
test_package "nginx" "Nginx web server" "true"
echo

echo "Testing Python Packages:"
test_command "python3 -c 'import psutil'" "Python psutil package"
test_command "python3 -c 'import netifaces'" "Python netifaces package"
test_command "python3 -c 'import scapy'" "Python scapy package" "true"
test_command "python3 -c 'import netaddr'" "Python netaddr package"
test_command "python3 -c 'import requests'" "Python requests package"
echo

echo "Testing System Configuration:"
test_command "grep -q 'net.ipv4.ip_forward=1' /etc/sysctl.conf" "IP forwarding enabled"
test_command "sysctl net.ipv4.ip_forward | grep -q '1'" "IP forwarding active"
test_command "ls -d /opt/pi5-supernode" "Pi5 Supernode directory"
test_command "ls -d /var/log/pi5-supernode" "Pi5 Supernode log directory"
test_command "ls /etc/systemd/system/pi5-supernode.service" "Pi5 Supernode service file" "true"
echo

echo "Testing Network Interfaces:"
echo "Available network interfaces:"
ip link show | grep -E '^[0-9]+:' | awk '{print "  " $2}' | sed 's/:$//'
echo

echo "Testing Wireless Capabilities:"
if test_command "which iwconfig" "Wireless configuration tools" "true"; then
    echo "Wireless interfaces:"
    iwconfig 2>/dev/null | grep -E '^\w+' | awk '{print "  " $1}' || echo "  No wireless interfaces found"
fi
echo

# Summary
echo "========================================"
echo -e "${BLUE}Verification Summary:${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [[ $WARNINGS -gt 0 ]]; then
    echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
fi
if [[ $FAILED -gt 0 ]]; then
    echo -e "${RED}Failed: $FAILED${NC}"
    echo
    echo -e "${RED}Some critical components are missing!${NC}"
    echo "Please run the installation script again or install missing packages manually."
    exit 1
else
    echo
    echo -e "${GREEN}✓ All critical components are installed and working!${NC}"
    echo "Your Pi5 Supernode is ready for configuration."
fi

echo
echo "Next steps:"
echo "1. Access the web interface at: http://$(hostname -I | awk '{print $1}'):3000"
echo "2. Configure your network interfaces"
echo "3. Set up monitoring and alerts"
echo "4. Review the documentation for advanced features"