import React from 'react';
import { motion } from 'framer-motion';

export function ToolGrid({ tools }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400';
      case 'running':
        return 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400 pulse-glow';
      case 'failed':
        return 'bg-rose-400/10 border-rose-400/20 text-rose-400';
      default:
        return 'bg-white/5 border-white/5 text-white/40';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'running':
        return '⟳';
      case 'failed':
        return '✕';
      default:
        return '·';
    }
  };

  // Show 150 tool slots
  const allSlots = Array.from({ length: 150 }, (_, i) => {
    const tool = tools.find(t => tools.indexOf(t) === i);
    return tool || { status: 'queued', toolId: `slot-${i}` };
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-heavy rounded-3xl p-6"
      data-testid="tool-grid"
    >
      <div className="mb-4">
        <h3 className="text-lg font-['Outfit'] font-light tracking-tight text-white/90">
          Tool Execution Grid
        </h3>
        <p className="text-xs text-white/50 mt-1">150 security tools across 5 phases</p>
      </div>

      <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-1">
        {allSlots.map((tool, index) => (
          <motion.div
            key={tool.toolId || `slot-${index}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.002 }}
            className={`
              aspect-square rounded-md border text-center flex items-center justify-center
              text-xs font-mono transition-all duration-300 cursor-pointer
              hover:scale-110 hover:border-white/30
              ${getStatusColor(tool.status)}
            `}
            title={tool.toolName || `Tool ${index + 1}`}
            data-testid={`tool-cell-${index}`}
          >
            {getStatusIcon(tool.status)}
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border bg-white/5 border-white/5"></div>
          <span className="text-white/50">Queued</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border bg-cyan-400/10 border-cyan-400/20"></div>
          <span className="text-white/50">Running</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border bg-emerald-400/10 border-emerald-400/20"></div>
          <span className="text-white/50">Done</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border bg-rose-400/10 border-rose-400/20"></div>
          <span className="text-white/50">Failed</span>
        </div>
      </div>
    </motion.div>
  );
}
