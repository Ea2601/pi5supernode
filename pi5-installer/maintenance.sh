#!/bin/bash

# Pi5 Supernode - Maintenance Script
# Version: 3.0.0
# Description: Comprehensive maintenance and management tool

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
INSTALL_DIR="/opt/pi5-supernode"
LOG_DIR="/var/log/pi5-supernode"
CONFIG_DIR="/etc/pi5-supernode"
BACKUP_DIR="/var/backups/pi5-supernode"
SERVICE_USER="pi5-supernode"

# Functions
show_banner() {
    clear
    cat << 'EOF'
████████████████████████████████████████████████████████████████████████████████
█                                                                              █
█   ███    ███  █████  ██ ███    ██ ████████ ███████ ███    ██  █████  ███    █
█   ████  ████ ██   ██ ██ ████   ██    ██    ██      ████   ██ ██   ██ ████   █
█   ██ ████ ██ ███████ ██ ██ ██  ██    ██    █████   ██ ██  ██ ███████ ██ ██  █
█   ██  ██  ██ ██   ██ ██ ██  ██ ██    ██    ██      ██  ██ ██ ██   ██ ██  ██ █
█   ██      ██ ██   ██ ██ ██   ████    ██    ███████ ██   ████ ██   ██ ██   ███
█                                                                              █
█                    Pi5 Supernode Maintenance v3.0.0                         █
█                                                                              █
████████████████████████████████████████████████████████████████████████████████

EOF
}

show_menu() {
    echo -e "${BLUE}Pi5 Supernode Maintenance Menu:${NC}"
    echo
    echo -e "${GREEN}System Status:${NC}"
    echo "  1) Health Check"
    echo "  2) Service Status"
    echo "  3) System Information"
    echo "  4) Network Status"
    echo
    echo -e "${GREEN}Maintenance:${NC}"
    echo "  5) Update System"
    echo "  6) Restart Services"
    echo "  7) Clean Logs"
    echo "  8) Backup Configuration"
    echo "  9) Restore Backup"
    echo
    echo -e "${GREEN}Monitoring:${NC}"
    echo " 10) View Live Logs"
    echo " 11) Performance Monitor"
    echo " 12) Network Monitor"
    echo " 13) Security Audit"
    echo
    echo -e "${GREEN}Configuration:${NC}"
    echo " 14) Edit Configuration"
    echo " 15) Reset Configuration"
    echo " 16) SSL Certificate Management"
    echo
    echo -e "${GREEN}Troubleshooting:${NC}"
    echo " 17) Run Diagnostics"
    echo " 18) Fix Permissions"
    echo " 19) Rebuild Application"
    echo " 20) Emergency Recovery"
    echo
    echo "  0) Exit"
    echo
}

health_check() {
    echo -e "${BLUE}=== Pi5 Supernode Health Check ===${NC}"
    echo "Timestamp: $(date)"
    echo
    
    # Service status
    echo -e "${GREEN}Service Status:${NC}"
    local services=("pi5-supernode" "pi5-network-monitor" "nginx")
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            echo -e "  ✓ $service: ${GREEN}Running${NC}"
        else
            echo -e "  ✗ $service: ${RED}Stopped${NC}"
        fi
    done
    echo
    
    # Port status
    echo -e "${GREEN}Port Status:${NC}"
    local ports=("80:HTTP" "443:HTTPS" "3000:App" "3001:API")
    for port_info in "${ports[@]}"; do
        local port=$(echo "$port_info" | cut -d: -f1)
        local name=$(echo "$port_info" | cut -d: -f2)
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo -e "  ✓ Port $port ($name): ${GREEN}Open${NC}"
        else
            echo -e "  ✗ Port $port ($name): ${RED}Closed${NC}"
        fi
    done
    echo
    
    # Disk usage
    echo -e "${GREEN}Disk Usage:${NC}"
    df -h / | tail -1 | awk '{print "  Root filesystem: " $5 " used (" $4 " available)"}'
    [[ -d "$INSTALL_DIR" ]] && du -sh "$INSTALL_DIR" | awk '{print "  Installation size: " $1}'
    [[ -d "$LOG_DIR" ]] && du -sh "$LOG_DIR" | awk '{print "  Log size: " $1}'
    echo
    
    # Memory usage
    echo -e "${GREEN}Memory Usage:${NC}"
    free -h | awk 'NR==2{printf "  Memory: %s used / %s total (%.1f%%)\n", $3, $2, $3/$2*100}'
    echo
    
    # CPU load
    echo -e "${GREEN}CPU Load:${NC}"
    uptime | awk '{print "  Load average: " $(NF-2) " " $(NF-1) " " $NF}'
    echo
    
    # Recent errors
    echo -e "${GREEN}Recent Errors:${NC}"
    local error_count
    error_count=$(sudo journalctl -u pi5-supernode --since "1 hour ago" --no-pager | grep -i error | wc -l)
    if [[ $error_count -gt 0 ]]; then
        echo -e "  ${RED}$error_count errors found in the last hour${NC}"
        sudo journalctl -u pi5-supernode --since "1 hour ago" --no-pager | grep -i error | tail -3
    else
        echo -e "  ${GREEN}No recent errors${NC}"
    fi
    echo
}

service_status() {
    echo -e "${BLUE}=== Service Status ===${NC}"
    echo
    
    local services=("pi5-supernode" "pi5-network-monitor" "nginx" "fail2ban" "ufw")
    
    for service in "${services[@]}"; do
        echo -e "${GREEN}$service:${NC}"
        systemctl status "$service" --no-pager -l || echo "  Service not found"
        echo
    done
}

system_info() {
    echo -e "${BLUE}=== System Information ===${NC}"
    echo
    
    echo -e "${GREEN}Hardware:${NC}"
    echo "  $(cat /proc/cpuinfo | grep 'model name' | head -1 | cut -d: -f2 | xargs)"
    echo "  $(grep 'Model' /proc/cpuinfo | cut -d: -f2 | xargs)"
    echo "  Memory: $(free -h | awk 'NR==2{print $2}')"
    echo
    
    echo -e "${GREEN}Operating System:${NC}"
    source /etc/os-release
    echo "  OS: $PRETTY_NAME"
    echo "  Kernel: $(uname -r)"
    echo "  Architecture: $(uname -m)"
    echo
    
    echo -e "${GREEN}Pi5 Supernode:${NC}"
    [[ -f "$INSTALL_DIR/VERSION" ]] && echo "  Version: $(cat "$INSTALL_DIR/VERSION")"
    echo "  Install Directory: $INSTALL_DIR"
    echo "  Config Directory: $CONFIG_DIR"
    echo "  Log Directory: $LOG_DIR"
    echo
    
    echo -e "${GREEN}Network Interfaces:${NC}"
    ip link show | grep -E '^[0-9]+:' | awk '{print "  " $2}' | sed 's/:$//'
    echo
}

network_status() {
    echo -e "${BLUE}=== Network Status ===${NC}"
    echo
    
    echo -e "${GREEN}Interface Status:${NC}"
    ip -brief addr show
    echo
    
    echo -e "${GREEN}Routing Table:${NC}"
    ip route show
    echo
    
    echo -e "${GREEN}Active Connections:${NC}"
    ss -tuln | head -10
    echo
    
    echo -e "${GREEN}Firewall Status:${NC}"
    sudo ufw status verbose
    echo
}

update_system() {
    echo -e "${BLUE}=== Updating System ===${NC}"
    echo
    
    echo "Updating package lists..."
    sudo apt update
    
    echo "Upgrading packages..."
    sudo apt upgrade -y
    
    echo "Cleaning up..."
    sudo apt autoremove -y
    sudo apt autoclean
    
    echo -e "${GREEN}System update completed${NC}"
}

restart_services() {
    echo -e "${BLUE}=== Restarting Services ===${NC}"
    echo
    
    local services=("pi5-supernode" "pi5-network-monitor" "nginx")
    
    for service in "${services[@]}"; do
        echo "Restarting $service..."
        sudo systemctl restart "$service" || echo "Failed to restart $service"
    done
    
    echo -e "${GREEN}Services restarted${NC}"
}

clean_logs() {
    echo -e "${BLUE}=== Cleaning Logs ===${NC}"
    echo
    
    # Clean systemd journals
    echo "Cleaning systemd journals..."
    sudo journalctl --vacuum-time=7d
    sudo journalctl --vacuum-size=100M
    
    # Clean application logs
    if [[ -d "$LOG_DIR" ]]; then
        echo "Cleaning application logs..."
        sudo find "$LOG_DIR" -name "*.log" -mtime +7 -delete
        sudo find "$LOG_DIR" -name "*.log.gz" -mtime +30 -delete
    fi
    
    # Clean temporary files
    echo "Cleaning temporary files..."
    sudo find /tmp -name "pi5-*" -mtime +1 -delete 2>/dev/null || true
    
    echo -e "${GREEN}Log cleanup completed${NC}"
}

backup_config() {
    echo -e "${BLUE}=== Creating Configuration Backup ===${NC}"
    echo
    
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/config-backup-$timestamp.tar.gz"
    
    mkdir -p "$BACKUP_DIR"
    
    echo "Creating backup: $backup_file"
    tar -czf "$backup_file" \
        -C / \
        $([ -d "$CONFIG_DIR" ] && echo "${CONFIG_DIR#/}") \
        $([ -d "$INSTALL_DIR/data" ] && echo "${INSTALL_DIR#/}/data") \
        2>/dev/null || true
    
    echo -e "${GREEN}Backup created: $backup_file${NC}"
}

view_logs() {
    echo -e "${BLUE}=== Live Logs ===${NC}"
    echo "Press Ctrl+C to exit"
    echo
    
    sudo journalctl -u pi5-supernode -f
}

performance_monitor() {
    echo -e "${BLUE}=== Performance Monitor ===${NC}"
    echo "Press 'q' to exit"
    echo
    
    htop
}

network_monitor() {
    echo -e "${BLUE}=== Network Monitor ===${NC}"
    echo "Press 'q' to exit"
    echo
    
    if command -v iftop >/dev/null; then
        sudo iftop
    else
        echo "iftop not available, using alternative..."
        watch -n 1 'cat /proc/net/dev'
    fi
}

security_audit() {
    echo -e "${BLUE}=== Security Audit ===${NC}"
    echo
    
    echo -e "${GREEN}Checking fail2ban status:${NC}"
    sudo fail2ban-client status
    echo
    
    echo -e "${GREEN}Recent authentication failures:${NC}"
    sudo journalctl -u ssh --since "24 hours ago" | grep -i "failed\|failure" | tail -5
    echo
    
    echo -e "${GREEN}Checking for suspicious processes:${NC}"
    ps aux | grep -E '(nc|netcat|nmap|telnet)' | grep -v grep || echo "No suspicious processes found"
    echo
    
    echo -e "${GREEN}Checking open ports:${NC}"
    sudo netstat -tuln | grep LISTEN
    echo
}

edit_config() {
    echo -e "${BLUE}=== Configuration Editor ===${NC}"
    echo
    
    echo "Available configuration files:"
    echo "1) Main environment file"
    echo "2) Nginx configuration"
    echo "3) Systemd service file"
    echo
    
    read -p "Select file to edit [1-3]: " choice
    
    case $choice in
        1)
            if [[ -f "$CONFIG_DIR/environment" ]]; then
                sudo nano "$CONFIG_DIR/environment"
            else
                echo "Environment file not found"
            fi
            ;;
        2)
            if [[ -f "/etc/nginx/sites-available/pi5-supernode" ]]; then
                sudo nano "/etc/nginx/sites-available/pi5-supernode"
            else
                echo "Nginx configuration not found"
            fi
            ;;
        3)
            if [[ -f "/etc/systemd/system/pi5-supernode.service" ]]; then
                sudo nano "/etc/systemd/system/pi5-supernode.service"
            else
                echo "Service file not found"
            fi
            ;;
        *)
            echo "Invalid selection"
            ;;
    esac
}

run_diagnostics() {
    echo -e "${BLUE}=== Running Diagnostics ===${NC}"
    echo
    
    echo "Checking installation integrity..."
    
    local issues=()
    
    # Check directories
    [[ ! -d "$INSTALL_DIR" ]] && issues+=("Installation directory missing")
    [[ ! -d "$CONFIG_DIR" ]] && issues+=("Configuration directory missing")
    [[ ! -d "$LOG_DIR" ]] && issues+=("Log directory missing")
    
    # Check user
    if ! id "$SERVICE_USER" >/dev/null 2>&1; then
        issues+=("Service user missing")
    fi
    
    # Check services
    if ! systemctl is-enabled --quiet pi5-supernode 2>/dev/null; then
        issues+=("Main service not enabled")
    fi
    
    # Check key files
    [[ ! -f "$CONFIG_DIR/environment" ]] && issues+=("Environment file missing")
    [[ ! -f "/etc/systemd/system/pi5-supernode.service" ]] && issues+=("Service file missing")
    
    if [[ ${#issues[@]} -eq 0 ]]; then
        echo -e "${GREEN}✓ No issues detected${NC}"
    else
        echo -e "${RED}Issues detected:${NC}"
        for issue in "${issues[@]}"; do
            echo -e "  ${RED}✗${NC} $issue"
        done
    fi
    echo
}

fix_permissions() {
    echo -e "${BLUE}=== Fixing Permissions ===${NC}"
    echo
    
    echo "Fixing directory permissions..."
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR" 2>/dev/null || true
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$LOG_DIR" 2>/dev/null || true
    sudo chmod 755 "$INSTALL_DIR" 2>/dev/null || true
    sudo chmod 755 "$LOG_DIR" 2>/dev/null || true
    
    echo "Fixing configuration permissions..."
    sudo chown "$SERVICE_USER:$SERVICE_USER" "$CONFIG_DIR/environment" 2>/dev/null || true
    sudo chmod 600 "$CONFIG_DIR/environment" 2>/dev/null || true
    
    echo "Fixing script permissions..."
    sudo chmod +x "$INSTALL_DIR/scripts/"*.sh 2>/dev/null || true
    
    echo -e "${GREEN}Permissions fixed${NC}"
}

emergency_recovery() {
    echo -e "${RED}=== Emergency Recovery ===${NC}"
    echo
    
    echo -e "${YELLOW}WARNING: This will reset the Pi5 Supernode installation${NC}"
    read -p "Continue? [y/N]: " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting emergency recovery..."
        
        # Stop services
        sudo systemctl stop pi5-supernode 2>/dev/null || true
        
        # Download and run installer
        curl -sSL https://get-pi5supernode.com/install | bash -s -- --force
        
        echo -e "${GREEN}Emergency recovery completed${NC}"
    else
        echo "Recovery cancelled"
    fi
}

main() {
    while true; do
        show_banner
        show_menu
        
        read -p "Select option [0-20]: " choice
        echo
        
        case $choice in
            1) health_check ;;
            2) service_status ;;
            3) system_info ;;
            4) network_status ;;
            5) update_system ;;
            6) restart_services ;;
            7) clean_logs ;;
            8) backup_config ;;
            9) echo "Restore backup feature coming soon..." ;;
            10) view_logs ;;
            11) performance_monitor ;;
            12) network_monitor ;;
            13) security_audit ;;
            14) edit_config ;;
            15) echo "Reset configuration feature coming soon..." ;;
            16) echo "SSL certificate management feature coming soon..." ;;
            17) run_diagnostics ;;
            18) fix_permissions ;;
            19) echo "Rebuild application feature coming soon..." ;;
            20) emergency_recovery ;;
            0) echo "Goodbye!"; exit 0 ;;
            *) echo -e "${RED}Invalid option${NC}" ;;
        esac
        
        echo
        read -p "Press Enter to continue..." -r
    done
}

# Check if running as root (some functions need sudo)
if [[ $EUID -eq 0 ]]; then
    echo -e "${YELLOW}Warning: Running as root. Some functions may behave differently.${NC}"
    echo
fi

# Run main function
main
