const Redis = require('redis');
const logger = require('./logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redisClient = Redis.createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis: Max reconnection attempts reached');
        return new Error('Redis reconnection failed');
      }
      return retries * 100;
    }
  }
});

redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
redisClient.on('connect', () => logger.info('Redis connected'));
redisClient.on('ready', () => logger.info('Redis ready'));

// Connect immediately
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
})();

// Save scan state to Redis with 24h TTL
async function saveScanState(scanId, state) {
  try {
    const key = `scan:${scanId}`;
    await redisClient.setEx(key, 86400, JSON.stringify(state));
  } catch (error) {
    logger.error(`Failed to save scan state for ${scanId}:`, error);
  }
}

// Get scan state from Redis
async function getScanState(scanId) {
  try {
    const key = `scan:${scanId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Failed to get scan state for ${scanId}:`, error);
    return null;
  }
}

// Update scan progress
async function updateScanProgress(scanId, updates) {
  try {
    const current = await getScanState(scanId);
    if (current) {
      const updated = { ...current, ...updates };
      await saveScanState(scanId, updated);
    }
  } catch (error) {
    logger.error(`Failed to update scan progress for ${scanId}:`, error);
  }
}

module.exports = {
  redisClient,
  saveScanState,
  getScanState,
  updateScanProgress
};
