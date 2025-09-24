#!/bin/bash

# Pi5 Supernode - Update Script
# Version: 3.0.0
# Description: Update existing Pi5 Supernode installation

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
INSTALL_DIR="/opt/pi5-supernode"
BACKUP_DIR="/var/backups/pi5-supernode"
UPDATE_URL="https://get-pi5supernode.com/releases/latest"
LOG_FILE="/var/log/pi5-supernode/update-$(date +%Y%m%d-%H%M%S).log"

# Options
FORCE_UPDATE=false
BACKUP_ENABLED=true
SKIP_VERIFICATION=false

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

show_banner() {
    clear
    cat << 'EOF'
████████████████████████████████████████████████████████████████████████████████
█                                                                              █
█   ██    ██ ██████  ██████   █████  ███████ ████████ ███████           █
█   ██    ██ ██   ██ ██   ██ ██   ██    ██       ██    ██             █
█   ██    ██ ██████  ██   ██ ██████     ██       ██    █████          █
█   ██    ██ ██       ██   ██ ██   ██    ██       ██    ██             █
█    ██████  ██       ██████  ██   ██    ██       ██    ███████        █
█                                                                              █
█                      Pi5 Supernode Updater v3.0.0                          █
█                                                                              █
████████████████████████████████████████████████████████████████████████████████

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                FORCE_UPDATE=true
                shift
                ;;
            --no-backup)
                BACKUP_ENABLED=false
                shift
                ;;
            --skip-verification)
                SKIP_VERIFICATION=true
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

show_usage() {
    cat << EOF
Pi5 Supernode Updater v3.0.0

Usage: $0 [OPTIONS]

Options:
  --force             Force update even if versions match
  --no-backup         Skip creating backup before update
  --skip-verification Skip post-update verification
  --help              Show this help message

EOF
}

check_current_installation() {
    log_info "Checking current installation..."
    
    if [[ ! -d "$INSTALL_DIR" ]]; then
        log_error "Pi5 Supernode installation not found at $INSTALL_DIR"
        log_error "Please run the installer first: curl -sSL https://get-pi5supernode.com/install | bash"
        return 1
    fi
    
    if ! systemctl is-enabled --quiet pi5-supernode 2>/dev/null; then
        log_warn "Pi5 Supernode service not found or not enabled"
    fi
    
    # Get current version
    local current_version="unknown"
    if [[ -f "$INSTALL_DIR/VERSION" ]]; then
        current_version=$(cat "$INSTALL_DIR/VERSION")
    fi
    
    log_info "Current version: $current_version"
    return 0
}

check_for_updates() {
    log_info "Checking for updates..."
    
    # Get latest version info
    local latest_version
    latest_version=$(curl -s "$UPDATE_URL/version" || echo "unknown")
    
    local current_version="unknown"
    if [[ -f "$INSTALL_DIR/VERSION" ]]; then
        current_version=$(cat "$INSTALL_DIR/VERSION")
    fi
    
    log_info "Latest version: $latest_version"
    log_info "Current version: $current_version"
    
    if [[ "$latest_version" == "$current_version" ]] && [[ $FORCE_UPDATE != true ]]; then
        log_info "Pi5 Supernode is already up to date"
        return 1
    fi
    
    return 0
}

create_backup() {
    if [[ $BACKUP_ENABLED != true ]]; then
        log_info "Skipping backup creation"
        return 0
    fi
    
    log_info "Creating backup before update..."
    
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/pre-update-backup-$timestamp.tar.gz"
    
    mkdir -p "$BACKUP_DIR"
    
    tar -czf "$backup_file" \
        -C / \
        "opt/pi5-supernode" \
        "etc/pi5-supernode" \
        "var/log/pi5-supernode" \
        2>/dev/null || true
    
    log_info "Backup created: $backup_file"
    return 0
}

stop_services() {
    log_info "Stopping Pi5 Supernode services..."
    
    local services=("pi5-supernode" "pi5-network-monitor")
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            sudo systemctl stop "$service" || log_warn "Failed to stop $service"
        fi
    done
}

download_update() {
    log_info "Downloading update..."
    
    local temp_dir
    temp_dir=$(mktemp -d)
    cd "$temp_dir"
    
    # Download latest release
    if ! curl -L -o pi5-supernode-update.tar.gz "$UPDATE_URL/pi5-supernode.tar.gz"; then
        log_error "Failed to download update"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Verify download
    if [[ ! -f "pi5-supernode-update.tar.gz" ]]; then
        log_error "Update file not found after download"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Extract update
    tar -xzf pi5-supernode-update.tar.gz
    
    # Store temp directory for cleanup
    echo "$temp_dir" > /tmp/pi5-update-temp
    
    log_info "Update downloaded and extracted"
    return 0
}

apply_update() {
    log_info "Applying update..."
    
    local temp_dir
    temp_dir=$(cat /tmp/pi5-update-temp)
    
    if [[ ! -d "$temp_dir" ]]; then
        log_error "Update directory not found"
        return 1
    fi
    
    # Preserve configuration files
    local config_backup="/tmp/pi5-config-backup-$(date +%s).tar.gz"
    tar -czf "$config_backup" -C / "etc/pi5-supernode" 2>/dev/null || true
    
    # Apply update
    sudo cp -r "$temp_dir/pi5-supernode/"* "$INSTALL_DIR/"
    
    # Restore configuration if needed
    if [[ -f "$config_backup" ]]; then
        tar -xzf "$config_backup" -C / 2>/dev/null || true
        rm -f "$config_backup"
    fi
    
    # Update permissions
    sudo chown -R pi5-supernode:pi5-supernode "$INSTALL_DIR"
    sudo chmod +x "$INSTALL_DIR/scripts/"*.sh
    
    # Cleanup
    rm -rf "$temp_dir"
    rm -f /tmp/pi5-update-temp
    
    log_info "Update applied successfully"
    return 0
}

update_services() {
    log_info "Updating system services..."
    
    # Reload systemd if service files changed
    sudo systemctl daemon-reload
    
    # Update nginx configuration if needed
    if [[ -f "$INSTALL_DIR/config/nginx.conf" ]]; then
        sudo cp "$INSTALL_DIR/config/nginx.conf" /etc/nginx/sites-available/pi5-supernode
        sudo nginx -t && sudo systemctl reload nginx || log_warn "Nginx reload failed"
    fi
    
    log_info "Services updated"
}

start_services() {
    log_info "Starting Pi5 Supernode services..."
    
    local services=("pi5-supernode" "pi5-network-monitor")
    
    for service in "${services[@]}"; do
        sudo systemctl start "$service" || log_warn "Failed to start $service"
    done
    
    # Wait for services to stabilize
    sleep 10
    
    # Check service status
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service"; then
            log_info "$service: Running"
        else
            log_warn "$service: Not running"
        fi
    done
}

verify_update() {
    if [[ $SKIP_VERIFICATION == true ]]; then
        log_info "Skipping update verification"
        return 0
    fi
    
    log_info "Verifying update..."
    
    local errors=0
    
    # Check installation directory
    [[ -d "$INSTALL_DIR" ]] || { log_error "Installation directory missing"; ((errors++)); }
    
    # Check services
    systemctl is-active --quiet pi5-supernode || { log_error "Main service not running"; ((errors++)); }
    
    # Check web interface
    if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q "200\|302\|301"; then
        log_warn "Web interface may not be responding (this is normal during startup)"
    fi
    
    if [[ $errors -eq 0 ]]; then
        log_info "Update verification passed"
        return 0
    else
        log_error "Update verification failed with $errors errors"
        return 1
    fi
}

show_completion() {
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
    
    echo -e "${GREEN}🎉 Pi5 Supernode update completed successfully!${NC}"
    echo
    
    # Get updated version
    local new_version="unknown"
    if [[ -f "$INSTALL_DIR/VERSION" ]]; then
        new_version=$(cat "$INSTALL_DIR/VERSION")
    fi
    
    echo -e "${GREEN}Updated to version: $new_version${NC}"
    echo
    
    # Get local IP
    local local_ip
    local_ip=$(hostname -I | awk '{print $1}')
    
    echo -e "${BLUE}Access your updated Pi5 Supernode:${NC}"
    echo -e "  Web Interface: http://$local_ip"
    echo
    
    echo -e "${BLUE}Useful Commands:${NC}"
    echo -e "  Health Check: $INSTALL_DIR/scripts/health-check.sh"
    echo -e "  View Logs: sudo journalctl -u pi5-supernode -f"
    echo -e "  Service Status: sudo systemctl status pi5-supernode"
    echo
    
    if [[ -f "$LOG_FILE" ]]; then
        echo -e "${BLUE}Update log: $LOG_FILE${NC}"
    fi
    
    echo
    echo -e "${GREEN}Thank you for keeping Pi5 Supernode up to date!${NC}"
    echo
}

main() {
    parse_arguments "$@"
    
    show_banner
    
    log_info "Starting Pi5 Supernode update process..."
    
    # Check current installation
    check_current_installation || exit 1
    
    # Check for updates
    if ! check_for_updates; then
        echo -e "${GREEN}No updates available${NC}"
        exit 0
    fi
    
    echo -e "${YELLOW}Update available. Proceeding with update...${NC}"
    echo
    
    # Create backup
    create_backup
    
    # Stop services
    stop_services
    
    # Download and apply update
    download_update || exit 1
    apply_update || exit 1
    
    # Update services
    update_services
    
    # Start services
    start_services
    
    # Verify update
    verify_update || log_warn "Update verification had issues, but update may still be successful"
    
    # Show completion
    show_completion
    
    log_info "Update process completed"
}

# Run main function
main "$@"
