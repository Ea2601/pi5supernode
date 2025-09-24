import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface InstallationStepProps {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
  delay?: number;
}

const InstallationStep: React.FC<InstallationStepProps> = ({ 
  step, 
  title, 
  description, 
  icon: Icon, 
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="text-center relative"
    >
      {/* Step Number */}
      <div className="relative mb-6">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
          {step}
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-400" />
        </div>
      </div>
      
      {/* Content */}
      <h3 className="text-xl font-semibold text-white mb-3">
        {title}
      </h3>
      
      <p className="text-slate-400">
        {description}
      </p>
    </motion.div>
  );
};

export default InstallationStep;