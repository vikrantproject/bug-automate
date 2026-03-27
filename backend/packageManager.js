const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { getAllTools } = require('./tools.config');

const execAsync = promisify(exec);

class PackageManager {
  constructor() {
    this.installLogPath = path.join(__dirname, '../logs/install.log');
    this.ensureLogFile();
  }

  ensureLogFile() {
    const logDir = path.dirname(this.installLogPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  async verifyAll() {
    const tools = getAllTools();
    const installed = [];
    const missing = [];

    // Check tools in batches of 20
    const batchSize = 20;
    for (let i = 0; i < tools.length; i += batchSize) {
      const batch = tools.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(tool => this.checkTool(tool))
      );
      
      batch.forEach((tool, idx) => {
        if (results[idx]) {
          installed.push(tool.id);
        } else {
          missing.push(tool.id);
        }
      });
    }

    return { installed, missing };
  }

  async checkTool(tool) {
    try {
      if (!tool.binary) return true; // Skip tools without binary check
      
      const { stdout } = await execAsync(`which ${tool.binary}`, {
        timeout: 5000
      });
      
      return stdout.trim().length > 0;
    } catch (error) {
      // Try version check as fallback
      try {
        await execAsync(`${tool.binary} --version`, { timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
  }

  async installMissing(missingToolIds) {
    const tools = getAllTools();
    const missingTools = tools.filter(t => missingToolIds.includes(t.id));
    
    // Group by install method
    const grouped = {
      apt: [],
      pip3: [],
      go: [],
      npm: [],
      git: [],
      curl: []
    };

    missingTools.forEach(tool => {
      if (tool.installMethod && grouped[tool.installMethod]) {
        grouped[tool.installMethod].push(tool);
      }
    });

    const results = [];

    // Install apt packages
    if (grouped.apt.length > 0) {
      const packages = grouped.apt.map(t => t.binary).join(' ');
      results.push(await this.installGroup('apt', `apt-get install -y ${packages}`));
    }

    // Install pip3 packages
    if (grouped.pip3.length > 0) {
      for (const tool of grouped.pip3) {
        results.push(await this.installGroup('pip3', tool.installCmd));
      }
    }

    // Install Go tools
    if (grouped.go.length > 0) {
      for (const tool of grouped.go) {
        results.push(await this.installGroup('go', tool.installCmd));
      }
    }

    // Install npm packages
    if (grouped.npm.length > 0) {
      for (const tool of grouped.npm) {
        results.push(await this.installGroup('npm', tool.installCmd));
      }
    }

    // Clone git repos
    if (grouped.git.length > 0) {
      for (const tool of grouped.git) {
        results.push(await this.installGroup('git', tool.installCmd));
      }
    }

    // Curl installs
    if (grouped.curl.length > 0) {
      for (const tool of grouped.curl) {
        results.push(await this.installGroup('curl', tool.installCmd));
      }
    }

    return results;
  }

  async installGroup(method, command) {
    try {
      logger.info(`Installing ${method} tools: ${command.substring(0, 100)}...`);
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 300000, // 5 minutes
        maxBuffer: 10 * 1024 * 1024 // 10MB
      });

      const logEntry = `[${new Date().toISOString()}] ${method}: SUCCESS\n${command}\n${stdout}\n\n`;
      fs.appendFileSync(this.installLogPath, logEntry);
      
      logger.info(`${method} installation completed successfully`);
      return { method, success: true };
    } catch (error) {
      const logEntry = `[${new Date().toISOString()}] ${method}: FAILED\n${command}\n${error.message}\n\n`;
      fs.appendFileSync(this.installLogPath, logEntry);
      
      logger.error(`${method} installation failed:`, error.message);
      
      // Retry once
      try {
        logger.info(`Retrying ${method} installation...`);
        const { stdout } = await execAsync(command, {
          timeout: 300000,
          maxBuffer: 10 * 1024 * 1024
        });
        
        const retryLog = `[${new Date().toISOString()}] ${method}: RETRY SUCCESS\n${stdout}\n\n`;
        fs.appendFileSync(this.installLogPath, retryLog);
        
        return { method, success: true, retried: true };
      } catch (retryError) {
        return { method, success: false, error: retryError.message };
      }
    }
  }

  getInstallCommand(tool) {
    return tool.installCmd || `apt-get install -y ${tool.binary}`;
  }
}

module.exports = { PackageManager };
