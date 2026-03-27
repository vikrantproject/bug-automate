const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../scan_results/scans.db');

// Ensure directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

function initializeDatabase() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS scans (
        scanId TEXT PRIMARY KEY,
        target TEXT NOT NULL,
        profile TEXT NOT NULL,
        useTor INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        phase TEXT,
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        duration INTEGER,
        summary TEXT
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS findings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scanId TEXT NOT NULL,
        toolId TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        evidence TEXT,
        remediation TEXT,
        cvss REAL,
        cve TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (scanId) REFERENCES scans(scanId)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS tool_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scanId TEXT NOT NULL,
        toolId TEXT NOT NULL,
        toolName TEXT NOT NULL,
        status TEXT NOT NULL,
        startedAt TEXT,
        completedAt TEXT,
        duration INTEGER,
        output TEXT,
        error TEXT,
        FOREIGN KEY (scanId) REFERENCES scans(scanId)
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_findings_scanId ON findings(scanId);
      CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
      CREATE INDEX IF NOT EXISTS idx_tool_results_scanId ON tool_results(scanId);
    `);

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization error:', error);
    throw error;
  }
}

function saveScan(scan) {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO scans 
      (scanId, target, profile, useTor, status, progress, phase, createdAt, completedAt, duration, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      scan.scanId,
      scan.target,
      scan.profile,
      scan.useTor ? 1 : 0,
      scan.status,
      scan.progress || 0,
      scan.phase || null,
      scan.createdAt,
      scan.completedAt || null,
      scan.duration || null,
      scan.summary ? JSON.stringify(scan.summary) : null
    );
  } catch (error) {
    logger.error('Error saving scan:', error);
  }
}

function getScan(scanId) {
  try {
    const scan = db.prepare('SELECT * FROM scans WHERE scanId = ?').get(scanId);
    if (!scan) return null;

    const findings = db.prepare('SELECT * FROM findings WHERE scanId = ? ORDER BY severity').all(scanId);
    const toolResults = db.prepare('SELECT * FROM tool_results WHERE scanId = ?').all(scanId);

    return {
      ...scan,
      useTor: scan.useTor === 1,
      summary: scan.summary ? JSON.parse(scan.summary) : null,
      findings,
      toolResults
    };
  } catch (error) {
    logger.error('Error getting scan:', error);
    return null;
  }
}

function getAllScans(limit = 100) {
  try {
    return db.prepare('SELECT * FROM scans ORDER BY createdAt DESC LIMIT ?').all(limit);
  } catch (error) {
    logger.error('Error getting all scans:', error);
    return [];
  }
}

function saveFinding(finding) {
  try {
    const stmt = db.prepare(`
      INSERT INTO findings 
      (scanId, toolId, severity, title, description, evidence, remediation, cvss, cve, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      finding.scanId,
      finding.toolId,
      finding.severity,
      finding.title,
      finding.description || null,
      finding.evidence || null,
      finding.remediation || null,
      finding.cvss || null,
      finding.cve || null,
      finding.createdAt || new Date().toISOString()
    );
  } catch (error) {
    logger.error('Error saving finding:', error);
  }
}

function saveToolResult(result) {
  try {
    const stmt = db.prepare(`
      INSERT INTO tool_results 
      (scanId, toolId, toolName, status, startedAt, completedAt, duration, output, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      result.scanId,
      result.toolId,
      result.toolName,
      result.status,
      result.startedAt || null,
      result.completedAt || null,
      result.duration || null,
      result.output || null,
      result.error || null
    );
  } catch (error) {
    logger.error('Error saving tool result:', error);
  }
}

module.exports = {
  db,
  initializeDatabase,
  saveScan,
  getScan,
  getAllScans,
  saveFinding,
  saveToolResult
};
