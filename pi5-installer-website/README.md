# Pi5 Supernode Installer Website

The official website for installing Pi5 Supernode with one command.

## Features

- **One-Command Installation**: Copy and paste installation commands
- **Comprehensive Documentation**: Complete setup and configuration guides
- **Troubleshooting Support**: Common issues and solutions
- **Release Management**: Download specific versions and view changelogs
- **Modern UI**: Responsive design with smooth animations

## Installation Commands

### Quick Install (Recommended)
```bash
curl -sSL https://get-pi5supernode.com/install | bash
```

### Interactive Install
```bash
curl -sSL https://get-pi5supernode.com/install | bash -s -- --interactive
```

### Offline Install
```bash
wget https://get-pi5supernode.com/offline-installer.tar.gz
tar -xzf offline-installer.tar.gz && cd pi5-supernode-offline-installer && ./install.sh
```

## Development

### Prerequisites
- Node.js 20.x or later
- pnpm package manager

### Setup
```bash
# Clone the repository
git clone https://github.com/pi5-supernode/installer-website.git
cd installer-website

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Build for Production
```bash
# Build the website
pnpm build:prod

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── CodeBlock.tsx    # Code block with copy functionality
│   ├── FeatureCard.tsx  # Feature showcase cards
│   ├── Footer.tsx       # Site footer
│   ├── Header.tsx       # Navigation header
│   └── InstallationStep.tsx  # Installation step component
├── pages/               # Main page components
│   ├── Documentation.tsx    # Installation and setup docs
│   ├── Homepage.tsx     # Landing page with install commands
│   ├── Releases.tsx     # Release downloads and changelogs
│   └── Troubleshooting.tsx  # Common issues and solutions
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## Features Overview

### Homepage
- Hero section with installation commands
- Feature highlights
- Installation process steps
- System requirements
- Call-to-action sections

### Documentation
- Quick start guide
- Installation options
- Network configuration
- Security setup
- Maintenance commands
- API reference

### Troubleshooting
- Quick diagnostics commands
- Categorized FAQ sections
- Code examples for solutions
- Emergency recovery procedures
- Community support links

### Releases
- Latest release highlights
- Version history
- Detailed changelogs
- Download links
- Installation commands for specific versions

## Technology Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icons
- **React Router** - Client-side routing

## Deployment

The website is designed to be deployed as a static site to any modern hosting platform:

- **Netlify**: Connect your repository for automatic deployments
- **Vercel**: Deploy with zero configuration
- **GitHub Pages**: Host directly from your repository
- **AWS S3 + CloudFront**: Enterprise-grade hosting
- **Any CDN**: Build and upload the `dist` folder

### Build Commands
```bash
# Install dependencies
pnpm install

# Build for production
pnpm build:prod

# The built files will be in the 'dist' directory
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

- **Documentation**: [docs.pi5-supernode.com](https://docs.pi5-supernode.com)
- **Issues**: [GitHub Issues](https://github.com/pi5-supernode/platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/pi5-supernode/platform/discussions)
- **Email**: support@pi5-supernode.com

## License

MIT License - see the [LICENSE](LICENSE) file for details.
