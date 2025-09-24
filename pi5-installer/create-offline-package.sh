#!/bin/bash

# Pi5 Supernode - Offline Installer Package Creator
# Version: 3.0.0
# Description: Create offline installation package

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PACKAGE_NAME="pi5-supernode-offline-installer"
PACKAGE_VERSION="3.0.0"
OUTPUT_DIR="./offline-packages"
TEMP_DIR="/tmp/pi5-offline-build"

# Package lists
DEB_PACKAGES=(
    # Network management
    "iproute2" "bridge-utils" "vlan" "ethtool" "net-tools"
    "wireless-tools" "wpasupplicant" "hostapd" "dnsmasq" "netplan.io"
    "ifupdown" "usb-modeswitch" "usb-modeswitch-data" "usbutils" "pciutils"
    
    # VPN software
    "openvpn" "easy-rsa" "wireguard" "wireguard-tools"
    "strongswan" "strongswan-pki" "libstrongswan-extra-plugins"
    
    # Monitoring tools
    "iftop" "nload" "vnstat" "tcpdump" "wireshark-common"
    "iperf3" "speedtest-cli" "htop" "iotop" "tmux" "screen"
    
    # Security packages
    "iptables" "iptables-persistent" "fail2ban" "ufw"
    "rkhunter" "chkrootkit" "unattended-upgrades"
    
    # Development tools
    "git" "curl" "wget" "build-essential" "python3" "python3-pip"
    "python3-dev" "python3-venv" "nodejs" "npm" "nginx"
    "supervisor" "sqlite3" "jq"
)

PIP_PACKAGES=(
    "psutil" "netifaces" "scapy" "netaddr" "requests"
    "flask" "fastapi" "uvicorn" "pydantic" "sqlalchemy"
)

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

show_banner() {
    clear
    cat << 'EOF'
████████████████████████████████████████████████████████████████████████████████
█                                                                              █
█   ██████  ██████ ██████ ██      ██ ███    ██ ███████       ██████        █
█  ██    ██ ██      ██      ██      ██ ████   ██ ██         ██    ██      █
█  ██    ██ █████   █████   ██      ██ ██ ██  ██ █████        █████       █
█  ██    ██ ██      ██      ██      ██ ██  ██ ██ ██         ██    ██      █
█   ██████  ███████ ██      ███████ ██   ████ ███████       ██████        █
█                                                                              █
█                Offline Installer Package Creator v3.0.0                    █
█                                                                              █
████████████████████████████████████████████████████████████████████████████████

EOF
}

setup_environment() {
    log_step "Setting up build environment"
    
    # Clean and create directories
    rm -rf "$TEMP_DIR" "$OUTPUT_DIR"
    mkdir -p "$TEMP_DIR" "$OUTPUT_DIR"
    
    cd "$TEMP_DIR"
    
    # Create package structure
    mkdir -p {
        "$PACKAGE_NAME/scripts",
        "$PACKAGE_NAME/packages/deb",
        "$PACKAGE_NAME/packages/pip",
        "$PACKAGE_NAME/application",
        "$PACKAGE_NAME/config"
    }
    
    log_info "Build environment ready"
}

download_deb_packages() {
    log_step "Downloading DEB packages"
    
    cd "$TEMP_DIR/$PACKAGE_NAME/packages/deb"
    
    # Update package lists
    sudo apt update -qq
    
    # Download packages with dependencies
    for package in "${DEB_PACKAGES[@]}"; do
        log_info "Downloading $package..."
        apt download "$package" 2>/dev/null || {
            echo "Warning: Failed to download $package"
            continue
        }
    done
    
    # Download dependencies
    log_info "Downloading package dependencies..."
    apt-get download $(apt-cache depends "${DEB_PACKAGES[@]}" | grep -E '^\s*Depends:' | awk '{print $2}' | sort -u) 2>/dev/null || true
    
    log_info "DEB packages downloaded: $(ls *.deb | wc -l) files"
}

download_pip_packages() {
    log_step "Downloading Python packages"
    
    cd "$TEMP_DIR/$PACKAGE_NAME/packages/pip"
    
    # Download pip packages
    for package in "${PIP_PACKAGES[@]}"; do
        log_info "Downloading Python package: $package"
        pip3 download "$package" --no-deps 2>/dev/null || {
            echo "Warning: Failed to download $package"
            continue
        }
    done
    
    log_info "Python packages downloaded: $(ls *.whl *.tar.gz 2>/dev/null | wc -l) files"
}

copy_installer_scripts() {
    log_step "Copying installer scripts"
    
    cd "$TEMP_DIR/$PACKAGE_NAME/scripts"
    
    # Copy main installer scripts (assuming they're in current directory)
    cp -r ../../../../pi5-installer/* . 2>/dev/null || {
        echo "Warning: Installer scripts not found in expected location"
        # Create minimal scripts if originals not found
        create_minimal_scripts
    }
    
    # Make scripts executable
    chmod +x *.sh
    
    log_info "Installer scripts copied"
}

create_minimal_scripts() {
    log_info "Creating minimal installer scripts"
    
    # Create basic offline installer
    cat > install-offline.sh << 'EOF'
#!/bin/bash
echo "Pi5 Supernode Offline Installer"
echo "Installing packages..."

# Install DEB packages
if [[ -d "packages/deb" ]]; then
    sudo dpkg -i packages/deb/*.deb || sudo apt-get install -f -y
fi

# Install Python packages
if [[ -d "packages/pip" ]]; then
    pip3 install packages/pip/*.whl packages/pip/*.tar.gz --no-index --find-links packages/pip/
fi

echo "Offline installation completed"
EOF
    chmod +x install-offline.sh
}

copy_application_files() {
    log_step "Copying application files"
    
    cd "$TEMP_DIR/$PACKAGE_NAME/application"
    
    # Copy Pi5 Supernode platform files (if available)
    if [[ -d "../../../../pi5-supernode-platform" ]]; then
        cp -r ../../../../pi5-supernode-platform/* .
        log_info "Application files copied"
    else
        echo "Warning: Pi5 Supernode platform files not found"
        # Create placeholder
        echo "Pi5 Supernode Application Files" > README.txt
        echo "Extract your Pi5 Supernode platform files here" >> README.txt
    fi
}

create_offline_installer() {
    log_step "Creating offline installer script"
    
    cd "$TEMP_DIR/$PACKAGE_NAME"
    
    cat > install.sh << 'EOF'
#!/bin/bash

# Pi5 Supernode Offline Installer
# This script installs Pi5 Supernode from offline packages

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_banner() {
    echo "======================================"
    echo "  Pi5 Supernode Offline Installer"
    echo "  Version 3.0.0"
    echo "======================================"
    echo
}

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check if running as non-root with sudo access
    if [[ $EUID -eq 0 ]]; then
        log_error "Please run as regular user with sudo access, not as root"
        exit 1
    fi
    
    if ! sudo -n true 2>/dev/null; then
        log_error "This script requires sudo access"
        exit 1
    fi
    
    # Check available space
    local available_space
    available_space=$(df . | tail -1 | awk '{print $4}')
    local required_space=$((2 * 1024 * 1024)) # 2GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        log_error "Insufficient disk space. Required: 2GB"
        exit 1
    fi
    
    log_info "System requirements check passed"
}

install_deb_packages() {
    log_info "Installing DEB packages..."
    
    if [[ -d "packages/deb" ]] && [[ -n "$(ls packages/deb/*.deb 2>/dev/null)" ]]; then
        # Update package lists first
        sudo apt update -qq
        
        # Install packages
        sudo dpkg -i packages/deb/*.deb || {
            log_info "Fixing package dependencies..."
            sudo apt-get install -f -y
        }
        
        log_info "DEB packages installed successfully"
    else
        log_error "No DEB packages found"
        exit 1
    fi
}

install_python_packages() {
    log_info "Installing Python packages..."
    
    if [[ -d "packages/pip" ]]; then
        pip3 install packages/pip/*.whl packages/pip/*.tar.gz \
            --no-index --find-links packages/pip/ --user 2>/dev/null || {
            log_info "Some Python packages may not have installed (this is often normal)"
        }
        
        log_info "Python packages installation completed"
    else
        echo "Warning: No Python packages found"
    fi
}

configure_system() {
    log_info "Configuring system..."
    
    # Enable IP forwarding
    echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    
    # Create service user
    sudo useradd -r -s /bin/false pi5-supernode || true
    
    # Create directories
    sudo mkdir -p /opt/pi5-supernode
    sudo mkdir -p /var/log/pi5-supernode
    sudo mkdir -p /etc/pi5-supernode
    
    # Copy application files
    if [[ -d "application" ]]; then
        sudo cp -r application/* /opt/pi5-supernode/
        sudo chown -R pi5-supernode:pi5-supernode /opt/pi5-supernode
    fi
    
    log_info "System configuration completed"
}

run_online_installer() {
    log_info "Running main installer scripts..."
    
    if [[ -f "scripts/install.sh" ]]; then
        chmod +x scripts/install.sh
        sudo scripts/install.sh --offline
    else
        log_info "Main installer not found, using basic configuration"
        configure_system
    fi
}

main() {
    show_banner
    
    log_info "Starting Pi5 Supernode offline installation..."
    
    check_requirements
    install_deb_packages
    install_python_packages
    run_online_installer
    
    echo
    log_info "Pi5 Supernode offline installation completed!"
    echo
    echo "Next steps:"
    echo "1. Reboot your Pi5: sudo reboot"
    echo "2. Access web interface: http://$(hostname -I | awk '{print $1}')"
    echo "3. Complete initial setup"
    echo
}

# Check if we're in the right directory
if [[ ! -d "packages" ]]; then
    echo "Error: Please run this script from the Pi5 Supernode offline installer directory"
    exit 1
fi

# Run main installation
main "$@"
EOF
    
    chmod +x install.sh
    
    log_info "Offline installer script created"
}

create_documentation() {
    log_step "Creating documentation"
    
    cd "$TEMP_DIR/$PACKAGE_NAME"
    
    cat > README.md << 'EOF'
# Pi5 Supernode Offline Installer

This package contains everything needed to install Pi5 Supernode on a Raspberry Pi 5 without internet access.

## Contents

- `install.sh` - Main offline installer script
- `packages/deb/` - Debian packages and dependencies
- `packages/pip/` - Python packages
- `application/` - Pi5 Supernode application files
- `scripts/` - Additional installer scripts

## Installation

1. Extract this package on your Raspberry Pi 5:
   ```bash
   tar -xzf pi5-supernode-offline-installer.tar.gz
   cd pi5-supernode-offline-installer
   ```

2. Run the offline installer:
   ```bash
   ./install.sh
   ```

3. Reboot your Pi5:
   ```bash
   sudo reboot
   ```

4. Access the web interface:
   ```
   http://<your-pi-ip-address>
   ```

## System Requirements

- Raspberry Pi 5 (recommended) or compatible ARM device
- Raspberry Pi OS (Bookworm or Bullseye)
- At least 8GB free disk space
- 4GB RAM (minimum 2GB)
- Sudo access

## Troubleshooting

If you encounter issues:

1. Check system requirements
2. Ensure you have sudo access
3. Try running individual scripts in the `scripts/` directory
4. Check logs in `/var/log/pi5-supernode/`

## Support

For support and documentation:
- Website: https://pi5-supernode.com
- Documentation: https://docs.pi5-supernode.com
- Issues: https://github.com/pi5-supernode/platform/issues

## Version

Offline Installer Version: 3.0.0
Package Created: $(date)

EOF
    
    log_info "Documentation created"
}

create_package() {
    log_step "Creating final package"
    
    cd "$TEMP_DIR"
    
    # Create version file
    echo "$PACKAGE_VERSION" > "$PACKAGE_NAME/VERSION"
    echo "$(date)" > "$PACKAGE_NAME/BUILD_DATE"
    
    # Create tarball
    local package_file="$PACKAGE_NAME-v$PACKAGE_VERSION.tar.gz"
    tar -czf "$package_file" "$PACKAGE_NAME"
    
    # Move to output directory
    mv "$package_file" "$OUTPUT_DIR/"
    
    # Create checksums
    cd "$OUTPUT_DIR"
    sha256sum "$package_file" > "$package_file.sha256"
    
    log_info "Package created: $OUTPUT_DIR/$package_file"
    log_info "Package size: $(du -h "$package_file" | awk '{print $1}')"
}

show_completion() {
    echo
    echo -e "${GREEN}===============================================${NC}"
    echo -e "${GREEN}  Offline Installer Package Created!${NC}"
    echo -e "${GREEN}===============================================${NC}"
    echo
    
    local package_file="$PACKAGE_NAME-v$PACKAGE_VERSION.tar.gz"
    
    echo -e "${BLUE}Package Details:${NC}"
    echo "  File: $OUTPUT_DIR/$package_file"
    echo "  Size: $(du -h "$OUTPUT_DIR/$package_file" | awk '{print $1}')"
    echo "  Checksum: $OUTPUT_DIR/$package_file.sha256"
    echo
    
    echo -e "${BLUE}Distribution Instructions:${NC}"
    echo "1. Copy the package to target Pi5 device"
    echo "2. Extract: tar -xzf $package_file"
    echo "3. Install: cd $PACKAGE_NAME && ./install.sh"
    echo
    
    echo -e "${BLUE}Package Contents:${NC}"
    echo "  DEB packages: $(ls "$TEMP_DIR/$PACKAGE_NAME/packages/deb/"*.deb 2>/dev/null | wc -l) files"
    echo "  Python packages: $(ls "$TEMP_DIR/$PACKAGE_NAME/packages/pip/"*.{whl,tar.gz} 2>/dev/null | wc -l) files"
    echo "  Scripts: $(ls "$TEMP_DIR/$PACKAGE_NAME/scripts/"*.sh 2>/dev/null | wc -l) files"
    echo
    
    echo -e "${YELLOW}Note: This package is designed for offline installation${NC}"
    echo -e "${YELLOW}on Raspberry Pi 5 devices without internet access.${NC}"
    echo
}

cleanup() {
    log_step "Cleaning up temporary files"
    rm -rf "$TEMP_DIR"
    log_info "Cleanup completed"
}

main() {
    show_banner
    
    echo -e "${BLUE}Creating Pi5 Supernode offline installer package...${NC}"
    echo
    
    setup_environment
    download_deb_packages
    download_pip_packages
    copy_installer_scripts
    copy_application_files
    create_offline_installer
    create_documentation
    create_package
    
    show_completion
    cleanup
    
    echo -e "${GREEN}Offline installer package creation completed successfully!${NC}"
}

# Check dependencies
if ! command -v apt >/dev/null; then
    echo "Error: This script requires apt package manager (Debian/Ubuntu)"
    exit 1
fi

if ! command -v pip3 >/dev/null; then
    echo "Error: This script requires pip3"
    echo "Install with: sudo apt install python3-pip"
    exit 1
fi

# Run main function
main "$@"
