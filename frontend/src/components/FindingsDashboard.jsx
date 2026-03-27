import React from 'react';
import { motion } from 'framer-motion';

export function FindingsDashboard({ findings }) {
  const severityCounts = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    info: findings.filter(f => f.severity === 'info').length
  };

  const severityCards = [
    { 
      severity: 'critical', 
      count: severityCounts.critical, 
      label: 'Critical', 
      color: 'from-rose-500 to-rose-600',
      bg: 'bg-rose-400/10',
      border: 'border-rose-400/20',
      text: 'text-rose-400'
    },
    { 
      severity: 'high', 
      count: severityCounts.high, 
      label: 'High', 
      color: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20',
      text: 'text-amber-400'
    },
    { 
      severity: 'medium', 
      count: severityCounts.medium, 
      label: 'Medium', 
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
      text: 'text-blue-400'
    },
    { 
      severity: 'low', 
      count: severityCounts.low, 
      label: 'Low', 
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
      text: 'text-emerald-400'
    },
    { 
      severity: 'info', 
      count: severityCounts.info, 
      label: 'Info', 
      color: 'from-white to-gray-400',
      bg: 'bg-white/5',
      border: 'border-white/10',
      text: 'text-white/70'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-2 md:grid-cols-5 gap-4"
      data-testid="findings-dashboard"
    >
      {severityCards.map((card, index) => (
        <motion.div
          key={card.severity}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`glass-light rounded-xl p-6 border ${card.border} ${card.bg}`}
          data-testid={`severity-card-${card.severity}`}
        >
          <div className="flex flex-col items-center">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2">
              {card.label}
            </p>
            <p className={`text-5xl font-['Outfit'] font-light tracking-tighter ${card.text}`}>
              {card.count}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
