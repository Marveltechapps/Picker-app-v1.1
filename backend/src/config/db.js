/**
 * Database connection. Uses MONGODB_URI from env when set.
 */
const mongoose = require('mongoose');
const env = require('./env');

const SERVER_SELECTION_TIMEOUT_MS = 10000;
const RETRY_BASE_MS = 15000;
const RETRY_MAX_MS = 120000;
const RETRY_MAX_ATTEMPTS = 10;

let dbConnected = false;
let retryTimer = null;
let retryAttempt = 0;
let lastLoggedMessage = '';

function isDbConnected() {
  return dbConnected;
}

function maskUri(uri) {
  if (!uri || typeof uri !== 'string') return '(no uri)';
  try {
    const u = new URL(uri);
    const db = u.pathname ? u.pathname.replace(/\//g, '') || 'db' : 'db';
    return `${u.protocol}//${u.hostname}:${u.port || '27017'}/${db}`;
  } catch (_) {
    return '(invalid uri)';
  }
}

function getRetryDelayMs() {
  const delay = Math.min(RETRY_BASE_MS * Math.pow(2, retryAttempt), RETRY_MAX_MS);
  retryAttempt += 1;
  return delay;
}

function formatConnectionError(msg) {
  if (msg.includes('querySrv ETIMEOUT') || msg.includes('getaddrinfo') || msg.includes('ENOTFOUND')) {
    return '[db] DNS/network timeout reaching MongoDB. Check: (1) Internet connection, (2) Firewall/VPN allows outbound DNS and port 27017, (3) backend\\.env MONGODB_URI is correct. For Atlas, try a direct URI if SRV fails.';
  }
  if (msg.includes('ECONNREFUSED')) {
    return '[db] Connection refused. Ensure MongoDB is running and MONGODB_URI in backend\\.env is correct.';
  }
  return '[db] Set a valid MONGODB_URI in backend\\.env.';
}

mongoose.connection.on('error', (err) => {
  dbConnected = false;
  const msg = err && err.message ? err.message : String(err);
  if (msg !== lastLoggedMessage) {
    lastLoggedMessage = msg;
    console.error(formatConnectionError(msg));
  }
});
mongoose.connection.on('disconnected', () => {
  dbConnected = false;
  scheduleRetry();
});

function connectDB() {
  if (dbConnected) return Promise.resolve();
  const uri = env.MONGODB_URI;
  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    return Promise.resolve();
  }
  const isRetry = retryAttempt > 0;
  if (!isRetry) {
    console.log('[db] Connecting to', maskUri(uri), '...');
  } else {
    console.log('[db] Retry', retryAttempt, '...');
  }

  return mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      autoIndex: env.NODE_ENV !== 'production',
    })
    .then(() => {
      dbConnected = true;
      retryAttempt = 0;
      lastLoggedMessage = '';
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      console.log('[db] Connected.');
    })
    .catch((err) => {
      dbConnected = false;
      const msg = err && err.message ? err.message : String(err);
      if (msg !== lastLoggedMessage) {
        lastLoggedMessage = msg;
        console.error(formatConnectionError(msg));
      }
      if (retryAttempt < RETRY_MAX_ATTEMPTS) {
        scheduleRetry();
      } else {
        console.error('[db] Max retries reached. Fix MONGODB_URI or network and restart the server.');
      }
      return Promise.reject(err);
    });
}

function scheduleRetry() {
  if (retryTimer || dbConnected || retryAttempt >= RETRY_MAX_ATTEMPTS) return;
  const delayMs = getRetryDelayMs();
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (dbConnected) return;
    connectDB().catch(() => {});
  }, delayMs);
  console.log('[db] Next try in', (delayMs / 1000).toFixed(0) + 's.');
}

module.exports = {
  connectDB,
  isDbConnected,
  mongoose,
};
