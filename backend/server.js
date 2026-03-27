const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cluster = require('cluster');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { initializeQueues, scanQueue, addScanToQueue } = require('./queueManager');
const { initializeDatabase, saveScan, getScan, getAllScans } = require('./resultsStore');
const { redisClient, saveScanState, getScanState } = require('./redisClient');
const { PackageManager } = require('./packageManager');
const logger = require('./logger');

const PORT_START = parseInt(process.env.PORT_START || 3001);
const VPS_IP = process.env.VPS_IP || 'localhost';
const FRONTEND_PORT = process.env.PORT || 9852;

// Cluster mode for PM2
const workerPort = cluster.worker ? PORT_START + cluster.worker.id - 1 : PORT_START;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Initialize queues
initializeQueues(io);

// Package manager instance
const packageManager = new PackageManager();

// Verify tools on startup
(async () => {
  logger.info('Verifying security tools installation...');
  const { installed, missing } = await packageManager.verifyAll();
  logger.info(`Tools status: ${installed.length} installed, ${missing.length} missing`);
  
  if (missing.length > 0) {
    logger.warn(`Missing tools: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`);
    logger.info('Tools will be installed automatically during scans');
  }
})();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    worker: cluster.worker ? cluster.worker.id : 'standalone',
    port: workerPort,
    vpsIp: VPS_IP,
    frontendPort: FRONTEND_PORT
  });
});

app.get('/api/server-info', (req, res) => {
  res.json({
    vpsIp: VPS_IP,
    port: FRONTEND_PORT,
    accessUrl: `http://${VPS_IP}:${FRONTEND_PORT}`,
    worker: cluster.worker ? cluster.worker.id : 'standalone'
  });
});

app.post('/api/scan/start', async (req, res) => {
  try {
    const { target, profile = 'full', useTor = false } = req.body;
    
    if (!target) {
      return res.status(400).json({ error: 'Target URL is required' });
    }

    const scanId = uuidv4();
    const scan = {
      scanId,
      target,
      profile,
      useTor,
      status: 'queued',
      createdAt: new Date().toISOString(),
      progress: 0,
      phase: 'initializing'
    };

    // Save to Redis for real-time state
    await saveScanState(scanId, scan);

    // Add to Bull queue
    await addScanToQueue({ scanId, target, profile, useTor });

    logger.info(`Scan ${scanId} queued for target: ${target}`);
    
    res.json({ scanId, message: 'Scan started', scan });
  } catch (error) {
    logger.error('Error starting scan:', error);
    res.status(500).json({ error: 'Failed to start scan' });
  }
});

app.get('/api/scan/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    
    // Try Redis first (for active scans)
    let scan = await getScanState(scanId);
    
    // If not in Redis, check SQLite (completed scans)
    if (!scan) {
      scan = await getScan(scanId);
    }
    
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    
    res.json(scan);
  } catch (error) {
    logger.error('Error fetching scan:', error);
    res.status(500).json({ error: 'Failed to fetch scan' });
  }
});

app.get('/api/scans', async (req, res) => {
  try {
    const scans = await getAllScans();
    res.json(scans);
  } catch (error) {
    logger.error('Error fetching scans:', error);
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('scan:subscribe', async ({ scanId }) => {
    socket.join(`scan:${scanId}`);
    logger.info(`Client ${socket.id} subscribed to scan ${scanId}`);
    
    // Send current state
    const state = await getScanState(scanId);
    if (state) {
      socket.emit('scan:state', state);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Start server
server.listen(workerPort, '127.0.0.1', () => {
  logger.info(`Scanner worker running on 127.0.0.1:${workerPort}`);
  logger.info(`Access URL: http://${VPS_IP}:${FRONTEND_PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server...');
  server.close(() => {
    logger.info('Server closed');
    redisClient.quit();
    process.exit(0);
  });
});
