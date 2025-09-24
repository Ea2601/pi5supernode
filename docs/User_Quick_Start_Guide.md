# Pi5 Supernode - User Quick Start Guide

**Live System:** https://ocy29k8lyqks.space.minimax.io

---

## 🚀 Getting Started

### First Login
1. **Access the System:** Navigate to https://ocy29k8lyqks.space.minimax.io
2. **Login/Register:** Create your admin account or login with existing credentials
3. **Dashboard Overview:** Start with the main dashboard to see system status

---

## 📱 Navigation Guide

### Main Menu (Left Sidebar)
- **🏠 Dashboard** - System overview and quick actions
- **📱 Devices** - Manage network devices
- **🌐 Network** - Configure DNS, DHCP, WiFi, VLANs
- **🛡️ VPN** - WireGuard VPN management
- **⚡ Automations** - Set up rules and integrations
- **📊 Observability** - Monitor system performance
- **💾 Storage** - Manage USB devices and shares
- **⚙️ Settings** - System configuration

### Responsive Design
- **Desktop:** Full sidebar with labels
- **Tablet/Mobile:** Collapsible sidebar with icons
- **Touch-Friendly:** Optimized for touch interactions

---

## 🏠 Dashboard Features

### System Metrics Cards
- **CPU Usage** - Real-time processor utilization
- **Memory Usage** - RAM consumption monitoring
- **Disk Usage** - Storage space tracking
- **Network Throughput** - Bandwidth utilization

### Device Overview
- **Connected Devices** - Total device count
- **Active Connections** - Currently online devices
- **Blocked Devices** - Security-blocked devices
- **VPN Clients** - Connected VPN users

### Quick Actions
- **🔍 Device Discovery** - Scan for new network devices
- **📊 Generate Report** - Create system status report
- **🚫 Block Device** - Quickly block suspicious devices
- **⚡ Wake Device** - Send Wake-on-LAN packets

---

## 📱 Device Management

### Device Discovery
1. **Automatic Scanning** - Click "Device Discovery" to scan network
2. **View Results** - See all discovered devices in table
3. **Device Details** - MAC address, IP, hostname, manufacturer
4. **Device Status** - Online/offline status with last seen

### Device Actions
- **✏️ Edit** - Modify device name, group, or settings
- **⚡ Wake-on-LAN** - Remotely wake up devices
- **🚫 Block** - Block device from network access
- **🗑️ Remove** - Remove device from management

### Device Grouping
- **Family Devices** - Smartphones, tablets, laptops
- **IoT Devices** - Smart home devices, sensors
- **Work Devices** - Business computers and equipment
- **Guests** - Temporary visitor devices

---

## 🌐 Network Configuration

### DNS Management
1. **Add DNS Server** - Configure upstream DNS servers
2. **DNS Filtering** - Set up ad-blocking and content filtering
3. **Custom Rules** - Create custom DNS resolution rules
4. **Cache Management** - Monitor and clear DNS cache

### DHCP Administration
1. **IP Pools** - Configure IP address ranges
2. **Reservations** - Assign static IPs to devices
3. **Lease Management** - Monitor active DHCP leases
4. **Pool Status** - Check IP pool utilization

### WiFi Management
1. **Network Creation** - Set up new WiFi networks
2. **Security Policies** - Configure WPA3/WPA2 security
3. **Guest Networks** - Create isolated guest access
4. **Access Control** - MAC address filtering

### VLAN Configuration
1. **VLAN Setup** - Create network segments
2. **Device Assignment** - Assign devices to VLANs
3. **Inter-VLAN Rules** - Configure communication rules
4. **Network Isolation** - Implement security boundaries

---

## 🛡️ VPN Management

### WireGuard Server Setup
1. **Create Server** - Set up new VPN server
2. **Server Configuration** - Define IP ranges and settings
3. **Port Configuration** - Set listening port (default: 51820)
4. **Key Management** - Automatic key generation

### Client Management
1. **Add Client** - Create new VPN client
2. **Generate Config** - Download client configuration
3. **QR Code** - Generate QR code for mobile setup
4. **Client Status** - Monitor connection status

### Mobile Setup
1. **Install WireGuard App** - Download from app store
2. **Scan QR Code** - Use built-in QR scanner
3. **Connect** - Activate VPN connection
4. **Verify** - Check connection status

### Remote Server Installation
- **Auto WG Installer** - Automatically install WireGuard on remote servers
- **SSH Integration** - Secure remote server access
- **Configuration Sync** - Automatic configuration deployment

---

## ⚡ Automation System

### Rule Creation
1. **Define Triggers** - Device connection, time-based, system events
2. **Set Conditions** - Device type, time of day, network status
3. **Choose Actions** - Block device, send notification, execute command
4. **Test Rules** - Validate rule logic before activation

### Telegram Integration
1. **Bot Setup** - Configure Telegram bot token
2. **Notification Settings** - Choose what events to notify
3. **Command Interface** - Control system via Telegram commands
4. **Test Messaging** - Send test notifications

### Webhook Integration
1. **External Systems** - Connect to n8n, Zapier, custom APIs
2. **Event Publishing** - Send network events to external systems
3. **Webhook Testing** - Validate webhook endpoints
4. **Response Handling** - Process webhook responses

---

## 📊 Monitoring & Observability

### System Metrics
- **Performance Charts** - CPU, memory, disk, network usage
- **Historical Data** - Track trends over time
- **Alert Thresholds** - Set warning levels
- **Resource Planning** - Capacity planning insights

### Network Analytics
- **Traffic Patterns** - Analyze network usage
- **Bandwidth Monitoring** - Track data consumption
- **Device Activity** - Monitor device behavior
- **Security Events** - Track blocked attempts

### Grafana Integration
- **Advanced Dashboards** - Professional monitoring views
- **Custom Metrics** - Create personalized dashboards
- **Alert Rules** - Set up automated alerting
- **Data Export** - Export monitoring data

### Log Management
- **System Logs** - View system activity logs
- **Network Events** - Track network changes
- **Security Logs** - Monitor security events
- **Log Export** - Download logs for analysis

---

## 💾 Storage Management

### USB Device Management
1. **Auto-Detection** - Automatic USB device discovery
2. **Mount/Unmount** - Control device mounting
3. **Share Configuration** - Set up network shares
4. **Access Permissions** - Configure user access

### Network Shares
1. **SMB/CIFS Shares** - Windows-compatible file sharing
2. **NFS Shares** - Linux/Unix file sharing
3. **FTP Access** - File transfer protocol access
4. **WebDAV** - Web-based file access

### Backup System
1. **Automatic Backups** - Schedule regular backups
2. **Backup Destinations** - Local and remote storage
3. **Incremental Backups** - Efficient backup strategy
4. **Restore Operations** - Easy data recovery

---

## ⚙️ System Settings

### System Configuration
- **Network Interfaces** - Configure network adapters
- **Time/Date Settings** - System time configuration
- **User Management** - Manage system users
- **Security Settings** - System security policies

### Backup & Restore
1. **Create Snapshot** - Take system configuration snapshot
2. **Restore Point** - Restore to previous configuration
3. **Export Configuration** - Download configuration files
4. **Import Settings** - Import configuration from backup

### API Management
- **API Keys** - Generate and manage API keys
- **Rate Limits** - Configure API usage limits
- **Access Logs** - Monitor API usage
- **Documentation** - Access API documentation

### System Health
- **Health Checks** - Monitor service health
- **Performance Metrics** - System performance indicators
- **Error Reporting** - Track system errors
- **Maintenance Mode** - System maintenance controls

---

## 🔧 Troubleshooting

### Common Issues

#### Connection Problems
- **Check Network** - Verify network connectivity
- **Restart Services** - Restart network services
- **Check Logs** - Review system logs for errors
- **Ping Test** - Test network connectivity

#### Device Not Detected
- **Refresh Discovery** - Re-run device discovery
- **Check IP Range** - Verify scan IP range
- **Network Permissions** - Check network access
- **Device Status** - Verify device is online

#### VPN Issues
- **Check Configuration** - Verify VPN settings
- **Port Availability** - Ensure VPN port is open
- **Firewall Rules** - Check firewall configuration
- **Key Validity** - Verify encryption keys

#### Performance Issues
- **Resource Usage** - Check CPU/memory usage
- **Network Load** - Monitor network traffic
- **Service Status** - Verify all services running
- **System Cleanup** - Clear logs and temporary files

### Getting Help
- **System Logs** - Check detailed error logs
- **Health Dashboard** - Review system health status
- **Documentation** - Access built-in documentation
- **Support Forums** - Community support resources

---

## 📞 Support & Resources

### Built-in Help
- **Contextual Help** - Hover over elements for tooltips
- **Documentation Access** - Built-in documentation browser
- **System Status** - Real-time system health indicators
- **Error Messages** - Detailed error descriptions

### External Resources
- **Community Forums** - User community support
- **GitHub Repository** - Source code and issues
- **Video Tutorials** - Step-by-step video guides
- **API Documentation** - Complete API reference

---

**Need Help?** Access the Settings page for comprehensive documentation and support resources.

*Pi5 Supernode v2.1.4 - Your Enterprise Network Management Solution*