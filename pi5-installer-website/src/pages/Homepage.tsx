import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Terminal, 
  Shield, 
  Zap, 
  Network, 
  Monitor, 
  Lock, 
  Wifi,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Play,
  Code,
  Globe
} from 'lucide-react';
import CodeBlock from '../components/CodeBlock';
import FeatureCard from '../components/FeatureCard';
import InstallationStep from '../components/InstallationStep';

const Homepage: React.FC = () => {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const installCommand = "curl -sSL https://get-pi5supernode.com/install | bash";
  const interactiveCommand = "curl -sSL https://get-pi5supernode.com/install | bash -s -- --interactive";
  const offlineCommand = "wget https://get-pi5supernode.com/offline-installer.tar.gz";

  const copyToClipboard = (text: string, commandType: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(commandType);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const features = [
    {
      icon: Network,
      title: "Advanced Network Management",
      description: "Complete control over network interfaces, routing, VLANs, and traffic shaping with enterprise-grade features.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Multi-Protocol VPN",
      description: "WireGuard, OpenVPN, and IPsec support with automatic configuration and seamless client management.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Monitor,
      title: "Real-Time Monitoring",
      description: "Comprehensive network monitoring with bandwidth tracking, device discovery, and performance analytics.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      description: "Built-in firewall, intrusion detection, fail2ban integration, and advanced security policies.",
      color: "from-red-500 to-orange-500"
    },
    {
      icon: Wifi,
      title: "Wireless Management",
      description: "Complete WiFi access point management with guest networks, bandwidth control, and device isolation.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: Zap,
      title: "High Performance",
      description: "Optimized for Raspberry Pi 5 with hardware acceleration and efficient resource utilization.",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const installationSteps = [
    {
      step: 1,
      title: "Prepare Your Pi5",
      description: "Fresh Raspberry Pi OS installation with internet connection",
      icon: Download
    },
    {
      step: 2,
      title: "Run Install Command",
      description: "Single command installs everything automatically",
      icon: Terminal
    },
    {
      step: 3,
      title: "Access Web Interface",
      description: "Navigate to your Pi's IP address to complete setup",
      icon: Globe
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-6">
              Pi5 Supernode
            </h1>
            <p className="text-2xl md:text-3xl text-slate-300 mb-4">
              Enterprise Network Management Platform
            </p>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              Transform your Raspberry Pi 5 into a powerful network management hub with 
              VPN capabilities, advanced monitoring, and enterprise-grade security features.
            </p>
          </motion.div>

          {/* One-Command Installation */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-8">
              One-Command Installation
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Quick Install */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-semibold text-white">Quick Install</h3>
                </div>
                <p className="text-slate-400 mb-4 text-left">
                  Automated installation with sensible defaults. Perfect for getting started quickly.
                </p>
                <CodeBlock
                  code={installCommand}
                  onCopy={() => copyToClipboard(installCommand, 'quick')}
                  copied={copiedCommand === 'quick'}
                />
              </div>

              {/* Interactive Install */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Terminal className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">Interactive Install</h3>
                </div>
                <p className="text-slate-400 mb-4 text-left">
                  Step-by-step installation with customization options and explanations.
                </p>
                <CodeBlock
                  code={interactiveCommand}
                  onCopy={() => copyToClipboard(interactiveCommand, 'interactive')}
                  copied={copiedCommand === 'interactive'}
                />
              </div>
            </div>

            {/* Offline Installation */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Download className="w-6 h-6 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Offline Installation</h3>
                </div>
                <p className="text-slate-400 mb-4 text-left">
                  Download complete offline installer package for air-gapped environments.
                </p>
                <div className="flex gap-3">
                  <CodeBlock
                    code={offlineCommand}
                    onCopy={() => copyToClipboard(offlineCommand, 'offline')}
                    copied={copiedCommand === 'offline'}
                    className="flex-1"
                  />
                  <motion.a
                    href="/releases"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </motion.a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Installation Time */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-6 max-w-2xl mx-auto mb-16"
          >
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-green-400" />
                <span className="text-white font-semibold">Installation Time:</span>
              </div>
              <span className="text-2xl font-bold text-green-400">10-15 minutes</span>
            </div>
            <p className="text-slate-300 mt-2">
              Complete automated installation including all dependencies and web interface
            </p>
          </motion.div>
        </div>
      </section>

      {/* Installation Process */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Installation Process
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Three simple steps to transform your Raspberry Pi 5 into an enterprise-grade network management platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {installationSteps.map((step, index) => (
              <InstallationStep
                key={step.step}
                {...step}
                delay={index * 0.2}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Enterprise-Grade Features
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Everything you need for professional network management, security, and monitoring in one comprehensive platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* System Requirements */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              System Requirements
            </h2>
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8"
          >
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Recommended
                </h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• Raspberry Pi 5 (8GB RAM)</li>
                  <li>• Raspberry Pi OS (Bookworm)</li>
                  <li>• 16GB+ microSD card (Class 10)</li>
                  <li>• Ethernet connection</li>
                  <li>• Internet access for installation</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-blue-400" />
                  Minimum
                </h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• Raspberry Pi 4B/5 (4GB RAM)</li>
                  <li>• Raspberry Pi OS (Bullseye+)</li>
                  <li>• 8GB+ storage space</li>
                  <li>• Network connectivity</li>
                  <li>• Sudo access</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-12"
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Transform your Raspberry Pi 5 into a professional network management platform in just one command.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => copyToClipboard(installCommand, 'cta')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg flex items-center justify-center gap-3 transition-all shadow-lg"
              >
                {copiedCommand === 'cta' ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Install Command
                  </>
                )}
              </motion.button>
              
              <motion.a
                href="/docs"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg flex items-center justify-center gap-3 transition-colors"
              >
                <Code className="w-5 h-5" />
                Documentation
                <ArrowRight className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
