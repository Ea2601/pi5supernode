import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Terminal, 
  Wifi, 
  Shield, 
  Network,
  HardDrive,
  Cpu,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import CodeBlock from '../components/CodeBlock';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  code?: string;
  category: string;
}

const Troubleshooting: React.FC = () => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyToClipboard = (text: string, commandType: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(commandType);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const categories = [
    { id: 'installation', name: 'Installation Issues', icon: Terminal, color: 'text-blue-400' },
    { id: 'network', name: 'Network Problems', icon: Network, color: 'text-green-400' },
    { id: 'performance', name: 'Performance Issues', icon: Cpu, color: 'text-yellow-400' },
    { id: 'security', name: 'Security & VPN', icon: Shield, color: 'text-red-400' },
    { id: 'hardware', name: 'Hardware Issues', icon: HardDrive, color: 'text-purple-400' }
  ];

  const faqItems: FAQItem[] = [
    {
      id: 'install-failed',
      category: 'installation',
      question: 'Installation failed with "Permission denied" error',
      answer: 'This usually means you need sudo access. Make sure you can run sudo commands and try again. If you\'re running as root, switch to a regular user with sudo privileges.',
      code: 'sudo -v  # Test sudo access\ncurl -sSL https://get-pi5supernode.com/install | bash'
    },
    {
      id: 'disk-space',
      category: 'installation',
      question: 'Installation fails due to insufficient disk space',
      answer: 'Pi5 Supernode requires at least 8GB of free space. Check available space and clean up unnecessary files.',
      code: 'df -h /  # Check disk space\nsudo apt autoremove  # Clean up packages\nsudo apt autoclean  # Clear package cache'
    },
    {
      id: 'network-down',
      category: 'network',
      question: 'Network interfaces not working after installation',
      answer: 'Check if the network service is running and interfaces are configured correctly. You may need to restart networking.',
      code: 'sudo systemctl status networking\nsudo systemctl restart networking\nip addr show  # Check interface status'
    },
    {
      id: 'wifi-ap-fail',
      category: 'network',
      question: 'WiFi Access Point not starting',
      answer: 'Ensure your WiFi adapter supports AP mode and isn\'t already connected to a network. Check hostapd configuration.',
      code: 'sudo systemctl status hostapd\nsudo systemctl restart hostapd\niw list  # Check WiFi capabilities'
    },
    {
      id: 'high-cpu',
      category: 'performance',
      question: 'High CPU usage after installation',
      answer: 'This is normal during the first few hours as services initialize and databases are populated. Monitor with htop.',
      code: 'htop  # Monitor processes\nsudo systemctl status pi5-supernode\njournalctl -u pi5-supernode -f  # Check logs'
    },
    {
      id: 'memory-leak',
      category: 'performance',
      question: 'System running out of memory',
      answer: 'Check memory usage and restart services if needed. Consider upgrading to 8GB Pi5 for better performance.',
      code: 'free -h  # Check memory usage\nsudo systemctl restart pi5-supernode\nps aux --sort=-%mem | head  # Top memory users'
    },
    {
      id: 'vpn-connect-fail',
      category: 'security',
      question: 'VPN clients cannot connect',
      answer: 'Check firewall rules, VPN service status, and client configurations. Ensure ports are open.',
      code: 'sudo ufw status  # Check firewall\nsudo systemctl status wg-quick@wg0  # WireGuard status\nsudo wg show  # WireGuard peers'
    },
    {
      id: 'ssl-cert-error',
      category: 'security',
      question: 'SSL certificate errors in web interface',
      answer: 'Self-signed certificates will show warnings. For production, configure proper SSL certificates.',
      code: 'sudo certbot --nginx -d your-domain.com  # Get Let\'s Encrypt cert\nsudo systemctl reload nginx'
    },
    {
      id: 'overheating',
      category: 'hardware',
      question: 'Raspberry Pi 5 overheating',
      answer: 'Ensure proper ventilation and consider adding a fan or heat sink. Check CPU temperature regularly.',
      code: 'vcgencmd measure_temp  # Check temperature\nwatch -n 1 vcgencmd measure_temp  # Monitor continuously'
    },
    {
      id: 'storage-corrupt',
      category: 'hardware',
      question: 'SD card corruption or read-only filesystem',
      answer: 'This often indicates SD card failure. Back up data and replace with a high-quality card (Class 10 or better).',
      code: 'sudo fsck /dev/mmcblk0p2  # Check filesystem\nsudo mount -o remount,rw /  # Remount read-write'
    }
  ];

  const diagnosticCommands = {
    health: '/opt/pi5-supernode/scripts/health-check.sh',
    logs: 'sudo journalctl -u pi5-supernode -f',
    status: 'sudo systemctl status pi5-supernode',
    network: 'ip addr show && ip route show',
    verify: '/opt/pi5-supernode/scripts/verify.sh'
  };

  const toggleExpanded = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  const filteredItems = (categoryId: string) => {
    return faqItems.filter(item => item.category === categoryId);
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
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-6">
            Troubleshooting
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Common issues and solutions for Pi5 Supernode installation and operation
          </p>
        </motion.div>

        {/* Quick Diagnostics */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Terminal className="w-7 h-7 text-green-400" />
            Quick Diagnostics
          </h2>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
            <p className="text-slate-300 mb-6">
              Run these commands to quickly diagnose common issues:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">System Health Check</h3>
                <CodeBlock
                  code={diagnosticCommands.health}
                  onCopy={() => copyToClipboard(diagnosticCommands.health, 'health')}
                  copied={copiedCommand === 'health'}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Service Status</h3>
                <CodeBlock
                  code={diagnosticCommands.status}
                  onCopy={() => copyToClipboard(diagnosticCommands.status, 'status')}
                  copied={copiedCommand === 'status'}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">View Live Logs</h3>
                <CodeBlock
                  code={diagnosticCommands.logs}
                  onCopy={() => copyToClipboard(diagnosticCommands.logs, 'logs')}
                  copied={copiedCommand === 'logs'}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Network Status</h3>
                <CodeBlock
                  code={diagnosticCommands.network}
                  onCopy={() => copyToClipboard(diagnosticCommands.network, 'network')}
                  copied={copiedCommand === 'network'}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQ by Category */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-yellow-400" />
            Common Issues
          </h2>
          
          <div className="space-y-8">
            {categories.map((category, categoryIndex) => {
              const Icon = category.icon;
              const items = filteredItems(category.id);
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden"
                >
                  <div className="p-6 border-b border-slate-700">
                    <h3 className={`text-xl font-semibold text-white flex items-center gap-3`}>
                      <Icon className={`w-6 h-6 ${category.color}`} />
                      {category.name}
                    </h3>
                  </div>
                  
                  <div className="divide-y divide-slate-700">
                    {items.map((item, itemIndex) => (
                      <div key={item.id}>
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className="w-full p-6 text-left hover:bg-slate-700/30 transition-colors flex items-center justify-between"
                        >
                          <span className="text-white font-medium">{item.question}</span>
                          {expandedItem === item.id ? (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        
                        {expandedItem === item.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="px-6 pb-6"
                          >
                            <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
                              <p className="text-slate-300">{item.answer}</p>
                              
                              {item.code && (
                                <div>
                                  <p className="text-sm text-slate-400 mb-2">Try these commands:</p>
                                  <CodeBlock
                                    code={item.code}
                                    onCopy={() => copyToClipboard(item.code!, `faq-${item.id}`)}
                                    copied={copiedCommand === `faq-${item.id}`}
                                  />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Emergency Recovery */}
        <section className="mt-16">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Shield className="w-7 h-7 text-red-400" />
              Emergency Recovery
            </h2>
            
            <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Complete Reinstall</h3>
                  <p className="text-slate-300 mb-4">
                    If your installation is completely broken, you can remove everything and start fresh:
                  </p>
                  <CodeBlock
                    code="curl -sSL https://get-pi5supernode.com/uninstall | bash && curl -sSL https://get-pi5supernode.com/install | bash"
                    onCopy={() => copyToClipboard("curl -sSL https://get-pi5supernode.com/uninstall | bash && curl -sSL https://get-pi5supernode.com/install | bash", 'reinstall')}
                    copied={copiedCommand === 'reinstall'}
                  />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">System Restore</h3>
                  <p className="text-slate-300 mb-4">
                    Restore system to a clean state (removes all Pi5 Supernode components):
                  </p>
                  <CodeBlock
                    code="curl -sSL https://get-pi5supernode.com/uninstall | bash --force"
                    onCopy={() => copyToClipboard("curl -sSL https://get-pi5supernode.com/uninstall | bash --force", 'uninstall')}
                    copied={copiedCommand === 'uninstall'}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Get Help */}
        <section className="mt-16">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
              <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                If you can't find a solution here, reach out to our community or create an issue report.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://github.com/pi5-supernode/platform/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Report Issue
                </a>
                <a
                  href="https://github.com/pi5-supernode/platform/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Community Discussion
                </a>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Troubleshooting;