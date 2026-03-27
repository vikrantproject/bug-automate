const Queue = require('bull');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const { getToolsByProfile } = require('./tools.config');
const toolRunner = require('./toolRunner');
const { saveScan, saveFinding, saveToolResult } = require('./resultsStore');
const { updateScanProgress } = require('./redisClient');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let scanQueue;
let io;

function initializeQueues(socketIo) {
  io = socketIo;
  
  scanQueue = new Queue('scans', REDIS_URL, {
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: 100,
      removeOnFail: 100
    }
  });

  scanQueue.process(5, async (job) => {
    return await processScan(job.data);
  });

  scanQueue.on('failed', (job, err) => {
    logger.error(`Scan ${job.data.scanId} failed:`, err);
  });

  scanQueue.on('completed', (job) => {
    logger.info(`Scan ${job.data.scanId} completed successfully`);
  });

  logger.info('Queue manager initialized');
}

async function processScan(scanData) {
  const { scanId, target, profile, useTor } = scanData;
  const startTime = Date.now();
  
  logger.info(`Processing scan ${scanId} for ${target}`);

  try {
    // Get tools based on profile
    const tools = getToolsByProfile(profile);
    const totalTools = tools.length;
    let completedTools = 0;
    const allFindings = [];
    
    // Update initial state
    await updateScanProgress(scanId, {
      status: 'running',
      phase: 'recon',
      progress: 0,
      totalTools,
      completedTools: 0
    });

    // Emit start event
    io.to(`scan:${scanId}`).emit('scan:progress', {
      scanId,
      percent: 0,
      phase: 'recon',
      currentTool: tools[0]?.name,
      eta: 0
    });

    // Phase mapping
    const phases = {
      recon: tools.filter(t => t.category === 'recon'),
      web: tools.filter(t => t.category === 'web'),
      vuln: tools.filter(t => t.category === 'vuln'),
      auth: tools.filter(t => t.category === 'auth'),
      infra: tools.filter(t => t.category === 'infra')
    };

    // Run tools by phase
    for (const [phaseName, phaseTools] of Object.entries(phases)) {
      if (phaseTools.length === 0) continue;
      
      logger.info(`Starting phase: ${phaseName} with ${phaseTools.length} tools`);
      
      await updateScanProgress(scanId, {
        phase: phaseName,
        currentPhase: phaseName
      });

      io.to(`scan:${scanId}`).emit('scan:progress', {
        scanId,
        phase: phaseName,
        percent: Math.round((completedTools / totalTools) * 100)
      });

      // Run tools in this phase
      for (const tool of phaseTools) {
        // Emit tool start
        io.to(`scan:${scanId}`).emit('tool:start', {
          scanId,
          toolId: tool.id,
          toolName: tool.name
        });

        try {
          const result = await toolRunner.runToolWithTorFallback(tool.id, target, useTor);
          
          // Save tool result
          saveToolResult({
            scanId,
            ...result
          });

          // Save findings
          if (result.findings && result.findings.length > 0) {
            result.findings.forEach(finding => {
              saveFinding({ scanId, ...finding });
              allFindings.push(finding);
            });
          }

          // Emit tool completion
          io.to(`scan:${scanId}`).emit('tool:done', {
            scanId,
            toolId: tool.id,
            findings: result.findings || [],
            duration: result.duration,
            status: result.status
          });

          // Emit Tor rotation if applicable
          if (result.viaTor) {
            io.to(`scan:${scanId}`).emit('tor:rotated', {
              scanId,
              toolId: tool.id,
              reason: 'Network block detected'
            });
          }

        } catch (toolError) {
          logger.error(`Tool ${tool.id} error:`, toolError);
          
          io.to(`scan:${scanId}`).emit('tool:failed', {
            scanId,
            toolId: tool.id,
            error: toolError.message
          });
        }

        completedTools++;
        const progress = Math.round((completedTools / totalTools) * 100);
        const elapsed = Date.now() - startTime;
        const eta = completedTools > 0 ? Math.round((elapsed / completedTools) * (totalTools - completedTools) / 1000) : 0;

        // Update progress
        await updateScanProgress(scanId, {
          progress,
          completedTools,
          eta
        });

        io.to(`scan:${scanId}`).emit('scan:progress', {
          scanId,
          percent: progress,
          currentTool: tool.name,
          phase: phaseName,
          eta
        });
      }
    }

    // Calculate summary
    const summary = {
      critical: allFindings.filter(f => f.severity === 'critical').length,
      high: allFindings.filter(f => f.severity === 'high').length,
      medium: allFindings.filter(f => f.severity === 'medium').length,
      low: allFindings.filter(f => f.severity === 'low').length,
      info: allFindings.filter(f => f.severity === 'info').length
    };

    const duration = Date.now() - startTime;

    // Save final scan state
    const finalScan = {
      scanId,
      target,
      profile,
      useTor,
      status: 'completed',
      progress: 100,
      phase: 'complete',
      createdAt: scanData.createdAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      duration,
      summary
    };

    saveScan(finalScan);
    await updateScanProgress(scanId, finalScan);

    // Emit completion
    io.to(`scan:${scanId}`).emit('scan:complete', {
      scanId,
      summary,
      duration,
      totalFindings: allFindings.length
    });

    logger.info(`Scan ${scanId} completed: ${allFindings.length} findings`);
    
    return { scanId, summary, duration };

  } catch (error) {
    logger.error(`Scan ${scanId} error:`, error);
    
    await updateScanProgress(scanId, {
      status: 'failed',
      error: error.message
    });

    saveScan({
      scanId,
      target,
      profile,
      useTor,
      status: 'failed',
      createdAt: scanData.createdAt || new Date().toISOString(),
      completedAt: new Date().toISOString()
    });

    throw error;
  }
}

async function addScanToQueue(scanData) {
  const job = await scanQueue.add(scanData, {
    jobId: scanData.scanId
  });
  
  logger.info(`Scan ${scanData.scanId} added to queue`);
  return job;
}

module.exports = {
  initializeQueues,
  addScanToQueue,
  scanQueue
};
