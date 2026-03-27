const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('./logger');
const { getToolById } = require('./tools.config');
const torManager = require('./torManager');

const execAsync = promisify(exec);

class ToolRunner {
  constructor() {
    this.runningProcesses = new Map();
  }

  async runTool(toolId, target, useTor = false) {
    const tool = getToolById(toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    const startTime = Date.now();
    const result = {
      toolId: tool.id,
      toolName: tool.name,
      status: 'running',
      startedAt: new Date().toISOString(),
      output: '',
      error: null,
      findings: [],
      duration: 0
    };

    try {
      logger.info(`Running tool: ${tool.name} on ${target}`);

      // Get appropriate command
      const command = useTor && tool.torCmd ? tool.torCmd(target) : tool.cmd(target);
      
      // Execute with timeout
      const { stdout, stderr } = await execAsync(command, {
        timeout: (tool.timeout || 60) * 1000,
        maxBuffer: 5 * 1024 * 1024, // 5MB
        shell: '/bin/bash'
      });

      result.output = stdout;
      result.status = 'completed';
      
      // Parse findings
      if (tool.parser) {
        try {
          const findings = tool.parser(stdout);
          result.findings = findings.map(f => ({
            ...f,
            toolId: tool.id,
            createdAt: new Date().toISOString()
          }));
        } catch (parseError) {
          logger.error(`Parser error for ${tool.id}:`, parseError);
          result.findings = [];
        }
      }

      if (stderr && stderr.length > 0) {
        result.error = stderr;
      }

    } catch (error) {
      logger.error(`Tool ${tool.id} failed:`, error.message);
      result.status = 'failed';
      result.error = error.message;
      
      // Check if it's a timeout
      if (error.killed && error.signal === 'SIGTERM') {
        result.error = `Timeout after ${tool.timeout}s`;
      }
    }

    result.completedAt = new Date().toISOString();
    result.duration = Date.now() - startTime;

    logger.info(`Tool ${tool.id} completed in ${result.duration}ms with status: ${result.status}`);
    
    return result;
  }

  async runToolWithTorFallback(toolId, target, useTor = false) {
    let result = await this.runTool(toolId, target, false);
    
    // If failed with network error and Tor is enabled, retry with Tor
    if (useTor && result.status === 'failed' && 
        (result.error?.includes('403') || result.error?.includes('429') || result.error?.includes('Connection'))) {
      logger.info(`Retrying ${toolId} with Tor...`);
      
      // Rotate Tor circuit
      await torManager.getNewCircuit();
      
      // Retry with Tor
      result = await this.runTool(toolId, target, true);
      result.viaTor = true;
    }
    
    return result;
  }

  async runBatch(toolIds, target, useTor = false) {
    const results = [];
    
    for (const toolId of toolIds) {
      try {
        const result = await this.runToolWithTorFallback(toolId, target, useTor);
        results.push(result);
      } catch (error) {
        logger.error(`Batch run error for ${toolId}:`, error);
        results.push({
          toolId,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = new ToolRunner();
