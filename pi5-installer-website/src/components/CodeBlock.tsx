import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  onCopy: () => void;
  copied: boolean;
  className?: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  onCopy, 
  copied, 
  className = '',
  language = 'bash'
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-600 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-600">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400 font-mono">{language}</span>
          </div>
          <motion.button
            onClick={onCopy}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded transition-colors text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </motion.button>
        </div>
        
        {/* Code */}
        <div className="p-4">
          <pre className="text-sm font-mono text-slate-100 whitespace-pre-wrap break-all">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeBlock;