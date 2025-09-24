#!/bin/bash

# Pi5 Supernode - Master Installation Script
# Version: 3.0.0
# Description: Complete automated one-command installation system
# Usage: curl -sSL https://get-pi5supernode.com/install | bash

set -euo pipefail

# Script version and configuration
VERSION="3.0.0"
SCRIPT_NAME="Pi5 Supernode Master Installer"
INSTALL_DIR="/opt/pi5-supernode"
LOG_DIR="/var/log/pi5-supernode"
LOG_FILE="$LOG_DIR/install-$(date +%Y%m%d-%H%M%S).log"
CONFIG_DIR="/etc/pi5-supernode"
BACKUP_DIR="/var/backups/pi5-supernode"

# Repository and download URLs
REPO_URL="https://github.com/pi5-supernode/platform.git"
INSTALLER_BASE_URL="https://get-pi5supernode.com"

# Installation modes
INTERACTIVE=false
DEV_MODE=false
OFFLINE_MODE=false
FORCE_INSTALL=false
SKIP_VERIFICATION=false

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Progress tracking
TOTAL_STEPS=25
CURRENT_STEP=0
START_TIME=$(date +%s)

# System requirements
MIN_DISK_SPACE_GB=8
MIN_MEMORY_GB=4
REQUIRED_ARCH="aarch64"

# Service configuration
SERVICE_USER="pi5-supernode"
WEB_PORT=3000
API_PORT=3001
MONITORING_PORT=3002

# Error tracking
ERROR_COUNT=0
WARNING_COUNT=0
ERROR_LOG="/tmp/pi5-install-errors.log"

# Rollback configuration
ROLLBACK_ENABLED=true
ROLLBACK_POINTS=()

# ===============================================================================
# LOGGING AND OUTPUT FUNCTIONS
# ===============================================================================

# Initialize logging
init_logging() {
    # Create log directory
    sudo mkdir -p "$LOG_DIR"
    sudo touch "$LOG_FILE"
    sudo chmod 644 "$LOG_FILE"
    
    # Create error log
    touch "$ERROR_LOG"
    
    # Start logging
    exec 1> >(tee -a "$LOG_FILE")
    exec 2> >(tee -a "$LOG_FILE" >&2)
}

# Progress indicator
show_progress() {
    local step=$1
    local total=$2
    local message="$3"
    local percentage=$((step * 100 / total))
    local filled=$((percentage / 2))
    local empty=$((50 - filled))
    
    printf "\r${BLUE}[%3d%%]${NC} [" "$percentage"
    printf "%*s" "$filled" '' | tr ' ' '█'
    printf "%*s" "$empty" '' | tr ' ' '░'
    printf "] ${WHITE}%s${NC}" "$message"
    
    if [[ $step -eq $total ]]; then
        echo
    fi
}

# Logging functions
log_info() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[INFO]${NC} [$timestamp] $1" | tee -a "$LOG_FILE"
}

log_warn() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[WARN]${NC} [$timestamp] $1" | tee -a "$LOG_FILE"
    ((WARNING_COUNT++))
}

log_error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[ERROR]${NC} [$timestamp] $1" | tee -a "$LOG_FILE" "$ERROR_LOG"
    ((ERROR_COUNT++))
}

log_success() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[SUCCESS]${NC} [$timestamp] $1" | tee -a "$LOG_FILE"
}

log_step() {
    ((CURRENT_STEP++))
    show_progress "$CURRENT_STEP" "$TOTAL_STEPS" "$1"
    log_info "Step $CURRENT_STEP/$TOTAL_STEPS: $1"
}

# ===============================================================================
# ERROR HANDLING AND ROLLBACK
# ===============================================================================

# Error handler
error_handler() {
    local line_number=$1
    local error_code=$2
    local command="$3"
    
    log_error "Script failed at line $line_number with exit code $error_code"
    log_error "Failed command: $command"
    
    if [[ $ROLLBACK_ENABLED == true ]]; then
        log_info "Starting rollback procedure..."
        perform_rollback
    fi
    
    show_error_summary
    exit "$error_code"
}

# Set error trap
trap 'error_handler $LINENO $? "$BASH_COMMAND"' ERR
trap 'log_warn "Installation interrupted by user"; perform_rollback; exit 130' INT TERM

# Create rollback point
create_rollback_point() {
    local point_name="$1"
    local timestamp=$(date +%s)
    ROLLBACK_POINTS+=("$timestamp:$point_name")
    log_info "Created rollback point: $point_name"
}

# Perform rollback
perform_rollback() {
    log_warn "Starting rollback procedure..."
    
    # Stop services if they were started
    sudo systemctl stop pi5-supernode 2>/dev/null || true
    sudo systemctl disable pi5-supernode 2>/dev/null || true
    
    # Remove created directories
    sudo rm -rf "$INSTALL_DIR" 2>/dev/null || true
    sudo rm -rf "$CONFIG_DIR" 2>/dev/null || true
    
    # Remove service files
    sudo rm -f /etc/systemd/system/pi5-supernode.service 2>/dev/null || true
    sudo systemctl daemon-reload 2>/dev/null || true
    
    # Remove user if created
    sudo userdel -r "$SERVICE_USER" 2>/dev/null || true
    
    log_info "Rollback completed"
}

# ===============================================================================
# SYSTEM REQUIREMENTS AND VALIDATION
# ===============================================================================

# Check if running on Raspberry Pi 5
check_hardware() {
    log_step "Checking hardware compatibility"
    
    # Check for Raspberry Pi
    if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
        log_error "This installer requires a Raspberry Pi system"
        return 1
    fi
    
    # Check architecture
    local arch=$(uname -m)
    if [[ "$arch" != "aarch64" ]] && [[ "$arch" != "armv7l" ]]; then
        log_warn "Detected architecture: $arch (recommended: aarch64)"
    fi
    
    # Check for Pi5 specific features
    if grep -q "Raspberry Pi 5" /proc/cpuinfo 2>/dev/null; then
        log_success "Raspberry Pi 5 detected"
    else
        log_warn "Raspberry Pi 5 not detected, continuing anyway"
    fi
    
    return 0
}

# Check system requirements
check_system_requirements() {
    log_step "Checking system requirements"
    
    # Check available disk space
    local available_space=$(df / | tail -1 | awk '{print $4}')
    local required_space=$((MIN_DISK_SPACE_GB * 1024 * 1024))
    
    if [[ $available_space -lt $required_space ]]; then
        log_error "Insufficient disk space. Required: ${MIN_DISK_SPACE_GB}GB, Available: $((available_space / 1024 / 1024))GB"
        return 1
    fi
    
    # Check available memory
    local total_memory=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local required_memory=$((MIN_MEMORY_GB * 1024 * 1024))
    
    if [[ $total_memory -lt $required_memory ]]; then
        log_warn "Low memory detected. Required: ${MIN_MEMORY_GB}GB, Available: $((total_memory / 1024 / 1024))GB"
    fi
    
    # Check internet connectivity
    if ! ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        if [[ $OFFLINE_MODE != true ]]; then
            log_error "No internet connectivity detected. Use --offline for offline installation"
            return 1
        fi
    fi
    
    # Check sudo access
    if ! sudo -n true 2>/dev/null; then
        log_error "This script requires sudo access"
        return 1
    fi
    
    log_success "All system requirements satisfied"
    return 0
}

# Check for conflicting installations
check_conflicts() {
    log_step "Checking for conflicting installations"
    
    local conflicts=()
    
    # Check for existing pi5-supernode
    if [[ -d "$INSTALL_DIR" ]] && [[ $FORCE_INSTALL != true ]]; then
        conflicts+=("Existing Pi5 Supernode installation found")
    fi
    
    # Check for conflicting services
    if systemctl is-active --quiet hostapd 2>/dev/null; then
        conflicts+=("hostapd service is running")
    fi
    
    if systemctl is-active --quiet dnsmasq 2>/dev/null; then
        conflicts+=("dnsmasq service is running")
    fi
    
    # Check for port conflicts
    if netstat -tuln 2>/dev/null | grep -q ":$WEB_PORT "; then
        conflicts+=("Port $WEB_PORT is already in use")
    fi
    
    if [[ ${#conflicts[@]} -gt 0 ]]; then
        log_warn "Potential conflicts detected:"
        for conflict in "${conflicts[@]}"; do
            log_warn "  - $conflict"
        done
        
        if [[ $INTERACTIVE == true ]]; then
            read -p "Continue anyway? [y/N]: " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Installation cancelled by user"
                exit 0
            fi
        elif [[ $FORCE_INSTALL != true ]]; then
            log_error "Use --force to continue despite conflicts"
            return 1
        fi
    fi
    
    return 0
}

# ===============================================================================
# PACKAGE INSTALLATION
# ===============================================================================

# Update system packages
update_system() {
    log_step "Updating system packages"
    
    # Update package lists
    sudo apt update -qq
    
    # Upgrade existing packages
    sudo apt upgrade -y -qq
    
    log_success "System packages updated"
}

# Install network management tools
install_network_tools() {
    log_step "Installing network management tools"
    
    local packages=(
        iproute2
        bridge-utils
        vlan
        ethtool
        net-tools
        wireless-tools
        wpasupplicant
        hostapd
        dnsmasq
        netplan.io
        ifupdown
        usb-modeswitch
        usb-modeswitch-data
        usbutils
        pciutils
    )
    
    sudo apt install -y -qq "${packages[@]}"
    
    log_success "Network management tools installed"
}

# Install VPN software
install_vpn_software() {
    log_step "Installing VPN software"
    
    local packages=(
        openvpn
        easy-rsa
        wireguard
        wireguard-tools
        strongswan
        strongswan-pki
        libstrongswan-extra-plugins
    )
    
    sudo apt install -y -qq "${packages[@]}"
    
    # Enable WireGuard module
    sudo modprobe wireguard || log_warn "Could not load WireGuard module"
    
    log_success "VPN software installed"
}

# Install monitoring tools
install_monitoring_tools() {
    log_step "Installing monitoring tools"
    
    local packages=(
        iftop
        nload
        vnstat
        tcpdump
        wireshark-common
        iperf3
        speedtest-cli
        htop
        iotop
        tmux
        screen
    )
    
    sudo apt install -y -qq "${packages[@]}"
    
    # Configure vnstat
    sudo systemctl enable vnstat
    sudo systemctl start vnstat
    
    log_success "Monitoring tools installed"
}

# Install security packages
install_security_tools() {
    log_step "Installing security packages"
    
    local packages=(
        iptables
        iptables-persistent
        fail2ban
        ufw
        rkhunter
        chkrootkit
        unattended-upgrades
    )
    
    sudo apt install -y -qq "${packages[@]}"
    
    # Configure fail2ban
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    
    # Configure unattended upgrades
    echo 'Unattended-Upgrade::Automatic-Reboot "false";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades
    
    log_success "Security packages installed"
}

# Install development tools
install_development_tools() {
    log_step "Installing development tools"
    
    local packages=(
        git
        curl
        wget
        build-essential
        python3
        python3-pip
        python3-dev
        python3-venv
        nodejs
        npm
        nginx
        supervisor
        sqlite3
        jq
    )
    
    sudo apt install -y -qq "${packages[@]}"
    
    # Install Node.js 20.x LTS
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Install pnpm
    npm install -g pnpm
    
    log_success "Development tools installed"
}

# Install Python packages
install_python_packages() {
    log_step "Installing Python packages"
    
    local packages=(
        psutil
        netifaces
        scapy
        netaddr
        requests
        flask
        fastapi
        uvicorn
        pydantic
        sqlalchemy
        asyncio
    )
    
    pip3 install --user "${packages[@]}"
    
    log_success "Python packages installed"
}

# ===============================================================================
# SYSTEM CONFIGURATION
# ===============================================================================

# Configure system settings
configure_system() {
    log_step "Configuring system settings"
    
    # Enable IP forwarding
    echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf
    echo 'net.ipv6.conf.all.forwarding=1' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    
    # Configure network optimization
    cat << EOF | sudo tee -a /etc/sysctl.conf

# Pi5 Supernode Network Optimizations
net.core.rmem_default = 262144
net.core.rmem_max = 16777216
net.core.wmem_default = 262144
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 65536 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 30000
net.ipv4.tcp_no_metrics_save = 1
net.ipv4.tcp_congestion_control = bbr
EOF
    
    sudo sysctl -p
    
    log_success "System settings configured"
}

# Create users and directories
setup_environment() {
    log_step "Setting up environment"
    
    create_rollback_point "environment_setup"
    
    # Create service user
    sudo useradd -r -s /bin/false -d "$INSTALL_DIR" "$SERVICE_USER" || true
    
    # Create directories
    sudo mkdir -p "$INSTALL_DIR"
    sudo mkdir -p "$LOG_DIR"
    sudo mkdir -p "$CONFIG_DIR"
    sudo mkdir -p "$BACKUP_DIR"
    sudo mkdir -p "$INSTALL_DIR/data"
    sudo mkdir -p "$INSTALL_DIR/ssl"
    sudo mkdir -p "$INSTALL_DIR/scripts"
    
    # Set permissions
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$LOG_DIR"
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$BACKUP_DIR"
    sudo chmod 755 "$INSTALL_DIR"
    sudo chmod 755 "$LOG_DIR"
    sudo chmod 755 "$CONFIG_DIR"
    
    log_success "Environment setup completed"
}

# ===============================================================================
# APPLICATION DEPLOYMENT
# ===============================================================================

# Download and deploy application
deploy_application() {
    log_step "Deploying Pi5 Supernode application"
    
    create_rollback_point "application_deployment"
    
    # Clone or download application
    if [[ $OFFLINE_MODE != true ]]; then
        # Download latest release
        local temp_dir=$(mktemp -d)
        cd "$temp_dir"
        
        # Download application archive
        curl -L -o pi5-supernode.tar.gz "$INSTALLER_BASE_URL/releases/latest/pi5-supernode.tar.gz"
        tar -xzf pi5-supernode.tar.gz
        
        # Copy to installation directory
        sudo cp -r pi5-supernode/* "$INSTALL_DIR/"
        
        # Cleanup
        cd /
        rm -rf "$temp_dir"
    else
        log_warn "Offline mode: assuming application files are already present"
    fi
    
    # Set permissions
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    sudo chmod +x "$INSTALL_DIR/scripts/"*.sh
    
    log_success "Application deployed"
}

# Install application dependencies
install_app_dependencies() {
    log_step "Installing application dependencies"
    
    cd "$INSTALL_DIR"
    
    # Install frontend dependencies
    if [[ -f "package.json" ]]; then
        sudo -u "$SERVICE_USER" pnpm install --frozen-lockfile
        sudo -u "$SERVICE_USER" pnpm run build:prod
    fi
    
    log_success "Application dependencies installed"
}

# ===============================================================================
# SERVICE CONFIGURATION
# ===============================================================================

# Configure web server
configure_webserver() {
    log_step "Configuring web server"
    
    # Create nginx configuration
    sudo tee /etc/nginx/sites-available/pi5-supernode << EOF
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Main application
    location / {
        proxy_pass http://localhost:$WEB_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://localhost:$API_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Monitoring endpoints
    location /metrics {
        proxy_pass http://localhost:$MONITORING_PORT/metrics;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    # Static files
    location /static/ {
        alias $INSTALL_DIR/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/pi5-supernode /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    sudo nginx -t
    
    log_success "Web server configured"
}

# Create systemd services
create_services() {
    log_step "Creating systemd services"
    
    create_rollback_point "service_creation"
    
    # Main Pi5 Supernode service
    sudo tee /etc/systemd/system/pi5-supernode.service << EOF
[Unit]
Description=Pi5 Supernode Enterprise Network Management Platform
After=network.target
Wants=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$CONFIG_DIR/environment
ExecStartPre=/bin/bash $INSTALL_DIR/scripts/pre-start.sh
ExecStart=/bin/bash $INSTALL_DIR/scripts/start.sh
ExecStop=/bin/bash $INSTALL_DIR/scripts/stop.sh
Restart=always
RestartSec=10
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30
StandardOutput=journal
StandardError=journal

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$INSTALL_DIR $LOG_DIR $CONFIG_DIR

[Install]
WantedBy=multi-user.target
EOF
    
    # Network monitoring service
    sudo tee /etc/systemd/system/pi5-network-monitor.service << EOF
[Unit]
Description=Pi5 Supernode Network Monitoring Service
After=network.target pi5-supernode.service
Wants=pi5-supernode.service

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/python3 $INSTALL_DIR/scripts/network-monitor.py
Restart=always
RestartSec=15
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd
    sudo systemctl daemon-reload
    
    # Enable services
    sudo systemctl enable pi5-supernode
    sudo systemctl enable pi5-network-monitor
    sudo systemctl enable nginx
    
    log_success "Systemd services created"
}

# Configure firewall
configure_firewall() {
    log_step "Configuring firewall"
    
    # Reset UFW
    sudo ufw --force reset
    
    # Set default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP/HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow application ports
    sudo ufw allow "$WEB_PORT"/tcp
    sudo ufw allow "$API_PORT"/tcp
    
    # Allow VPN ports
    sudo ufw allow 51820/udp  # WireGuard
    sudo ufw allow 1194/udp   # OpenVPN
    sudo ufw allow 500/udp    # IPsec
    sudo ufw allow 4500/udp   # IPsec NAT-T
    
    # Allow monitoring (local only)
    sudo ufw allow from 127.0.0.0/8 to any port "$MONITORING_PORT"
    
    # Enable UFW
    sudo ufw --force enable
    
    log_success "Firewall configured"
}

# ===============================================================================
# VERIFICATION AND TESTING
# ===============================================================================

# Verify installation
verify_installation() {
    log_step "Verifying installation"
    
    local errors=0
    
    # Check directories
    [[ -d "$INSTALL_DIR" ]] || { log_error "Installation directory missing"; ((errors++)); }
    [[ -d "$LOG_DIR" ]] || { log_error "Log directory missing"; ((errors++)); }
    [[ -d "$CONFIG_DIR" ]] || { log_error "Config directory missing"; ((errors++)); }
    
    # Check user
    id "$SERVICE_USER" >/dev/null 2>&1 || { log_error "Service user missing"; ((errors++)); }
    
    # Check services
    [[ -f /etc/systemd/system/pi5-supernode.service ]] || { log_error "Main service file missing"; ((errors++)); }
    
    # Check web server
    sudo nginx -t >/dev/null 2>&1 || { log_error "Nginx configuration invalid"; ((errors++)); }
    
    # Check key packages
    local packages=("wireguard" "openvpn" "nginx" "python3" "nodejs")
    for package in "${packages[@]}"; do
        if ! dpkg -l | grep -q "^ii.*$package"; then
            log_error "Package $package not installed"
            ((errors++))
        fi
    done
    
    if [[ $errors -eq 0 ]]; then
        log_success "Installation verification passed"
        return 0
    else
        log_error "Installation verification failed with $errors errors"
        return 1
    fi
}

# Test services
test_services() {
    if [[ $SKIP_VERIFICATION == true ]]; then
        log_info "Skipping service testing"
        return 0
    fi
    
    log_step "Testing services"
    
    # Start services
    sudo systemctl start nginx
    sudo systemctl start pi5-supernode
    
    # Wait for services to start
    sleep 10
    
    # Test nginx
    if ! curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -q "200\|302\|301"; then
        log_error "Web server test failed"
        return 1
    fi
    
    # Test main application (if available)
    if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:"$WEB_PORT"/ | grep -q "200\|302\|301"; then
        log_warn "Main application test failed (may not be ready yet)"
    fi
    
    log_success "Service testing completed"
    return 0
}

# ===============================================================================
# INSTALLATION FINALIZATION
# ===============================================================================

# Generate configuration files
generate_configs() {
    log_step "Generating configuration files"
    
    # Create environment file
    sudo tee "$CONFIG_DIR/environment" << EOF
# Pi5 Supernode Environment Configuration
# Generated on: $(date)

# Application Settings
NODE_ENV=production
PORT=$WEB_PORT
API_PORT=$API_PORT
MONITORING_PORT=$MONITORING_PORT
HOST=0.0.0.0

# Paths
INSTALL_DIR=$INSTALL_DIR
LOG_DIR=$LOG_DIR
CONFIG_DIR=$CONFIG_DIR
DATA_DIR=$INSTALL_DIR/data

# Database
DATABASE_PATH=$INSTALL_DIR/data/pi5-supernode.db

# Network Configuration
NETWORK_INTERFACE=eth0
DHCP_RANGE_START=192.168.1.100
DHCP_RANGE_END=192.168.1.200
DNS_SERVER=8.8.8.8

# VPN Configuration
WIREGUARD_PORT=51820
OPENVPN_PORT=1194
VPN_NETWORK=10.0.0.0/24

# Security
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
API_KEY=$(openssl rand -hex 16)

# Monitoring
METRICS_ENABLED=true
LOG_LEVEL=info

# SSL/TLS
SSL_ENABLED=false
SSL_CERT_PATH=$INSTALL_DIR/ssl/cert.pem
SSL_KEY_PATH=$INSTALL_DIR/ssl/key.pem
EOF
    
    # Set permissions
    sudo chown "$SERVICE_USER:$SERVICE_USER" "$CONFIG_DIR/environment"
    sudo chmod 600 "$CONFIG_DIR/environment"
    
    log_success "Configuration files generated"
}

# Create maintenance scripts
create_maintenance_scripts() {
    log_step "Creating maintenance scripts"
    
    # Update script
    sudo tee "$INSTALL_DIR/scripts/update.sh" << 'EOF'
#!/bin/bash
# Pi5 Supernode Update Script
set -e

echo "Updating Pi5 Supernode..."

# Stop services
sudo systemctl stop pi5-supernode

# Backup current installation
sudo cp -r /opt/pi5-supernode /var/backups/pi5-supernode/backup-$(date +%Y%m%d-%H%M%S)

# Download and install updates
curl -sSL https://get-pi5supernode.com/update | bash

# Start services
sudo systemctl start pi5-supernode

echo "Update completed successfully"
EOF
    
    # Backup script
    sudo tee "$INSTALL_DIR/scripts/backup.sh" << 'EOF'
#!/bin/bash
# Pi5 Supernode Backup Script
set -e

BACKUP_DIR="/var/backups/pi5-supernode"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "Creating backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup configuration and data
tar -czf "$BACKUP_DIR/pi5-supernode-backup-$TIMESTAMP.tar.gz" \
    -C / \
    opt/pi5-supernode \
    etc/pi5-supernode \
    var/log/pi5-supernode

echo "Backup created: $BACKUP_DIR/pi5-supernode-backup-$TIMESTAMP.tar.gz"
EOF
    
    # Health check script
    sudo tee "$INSTALL_DIR/scripts/health-check.sh" << 'EOF'
#!/bin/bash
# Pi5 Supernode Health Check Script

echo "=== Pi5 Supernode Health Check ==="
echo "Timestamp: $(date)"
echo

# Check services
echo "Service Status:"
sudo systemctl is-active pi5-supernode && echo "✓ Pi5 Supernode: Running" || echo "✗ Pi5 Supernode: Stopped"
sudo systemctl is-active nginx && echo "✓ Nginx: Running" || echo "✗ Nginx: Stopped"
echo

# Check ports
echo "Port Status:"
netstat -tuln | grep ":80 " >/dev/null && echo "✓ Port 80: Open" || echo "✗ Port 80: Closed"
netstat -tuln | grep ":3000 " >/dev/null && echo "✓ Port 3000: Open" || echo "✗ Port 3000: Closed"
echo

# Check disk space
echo "Disk Usage:"
df -h / | tail -1
echo

# Check memory
echo "Memory Usage:"
free -h
echo

# Check logs for errors
echo "Recent Errors:"
sudo journalctl -u pi5-supernode --since "1 hour ago" --no-pager | grep -i error | tail -5 || echo "No recent errors"
EOF
    
    # Make scripts executable
    sudo chmod +x "$INSTALL_DIR/scripts/"*.sh
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/scripts"
    
    log_success "Maintenance scripts created"
}

# Setup log rotation
setup_log_rotation() {
    log_step "Setting up log rotation"
    
    sudo tee /etc/logrotate.d/pi5-supernode << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    create 644 $SERVICE_USER $SERVICE_USER
}
EOF
    
    log_success "Log rotation configured"
}

# ===============================================================================
# ERROR HANDLING AND REPORTING
# ===============================================================================

# Show error summary
show_error_summary() {
    if [[ $ERROR_COUNT -gt 0 ]] || [[ $WARNING_COUNT -gt 0 ]]; then
        echo
        echo -e "${RED}=== INSTALLATION SUMMARY ===${NC}"
        [[ $ERROR_COUNT -gt 0 ]] && echo -e "${RED}Errors: $ERROR_COUNT${NC}"
        [[ $WARNING_COUNT -gt 0 ]] && echo -e "${YELLOW}Warnings: $WARNING_COUNT${NC}"
        echo
        
        if [[ -f "$ERROR_LOG" ]] && [[ -s "$ERROR_LOG" ]]; then
            echo -e "${RED}Error Details:${NC}"
            cat "$ERROR_LOG"
            echo
        fi
        
        echo -e "${BLUE}Troubleshooting:${NC}"
        echo "1. Check the full log: $LOG_FILE"
        echo "2. Run the verification script: $INSTALL_DIR/scripts/health-check.sh"
        echo "3. Visit: https://docs.pi5-supernode.com/troubleshooting"
        echo
    fi
}

# ===============================================================================
# MAIN INSTALLATION FLOW
# ===============================================================================

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --interactive)
                INTERACTIVE=true
                shift
                ;;
            --dev-mode)
                DEV_MODE=true
                shift
                ;;
            --offline)
                OFFLINE_MODE=true
                shift
                ;;
            --force)
                FORCE_INSTALL=true
                shift
                ;;
            --skip-verification)
                SKIP_VERIFICATION=true
                shift
                ;;
            --no-rollback)
                ROLLBACK_ENABLED=false
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Show usage information
show_usage() {
    cat << EOF
$SCRIPT_NAME v$VERSION

Usage: $0 [OPTIONS]

Options:
  --interactive        Enable interactive installation mode
  --dev-mode          Enable development mode with debug features
  --offline           Enable offline installation mode
  --force             Force installation despite conflicts
  --skip-verification Skip post-installation verification
  --no-rollback       Disable automatic rollback on errors
  --help              Show this help message

One-command installation:
  curl -sSL https://get-pi5supernode.com/install | bash

With options:
  curl -sSL https://get-pi5supernode.com/install | bash -s -- --interactive

Offline installation:
  wget https://get-pi5supernode.com/offline-installer.tar.gz
  tar -xzf offline-installer.tar.gz && ./install.sh --offline

EOF
}

# Show welcome banner
show_banner() {
    clear
    cat << 'EOF'

████████████████████████████████████████████████████████████████████████████████
█                                                                              █
█   ____  _ ____    ____                                     _                 █
█  |  _ \(_) ___|  / ___| _   _ _ __   ___ _ __ _ __   ___   __| | ___           █
█  | |_) | |___ \  \___ \| | | | '_ \ / _ \ '__| '_ \ / _ \ / _` |/ _ \          █
█  |  __/| |___) |  ___) | |_| | |_) |  __/ |  | | | | (_) | (_| |  __/          █
█  |_|   |_|____/  |____/ \__,_| .__/ \___|_|  |_| |_|\___/ \__,_|\___|          █
█                              |_|                                             █
█                                                                              █
█              Enterprise Network Management Platform                          █
█                     Automated Installer v3.0.0                             █
█                                                                              █
████████████████████████████████████████████████████████████████████████████████

EOF

    echo -e "${GREEN}Welcome to the Pi5 Supernode Automated Installation System${NC}"
    echo
    echo -e "${BLUE}This installer will:${NC}"
    echo "  • Install all required packages and dependencies"
    echo "  • Configure network management tools and VPN software"
    echo "  • Deploy the Pi5 Supernode web interface"
    echo "  • Set up monitoring and security services"
    echo "  • Configure automatic startup and maintenance"
    echo
    
    if [[ $INTERACTIVE == true ]]; then
        echo -e "${YELLOW}Press Enter to continue or Ctrl+C to cancel...${NC}"
        read -r
    else
        echo -e "${GREEN}Starting automated installation in 5 seconds...${NC}"
        sleep 5
    fi
    
    echo
}

# Show completion information
show_completion() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    clear
    cat << 'EOF'

████████████████████████████████████████████████████████████████████████████████
█                                                                              █
█   ██████  ██████  ███    ███ ██████  ██      ███████ ████████ ███████        █
█  ██      ██    ██ ████  ████ ██   ██ ██      ██         ██    ██             █
█  ██      ██    ██ ██ ████ ██ ██████  ██      █████      ██    █████          █
█  ██      ██    ██ ██  ██  ██ ██      ██      ██         ██    ██             █
█   ██████  ██████  ██      ██ ██      ███████ ███████    ██    ███████        █
█                                                                              █
████████████████████████████████████████████████████████████████████████████████

EOF
    
    echo -e "${GREEN}🎉 Pi5 Supernode installation completed successfully!${NC}"
    echo
    echo -e "${BOLD}Installation Summary:${NC}"
    echo -e "  Duration: ${minutes}m ${seconds}s"
    echo -e "  Errors: $ERROR_COUNT"
    echo -e "  Warnings: $WARNING_COUNT"
    echo -e "  Log file: $LOG_FILE"
    echo
    
    # Get local IP address
    local local_ip
    local_ip=$(hostname -I | awk '{print $1}')
    
    echo -e "${BOLD}Access Information:${NC}"
    echo -e "  ${GREEN}Web Interface:${NC} http://$local_ip or http://localhost"
    echo -e "  ${GREEN}Management API:${NC} http://$local_ip:$API_PORT"
    echo -e "  ${GREEN}System Status:${NC} $INSTALL_DIR/scripts/health-check.sh"
    echo
    
    echo -e "${BOLD}Next Steps:${NC}"
    echo "  1. 🌐 Open your web browser and navigate to: http://$local_ip"
    echo "  2. 🔧 Complete the initial setup wizard"
    echo "  3. 🔒 Configure your network interfaces and security settings"
    echo "  4. 📊 Set up monitoring and alerts"
    echo "  5. 📚 Review the documentation at: https://docs.pi5-supernode.com"
    echo
    
    echo -e "${BOLD}Useful Commands:${NC}"
    echo -e "  ${CYAN}Service Status:${NC} sudo systemctl status pi5-supernode"
    echo -e "  ${CYAN}View Logs:${NC} sudo journalctl -u pi5-supernode -f"
    echo -e "  ${CYAN}Health Check:${NC} $INSTALL_DIR/scripts/health-check.sh"
    echo -e "  ${CYAN}Update System:${NC} $INSTALL_DIR/scripts/update.sh"
    echo -e "  ${CYAN}Backup Config:${NC} $INSTALL_DIR/scripts/backup.sh"
    echo
    
    if [[ $WARNING_COUNT -gt 0 ]] || [[ $ERROR_COUNT -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  Some issues were detected during installation.${NC}"
        echo -e "   Check the log file: $LOG_FILE"
        echo -e "   Run health check: $INSTALL_DIR/scripts/health-check.sh"
        echo
    fi
    
    echo -e "${GREEN}Thank you for choosing Pi5 Supernode!${NC}"
    echo -e "${BLUE}For support and documentation: https://docs.pi5-supernode.com${NC}"
    echo
}

# Main installation function
main() {
    # Parse arguments
    parse_arguments "$@"
    
    # Initialize logging
    init_logging
    
    # Show banner
    show_banner
    
    # Execute installation steps
    log_info "Starting Pi5 Supernode installation v$VERSION"
    log_info "Installation mode: $([ $INTERACTIVE == true ] && echo "Interactive" || echo "Automated")"
    log_info "Target directory: $INSTALL_DIR"
    
    # Pre-installation checks
    check_hardware
    check_system_requirements
    check_conflicts
    
    # System preparation
    update_system
    
    # Package installation
    install_network_tools
    install_vpn_software
    install_monitoring_tools
    install_security_tools
    install_development_tools
    install_python_packages
    
    # System configuration
    configure_system
    setup_environment
    
    # Application deployment
    deploy_application
    install_app_dependencies
    
    # Service configuration
    configure_webserver
    create_services
    configure_firewall
    
    # Finalization
    generate_configs
    create_maintenance_scripts
    setup_log_rotation
    
    # Verification
    verify_installation
    test_services
    
    log_step "Installation completed"
    
    # Show completion information
    show_completion
    
    # Cleanup
    rm -f "$ERROR_LOG"
    
    return 0
}

# ===============================================================================
# SCRIPT EXECUTION
# ===============================================================================

# Handle script being piped from curl
if [[ -p /dev/stdin ]] && [[ $# -eq 0 ]]; then
    # Save script to temporary file when piped from curl
    TEMP_SCRIPT=$(mktemp)
    cat > "$TEMP_SCRIPT"
    chmod +x "$TEMP_SCRIPT"
    exec "$TEMP_SCRIPT"
else
    # Run directly with arguments
    main "$@"
fi
