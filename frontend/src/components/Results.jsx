import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Results({ findings }) {
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [expandedFinding, setExpandedFinding] = useState(null);

  const filteredFindings = selectedSeverity === 'all' 
    ? findings 
    : findings.filter(f => f.severity === selectedSeverity);

  const getSeverityBadge = (severity) => {
    const badges = {
      critical: 'bg-rose-400/10 border-rose-400/20 text-rose-400',
      high: 'bg-amber-400/10 border-amber-400/20 text-amber-400',
      medium: 'bg-blue-400/10 border-blue-400/20 text-blue-400',
      low: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400',
      info: 'bg-white/5 border-white/10 text-white/70'
    };
    return badges[severity] || badges.info;
  };

  const filters = ['all', 'critical', 'high', 'medium', 'low', 'info'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-heavy rounded-3xl p-6"
      data-testid="results-panel"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-['Outfit'] font-light tracking-tighter text-white/90 mb-4">
          Security Findings
        </h3>
        
        <div className="flex flex-wrap gap-2">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedSeverity(filter)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${selectedSeverity === filter 
                  ? 'bg-cyan-400/20 border border-cyan-400/40 text-cyan-400' 
                  : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/90 hover:border-white/20'
                }
              `}
              data-testid={`filter-${filter}`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredFindings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/50 text-sm">No findings yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {filteredFindings.map((finding, index) => (
            <motion.div
              key={`${finding.toolId}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-light rounded-xl border border-white/10 overflow-hidden"
            >
              <button
                onClick={() => setExpandedFinding(expandedFinding === index ? null : index)}
                className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                data-testid={`finding-${index}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs uppercase tracking-wider border ${getSeverityBadge(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      <span className="text-xs text-white/50 font-mono">{finding.toolId}</span>
                    </div>
                    <h4 className="text-white/90 font-medium">{finding.title}</h4>
                    {finding.description && (
                      <p className="text-sm text-white/60 mt-1">{finding.description}</p>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-white/50 transition-transform ${expandedFinding === index ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              <AnimatePresence>
                {expandedFinding === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-4">
                      {finding.evidence && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Evidence</p>
                          <pre className="text-xs text-white/70 bg-black/40 p-3 rounded-lg overflow-x-auto font-mono">
                            {finding.evidence}
                          </pre>
                        </div>
                      )}
                      
                      {finding.remediation && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Remediation</p>
                          <p className="text-sm text-white/80">{finding.remediation}</p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-xs">
                        {finding.cvss && (
                          <div>
                            <span className="text-white/50">CVSS: </span>
                            <span className="text-white/90">{finding.cvss}</span>
                          </div>
                        )}
                        {finding.cve && (
                          <div>
                            <span className="text-white/50">CVE: </span>
                            <a 
                              href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${finding.cve}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              {finding.cve}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
