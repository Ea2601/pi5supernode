import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Calendar, 
  Tag, 
  FileText, 
  Github, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Archive
} from 'lucide-react';
import CodeBlock from '../components/CodeBlock';

interface Release {
  version: string;
  date: string;
  status: 'stable' | 'beta' | 'alpha';
  description: string;
  features: string[];
  fixes: string[];
  breaking?: string[];
  downloadUrl: string;
  installCommand: string;
  fileSize: string;
  checksums: {
    sha256: string;
  };
}

const Releases: React.FC = () => {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<string>('3.0.0');

  const copyToClipboard = (text: string, commandType: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(commandType);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const releases: Release[] = [
    {
      version: '3.0.0',
      date: '2024-12-09',
      status: 'stable',
      description: 'Major release with complete automation system, enhanced security, and improved user experience.',
      features: [
        'One-command automated installation system',
        'Interactive installation mode with customization options',
        'Offline installation package support',
        'Advanced progress indicators and error handling',
        'Comprehensive verification and testing system',
        'Automatic rollback on installation failures',
        'Enhanced web interface with modern UI',
        'Improved VPN management with multi-protocol support',
        'Real-time monitoring and performance analytics',
        'Advanced firewall and security configurations'
      ],
      fixes: [
        'Fixed memory leaks in network monitoring service',
        'Resolved SSL certificate generation issues',
        'Improved stability of WireGuard connections',
        'Fixed compatibility issues with Raspberry Pi OS Bookworm',
        'Corrected timezone handling in log files',
        'Fixed database migration issues from previous versions'
      ],
      breaking: [
        'Configuration file format changed (automatic migration included)',
        'API endpoints restructured (v2 compatibility maintained)',
        'Minimum system requirements increased to 4GB RAM'
      ],
      downloadUrl: 'https://get-pi5supernode.com/releases/v3.0.0/pi5-supernode-offline-installer-v3.0.0.tar.gz',
      installCommand: 'curl -sSL https://get-pi5supernode.com/install | bash',
      fileSize: '1.2 GB',
      checksums: {
        sha256: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
      }
    },
    {
      version: '2.5.1',
      date: '2024-11-15',
      status: 'stable',
      description: 'Stability improvements and bug fixes for the 2.5 series.',
      features: [
        'Improved error handling in network configuration',
        'Enhanced logging and debugging capabilities',
        'Better support for USB network adapters',
        'Optimized memory usage for Pi 4B compatibility'
      ],
      fixes: [
        'Fixed DHCP server conflicts on multiple interfaces',
        'Resolved hostapd startup issues',
        'Corrected VPN client certificate generation',
        'Fixed web interface HTTPS redirect loops'
      ],
      downloadUrl: 'https://get-pi5supernode.com/releases/v2.5.1/pi5-supernode-offline-installer-v2.5.1.tar.gz',
      installCommand: 'curl -sSL https://get-pi5supernode.com/install | bash -s -- --version=2.5.1',
      fileSize: '980 MB',
      checksums: {
        sha256: 'b2c3d4e5f6789012345678901234567890123456789012345678901234567890a1'
      }
    },
    {
      version: '2.5.0',
      date: '2024-10-20',
      status: 'stable',
      description: 'Feature release with enhanced VPN capabilities and monitoring improvements.',
      features: [
        'Multi-protocol VPN support (WireGuard, OpenVPN, IPsec)',
        'Advanced traffic monitoring and QoS',
        'Guest network isolation',
        'Enhanced firewall rules management',
        'Bandwidth monitoring and alerts',
        'Improved API documentation'
      ],
      fixes: [
        'Improved installation reliability',
        'Fixed network interface detection',
        'Resolved service startup dependencies',
        'Corrected backup and restore functionality'
      ],
      downloadUrl: 'https://get-pi5supernode.com/releases/v2.5.0/pi5-supernode-offline-installer-v2.5.0.tar.gz',
      installCommand: 'curl -sSL https://get-pi5supernode.com/install | bash -s -- --version=2.5.0',
      fileSize: '950 MB',
      checksums: {
        sha256: 'c3d4e5f6789012345678901234567890123456789012345678901234567890a1b2'
      }
    },
    {
      version: '3.1.0-beta.1',
      date: '2024-12-15',
      status: 'beta',
      description: 'Beta release with experimental features and AI-powered network optimization.',
      features: [
        'AI-powered network optimization (experimental)',
        'Advanced threat detection system',
        'Machine learning-based traffic analysis',
        'Predictive maintenance alerts',
        'Enhanced API with GraphQL support',
        'Cloud integration capabilities'
      ],
      fixes: [
        'Improved installation speed',
        'Enhanced error recovery mechanisms',
        'Better hardware compatibility detection'
      ],
      downloadUrl: 'https://get-pi5supernode.com/releases/v3.1.0-beta.1/pi5-supernode-offline-installer-v3.1.0-beta.1.tar.gz',
      installCommand: 'curl -sSL https://get-pi5supernode.com/install | bash -s -- --version=3.1.0-beta.1 --beta',
      fileSize: '1.4 GB',
      checksums: {
        sha256: 'd4e5f6789012345678901234567890123456789012345678901234567890a1b2c3'
      }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'beta': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'alpha': return 'text-red-400 bg-red-400/20 border-red-400/30';
      default: return 'text-slate-400 bg-slate-400/20 border-slate-400/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'stable': return CheckCircle;
      case 'beta': case 'alpha': return AlertCircle;
      default: return Tag;
    }
  };

  const currentRelease = releases.find(r => r.version === selectedRelease) || releases[0];

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-6">
            Releases
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Download Pi5 Supernode releases and view changelog information
          </p>
        </motion.div>

        {/* Latest Release Highlight */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <div className="bg-gradient-to-r from-blue-500/20 to-green-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-3xl font-bold text-white">Latest Release</h2>
                  <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(releases[0].status)}`}>
                    v{releases[0].version}
                  </div>
                </div>
                <p className="text-slate-300 mb-4">{releases[0].description}</p>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(releases[0].date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4" />
                    {releases[0].fileSize}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.a
                  href={releases[0].downloadUrl}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download v{releases[0].version}
                </motion.a>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copyToClipboard(releases[0].installCommand, 'latest')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  {copiedCommand === 'latest' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Install
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Release List */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h3 className="text-2xl font-bold text-white mb-6">All Releases</h3>
              
              <div className="space-y-3">
                {releases.map((release, index) => {
                  const StatusIcon = getStatusIcon(release.status);
                  return (
                    <motion.button
                      key={release.version}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      onClick={() => setSelectedRelease(release.version)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedRelease === release.version
                          ? 'bg-blue-500/20 border-blue-400/50'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">v{release.version}</span>
                          <div className={`px-2 py-0.5 rounded-full border text-xs font-medium ${getStatusColor(release.status)}`}>
                            <StatusIcon className="w-3 h-3 inline mr-1" />
                            {release.status}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-slate-400">
                        {new Date(release.date).toLocaleDateString()}
                      </div>
                      <p className="text-sm text-slate-300 mt-2 line-clamp-2">
                        {release.description}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Release Details */}
          <div className="lg:col-span-2">
            <motion.div
              key={selectedRelease}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-white">
                      Version {currentRelease.version}
                    </h3>
                    <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(currentRelease.status)}`}>
                      {currentRelease.status.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    {new Date(currentRelease.date).toLocaleDateString()}
                  </div>
                </div>
                
                <p className="text-slate-300">{currentRelease.description}</p>
              </div>

              {/* Installation */}
              <div className="p-6 border-b border-slate-700">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-400" />
                  Installation
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400 mb-2">One-command installation:</p>
                    <CodeBlock
                      code={currentRelease.installCommand}
                      onCopy={() => copyToClipboard(currentRelease.installCommand, `install-${currentRelease.version}`)}
                      copied={copiedCommand === `install-${currentRelease.version}`}
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Offline installer:</p>
                      <a
                        href={currentRelease.downloadUrl}
                        className="block w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-center"
                      >
                        Download ({currentRelease.fileSize})
                      </a>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-400 mb-2">SHA256 Checksum:</p>
                      <div className="bg-slate-700 rounded p-2 text-xs font-mono text-slate-300 break-all">
                        {currentRelease.checksums.sha256}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              {currentRelease.features.length > 0 && (
                <div className="p-6 border-b border-slate-700">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    New Features
                  </h4>
                  <ul className="space-y-2">
                    {currentRelease.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-slate-300">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bug Fixes */}
              {currentRelease.fixes.length > 0 && (
                <div className="p-6 border-b border-slate-700">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Bug Fixes
                  </h4>
                  <ul className="space-y-2">
                    {currentRelease.fixes.map((fix, index) => (
                      <li key={index} className="flex items-start gap-2 text-slate-300">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                        {fix}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Breaking Changes */}
              {currentRelease.breaking && currentRelease.breaking.length > 0 && (
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    Breaking Changes
                  </h4>
                  <ul className="space-y-2">
                    {currentRelease.breaking.map((change, index) => (
                      <li key={index} className="flex items-start gap-2 text-slate-300">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Archive Note */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center justify-center gap-2">
              <Github className="w-5 h-5" />
              Looking for older releases?
            </h3>
            <p className="text-slate-400 mb-4">
              Find all releases and source code on our GitHub repository.
            </p>
            <a
              href="https://github.com/pi5-supernode/platform/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on GitHub
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Releases;