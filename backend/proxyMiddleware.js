const axios = require('axios');
const torManager = require('./torManager');
const logger = require('./logger');

class ProxyMiddleware {
  constructor() {
    this.maxRetries = 3;
    this.maxTorRetries = 5;
  }

  async makeRequest(url, options = {}, useTor = false) {
    let attempts = 0;
    let lastError = null;
    
    // Try direct connection first
    while (attempts < this.maxRetries) {
      try {
        const response = await axios({
          url,
          ...options,
          timeout: options.timeout || 30000
        });
        
        return { success: true, data: response.data, status: response.status };
      } catch (error) {
        attempts++;
        lastError = error;
        const statusCode = error.response?.status || 0;
        
        logger.warn(`Request failed (attempt ${attempts}/${this.maxRetries}): ${statusCode}`);
        
        // If blocked and Tor is allowed, switch to Tor
        if (useTor && [403, 429, 503].includes(statusCode)) {
          logger.info('Switching to Tor proxy...');
          return await this.makeRequestWithTor(url, options);
        }
        
        if (attempts >= this.maxRetries) {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
    
    // If direct connection failed and Tor is allowed, try Tor
    if (useTor) {
      logger.info('Direct connection exhausted, switching to Tor...');
      return await this.makeRequestWithTor(url, options);
    }
    
    return {
      success: false,
      error: lastError?.message || 'Request failed',
      status: lastError?.response?.status || 0
    };
  }

  async makeRequestWithTor(url, options = {}) {
    let torAttempts = 0;
    let lastError = null;
    
    while (torAttempts < this.maxTorRetries) {
      try {
        const agent = torManager.getSocksAgent();
        
        const response = await axios({
          url,
          ...options,
          httpAgent: agent,
          httpsAgent: agent,
          timeout: options.timeout || 30000
        });
        
        logger.info(`Tor request successful via ${await torManager.getCurrentIP()}`);
        return { 
          success: true, 
          data: response.data, 
          status: response.status,
          viaTor: true 
        };
      } catch (error) {
        torAttempts++;
        lastError = error;
        const statusCode = error.response?.status || 0;
        
        logger.warn(`Tor request failed (attempt ${torAttempts}/${this.maxTorRetries}): ${statusCode}`);
        
        // Rotate circuit on blocks
        if ([403, 429, 503].includes(statusCode)) {
          await torManager.rotateIfNeeded(statusCode);
        }
        
        if (torAttempts >= this.maxTorRetries) {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000 * torAttempts));
      }
    }
    
    return {
      success: false,
      error: lastError?.message || 'Tor request failed',
      status: lastError?.response?.status || 0,
      viaTor: true
    };
  }

  getTorProxyString() {
    return `socks5://127.0.0.1:${process.env.TOR_SOCKS_PORT || 9050}`;
  }
}

module.exports = new ProxyMiddleware();
