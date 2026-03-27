import React from 'react';
import { motion } from 'framer-motion';

export function ProgressBar({ progress, phase, eta, currentTool }) {
  const phaseColors = {
    initializing: 'from-blue-500 to-blue-400',
    recon: 'from-blue-500 via-cyan-400 to-cyan-300',
    web: 'from-cyan-400 via-emerald-400 to-emerald-300',
    vuln: 'from-emerald-400 via-amber-400 to-amber-300',
    auth: 'from-amber-400 via-rose-400 to-rose-300',
    infra: 'from-rose-400 via-purple-400 to-purple-300',
    complete: 'from-emerald-500 to-emerald-400'
  };

  const phaseLabels = {
    initializing: 'INITIALIZING',
    recon: 'RECONNAISSANCE',
    web: 'WEB SCAN',
    vuln: 'VULNERABILITY SCAN',
    auth: 'AUTHENTICATION',
    infra: 'INFRASTRUCTURE',
    complete: 'COMPLETE'
  };

  const gradientClass = phaseColors[phase] || phaseColors.initializing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-heavy rounded-3xl p-8"
      data-testid="progress-bar-container"
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-2xl font-['Outfit'] font-light tracking-tighter text-white/90">
            {progress}%
          </h3>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-white/50 mt-1">
            {phaseLabels[phase] || 'PREPARING'}
          </p>
        </div>
        {eta > 0 && (
          <div className="text-right">
            <p className="text-sm text-white/70">ETA</p>
            <p className="text-xl font-['Outfit'] font-light text-cyan-400">
              {Math.floor(eta / 60)}:{String(eta % 60).padStart(2, '0')}
            </p>
          </div>
        )}
      </div>

      <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${gradientClass}`}
          style={{
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.4)'
          }}
          data-testid="progress-bar-fill"
        />
      </div>

      {currentTool && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10"
        >
          <p className="text-xs text-white/50">Current Tool</p>
          <p className="text-sm text-white/90 font-medium mt-1">{currentTool}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
