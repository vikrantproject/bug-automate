import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:9852';

export function useScan() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentScan, setCurrentScan] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [toolResults, setToolResults] = useState([]);
  const [findings, setFindings] = useState([]);
  const [eta, setEta] = useState(0);
  const [torRotations, setTorRotations] = useState([]);
  
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketInstance.on('scan:state', (state) => {
      console.log('Scan state received:', state);
      setCurrentScan(state);
      setScanProgress(state.progress || 0);
      setPhase(state.phase || '');
    });

    socketInstance.on('scan:progress', (data) => {
      console.log('Progress update:', data);
      setScanProgress(data.percent || 0);
      setPhase(data.phase || '');
      setEta(data.eta || 0);
    });

    socketInstance.on('tool:start', (data) => {
      console.log('Tool started:', data);
      setToolResults(prev => [...prev, { ...data, status: 'running', startedAt: new Date() }]);
    });

    socketInstance.on('tool:done', (data) => {
      console.log('Tool completed:', data);
      setToolResults(prev => prev.map(t => 
        t.toolId === data.toolId ? { ...t, status: 'completed', ...data } : t
      ));
      if (data.findings && data.findings.length > 0) {
        setFindings(prev => [...prev, ...data.findings]);
      }
    });

    socketInstance.on('tool:failed', (data) => {
      console.log('Tool failed:', data);
      setToolResults(prev => prev.map(t => 
        t.toolId === data.toolId ? { ...t, status: 'failed', error: data.error } : t
      ));
    });

    socketInstance.on('tor:rotated', (data) => {
      console.log('Tor rotated:', data);
      setTorRotations(prev => [...prev, data]);
    });

    socketInstance.on('scan:complete', (data) => {
      console.log('Scan completed:', data);
      setScanProgress(100);
      setPhase('complete');
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Check for scanId in URL hash
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('scan=')) {
      const scanId = hash.split('=')[1];
      if (scanId) {
        console.log('Restoring scan from URL:', scanId);
        socketInstance.emit('scan:subscribe', { scanId });
      }
    }

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const startScan = useCallback(async (target, profile = 'full', useTor = false) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/scan/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, profile, useTor })
      });

      if (!response.ok) {
        throw new Error('Failed to start scan');
      }

      const data = await response.json();
      const { scanId } = data;

      // Update URL with scanId
      window.location.hash = `scan=${scanId}`;

      // Subscribe to scan updates
      if (socketRef.current) {
        socketRef.current.emit('scan:subscribe', { scanId });
      }

      setCurrentScan(data.scan);
      setToolResults([]);
      setFindings([]);
      setScanProgress(0);
      setPhase('initializing');
      setTorRotations([]);

      return data;
    } catch (error) {
      console.error('Failed to start scan:', error);
      throw error;
    }
  }, []);

  const getScanHistory = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/scans`);
      if (!response.ok) throw new Error('Failed to fetch scan history');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
      return [];
    }
  }, []);

  const getScanById = useCallback(async (scanId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/scan/${scanId}`);
      if (!response.ok) throw new Error('Failed to fetch scan');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch scan:', error);
      return null;
    }
  }, []);

  return {
    socket,
    connected,
    currentScan,
    scanProgress,
    phase,
    toolResults,
    findings,
    eta,
    torRotations,
    startScan,
    getScanHistory,
    getScanById
  };
}
