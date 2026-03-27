import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './App.css';
import { useScan } from './hooks/useScan';
import { ServerInfo } from './components/ServerInfo';
import { ScanForm } from './components/ScanForm';
import { ProgressBar } from './components/ProgressBar';
import { ToolGrid } from './components/ToolGrid';
import { FindingsDashboard } from './components/FindingsDashboard';
import { Results } from './components/Results';

function App() {
  const {
    connected,
    currentScan,
    scanProgress,
    phase,
    toolResults,
    findings,
    eta,
    torRotations,
    startScan
  } = useScan();

  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    setIsScanning(currentScan?.status === 'running' || currentScan?.status === 'queued');
  }, [currentScan]);

  const handleStartScan = async (target, profile, useTor) => {
    await startScan(target, profile, useTor);
  };

  return (
    <div className="min-h-screen relative">
      {/* Mesh gradient background */}
      <div className="mesh-background"></div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-6 pt-12 pb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-5xl font-['Outfit'] font-light tracking-tighter text-white/90 mb-3">
                <span className="gradient-text">Bug Scanner</span>
              </h1>
              <p className="text-white/50 text-sm">
                Automated penetration testing with 150 security tools
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${connected ? 'bg-emerald-400/10 border border-emerald-400/20' : 'bg-white/5 border border-white/10'}`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`}></div>
              <span className={`text-xs font-mono ${connected ? 'text-emerald-400' : 'text-white/50'}`}>
                {connected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>

          {/* Legal notice banner */}
          <div className="mt-6 p-4 rounded-xl bg-rose-400/10 border border-rose-400/20">
            <p className="text-sm text-rose-400">
              <strong>⚠️ LEGAL NOTICE:</strong> This tool is for authorized penetration testing only. 
              Only scan systems you own or have explicit written permission to test. 
              Unauthorized scanning is illegal under the CFAA, Computer Misuse Act, and equivalent laws worldwide.
            </p>
          </div>
        </motion.header>

        {/* Main grid */}
        <div className="container mx-auto px-6 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left sidebar */}
            <div className="space-y-6">
              <ServerInfo />
              <ScanForm onStartScan={handleStartScan} isScanning={isScanning} />
            </div>

            {/* Main content area */}
            <div className="lg:col-span-3 space-y-6">
              {isScanning && (
                <>
                  <ProgressBar 
                    progress={scanProgress} 
                    phase={phase} 
                    eta={eta}
                    currentTool={toolResults[toolResults.length - 1]?.toolName}
                  />
                  
                  <FindingsDashboard findings={findings} />
                  
                  <ToolGrid tools={toolResults} />
                  
                  {torRotations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-light rounded-xl p-4 border border-cyan-400/20"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-cyan-400 text-sm">🔄 Tor IP Rotation Active</span>
                      </div>
                      <p className="text-xs text-white/50">
                        {torRotations.length} rotation{torRotations.length > 1 ? 's' : ''} performed to evade rate limiting
                      </p>
                    </motion.div>
                  )}
                </>
              )}

              {findings.length > 0 && (
                <Results findings={findings} />
              )}

              {!isScanning && findings.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-heavy rounded-3xl p-12 text-center"
                >
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-['Outfit'] font-light tracking-tight text-white/90 mb-3">
                      Ready to Scan
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed">
                      Enter a target URL and select a scan profile to begin automated security testing. 
                      Our platform will run 150 security tools across reconnaissance, web scanning, 
                      vulnerability detection, authentication testing, and infrastructure analysis.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="container mx-auto px-6 py-8 border-t border-white/10"
        >
          <div className="text-center text-white/50 text-sm space-y-2">
            <p className="font-mono">
              Bug Scanner Platform v1.0 • 150 Security Tools • Tor IP Rotation
            </p>
            <p className="text-xs">
              Powered by Subfinder, Nuclei, Nmap, SQLmap, Hydra, and 145+ more tools
            </p>
            <p className="text-xs text-rose-400 mt-4">
              For authorized penetration testing only. The authors accept no liability for misuse.
            </p>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}

export default App;
