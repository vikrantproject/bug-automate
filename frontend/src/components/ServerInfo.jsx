import React from 'react';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:9852';

export function ServerInfo() {
  const [serverInfo, setServerInfo] = React.useState(null);

  React.useEffect(() => {
    fetch(`${BACKEND_URL}/api/server-info`)
      .then(res => res.json())
      .then(data => setServerInfo(data))
      .catch(err => console.error('Failed to fetch server info:', err));
  }, []);

  if (!serverInfo) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-heavy rounded-3xl p-6"
      data-testid="server-info-panel"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
        <h3 className="text-white/90 font-mono text-sm tracking-wide">SCANNER STATUS</h3>
      </div>
      
      <div className="space-y-3 font-mono text-sm">
        <div className="flex justify-between items-center">
          <span className="text-white/50">VPS IP</span>
          <span className="text-cyan-400">{serverInfo.vpsIp}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/50">Port</span>
          <span className="text-cyan-400">{serverInfo.port}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/50">Worker</span>
          <span className="text-white/70">#{serverInfo.worker}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <a 
          href={serverInfo.accessUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors break-all"
          data-testid="access-url-link"
        >
          {serverInfo.accessUrl}
        </a>
      </div>
    </motion.div>
  );
}
