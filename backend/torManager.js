const net = require('net');
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
const logger = require('./logger');

const TOR_SOCKS_PORT = parseInt(process.env.TOR_SOCKS_PORT || 9050);
const TOR_CONTROL_PORT = parseInt(process.env.TOR_CONTROL_PORT || 9051);
const TOR_CONTROL_PASSWORD = process.env.TOR_CONTROL_PASSWORD || '';

class TorManager {
  constructor() {
    this.socksProxy = `socks5://127.0.0.1:${TOR_SOCKS_PORT}`;
    this.currentIP = null;
    this.rotationCount = 0;
  }

  getSocksAgent() {
    return new SocksProxyAgent(this.socksProxy);
  }

  async sendControlCommand(command) {
    return new Promise((resolve, reject) => {
      const socket = net.connect(TOR_CONTROL_PORT, '127.0.0.1');
      let response = '';

      socket.on('connect', () => {
        if (TOR_CONTROL_PASSWORD) {
          socket.write(`AUTHENTICATE "${TOR_CONTROL_PASSWORD}"\r\n`);
        } else {
          socket.write('AUTHENTICATE\r\n');
        }
      });

      socket.on('data', (data) => {
        response += data.toString();
        
        if (response.includes('250 OK')) {
          if (!command.startsWith('SIGNAL')) {
            socket.write(`${command}\r\n`);
          }
        }
        
        if (command.startsWith('SIGNAL') && response.includes('250 OK')) {
          socket.write(`${command}\r\n`);
        }
        
        if (response.split('250 OK').length > (command.startsWith('SIGNAL') ? 2 : 1)) {
          socket.end();
          resolve(response);
        }
      });

      socket.on('error', (err) => {
        logger.error('Tor control socket error:', err);
        reject(err);
      });

      socket.on('timeout', () => {
        socket.end();
        reject(new Error('Tor control connection timeout'));
      });

      socket.setTimeout(5000);
    });
  }

  async getNewCircuit() {
    try {
      const oldIP = this.currentIP;
      
      await this.sendControlCommand('SIGNAL NEWNYM');
      logger.info('Sent NEWNYM signal to Tor');
      
      // Wait for circuit to establish
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify new IP
      const newIP = await this.getCurrentIP();
      this.rotationCount++;
      
      logger.info(`Tor circuit rotated: ${oldIP} → ${newIP} (rotation #${this.rotationCount})`);
      
      return newIP;
    } catch (error) {
      logger.error('Failed to rotate Tor circuit:', error);
      throw error;
    }
  }

  async getCurrentIP() {
    try {
      const agent = this.getSocksAgent();
      const response = await axios.get('https://check.torproject.org/api/ip', {
        httpAgent: agent,
        httpsAgent: agent,
        timeout: 10000
      });
      
      this.currentIP = response.data.IP || 'unknown';
      return this.currentIP;
    } catch (error) {
      logger.error('Failed to get current Tor IP:', error);
      
      // Fallback to ipify
      try {
        const agent = this.getSocksAgent();
        const response = await axios.get('https://api.ipify.org?format=json', {
          httpAgent: agent,
          httpsAgent: agent,
          timeout: 10000
        });
        this.currentIP = response.data.ip || 'unknown';
        return this.currentIP;
      } catch (fallbackError) {
        logger.error('Fallback IP check also failed:', fallbackError);
        this.currentIP = 'unknown';
        return 'unknown';
      }
    }
  }

  async rotateIfNeeded(responseCode, error = null) {
    const blockedCodes = [403, 429, 503, 0];
    const shouldRotate = blockedCodes.includes(responseCode) || 
                        (error && error.code === 'ECONNREFUSED');
    
    if (shouldRotate) {
      logger.warn(`Blocked (HTTP ${responseCode}) - rotating Tor circuit...`);
      const newIP = await this.getNewCircuit();
      return {
        rotated: true,
        oldIP: this.currentIP,
        newIP,
        reason: `HTTP ${responseCode}`
      };
    }
    
    return { rotated: false };
  }

  async testConnection() {
    try {
      const ip = await this.getCurrentIP();
      logger.info(`Tor connection test successful. Exit IP: ${ip}`);
      return { success: true, ip };
    } catch (error) {
      logger.error('Tor connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TorManager();
