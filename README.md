# Pi5 Supernode Complete Package

This package contains the complete Pi5 Supernode system including:

## Main Components

### 1. pi5-supernode-platform/
- Main React/TypeScript web application
- Complete dashboard, settings, network management
- Documentation system
- Blue-green-turquoise phosphorescent theme

### 2. pi5-installer/
- Automated installation scripts
- One-command installer: install.sh
- Maintenance and update scripts
- Verification tools

### 3. pi5-installer-website/
- Installation website for hosting the installer
- Provides download links and documentation

### 4. supabase/
- Complete backend configuration
- Database migrations and tables
- Edge functions for all API endpoints
- Comprehensive data management

### 5. docs/
- Complete documentation
- Deployment guides
- User manuals and technical reports

### 6. public/
- Installation scripts for download
- Public assets and resources

## Quick Start

### For Development:
1. Navigate to `pi5-supernode-platform/`
2. Run `npm install` or `pnpm install`
3. Run `npm run dev` to start development server

### For Production Deployment:
1. Use the automated installer: `curl -sSL [your-domain]/install | bash`
2. Or manually run scripts from `pi5-installer/`

### For Backend Setup:
1. Configure Supabase with files from `supabase/`
2. Run database migrations
3. Deploy edge functions

## Features
- Complete network interface management
- VPN and security configuration
- System monitoring and analytics
- Documentation system
- Automated installation and maintenance
- Mobile-responsive design
- API-driven architecture

## Support
Refer to the documentation in the `docs/` folder for detailed setup and usage instructions.
