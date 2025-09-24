import React from 'react';
import { motion } from 'framer-motion';
import { 
  Book, 
  Terminal, 
  Network, 
  Shield, 
  Settings, 
  Monitor,
  Code,
  ExternalLink,
  ChevronRight,
  Download
} from 'lucide-react';
import CodeBlock from '../components/CodeBlock';

const Documentation: React.FC = () => {
  const [copiedCommand, setCopiedCommand] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, commandType: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(commandType);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const sections = [
    {
      id: 'quick-start',
      title: 'Quick Start Guide',
      icon: Terminal,
      description: 'Get up and running in minutes'
    },
    {
      id: 'installation',
      title: 'Installation Options',
      icon: Download,
      description: 'Different installation methods'
    },
    {
      id: 'network',
      title: 'Network Configuration',
      icon: Network,
      description: 'Configure interfaces and routing'
    },
    {
      id: 'security',
      title: 'Security Setup',
      icon: Shield,
      description: 'Firewall and VPN configuration'
    },
    {
      id: 'monitoring',
      title: 'Monitoring & Alerts',
      icon: Monitor,
      description: 'Set up monitoring and notifications'
    },
    {
      id: 'api',
      title: 'API Reference',
      icon: Code,
      description: 'Programmatic access and automation'
    }
  ];

  const installCommands = {
    quick: "curl -sSL https://get-pi5supernode.com/install | bash",
    interactive: "curl -sSL https://get-pi5supernode.com/install | bash -s -- --interactive",
    offline: "wget https://get-pi5supernode.com/offline-installer.tar.gz",
    update: "curl -sSL https://get-pi5supernode.com/update | bash",
    verify: "/opt/pi5-supernode/scripts/verify.sh"
  };

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
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
            Documentation
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Complete guide to installing, configuring, and managing your Pi5 Supernode
          </p>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Book className="w-6 h-6 text-blue-400" />
            Table of Contents
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.a
                  key={section.id}
                  href={`#${section.id}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 hover:border-blue-500/50 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {section.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                </motion.a>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Start Guide */}
        <section id="quick-start" className="mb-16">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Terminal className="w-7 h-7 text-green-400" />
              Quick Start Guide
            </h2>
            
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Prerequisites</h3>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      Raspberry Pi 5 (4GB+ RAM recommended)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      Fresh Raspberry Pi OS installation
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      Internet connection during installation
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      8GB+ free disk space
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      SSH access or direct terminal
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Installation Steps</h3>
                  <ol className="space-y-3 text-slate-300">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                      <span>SSH into your Pi or open terminal</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                      <span>Run the one-command installer</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                      <span>Wait 10-15 minutes for completion</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                      <span>Access web interface via browser</span>
                    </li>
                  </ol>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-4">Install Command</h3>
                <CodeBlock
                  code={installCommands.quick}
                  onCopy={() => copyToClipboard(installCommands.quick, 'quick-start')}
                  copied={copiedCommand === 'quick-start'}
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Installation Options */}
        <section id="installation" className="mb-16">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Download className="w-7 h-7 text-blue-400" />
              Installation Options
            </h2>
            
            <div className="space-y-6">
              {/* Quick Installation */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <Terminal className="w-4 h-4 text-white" />
                  </div>
                  Quick Installation (Recommended)
                </h3>
                <p className="text-slate-400 mb-4">
                  Automated installation with sensible defaults. Best for most users.
                </p>
                <CodeBlock
                  code={installCommands.quick}
                  onCopy={() => copyToClipboard(installCommands.quick, 'install-quick')}
                  copied={copiedCommand === 'install-quick'}
                />
              </div>

              {/* Interactive Installation */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  Interactive Installation
                </h3>
                <p className="text-slate-400 mb-4">
                  Step-by-step installation with customization options and explanations.
                </p>
                <CodeBlock
                  code={installCommands.interactive}
                  onCopy={() => copyToClipboard(installCommands.interactive, 'install-interactive')}
                  copied={copiedCommand === 'install-interactive'}
                />
                <div className="mt-4 text-sm text-slate-400">
                  <strong>Additional options:</strong>
                  <ul className="mt-2 space-y-1 ml-4">
                    <li>• <code className="bg-slate-700 px-2 py-1 rounded text-slate-300">--dev-mode</code> - Enable development features</li>
                    <li>• <code className="bg-slate-700 px-2 py-1 rounded text-slate-300">--force</code> - Force installation despite conflicts</li>
                    <li>• <code className="bg-slate-700 px-2 py-1 rounded text-slate-300">--skip-verification</code> - Skip post-installation tests</li>
                  </ul>
                </div>
              </div>

              {/* Offline Installation */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Download className="w-4 h-4 text-white" />
                  </div>
                  Offline Installation
                </h3>
                <p className="text-slate-400 mb-4">
                  For air-gapped environments or systems without internet access.
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-400 mb-2">1. Download offline package:</p>
                    <CodeBlock
                      code={installCommands.offline}
                      onCopy={() => copyToClipboard(installCommands.offline, 'install-offline')}
                      copied={copiedCommand === 'install-offline'}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-2">2. Extract and install:</p>
                    <CodeBlock
                      code="tar -xzf offline-installer.tar.gz && cd pi5-supernode-offline-installer && ./install.sh"
                      onCopy={() => copyToClipboard("tar -xzf offline-installer.tar.gz && cd pi5-supernode-offline-installer && ./install.sh", 'install-extract')}
                      copied={copiedCommand === 'install-extract'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Network Configuration */}
        <section id="network" className="mb-16">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Network className="w-7 h-7 text-cyan-400" />
              Network Configuration
            </h2>
            
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Interface Management</h3>
                  <ul className="space-y-2 text-slate-300">
                    <li>• Automatic interface detection</li>
                    <li>• VLAN configuration</li>
                    <li>• Bridge and bond interfaces</li>
                    <li>• WiFi access point setup</li>
                    <li>• Guest network isolation</li>
                  </ul>
                  
                  <h3 className="text-xl font-semibold text-white mb-4 mt-6">Routing & Traffic</h3>
                  <ul className="space-y-2 text-slate-300">
                    <li>• Multi-WAN load balancing</li>
                    <li>• Policy-based routing</li>
                    <li>• QoS and traffic shaping</li>
                    <li>• Bandwidth monitoring</li>
                    <li>• Connection tracking</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Common Configurations</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-300 mb-2">Router Mode</h4>
                      <p className="text-sm text-slate-400">Internet sharing with DHCP and NAT</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-300 mb-2">Bridge Mode</h4>
                      <p className="text-sm text-slate-400">Transparent network bridge</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-300 mb-2">Access Point</h4>
                      <p className="text-sm text-slate-400">WiFi hotspot with guest networks</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Security Setup */}
        <section id="security" className="mb-16">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Shield className="w-7 h-7 text-red-400" />
              Security Setup
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Firewall */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Firewall & Protection</h3>
                <ul className="space-y-2 text-slate-300 mb-4">
                  <li>• Automatic UFW configuration</li>
                  <li>• Fail2ban intrusion prevention</li>
                  <li>• DDoS protection</li>
                  <li>• Port scanning detection</li>
                  <li>• Custom security rules</li>
                </ul>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-sm text-slate-400">
                    <strong>Default Policy:</strong> Deny all incoming, allow outgoing
                  </p>
                </div>
              </div>

              {/* VPN */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">VPN Services</h3>
                <ul className="space-y-2 text-slate-300 mb-4">
                  <li>• WireGuard (recommended)</li>
                  <li>• OpenVPN compatibility</li>
                  <li>• IPsec/IKEv2 support</li>
                  <li>• Client certificate management</li>
                  <li>• Split tunneling options</li>
                </ul>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-sm text-slate-400">
                    <strong>Default Ports:</strong> WireGuard 51820, OpenVPN 1194
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Maintenance Commands */}
        <section className="mb-16">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Terminal className="w-7 h-7 text-yellow-400" />
              Maintenance Commands
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">System Update</h3>
                <CodeBlock
                  code={installCommands.update}
                  onCopy={() => copyToClipboard(installCommands.update, 'update')}
                  copied={copiedCommand === 'update'}
                />
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Verify Installation</h3>
                <CodeBlock
                  code={installCommands.verify}
                  onCopy={() => copyToClipboard(installCommands.verify, 'verify')}
                  copied={copiedCommand === 'verify'}
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Support */}
        <section className="mb-16">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Need Help?</h2>
              <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                Check our troubleshooting guide or reach out to the community for support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/troubleshooting"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Book className="w-4 h-4" />
                  Troubleshooting Guide
                </a>
                <a
                  href="https://github.com/pi5-supernode"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  GitHub Community
                </a>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Documentation;