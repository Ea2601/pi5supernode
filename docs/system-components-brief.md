# Pi5 Supernode System Components Brief

## Overview
This document provides a comprehensive catalog of every UI component in the Pi5 Supernode system, including information cards, buttons, dropdown menus, and popup windows with their specific locations, purposes, and functionality.

## Tab Structure & Components

### 1. Dashboard Tab

**Location: Main Navigation > Dashboard**

#### Header Section
- **Tab**: Dashboard **Card**: Page Header **Purpose**: Primary navigation and title display **Content**: "Network Dashboard" title with real-time overview subtitle **Location**: Top section
- **Tab**: Dashboard **Card**: Discover Devices Button **Purpose**: Trigger network device discovery **Content**: "Discover Devices" with refresh icon **Location**: Top-right header
- **Tab**: Dashboard **Card**: Quick Setup Button **Purpose**: Launch quick configuration wizard **Content**: "Quick Setup" with plus icon **Location**: Top-right header
- **Tab**: Dashboard **Card**: Live Status Indicator **Purpose**: Show real-time connection status **Content**: Animated dot with "Live/Offline" text **Location**: Header subtitle area

#### Metrics Cards Row
- **Tab**: Dashboard **Card**: Active Devices Metric **Purpose**: Display count of currently online devices **Content**: Number value with trend indicator and total devices subtitle **Location**: Top metrics row, position 1
- **Tab**: Dashboard **Card**: VPN Connections Metric **Purpose**: Show active VPN client connections **Content**: Connected clients count with active servers subtitle **Location**: Top metrics row, position 2
- **Tab**: Dashboard **Card**: CPU Usage Metric **Purpose**: Real-time system CPU utilization **Content**: Percentage value with performance subtitle **Location**: Top metrics row, position 3
- **Tab**: Dashboard **Card**: System Health Metric **Purpose**: Overall system status indicator **Content**: Status text (HEALTHY/WARNING/CRITICAL) **Location**: Top metrics row, position 4

#### Performance Cards
- **Tab**: Dashboard **Card**: System Performance Card **Purpose**: Live system metrics visualization **Content**: CPU, Memory, Temperature, Network I/O with progress bars **Location**: Middle section, left column
- **Tab**: Dashboard **Card**: Network Traffic Card **Purpose**: Real-time network usage monitoring **Content**: Upload/download speeds with progress bars and latency/packet loss stats **Location**: Middle section, right column

#### Status Cards
- **Tab**: Dashboard **Card**: System Status Card **Purpose**: Hardware health monitoring **Content**: CPU temperature, memory usage, network latency, packet loss **Location**: Bottom section, position 1
- **Tab**: Dashboard **Card**: VPN Status Card **Purpose**: VPN service overview **Content**: Active servers, connected clients, total traffic, average latency **Location**: Bottom section, position 2
- **Tab**: Dashboard **Card**: Network Overview Card **Purpose**: Network topology summary **Content**: Device types, network segments, traffic patterns **Location**: Bottom section, position 3

#### Data Tables
- **Tab**: Dashboard **Card**: Recent Devices Table **Purpose**: Show last 5 discovered devices **Content**: Device name, IP address, type, last seen with status indicators **Location**: Bottom section full width

### 2. Devices Tab

**Location: Main Navigation > Devices**

#### Header Section
- **Tab**: Devices **Card**: Page Header **Purpose**: Device management title and description **Content**: "Device Management" with monitoring subtitle **Location**: Top section
- **Tab**: Devices **Card**: Discover Devices Button **Purpose**: Launch network discovery scan **Content**: "Discover Devices" with loading state **Location**: Top-right header
- **Tab**: Devices **Card**: Add Device Button **Purpose**: Open manual device addition modal **Content**: "Add Device" with plus icon **Location**: Top-right header

#### Metrics Cards Row
- **Tab**: Devices **Card**: Total Devices Metric **Purpose**: Show all discovered devices count **Content**: Total count with "discovered devices" subtitle **Location**: Top metrics row, position 1
- **Tab**: Devices **Card**: Active Devices Metric **Purpose**: Display currently online devices **Content**: Active count with percentage online subtitle **Location**: Top metrics row, position 2
- **Tab**: Devices **Card**: Inactive Devices Metric **Purpose**: Show offline device count **Content**: Inactive count with "offline devices" subtitle **Location**: Top metrics row, position 3
- **Tab**: Devices **Card**: Total Traffic Metric **Purpose**: Combined bandwidth usage **Content**: Traffic rate with "combined bandwidth" subtitle **Location**: Top metrics row, position 4

#### Control Panel
- **Tab**: Devices **Card**: Search Input **Purpose**: Filter devices by text search **Content**: Search field with magnifying glass icon **Location**: Control panel, left side
- **Tab**: Devices **Card**: Filter Dropdown **Purpose**: Filter devices by status **Content**: "All Devices", "Active Only", "Inactive Only" options **Location**: Control panel, right side

#### Device Table
- **Tab**: Devices **Card**: Device List Table **Purpose**: Comprehensive device inventory **Content**: Device name, MAC address, IP address, type, last seen, status with action buttons **Location**: Main content area
- **Tab**: Devices **Card**: Wake Button **Purpose**: Send Wake-on-LAN to device **Content**: "Wake" action button **Location**: Table row actions
- **Tab**: Devices **Card**: Edit Button **Purpose**: Modify device properties **Content**: "Edit" action button **Location**: Table row actions
- **Tab**: Devices **Card**: Block Button **Purpose**: Block device network access **Content**: "Block" action button **Location**: Table row actions
- **Tab**: Devices **Card**: Delete Button **Purpose**: Remove device from inventory **Content**: "Delete" action button **Location**: Table row actions

#### Modals
- **Tab**: Devices **Card**: Add Device Modal **Purpose**: Manual device registration form **Content**: Device name, type, MAC address, IP address input fields **Location**: Modal popup
- **Tab**: Devices **Card**: Edit Device Modal **Purpose**: Modify existing device information **Content**: Pre-filled form with device properties **Location**: Modal popup

### 3. Network Tab

**Location: Main Navigation > Network**

#### Header Section
- **Tab**: Network **Card**: Page Header **Purpose**: Network configuration title **Content**: "Network Configuration" with DNS/DHCP/WiFi/VLAN subtitle **Location**: Top section

#### Metrics Cards Row
- **Tab**: Network **Card**: DNS Servers Metric **Purpose**: Count of configured DNS servers **Content**: Server count with active servers subtitle **Location**: Top metrics row, position 1
- **Tab**: Network **Card**: Traffic Rules Metric **Purpose**: Network filtering rules count **Content**: Rules count with enabled rules subtitle **Location**: Top metrics row, position 2
- **Tab**: Network **Card**: WiFi Networks Metric **Purpose**: Wireless network count **Content**: Network count with broadcasting status **Location**: Top metrics row, position 3
- **Tab**: Network **Card**: VLAN Count Metric **Purpose**: Network segmentation overview **Content**: VLAN count with "network segments" subtitle **Location**: Top metrics row, position 4

#### Tab Navigation
- **Tab**: Network **Card**: DNS Tab **Purpose**: DNS server configuration **Content**: Tab button with globe icon **Location**: Tab navigation bar
- **Tab**: Network **Card**: DHCP Tab **Purpose**: DHCP pool management **Content**: Tab button with router icon **Location**: Tab navigation bar
- **Tab**: Network **Card**: WiFi Tab **Purpose**: Wireless network settings **Content**: Tab button with WiFi icon **Location**: Tab navigation bar
- **Tab**: Network **Card**: VLAN Tab **Purpose**: Virtual LAN configuration **Content**: Tab button with layers icon **Location**: Tab navigation bar
- **Tab**: Network **Card**: Traffic Rules Tab **Purpose**: Network filtering rules **Content**: Tab button with shield icon **Location**: Tab navigation bar

#### DNS Configuration Panel
- **Tab**: Network **Card**: DNS Servers Table **Purpose**: Manage DNS server configurations **Content**: Server name, IP address, port, type, status with edit/delete actions **Location**: DNS tab content
- **Tab**: Network **Card**: Add DNS Server Button **Purpose**: Create new DNS server entry **Content**: "Add DNS Server" with plus icon **Location**: DNS tab header
- **Tab**: Network **Card**: DNS Server Modal **Purpose**: DNS server configuration form **Content**: Name, IP address, port, type, primary/active settings **Location**: Modal popup

#### Traffic Rules Panel
- **Tab**: Network **Card**: Traffic Rules Table **Purpose**: Network filtering rule management **Content**: Rule name, priority, conditions, actions, status **Location**: Traffic rules tab
- **Tab**: Network **Card**: Validate Rules Button **Purpose**: Check rule configuration validity **Content**: "Validate Rules" with shield icon **Location**: Traffic rules header
- **Tab**: Network **Card**: Apply Changes Button **Purpose**: Activate pending rule changes **Content**: "Apply Changes" with refresh icon **Location**: Traffic rules header
- **Tab**: Network **Card**: Create Rule Button **Purpose**: Add new traffic filtering rule **Content**: "Create Rule" with plus icon **Location**: Traffic rules header
- **Tab**: Network **Card**: Rule Toggle Button **Purpose**: Enable/disable individual rules **Content**: "Toggle" action button **Location**: Table row actions
- **Tab**: Network **Card**: Rule Edit Button **Purpose**: Modify existing rule **Content**: "Edit" action button **Location**: Table row actions
- **Tab**: Network **Card**: Rule Delete Button **Purpose**: Remove traffic rule **Content**: "Delete" action button **Location**: Table row actions

#### Modals
- **Tab**: Network **Card**: Create Rule Modal **Purpose**: Traffic rule configuration form **Content**: Name, description, priority, conditions, actions settings **Location**: Modal popup

### 4. VPN Tab

**Location: Main Navigation > VPN**

#### Header Section
- **Tab**: VPN **Card**: Page Header **Purpose**: VPN management title **Content**: "VPN Management" with WireGuard subtitle **Location**: Top section
- **Tab**: VPN **Card**: Sync Servers Button **Purpose**: Synchronize WireGuard configurations **Content**: "Sync Servers" with refresh icon **Location**: Top-right header
- **Tab**: VPN **Card**: Add Server Button **Purpose**: Create new VPN server instance **Content**: "Add Server" with server icon **Location**: Top-right header
- **Tab**: VPN **Card**: Add Client Button **Purpose**: Generate new client configuration **Content**: "Add Client" with plus icon **Location**: Top-right header

#### Metrics Cards Row
- **Tab**: VPN **Card**: Active Servers Metric **Purpose**: Running VPN servers count **Content**: Server count with total servers subtitle **Location**: Top metrics row, position 1
- **Tab**: VPN **Card**: Connected Clients Metric **Purpose**: Active client connections **Content**: Connected count with total clients subtitle **Location**: Top metrics row, position 2
- **Tab**: VPN **Card**: Total Traffic Metric **Purpose**: Combined VPN data transfer **Content**: Traffic amount with "combined data transfer" subtitle **Location**: Top metrics row, position 3
- **Tab**: VPN **Card**: Tunnel Health Metric **Purpose**: Connection reliability indicator **Content**: Percentage with "connection reliability" subtitle **Location**: Top metrics row, position 4

#### Server Management
- **Tab**: VPN **Card**: WireGuard Servers Table **Purpose**: VPN server instance management **Content**: Server name, network, port, clients, status with toggle/configure/delete actions **Location**: Middle section
- **Tab**: VPN **Card**: Server Toggle Button **Purpose**: Start/stop VPN server **Content**: "Toggle" action button **Location**: Server table actions
- **Tab**: VPN **Card**: Server Configure Button **Purpose**: Edit server configuration **Content**: "Configure" action button **Location**: Server table actions
- **Tab**: VPN **Card**: Server Delete Button **Purpose**: Remove VPN server **Content**: "Delete" action button **Location**: Server table actions

#### Client Management
- **Tab**: VPN **Card**: WireGuard Clients Table **Purpose**: Client configuration management **Content**: Client name, server, download/upload, status with download/QR/delete actions **Location**: Bottom section
- **Tab**: VPN **Card**: Download Config Button **Purpose**: Download client configuration file **Content**: "Download" action button **Location**: Client table actions
- **Tab**: VPN **Card**: QR Code Button **Purpose**: Generate QR code for mobile import **Content**: "QR Code" action button **Location**: Client table actions
- **Tab**: VPN **Card**: Client Delete Button **Purpose**: Remove client configuration **Content**: "Delete" action button **Location**: Client table actions

#### Modals
- **Tab**: VPN **Card**: Create Server Modal **Purpose**: VPN server configuration form **Content**: Server name, listen port, network CIDR, max clients settings **Location**: Modal popup
- **Tab**: VPN **Card**: Create Client Modal **Purpose**: Client configuration form **Content**: Client name, server selection, allowed IPs settings **Location**: Modal popup
- **Tab**: VPN **Card**: Configuration Modal **Purpose**: Display client configuration text **Content**: WireGuard configuration with copy functionality **Location**: Modal popup
- **Tab**: VPN **Card**: QR Code Modal **Purpose**: Visual QR code display **Content**: QR code image with configuration details **Location**: Modal popup

### 5. Automations Tab

**Location: Main Navigation > Automations**

#### Header Section
- **Tab**: Automations **Card**: Page Header **Purpose**: Automation system title **Content**: "Automation Rules" with rule engine subtitle **Location**: Top section
- **Tab**: Automations **Card**: Refresh Button **Purpose**: Reload automation data **Content**: "Refresh" with refresh icon **Location**: Top-right header
- **Tab**: Automations **Card**: Create Rule Button **Purpose**: Add new automation rule **Content**: "Create Rule" with plus icon **Location**: Top-right header

#### Metrics Cards Row
- **Tab**: Automations **Card**: Total Rules Metric **Purpose**: All automation rules count **Content**: Rules count with "automation rules" subtitle **Location**: Top metrics row, position 1
- **Tab**: Automations **Card**: Active Rules Metric **Purpose**: Currently enabled rules **Content**: Active count with disabled count subtitle **Location**: Top metrics row, position 2
- **Tab**: Automations **Card**: Total Executions Metric **Purpose**: Historical execution count **Content**: Execution count with "all time" subtitle **Location**: Top metrics row, position 3
- **Tab**: Automations **Card**: Recent Activity Metric **Purpose**: Recent executions indicator **Content**: Activity count with "last 24 hours" subtitle **Location**: Top metrics row, position 4

#### Integration Settings
- **Tab**: Automations **Card**: Telegram Bot Settings **Purpose**: Configure Telegram notifications **Content**: Bot token, chat ID fields with test button **Location**: Middle section, left column
- **Tab**: Automations **Card**: Telegram Test Button **Purpose**: Send test message to Telegram **Content**: Send icon button **Location**: Telegram settings card
- **Tab**: Automations **Card**: Webhook Testing **Purpose**: Test webhook endpoints **Content**: URL field with test button and format example **Location**: Middle section, right column
- **Tab**: Automations **Card**: Webhook Test Button **Purpose**: Send test webhook request **Content**: Send icon button **Location**: Webhook settings card

#### Rules Management
- **Tab**: Automations **Card**: Automation Rules Table **Purpose**: Rule configuration management **Content**: Rule name, trigger type, actions, executions, status **Location**: Bottom section
- **Tab**: Automations **Card**: Execute Rule Button **Purpose**: Manually trigger rule execution **Content**: "Execute" action button with play icon **Location**: Table row actions
- **Tab**: Automations **Card**: Rule Toggle Button **Purpose**: Enable/disable rule **Content**: "Enable/Disable" action button **Location**: Table row actions
- **Tab**: Automations **Card**: Rule Delete Button **Purpose**: Remove automation rule **Content**: "Delete" action button with trash icon **Location**: Table row actions

#### Modals
- **Tab**: Automations **Card**: Create Rule Modal **Purpose**: Automation rule configuration form **Content**: Name, description, trigger type, conditions, actions settings **Location**: Modal popup

### 6. Observability Tab

**Location: Main Navigation > Observability**

#### Header Section
- **Tab**: Observability **Card**: Page Header **Purpose**: Monitoring dashboard title **Content**: "Observability Dashboard" with monitoring subtitle **Location**: Top section
- **Tab**: Observability **Card**: Live Data Indicator **Purpose**: Real-time connection status **Content**: Animated dot with "Live Data/Disconnected" text **Location**: Header subtitle area
- **Tab**: Observability **Card**: Time Range Selector **Purpose**: Historical data time window **Content**: "Last Hour", "Last 6 Hours", "Last 24 Hours", "Last 7 Days" dropdown **Location**: Top-right header
- **Tab**: Observability **Card**: Refresh Button **Purpose**: Reload monitoring data **Content**: "Refresh" with refresh icon **Location**: Top-right header
- **Tab**: Observability **Card**: Open Grafana Button **Purpose**: Launch external Grafana dashboard **Content**: "Open Grafana" with external link icon **Location**: Top-right header

#### Key Metrics
- **Tab**: Observability **Card**: System Health Metric **Purpose**: Overall system status **Content**: Status value with overall status subtitle **Location**: Top metrics row, position 1
- **Tab**: Observability **Card**: Active Alerts Metric **Purpose**: Current alert count **Content**: Alert count with critical/warning breakdown **Location**: Top metrics row, position 2
- **Tab**: Observability **Card**: Uptime Metric **Purpose**: System availability percentage **Content**: Uptime percentage with "last 30 days" subtitle **Location**: Top metrics row, position 3
- **Tab**: Observability **Card**: Average Response Metric **Purpose**: Network latency indicator **Content**: Response time with "network latency" subtitle **Location**: Top metrics row, position 4

#### Chart Areas
- **Tab**: Observability **Card**: System Performance Chart **Purpose**: CPU, memory, temperature visualization **Content**: Chart placeholder with trending up icon **Location**: Middle section, left column
- **Tab**: Observability **Card**: Network Traffic Chart **Purpose**: Upload/download bandwidth visualization **Content**: Chart placeholder with WiFi icon **Location**: Middle section, right column

#### Status Displays
- **Tab**: Observability **Card**: Device Status Display **Purpose**: Device online/offline distribution **Content**: Chart placeholder with pie chart representation **Location**: Bottom section, position 1
- **Tab**: Observability **Card**: Service Health Display **Purpose**: Service status overview **Content**: Service status indicators **Location**: Bottom section, position 2
- **Tab**: Observability **Card**: Alert History Display **Purpose**: Recent alerts timeline **Content**: Alert list with acknowledge/dismiss buttons **Location**: Bottom section, position 3

### 7. Storage Tab

**Location: Main Navigation > Storage**

#### Header Section
- **Tab**: Storage **Card**: Page Header **Purpose**: Storage management title **Content**: "Storage Management" with NAS and sharing subtitle **Location**: Top section
- **Tab**: Storage **Card**: Refresh Button **Purpose**: Reload storage data **Content**: "Refresh" with refresh icon **Location**: Top-right header
- **Tab**: Storage **Card**: Add Device Button **Purpose**: Register new storage device **Content**: "Add Device" with plus icon **Location**: Top-right header
- **Tab**: Storage **Card**: Create Share Button **Purpose**: Setup new network share **Content**: "Create Share" with plus icon **Location**: Top-right header

#### Metrics Cards Row
- **Tab**: Storage **Card**: Total Devices Metric **Purpose**: Storage device count **Content**: Device count with mounted devices subtitle **Location**: Top metrics row, position 1
- **Tab**: Storage **Card**: Total Capacity Metric **Purpose**: Combined storage space **Content**: Capacity amount with used/available breakdown **Location**: Top metrics row, position 2
- **Tab**: Storage **Card**: Active Shares Metric **Purpose**: Network shares count **Content**: Share count with protocol breakdown **Location**: Top metrics row, position 3
- **Tab**: Storage **Card**: Storage Health Metric **Purpose**: Device health status **Content**: Health status with warning indicators **Location**: Top metrics row, position 4

#### Tab Navigation
- **Tab**: Storage **Card**: Devices Tab **Purpose**: Storage device management **Content**: Tab button with hard drive icon **Location**: Tab navigation bar
- **Tab**: Storage **Card**: Shares Tab **Purpose**: Network share configuration **Content**: Tab button with share icon **Location**: Tab navigation bar
- **Tab**: Storage **Card**: Performance Tab **Purpose**: Storage performance metrics **Content**: Tab button with bar chart icon **Location**: Tab navigation bar

#### Device Management
- **Tab**: Storage **Card**: Storage Devices Table **Purpose**: Physical storage management **Content**: Device name, capacity, file system, status with mount/unmount/delete actions **Location**: Devices tab content
- **Tab**: Storage **Card**: Mount Toggle Button **Purpose**: Mount/unmount storage device **Content**: "Mount/Unmount" action button **Location**: Device table actions
- **Tab**: Storage **Card**: Device Configure Button **Purpose**: Configure device settings **Content**: "Configure" action button **Location**: Device table actions
- **Tab**: Storage **Card**: Device Delete Button **Purpose**: Remove device from system **Content**: "Delete" action button **Location**: Device table actions

#### Share Management
- **Tab**: Storage **Card**: Network Shares Table **Purpose**: Network sharing configuration **Content**: Share name, protocol, permissions, status with toggle/edit/delete actions **Location**: Shares tab content
- **Tab**: Storage **Card**: Share Toggle Button **Purpose**: Enable/disable network share **Content**: "Toggle" action button **Location**: Share table actions
- **Tab**: Storage **Card**: Share Edit Button **Purpose**: Modify share configuration **Content**: "Edit" action button **Location**: Share table actions
- **Tab**: Storage **Card**: Share Delete Button **Purpose**: Remove network share **Content**: "Delete" action button **Location**: Share table actions

#### Modals
- **Tab**: Storage **Card**: Add Device Modal **Purpose**: Storage device registration form **Content**: Device type, mount point, file system settings **Location**: Modal popup
- **Tab**: Storage **Card**: Create Share Modal **Purpose**: Network share configuration form **Content**: Name, protocol, path, permissions, access control settings **Location**: Modal popup

### 8. Settings Tab

**Location: Main Navigation > Settings**

#### Header Section
- **Tab**: Settings **Card**: Page Header **Purpose**: System settings title **Content**: "System Settings" with configuration subtitle **Location**: Top section
- **Tab**: Settings **Card**: Refresh Button **Purpose**: Reload settings data **Content**: "Refresh" with refresh icon **Location**: Top-right header
- **Tab**: Settings **Card**: Restart System Button **Purpose**: Reboot Pi5 Supernode **Content**: "Restart System" with refresh icon, destructive styling **Location**: Top-right header

#### Quick Stats
- **Tab**: Settings **Card**: System Uptime Metric **Purpose**: System runtime indicator **Content**: Uptime duration with "since last restart" subtitle **Location**: Top metrics row, position 1
- **Tab**: Settings **Card**: SSH Status Metric **Purpose**: SSH service availability **Content**: Enabled/Disabled with port number subtitle **Location**: Top metrics row, position 2
- **Tab**: Settings **Card**: Firewall Metric **Purpose**: Security status indicator **Content**: Active/Inactive with "network protection" subtitle **Location**: Top metrics row, position 3
- **Tab**: Settings **Card**: Auto Updates Metric **Purpose**: Update automation status **Content**: Enabled/Disabled with "system maintenance" subtitle **Location**: Top metrics row, position 4

#### Tab Navigation
- **Tab**: Settings **Card**: System Tab **Purpose**: General system configuration **Content**: Tab button with settings icon **Location**: Tab navigation bar
- **Tab**: Settings **Card**: Security Tab **Purpose**: Security and access settings **Content**: Tab button with shield icon **Location**: Tab navigation bar
- **Tab**: Settings **Card**: Notifications Tab **Purpose**: Alert and notification setup **Content**: Tab button with bell icon **Location**: Tab navigation bar
- **Tab**: Settings **Card**: API Keys Tab **Purpose**: API authentication management **Content**: Tab button with key icon **Location**: Tab navigation bar
- **Tab**: Settings **Card**: Backup Tab **Purpose**: System backup and restore **Content**: Tab button with database icon **Location**: Tab navigation bar
- **Tab**: Settings **Card**: Documentation Tab **Purpose**: Help and documentation links **Content**: Tab button with file text icon **Location**: Tab navigation bar

#### System Configuration
- **Tab**: Settings **Card**: General Settings Form **Purpose**: Basic system configuration **Content**: Hostname, timezone, auto-updates settings **Location**: System tab, left column
- **Tab**: Settings **Card**: Network Settings Form **Purpose**: Network configuration **Content**: DNS servers, SSH settings, NTP configuration **Location**: System tab, right column
- **Tab**: Settings **Card**: Save System Settings Button **Purpose**: Apply system configuration changes **Content**: "Save System Settings" with save icon **Location**: System settings form

#### Security Configuration
- **Tab**: Settings **Card**: Security Settings Form **Purpose**: Security policy configuration **Content**: Firewall, fail2ban, password policy, session timeout, 2FA settings **Location**: Security tab
- **Tab**: Settings **Card**: Save Security Settings Button **Purpose**: Apply security configuration changes **Content**: "Save Security Settings" with save icon **Location**: Security settings form

#### Notification Configuration
- **Tab**: Settings **Card**: Notification Settings Form **Purpose**: Alert delivery configuration **Content**: Email, Telegram, webhook settings with alert level selection **Location**: Notifications tab
- **Tab**: Settings **Card**: Save Notification Settings Button **Purpose**: Apply notification configuration changes **Content**: "Save Notification Settings" with save icon **Location**: Notification settings form

#### API Key Management
- **Tab**: Settings **Card**: API Key Display **Purpose**: Show/hide current API key **Content**: Masked API key with show/hide toggle and copy button **Location**: API Keys tab
- **Tab**: Settings **Card**: Generate API Key Button **Purpose**: Create new API key **Content**: "Generate New Key" with key icon **Location**: API Keys tab
- **Tab**: Settings **Card**: Copy API Key Button **Purpose**: Copy key to clipboard **Content**: Copy icon button **Location**: API key display

#### Backup Management
- **Tab**: Settings **Card**: Backup Settings Form **Purpose**: Backup configuration **Content**: Backup schedule, retention, destination settings **Location**: Backup tab
- **Tab**: Settings **Card**: Create Backup Button **Purpose**: Manually create system backup **Content**: "Create Backup" with download icon **Location**: Backup tab
- **Tab**: Settings **Card**: Backup History Table **Purpose**: Show previous backups **Content**: Backup date, size, status with download/restore actions **Location**: Backup tab

#### Documentation Links
- **Tab**: Settings **Card**: Getting Started Guide **Purpose**: Link to setup documentation **Content**: "Getting Started Guide" with book icon and external link **Location**: Documentation tab
- **Tab**: Settings **Card**: Network Configuration Guide **Purpose**: Link to networking docs **Content**: "Network Configuration" with network icon **Location**: Documentation tab
- **Tab**: Settings **Card**: VPN Setup Guide **Purpose**: Link to VPN documentation **Content**: "VPN Setup Guide" with shield icon **Location**: Documentation tab
- **Tab**: Settings **Card**: API Documentation **Purpose**: Link to API reference **Content**: "API Documentation" with terminal icon **Location**: Documentation tab
- **Tab**: Settings **Card**: Troubleshooting Guide **Purpose**: Link to support documentation **Content**: "Troubleshooting" with help circle icon **Location**: Documentation tab
- **Tab**: Settings **Card**: Hardware Requirements **Purpose**: Link to hardware documentation **Content**: "Hardware Requirements" with monitor icon **Location**: Documentation tab

#### Modals
- **Tab**: Settings **Card**: Backup Modal **Purpose**: Backup creation confirmation **Content**: Backup options and progress indicator **Location**: Modal popup
- **Tab**: Settings **Card**: API Key Modal **Purpose**: API key generation confirmation **Content**: New key display with security warnings **Location**: Modal popup
- **Tab**: Settings **Card**: Password Change Modal **Purpose**: Admin password update form **Content**: Current password, new password, confirm password fields **Location**: Modal popup

### 9. Global UI Components

**Location: Present across all tabs**

#### Navigation Sidebar
- **Tab**: All **Card**: Logo and Branding **Purpose**: System identification **Content**: Pi5 Supernode logo with "Enterprise Network" subtitle **Location**: Sidebar header
- **Tab**: All **Card**: Navigation Menu **Purpose**: Primary tab navigation **Content**: 8 navigation items with icons and labels **Location**: Sidebar main area
- **Tab**: All **Card**: Sidebar Collapse Button **Purpose**: Toggle sidebar width **Content**: Chevron left/right icon **Location**: Sidebar header
- **Tab**: All **Card**: User Profile **Purpose**: Show current user info **Content**: Avatar, username, email with admin designation **Location**: Sidebar footer

#### Top Header Bar
- **Tab**: All **Card**: Page Title **Purpose**: Current section identification **Content**: "Network Management" title **Location**: Top header left
- **Tab**: All **Card**: Global Search **Purpose**: System-wide search functionality **Content**: Search input with magnifying glass icon **Location**: Top header center
- **Tab**: All **Card**: Global Refresh Button **Purpose**: Refresh current view data **Content**: Refresh icon button **Location**: Top header right
- **Tab**: All **Card**: Notifications Bell **Purpose**: Show system notifications **Content**: Bell icon with notification count badge **Location**: Top header right

#### Notification System
- **Tab**: All **Card**: Toast Notifications **Purpose**: User feedback and alerts **Content**: Success, error, warning, info messages with dismiss option **Location**: Top-right overlay
- **Tab**: All **Card**: Loading Spinners **Purpose**: Indicate data loading states **Content**: Animated spinner with loading text **Location**: Various card locations

## Component Patterns

### Common Button Types
- **Primary Action Buttons**: Neon-styled buttons for main actions (Create, Add, Save)
- **Secondary Action Buttons**: Outline-styled buttons for secondary actions (Edit, Configure, Refresh)
- **Destructive Action Buttons**: Red-styled buttons for dangerous actions (Delete, Block, Restart)
- **Icon Buttons**: Small buttons with only icons for space-efficient actions

### Modal Patterns
- **Form Modals**: Configuration and creation forms with input validation
- **Confirmation Modals**: Action confirmation dialogs with cancel/proceed options
- **Display Modals**: Read-only content display (QR codes, configurations, documentation)

### Table Patterns
- **Data Tables**: Sortable, filterable data display with pagination
- **Action Tables**: Tables with row-level action buttons
- **Status Tables**: Tables with visual status indicators and health badges

### Metric Card Patterns
- **Simple Metrics**: Single value with subtitle
- **Trend Metrics**: Value with trend indicators and percentage changes
- **Status Metrics**: Health status with color-coded indicators
- **Progress Metrics**: Values with progress bars and utilization percentages

## Total Component Count

- **Tabs**: 8 main navigation tabs
- **Metric Cards**: 32 informational metric displays
- **Action Buttons**: 127 interactive buttons across all tabs
- **Data Tables**: 13 structured data displays
- **Modal Popups**: 15 overlay forms and dialogs
- **Input Fields**: 45+ form inputs across all configuration panels
- **Dropdown Menus**: 12 selection dropdowns
- **Navigation Elements**: 25+ navigation and control elements

---

*Generated: 2025-09-06*  
*Version: 1.0*  
*System: Pi5 Supernode Platform*