#!/bin/bash

# Pi5 Supernode - Complete Uninstaller Script
# Version: 3.0.0
# Description: Completely remove Pi5 Supernode installation

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
INSTALL_DIR="/opt/pi5-supernode"
LOG_DIR="/var/log/pi5-supernode"
CONFIG_DIR="/etc/pi5-supernode"
BACKUP_DIR="/var/backups/pi5-supernode"
SERVICE_USER="pi5-supernode"
LOG_FILE="/tmp/pi5-uninstall-$(date +%Y%m%d-%H%M%S).log"

# Options
KEEP_BACKUPS=false
KEEP_LOGS=false
FORCE_REMOVE=false
INTERACTIVE=true

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
█   ██    ██ ███    ██ ██ ███    ██ ███████ ████████  █████  ██      ██       █
█   ██    ██ ████   ██ ██ ████   ██ ██         ██    ██   ██ ██      ██       █
█   ██    ██ ██ ██  ██ ██ ██ ██  ██ ███████    ██    ███████ ██      ██       █
█   ██    ██ ██  ██ ██ ██ ██  ██ ██      ██    ██    ██   ██ ██      ██       █
█    ██████  ██   ████ ██ ██   ████ ███████    ██    ██   ██ ███████ ███████  █
█                                                                              █
█                    Pi5 Supernode Uninstaller v3.0.0                         █
█                                                                              █
████████████████████████████████████████████████████████████████████████████████

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --keep-backups)
                KEEP_BACKUPS=true
                shift
                ;;
            --keep-logs)
                KEEP_LOGS=true
                shift
                ;;
            --force)
                FORCE_REMOVE=true
                INTERACTIVE=false
                shift
                ;;
            --non-interactive)
                INTERACTIVE=false
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
Pi5 Supernode Uninstaller v3.0.0

Usage: $0 [OPTIONS]

Options:
  --keep-backups      Keep backup files
  --keep-logs         Keep log files
  --force             Force removal without confirmation
  --non-interactive   Run without user prompts
  --help              Show this help message

EOF
}

create_backup() {
    log_info "Creating final backup before removal..."
    
    local backup_file="$BACKUP_DIR/final-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    mkdir -p "$BACKUP_DIR"
    
    if [[ -d "$INSTALL_DIR" ]] || [[ -d "$CONFIG_DIR" ]]; then
        tar -czf "$backup_file" \
            $([ -d "$INSTALL_DIR" ] && echo "$INSTALL_DIR") \
            $([ -d "$CONFIG_DIR" ] && echo "$CONFIG_DIR") \
            $([ -d "$LOG_DIR" ] && echo "$LOG_DIR") \
            2>/dev/null || true
            
        log_info "Backup created: $backup_file"
    fi
}

stop_services() {
    log_info "Stopping Pi5 Supernode services..."
    
    local services=("pi5-supernode" "pi5-network-monitor")
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            log_info "Stopping $service..."
            sudo systemctl stop "$service" || log_warn "Failed to stop $service"
        fi
        
        if systemctl is-enabled --quiet "$service" 2>/dev/null; then
            log_info "Disabling $service..."
            sudo systemctl disable "$service" || log_warn "Failed to disable $service"
        fi
    done
}

remove_services() {
    log_info "Removing systemd service files..."
    
    local service_files=(
        "/etc/systemd/system/pi5-supernode.service"
        "/etc/systemd/system/pi5-network-monitor.service"
    )
    
    for service_file in "${service_files[@]}"; do
        if [[ -f "$service_file" ]]; then
            sudo rm -f "$service_file"
            log_info "Removed $service_file"
        fi
    done
    
    sudo systemctl daemon-reload
}

remove_nginx_config() {
    log_info "Removing nginx configuration..."
    
    if [[ -f "/etc/nginx/sites-available/pi5-supernode" ]]; then
        sudo rm -f "/etc/nginx/sites-available/pi5-supernode"
        log_info "Removed nginx site configuration"
    fi
    
    if [[ -L "/etc/nginx/sites-enabled/pi5-supernode" ]]; then
        sudo rm -f "/etc/nginx/sites-enabled/pi5-supernode"
        log_info "Removed nginx site link"
    fi
    
    # Test and reload nginx if it's running
    if systemctl is-active --quiet nginx; then
        sudo nginx -t && sudo systemctl reload nginx || log_warn "Nginx reload failed"
    fi
}

remove_firewall_rules() {
    log_info "Removing firewall rules..."
    
    # Remove UFW rules
    sudo ufw --force delete allow 3000/tcp 2>/dev/null || true
    sudo ufw --force delete allow 3001/tcp 2>/dev/null || true
    sudo ufw --force delete allow 3002/tcp 2>/dev/null || true
    sudo ufw --force delete allow 51820/udp 2>/dev/null || true
    sudo ufw --force delete allow 1194/udp 2>/dev/null || true
    
    log_info "Firewall rules removed"
}

remove_user() {
    log_info "Removing service user..."
    
    if id "$SERVICE_USER" >/dev/null 2>&1; then
        sudo userdel -r "$SERVICE_USER" 2>/dev/null || {
            sudo userdel "$SERVICE_USER" 2>/dev/null || true
        }
        log_info "Service user '$SERVICE_USER' removed"
    fi
}

remove_directories() {
    log_info "Removing installation directories..."
    
    local dirs_to_remove=()
    
    # Always remove these
    dirs_to_remove+=("$INSTALL_DIR" "$CONFIG_DIR")
    
    # Conditionally remove these
    [[ $KEEP_LOGS != true ]] && dirs_to_remove+=("$LOG_DIR")
    [[ $KEEP_BACKUPS != true ]] && dirs_to_remove+=("$BACKUP_DIR")
    
    for dir in "${dirs_to_remove[@]}"; do
        if [[ -d "$dir" ]]; then
            sudo rm -rf "$dir"
            log_info "Removed directory: $dir"
        fi
    done
}

remove_logrotate() {
    log_info "Removing log rotation configuration..."
    
    if [[ -f "/etc/logrotate.d/pi5-supernode" ]]; then
        sudo rm -f "/etc/logrotate.d/pi5-supernode"
        log_info "Log rotation configuration removed"
    fi
}

cleanup_packages() {
    log_info "Cleaning up package dependencies..."
    
    # Remove packages that were specifically installed for Pi5 Supernode
    # (Be careful not to remove system-critical packages)
    local packages_to_consider=(
        "wireguard"
        "wireguard-tools"
    )
    
    for package in "${packages_to_consider[@]}"; do
        if dpkg -l | grep -q "^ii.*$package"; then
            if [[ $INTERACTIVE == true ]]; then
                read -p "Remove package '$package'? [y/N]: " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    sudo apt remove -y "$package" || log_warn "Failed to remove $package"
                fi
            else
                log_info "Package '$package' left installed (use apt remove to remove manually)"
            fi
        fi
    done
    
    # Clean up orphaned packages
    sudo apt autoremove -y || log_warn "Autoremove failed"
}

verify_removal() {
    log_info "Verifying removal..."
    
    local issues=()
    
    # Check directories
    [[ -d "$INSTALL_DIR" ]] && issues+=("Installation directory still exists")
    [[ -d "$CONFIG_DIR" ]] && issues+=("Configuration directory still exists")
    
    # Check services
    systemctl is-active --quiet pi5-supernode 2>/dev/null && issues+=("Pi5 Supernode service still running")
    
    # Check user
    id "$SERVICE_USER" >/dev/null 2>&1 && issues+=("Service user still exists")
    
    if [[ ${#issues[@]} -eq 0 ]]; then
        log_info "✓ Removal verification passed"
        return 0
    else
        log_warn "⚠ Some items may not have been completely removed:"
        for issue in "${issues[@]}"; do
            log_warn "  - $issue"
        done
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
    
    echo -e "${GREEN}🗑️  Pi5 Supernode has been successfully uninstalled!${NC}"
    echo
    
    if [[ $KEEP_BACKUPS == true ]] && [[ -d "$BACKUP_DIR" ]]; then
        echo -e "${BLUE}📦 Backups preserved in: $BACKUP_DIR${NC}"
    fi
    
    if [[ $KEEP_LOGS == true ]] && [[ -d "$LOG_DIR" ]]; then
        echo -e "${BLUE}📋 Logs preserved in: $LOG_DIR${NC}"
    fi
    
    echo
    echo -e "${YELLOW}Manual cleanup (if needed):${NC}"
    echo "  • Remove any remaining packages: sudo apt autoremove"
    echo "  • Check for leftover configuration files in /etc/"
    echo "  • Review firewall rules: sudo ufw status"
    echo
    
    echo -e "${GREEN}Thank you for using Pi5 Supernode!${NC}"
    echo -e "${BLUE}Reinstall anytime: curl -sSL https://get-pi5supernode.com/install | bash${NC}"
    echo
}

main() {
    parse_arguments "$@"
    
    show_banner
    
    echo -e "${RED}⚠️  WARNING: This will completely remove Pi5 Supernode from your system!${NC}"
    echo
    echo "This will remove:"
    echo "  • All Pi5 Supernode files and configurations"
    echo "  • Systemd services"
    echo "  • Nginx configuration"
    echo "  • Service user account"
    echo "  • Firewall rules"
    [[ $KEEP_BACKUPS != true ]] && echo "  • Backup files"
    [[ $KEEP_LOGS != true ]] && echo "  • Log files"
    echo
    
    if [[ $INTERACTIVE == true ]]; then
        read -p "Are you sure you want to continue? [y/N]: " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Uninstallation cancelled."
            exit 0
        fi
        echo
    fi
    
    log_info "Starting Pi5 Supernode removal..."
    
    # Create final backup
    create_backup
    
    # Removal steps
    stop_services
    remove_services
    remove_nginx_config
    remove_firewall_rules
    remove_user
    remove_directories
    remove_logrotate
    
    # Optional cleanup
    if [[ $FORCE_REMOVE == true ]] || [[ $INTERACTIVE == false ]]; then
        cleanup_packages
    else
        if [[ $INTERACTIVE == true ]]; then
            read -p "Clean up package dependencies? [y/N]: " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cleanup_packages
            fi
        fi
    fi
    
    # Verify removal
    verify_removal
    
    # Show completion
    show_completion
    
    log_info "Uninstallation completed successfully"
}

# Run main function
main "$@"
