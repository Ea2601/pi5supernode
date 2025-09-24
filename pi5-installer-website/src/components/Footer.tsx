import React from 'react';
import { motion } from 'framer-motion';
import { Github, Globe, Mail, Heart, Terminal } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    project: [
      { name: 'Installation', href: '/' },
      { name: 'Documentation', href: '/docs' },
      { name: 'Troubleshooting', href: '/troubleshooting' },
      { name: 'Releases', href: '/releases' },
    ],
    community: [
      { name: 'GitHub', href: 'https://github.com/pi5-supernode', icon: Github },
      { name: 'Website', href: 'https://pi5-supernode.com', icon: Globe },
      { name: 'Support', href: 'mailto:support@pi5-supernode.com', icon: Mail },
    ],
    resources: [
      { name: 'Quick Start Guide', href: '/docs#quick-start' },
      { name: 'API Reference', href: '/docs#api' },
      { name: 'Network Configuration', href: '/docs#network' },
      { name: 'Security Guide', href: '/docs#security' },
    ]
  };

  return (
    <footer className="bg-slate-900/50 backdrop-blur-sm border-t border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Pi5 Supernode</h3>
                <p className="text-sm text-slate-400">Installer Portal</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Transform your Raspberry Pi 5 into an enterprise-grade network management platform with one command.
            </p>
            <div className="flex items-center text-slate-400 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 mx-1 text-red-400" />
              <span>for the Pi community</span>
            </div>
          </div>

          {/* Project Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Project</h4>
            <ul className="space-y-2">
              {links.project.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Community</h4>
            <ul className="space-y-2">
              {links.community.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {link.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              {links.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-slate-400 text-sm mb-4 md:mb-0">
              © {currentYear} Pi5 Supernode. Open source project.
            </div>
            
            <div className="flex items-center space-x-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-r from-green-500/20 to-blue-500/20 px-4 py-2 rounded-lg border border-green-500/30"
              >
                <span className="text-green-400 text-sm font-medium">v3.0.0 Available</span>
              </motion.div>
              
              <div className="text-slate-400 text-xs">
                Installation Command Updated: Dec 2024
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;