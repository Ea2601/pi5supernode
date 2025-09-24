#!/bin/bash

# Pi5 Supernode - Enhanced Verification Script
# Version: 3.0.0
# Description: Comprehensive verification of Pi5 Supernode installation

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
INSTALL_DIR="/opt/pi5-supernode"
LOG_DIR="/var/log/pi5-supernode"
CONFIG_DIR="/etc/pi5-supernode"
SERVICE_USER="pi5-supernode"

# Counters
PASSED=0
FAILED=0
WARNINGS=0
TOTAL_TESTS=0

# Results
RESULTS=()

log_test() {
    local status="$1"
    local description="$2"
    local category="$3"
    local details="$4"
    
    ((TOTAL_TESTS++))
    
    case $status in
        "PASS")
            echo -e "  ${GREEN}✓${NC} $description"
            ((PASSED++))
            RESULTS+=("PASS|$category|$description|$details")
            ;;
        "FAIL")
            echo -e "  ${RED}✗${NC} $description"
            ((FAILED++))
            RESULTS+=("FAIL|$category|$description|$details")
            ;;
        "WARN")
            echo -e "  ${YELLOW}⚠${NC} $description"
            ((WARNINGS++))
            RESULTS+=("WARN|$category|$description|$details")
            ;;
    esac
}

test_command() {
    local cmd="$1"
    local description="$2"
    local category="$3"
    local warning_only="${4:-false}"
    
    if eval "$cmd" >/dev/null 2>&1; then
        log_test "PASS" "$description" "$category" "Command: $cmd"
        return 0
    else
        if [[ "$warning_only" == "true" ]]; then
            log_test "WARN" "$description (optional)" "$category" "Command: $cmd"
        else
            log_test "FAIL" "$description" "$category" "Command: $cmd"
        fi
        return 1
    fi
}

test_package() {
    local package="$1"
    local description="$2"
    local category="$3"
    local warning_only="${4:-false}"
    
    test_command "dpkg -l | grep -q '^ii.*$package'" "$description" "$category" "$warning_only"
}

test_service() {
    local service="$1"
    local description="$2"
    local category="$3"
    local warning_only="${4:-false}"
    
    test_command "systemctl is-active --quiet $service" "$description" "$category" "$warning_only"
}

test_port() {
    local port="$1"
    local description="$2"
    local category="$3"
    local warning_only="${4:-false}"
    
    test_command "netstat -tuln 2>/dev/null | grep -q ':$port '" "$description" "$category" "$warning_only"
}

test_file() {
    local file="$1"
    local description="$2"
    local category="$3"
    local warning_only="${4:-false}"
    
    test_command "[[ -f '$file' ]]" "$description" "$category" "$warning_only"
}

test_directory() {
    local dir="$1"
    local description="$2"
    local category="$3"
    local warning_only="${4:-false}"
    
    test_command "[[ -d '$dir' ]]" "$description" "$category" "$warning_only"
}

show_banner() {
    clear
    cat << 'EOF'
████████████████████████████████████████████████████████████████████████████████
█                                                                              █
█  ███████ ███████ ██████  ██ ███████ ██ ███████ ██    ██     ███████       █
█  ██       ██      ██   ██ ██ ██      ██ ██       ██    ██        ██           █
█  █████    ██      ██████  ██ █████    ██ █████    ██    ██        █████         █
█       ██   ██      ██   ██ ██ ██       ██ ██       ██    ██           ██           █
█  ███████  ███████ ██   ██ ██ ██       ██ ██       ████████        ███████       █
█                                                                              █
█                 Pi5 Supernode Verification System v3.0.0                   █
█                                                                              █
████████████████████████████████████████████████████████████████████████████████

EOF
    
    echo -e "${BLUE}Pi5 Supernode Installation Verification${NC}"
    echo "Timestamp: $(date)"
    echo "======================================="
    echo
}

test_hardware() {
    echo -e "${CYAN}Hardware Compatibility:${NC}"
    
    # Check for Raspberry Pi
    if grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
        local pi_model
        pi_model=$(grep "Model" /proc/cpuinfo | cut -d: -f2 | xargs)
        log_test "PASS" "Raspberry Pi detected: $pi_model" "Hardware" "Model: $pi_model"
    else
        log_test "WARN" "Raspberry Pi not detected" "Hardware" "Non-Pi hardware"
    fi
    
    # Check architecture
    local arch
    arch=$(uname -m)
    if [[ "$arch" == "aarch64" ]] || [[ "$arch" == "armv7l" ]]; then
        log_test "PASS" "Architecture: $arch" "Hardware" "Architecture: $arch"
    else
        log_test "WARN" "Unusual architecture: $arch" "Hardware" "Architecture: $arch"
    fi
    
    # Check memory
    local total_mem_gb
    total_mem_gb=$(free -g | awk 'NR==2{print $2}')
    if [[ $total_mem_gb -ge 4 ]]; then
        log_test "PASS" "Memory: ${total_mem_gb}GB (sufficient)" "Hardware" "Memory: ${total_mem_gb}GB"
    elif [[ $total_mem_gb -ge 2 ]]; then
        log_test "WARN" "Memory: ${total_mem_gb}GB (minimum)" "Hardware" "Memory: ${total_mem_gb}GB"
    else
        log_test "FAIL" "Memory: ${total_mem_gb}GB (insufficient)" "Hardware" "Memory: ${total_mem_gb}GB"
    fi
    
    echo
}

test_system_packages() {
    echo -e "${CYAN}System Packages:${NC}"
    
    # Network management tools
    test_package "iproute2" "IP routing utilities" "System Packages"
    test_package "bridge-utils" "Bridge utilities" "System Packages"
    test_package "vlan" "VLAN configuration tools" "System Packages"
    test_package "ethtool" "Ethernet tools" "System Packages"
    test_package "net-tools" "Network tools" "System Packages"
    test_package "wireless-tools" "Wireless tools" "System Packages"
    test_package "wpasupplicant" "WPA supplicant" "System Packages"
    test_package "hostapd" "Host access point daemon" "System Packages"
    test_package "dnsmasq" "DNS masquerading" "System Packages"
    
    # VPN software
    test_package "openvpn" "OpenVPN" "System Packages"
    test_package "wireguard" "WireGuard VPN" "System Packages"
    test_package "strongswan" "StrongSwan IPsec" "System Packages"
    
    # Monitoring tools
    test_package "iftop" "Interface top" "System Packages"
    test_package "nload" "Network load monitor" "System Packages"
    test_package "vnstat" "Network statistics" "System Packages"
    test_package "tcpdump" "Packet capture" "System Packages"
    test_package "htop" "Process monitor" "System Packages"
    
    # Security packages
    test_package "iptables" "IP tables firewall" "System Packages"
    test_package "fail2ban" "Intrusion prevention" "System Packages"
    test_package "ufw" "Uncomplicated firewall" "System Packages"
    
    # Development tools
    test_package "git" "Git version control" "System Packages"
    test_package "curl" "HTTP client" "System Packages"
    test_package "wget" "Web retrieval tool" "System Packages"
    test_package "nodejs" "Node.js" "System Packages"
    test_package "nginx" "Nginx web server" "System Packages" "true"
    
    echo
}

test_python_packages() {
    echo -e "${CYAN}Python Packages:${NC}"
    
    test_command "python3 -c 'import psutil'" "Python psutil package" "Python Packages"
    test_command "python3 -c 'import netifaces'" "Python netifaces package" "Python Packages"
    test_command "python3 -c 'import netaddr'" "Python netaddr package" "Python Packages"
    test_command "python3 -c 'import requests'" "Python requests package" "Python Packages"
    test_command "python3 -c 'import scapy'" "Python scapy package" "Python Packages" "true"
    
    echo
}

test_installation() {
    echo -e "${CYAN}Pi5 Supernode Installation:${NC}"
    
    # Directories
    test_directory "$INSTALL_DIR" "Installation directory" "Installation"
    test_directory "$LOG_DIR" "Log directory" "Installation"
    test_directory "$CONFIG_DIR" "Configuration directory" "Installation"
    test_directory "$INSTALL_DIR/data" "Data directory" "Installation" "true"
    test_directory "$INSTALL_DIR/scripts" "Scripts directory" "Installation" "true"
    
    # Configuration files
    test_file "$CONFIG_DIR/environment" "Environment configuration" "Installation"
    test_file "/etc/systemd/system/pi5-supernode.service" "Systemd service file" "Installation"
    test_file "/etc/nginx/sites-available/pi5-supernode" "Nginx configuration" "Installation" "true"
    
    # Scripts
    test_file "$INSTALL_DIR/scripts/health-check.sh" "Health check script" "Installation" "true"
    test_file "$INSTALL_DIR/scripts/backup.sh" "Backup script" "Installation" "true"
    test_file "$INSTALL_DIR/scripts/update.sh" "Update script" "Installation" "true"
    
    # User account
    test_command "id $SERVICE_USER" "Service user account" "Installation"
    
    # Permissions
    if [[ -d "$INSTALL_DIR" ]]; then
        local owner
        owner=$(stat -c '%U' "$INSTALL_DIR")
        if [[ "$owner" == "$SERVICE_USER" ]]; then
            log_test "PASS" "Installation directory ownership" "Installation" "Owner: $owner"
        else
            log_test "FAIL" "Installation directory ownership" "Installation" "Owner: $owner (should be $SERVICE_USER)"
        fi
    fi
    
    echo
}

test_services() {
    echo -e "${CYAN}System Services:${NC}"
    
    # Pi5 Supernode services
    test_service "pi5-supernode" "Pi5 Supernode main service" "Services"
    test_service "pi5-network-monitor" "Network monitoring service" "Services" "true"
    
    # System services
    test_service "nginx" "Nginx web server" "Services" "true"
    test_service "fail2ban" "Fail2ban intrusion prevention" "Services"
    test_service "vnstat" "Network statistics service" "Services" "true"
    
    # Service enablement
    test_command "systemctl is-enabled --quiet pi5-supernode" "Pi5 Supernode service enabled" "Services"
    
    echo
}

test_network() {
    echo -e "${CYAN}Network Configuration:${NC}"
    
    # Port availability
    test_port "80" "HTTP port (80)" "Network" "true"
    test_port "443" "HTTPS port (443)" "Network" "true"
    test_port "3000" "Application port (3000)" "Network" "true"
    test_port "3001" "API port (3001)" "Network" "true"
    
    # VPN ports
    test_port "51820" "WireGuard port (51820)" "Network" "true"
    test_port "1194" "OpenVPN port (1194)" "Network" "true"
    
    # IP forwarding
    test_command "sysctl net.ipv4.ip_forward | grep -q '1'" "IP forwarding enabled" "Network"
    
    # Network interfaces
    echo "  Available network interfaces:"
    ip link show | grep -E '^[0-9]+:' | awk '{print "    " $2}' | sed 's/:$//'
    
    # Firewall status
    if command -v ufw >/dev/null; then
        if ufw status | grep -q "Status: active"; then
            log_test "PASS" "UFW firewall is active" "Network" "UFW status: active"
        else
            log_test "WARN" "UFW firewall is inactive" "Network" "UFW status: inactive"
        fi
    fi
    
    echo
}

test_web_interface() {
    echo -e "${CYAN}Web Interface:${NC}"
    
    # Test web server response
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
    
    if [[ "$http_code" =~ ^(200|301|302)$ ]]; then
        log_test "PASS" "Web interface responding (HTTP $http_code)" "Web Interface" "HTTP code: $http_code"
    elif [[ "$http_code" == "000" ]]; then
        log_test "FAIL" "Web interface not responding" "Web Interface" "Connection failed"
    else
        log_test "WARN" "Web interface responding with HTTP $http_code" "Web Interface" "HTTP code: $http_code"
    fi
    
    # Test application port
    http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
    
    if [[ "$http_code" =~ ^(200|301|302)$ ]]; then
        log_test "PASS" "Application responding (HTTP $http_code)" "Web Interface" "HTTP code: $http_code"
    else
        log_test "WARN" "Application not responding on port 3000" "Web Interface" "HTTP code: $http_code"
    fi
    
    echo
}

test_security() {
    echo -e "${CYAN}Security Configuration:${NC}"
    
    # Check fail2ban status
    if systemctl is-active --quiet fail2ban 2>/dev/null; then
        local jail_count
        jail_count=$(fail2ban-client status 2>/dev/null | grep "jail list" | awk -F: '{print $2}' | wc -w)
        log_test "PASS" "Fail2ban active with $jail_count jails" "Security" "Jails: $jail_count"
    else
        log_test "WARN" "Fail2ban not active" "Security" "Service inactive"
    fi
    
    # Check SSH configuration
    if [[ -f "/etc/ssh/sshd_config" ]]; then
        if grep -q "PasswordAuthentication no" /etc/ssh/sshd_config; then
            log_test "PASS" "SSH password authentication disabled" "Security" "Key-based auth enforced"
        else
            log_test "WARN" "SSH password authentication may be enabled" "Security" "Consider disabling"
        fi
    fi
    
    # Check for default passwords (basic check)
    if [[ -f "/etc/shadow" ]]; then
        if sudo grep -q "pi:\$" /etc/shadow 2>/dev/null; then
            log_test "WARN" "Default 'pi' user may have weak password" "Security" "Consider strengthening"
        fi
    fi
    
    echo
}

test_performance() {
    echo -e "${CYAN}System Performance:${NC}"
    
    # Disk usage
    local disk_usage
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [[ $disk_usage -lt 80 ]]; then
        log_test "PASS" "Disk usage: ${disk_usage}%" "Performance" "Usage: ${disk_usage}%"
    elif [[ $disk_usage -lt 90 ]]; then
        log_test "WARN" "Disk usage: ${disk_usage}% (high)" "Performance" "Usage: ${disk_usage}%"
    else
        log_test "FAIL" "Disk usage: ${disk_usage}% (critical)" "Performance" "Usage: ${disk_usage}%"
    fi
    
    # Memory usage
    local mem_usage
    mem_usage=$(free | awk 'NR==2{printf "%.0f", $3/$2*100}')
    
    if [[ $mem_usage -lt 80 ]]; then
        log_test "PASS" "Memory usage: ${mem_usage}%" "Performance" "Usage: ${mem_usage}%"
    elif [[ $mem_usage -lt 90 ]]; then
        log_test "WARN" "Memory usage: ${mem_usage}% (high)" "Performance" "Usage: ${mem_usage}%"
    else
        log_test "FAIL" "Memory usage: ${mem_usage}% (critical)" "Performance" "Usage: ${mem_usage}%"
    fi
    
    # Load average
    local load_avg
    load_avg=$(uptime | awk '{print $(NF-2)}' | sed 's/,//')
    
    if (( $(echo "$load_avg < 2.0" | bc -l) )); then
        log_test "PASS" "Load average: $load_avg" "Performance" "Load: $load_avg"
    elif (( $(echo "$load_avg < 4.0" | bc -l) )); then
        log_test "WARN" "Load average: $load_avg (high)" "Performance" "Load: $load_avg"
    else
        log_test "FAIL" "Load average: $load_avg (critical)" "Performance" "Load: $load_avg"
    fi
    
    echo
}

test_logs() {
    echo -e "${CYAN}Log Analysis:${NC}"
    
    # Check for recent errors
    local error_count
    error_count=$(sudo journalctl -u pi5-supernode --since "1 hour ago" --no-pager 2>/dev/null | grep -i error | wc -l)
    
    if [[ $error_count -eq 0 ]]; then
        log_test "PASS" "No recent errors in logs" "Logs" "Error count: $error_count"
    elif [[ $error_count -lt 5 ]]; then
        log_test "WARN" "$error_count recent errors in logs" "Logs" "Error count: $error_count"
    else
        log_test "FAIL" "$error_count recent errors in logs (many)" "Logs" "Error count: $error_count"
    fi
    
    # Check log file sizes
    if [[ -d "$LOG_DIR" ]]; then
        local log_size
        log_size=$(du -sm "$LOG_DIR" 2>/dev/null | awk '{print $1}' || echo "0")
        
        if [[ $log_size -lt 100 ]]; then
            log_test "PASS" "Log directory size: ${log_size}MB" "Logs" "Size: ${log_size}MB"
        elif [[ $log_size -lt 500 ]]; then
            log_test "WARN" "Log directory size: ${log_size}MB (large)" "Logs" "Size: ${log_size}MB"
        else
            log_test "FAIL" "Log directory size: ${log_size}MB (very large)" "Logs" "Size: ${log_size}MB"
        fi
    fi
    
    echo
}

generate_report() {
    echo -e "${BLUE}=== VERIFICATION SUMMARY ===${NC}"
    echo
    
    # Overall statistics
    echo -e "${GREEN}Test Results:${NC}"
    echo "  Total Tests: $TOTAL_TESTS"
    echo -e "  ${GREEN}Passed: $PASSED${NC}"
    [[ $WARNINGS -gt 0 ]] && echo -e "  ${YELLOW}Warnings: $WARNINGS${NC}"
    [[ $FAILED -gt 0 ]] && echo -e "  ${RED}Failed: $FAILED${NC}"
    echo
    
    # Calculate success rate
    local success_rate
    if [[ $TOTAL_TESTS -gt 0 ]]; then
        success_rate=$(( (PASSED * 100) / TOTAL_TESTS ))
        echo -e "${GREEN}Success Rate: ${success_rate}%${NC}"
    fi
    echo
    
    # Show critical failures
    if [[ $FAILED -gt 0 ]]; then
        echo -e "${RED}Critical Issues:${NC}"
        for result in "${RESULTS[@]}"; do
            if [[ $result == FAIL* ]]; then
                local description
                description=$(echo "$result" | cut -d'|' -f3)
                echo -e "  ${RED}✗${NC} $description"
            fi
        done
        echo
    fi
    
    # Show warnings
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}Warnings (non-critical):${NC}"
        for result in "${RESULTS[@]}"; do
            if [[ $result == WARN* ]]; then
                local description
                description=$(echo "$result" | cut -d'|' -f3)
                echo -e "  ${YELLOW}⚠${NC} $description"
            fi
        done
        echo
    fi
    
    # Recommendations
    echo -e "${BLUE}Recommendations:${NC}"
    
    if [[ $FAILED -eq 0 ]] && [[ $WARNINGS -eq 0 ]]; then
        echo -e "  ${GREEN}✓ Your Pi5 Supernode installation is excellent!${NC}"
        echo "  • All tests passed successfully"
        echo "  • System is ready for production use"
    elif [[ $FAILED -eq 0 ]]; then
        echo -e "  ${GREEN}✓ Your Pi5 Supernode installation is good!${NC}"
        echo "  • All critical tests passed"
        echo "  • Review warnings for optimization opportunities"
    else
        echo -e "  ${RED}⚠ Your Pi5 Supernode installation needs attention!${NC}"
        echo "  • Address critical issues before production use"
        echo "  • Run health check: $INSTALL_DIR/scripts/health-check.sh"
        echo "  • Check logs: sudo journalctl -u pi5-supernode -f"
    fi
    
    echo
    echo -e "${BLUE}Next Steps:${NC}"
    
    if [[ $FAILED -gt 0 ]]; then
        echo "  1. Fix critical issues listed above"
        echo "  2. Re-run verification: $0"
        echo "  3. Check documentation: https://docs.pi5-supernode.com"
    else
        local local_ip
        local_ip=$(hostname -I | awk '{print $1}' || echo "localhost")
        echo "  1. Access web interface: http://$local_ip"
        echo "  2. Complete initial configuration"
        echo "  3. Set up monitoring and alerts"
        echo "  4. Review security settings"
    fi
    
    echo
    echo -e "${CYAN}System Information:${NC}"
    echo "  Verification Date: $(date)"
    echo "  System Uptime: $(uptime -p)"
    if [[ -f "$INSTALL_DIR/VERSION" ]]; then
        echo "  Pi5 Supernode Version: $(cat "$INSTALL_DIR/VERSION")"
    fi
    echo
    
    # Exit code based on results
    if [[ $FAILED -gt 0 ]]; then
        return 1
    else
        return 0
    fi
}

main() {
    show_banner
    
    # Run all test categories
    test_hardware
    test_system_packages
    test_python_packages
    test_installation
    test_services
    test_network
    test_web_interface
    test_security
    test_performance
    test_logs
    
    # Generate final report
    generate_report
}

# Run main function
main "$@"
