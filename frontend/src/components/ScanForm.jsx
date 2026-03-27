import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function ScanForm({ onStartScan, isScanning }) {
  const [target, setTarget] = useState('');
  const [profile, setProfile] = useState('full');
  const [useTor, setUseTor] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!target.trim()) {
      setError('Please enter a target URL or domain');
      return;
    }

    // Basic validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(target)) {
      setError('Please enter a valid URL or domain');
      return;
    }

    try {
      await onStartScan(target.trim(), profile, useTor);
    } catch (err) {
      setError('Failed to start scan. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="glass-heavy rounded-3xl p-8"
      data-testid="scan-form"
    >
      <div className="mb-6">
        <h2 className="text-3xl font-['Outfit'] font-light tracking-tighter text-white/90 mb-2">
          Start Security Scan
        </h2>
        <p className="text-sm text-white/50">
          Automated testing with 150+ security tools
        </p>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-rose-400/10 border border-rose-400/20">
        <p className="text-xs text-rose-400 leading-relaxed">
          ⚠️ <strong>LEGAL NOTICE:</strong> Only scan targets you own or have explicit written permission to test. 
          Unauthorized scanning is illegal under CFAA and equivalent laws worldwide.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-white/70 mb-2">
            Target URL or Domain
          </label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="https://example.com or example.com"
            disabled={isScanning}
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/30 
                     focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none
                     disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="target-input"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-white/70 mb-2">
            Scan Profile
          </label>
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            disabled={isScanning}
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white 
                     focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none
                     disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="profile-select"
          >
            <option value="quick">Quick Scan (30 tools, ~10 min)</option>
            <option value="web">Web Focus (80 tools, ~30 min)</option>
            <option value="full">Full Scan (150 tools, ~60 min)</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
          <div>
            <label className="text-sm text-white/90 font-medium">Enable Tor IP Rotation</label>
            <p className="text-xs text-white/50 mt-1">Rotate IP if target blocks requests</p>
          </div>
          <button
            type="button"
            onClick={() => setUseTor(!useTor)}
            disabled={isScanning}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       ${useTor ? 'bg-emerald-500' : 'bg-white/20'}`}
            data-testid="tor-toggle"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                         ${useTor ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-rose-400/10 border border-rose-400/20 text-rose-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isScanning}
          className={`w-full py-3 px-6 rounded-xl font-medium transition-all transform
                     ${isScanning 
                       ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                       : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 text-white hover:shadow-lg hover:shadow-cyan-500/50 hover:-translate-y-0.5'
                     }`}
          data-testid="start-scan-button"
        >
          {isScanning ? 'Scan in Progress...' : 'Start Scan'}
        </button>
      </form>
    </motion.div>
  );
}
