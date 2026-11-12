/**
 * JNJ Innovations - Dedicated Node.js Express API Server
 * 
 * Production-ready backend server designed for deployment on Google Cloud Run,
 * Render, Railway, AWS ECS, or any standard Node.js hosting platform.
 * 
 * Features:
 * - Direct connection to MongoDB Atlas using the MONGODB_URI environment variable
 * - Robust connection pooling, reconnection logic, and error categorization
 * - Permissive and secure CORS configuration for GitHub Pages, custom domain, and localhost
 * - Complete CRUD & synchronization endpoints for playbook catalog data:
 *     GET  /api/health            -> Server health-check and uptime
 *     GET  /api/mongodb/status    -> Live MongoDB ping and collection count
 *     GET  /api/playbooks         -> Fetch all playbooks from MongoDB Atlas
 *     POST /api/playbooks         -> Create or upsert a single playbook
 *     PUT  /api/playbooks         -> Bulk upsert/synchronize entire catalog safely
 *     PUT  /api/playbooks/:id     -> Update a playbook by ID
 *     DELETE /api/playbooks/:id  -> Delete a playbook by ID
 *     POST /api/playbooks/reset   -> Reset catalog to baseline defaults
 */

import express from 'express';
import cors from 'cors';
import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// ---------------------- CORS SETUP ---------------------- //
// Allow requests from GitHub Pages, custom domain (jnjinnovations.com), and local development
const customOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const allowedOriginPatterns = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/.*\.github\.io$/,
  /^https:\/\/(www\.)?jnjinnovations\.com$/,
  /^https:\/\/ais-.*\.run\.app$/
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, server-to-server, health probes)
    if (!origin) return callback(null, true);

    if (customOrigins.includes(origin)) {
      return callback(null, true);
    }

    const matchesPattern = allowedOriginPatterns.some(pattern => pattern.test(origin));
    if (matchesPattern) {
      return callback(null, true);
    }

    // Default permissive in non-strict mode to prevent frontend breakages
    if (process.env.CORS_ALLOW_ALL === 'true' || !process.env.CORS_STRICT) {
      return callback(null, true);
    }

    callback(new Error(`Origin ${origin} not permitted by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '15mb' }));

// ---------------------- MONGODB CONFIGURATION ---------------------- //
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://jnjinnovations1_db_user:haLeRUUJGKBJ03Zc@jnjtestcluster.695tiet.mongodb.net/jnj_innovations?retryWrites=true&w=majority";
const DB_NAME = process.env.MONGODB_DB_NAME || "jnj_innovations";
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || "playbooks";

// Load fallback playbooks from public/catalog.json if available
let FALLBACK_PLAYBOOKS = [];
try {
  const catalogPath = path.resolve(__dirname, 'public/catalog.json');
  if (fs.existsSync(catalogPath)) {
    FALLBACK_PLAYBOOKS = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  }
} catch (e) {
  console.warn('[Server] Could not load local public/catalog.json:', e.message);
}

let client = null;
let lastFailureTime = 0;
let lastFailureError = null;
const FAILURE_CACHE_MS = 6000;

function categorizeMongoError(errMessage) {
  const isIpWhitelist = 
    errMessage.includes('SSL alert number 80') || 
    errMessage.includes('tlsv1 alert internal error') ||
    errMessage.includes('whitelist') ||
    errMessage.includes('connection refused');

  const isAuth = 
    errMessage.includes('Authentication failed') ||
    errMessage.includes('bad auth') ||
    errMessage.includes('auth error');

  const isTimeout = 
    errMessage.includes('timed out') ||
    errMessage.includes('ETIMEDOUT') ||
    errMessage.includes('Server selection timed out');

  let code = 'UNKNOWN_DATABASE_ERROR';
  let guidance = 'Inspect server logs for complete stack trace and connection configuration.';

  if (isIpWhitelist) {
    code = 'ATLAS_FIREWALL_IP_BLOCKED';
    guidance = "Atlas firewall blocks incoming traffic from new hosting IPs. Go to MongoDB Atlas -> Security -> Network Access -> Add IP Address -> Select 'Allow Access From Anywhere (0.0.0.0/0)'.";
  } else if (isAuth) {
    code = 'ATLAS_AUTHENTICATION_FAILED';
    guidance = "Database credentials rejected. Verify MONGODB_URI contains valid username and password for database 'jnj_innovations'.";
  } else if (isTimeout) {
    code = 'ATLAS_NETWORK_TIMEOUT';
    guidance = "Connection attempt to cluster timed out. Verify network connectivity or DNS resolver.";
  }

  return {
    code,
    isIpWhitelistError: isIpWhitelist,
    isAuthError: isAuth,
    isTimeoutError: isTimeout,
    guidance
  };
}

async function getMongoClient(forceRetry = false) {
  if (client) {
    return client;
  }

  if (!forceRetry && lastFailureError && Date.now() - lastFailureTime < FAILURE_CACHE_MS) {
    throw new Error(lastFailureError);
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not defined on the server.");
  }

  const newClient = new MongoClient(MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
    autoSelectFamily: false,
    serverSelectionTimeoutMS: 6000,
    connectTimeoutMS: 6000
  });

  try {
    await newClient.connect();
    client = newClient;
    lastFailureError = null;
    console.log('[MongoDB] Connected successfully to cluster');
    
    // Seed collection if empty on first startup
    const db = client.db(DB_NAME);
    const count = await db.collection(COLLECTION_NAME).countDocuments();
    if (count === 0 && FALLBACK_PLAYBOOKS.length > 0) {
      console.log(`[MongoDB] Collection is empty. Auto-seeding ${FALLBACK_PLAYBOOKS.length} playbooks...`);
      await db.collection(COLLECTION_NAME).insertMany(FALLBACK_PLAYBOOKS);
      console.log('[MongoDB] Seeding completed.');
    }
  } catch (err) {
    lastFailureTime = Date.now();
    lastFailureError = err.message;
    client = null;
    console.error('[MongoDB] Connection failure:', err.message);
    throw err;
  }
  return client;
}

// ---------------------- ENDPOINTS ---------------------- //

// Root welcome & API discovery route
app.get('/', (req, res) => {
  res.json({
    service: 'jnj-innovations-playbook-api',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      mongoStatus: 'GET /api/mongodb/status',
      getPlaybooks: 'GET /api/playbooks',
      createPlaybook: 'POST /api/playbooks',
      syncCatalog: 'PUT /api/playbooks',
      updatePlaybook: 'PUT /api/playbooks/:id',
      deletePlaybook: 'DELETE /api/playbooks/:id',
      resetCatalog: 'POST /api/playbooks/reset'
    }
  });
});

// GET /api/health - Cloud Run / uptime probe endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'jnj-innovations-backend-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: isProd ? 'production' : 'development'
  });
});

// GET /api/mongodb/status - Live cluster connection & ping check
app.get('/api/mongodb/status', async (req, res) => {
  const force = req.query.force === 'true' || req.query.force === '1';
  try {
    const mongo = await getMongoClient(force);
    const db = mongo.db(DB_NAME);
    await db.command({ ping: 1 });
    const count = await db.collection(COLLECTION_NAME).countDocuments();

    res.json({
      connected: true,
      cluster: "jnjtestcluster.695tiet.mongodb.net",
      database: DB_NAME,
      collection: COLLECTION_NAME,
      documentCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    const details = categorizeMongoError(err.message || '');
    res.json({
      connected: false,
      cluster: "jnjtestcluster.695tiet.mongodb.net",
      database: DB_NAME,
      collection: COLLECTION_NAME,
      error: err.message,
      errorCode: details.code,
      isIpWhitelistError: details.isIpWhitelistError,
      isAuthError: details.isAuthError,
      isTimeoutError: details.isTimeoutError,
      ipWhitelistGuide: details.guidance
    });
  }
});

// GET /api/playbooks - Fetch all playbooks from MongoDB Atlas
app.get('/api/playbooks', async (req, res) => {
  const isStrict = req.query.strict === 'true' || req.query.strict === '1';
  try {
    const mongo = await getMongoClient();
    const db = mongo.db(DB_NAME);
    const books = await db.collection(COLLECTION_NAME).find({}).toArray();
    
    // Strip internal _id field for clean client serialization
    const formatted = books.map((b) => {
      const { _id, ...rest } = b;
      return rest;
    });

    res.json({
      success: true,
      books: formatted.length > 0 ? formatted : FALLBACK_PLAYBOOKS,
      count: formatted.length,
      source: 'mongodb'
    });
  } catch (err) {
    console.warn('[MongoDB Fallback] Serving local books because MongoDB is not yet reached:', err.message);
    if (isStrict) {
      return res.status(503).json({
        success: false,
        error: `MongoDB unreachable: ${err.message}`,
        source: 'error'
      });
    }
    res.json({
      success: true,
      books: FALLBACK_PLAYBOOKS,
      count: FALLBACK_PLAYBOOKS.length,
      source: 'local_fallback',
      warning: err.message
    });
  }
});

// POST /api/playbooks - Create or upsert an individual playbook
app.post('/api/playbooks', async (req, res) => {
  try {
    const newBook = req.body;
    if (!newBook || !newBook.id || !newBook.title) {
      return res.status(400).json({ success: false, message: 'Invalid playbook payload: id and title are required' });
    }

    const mongo = await getMongoClient();
    const db = mongo.db(DB_NAME);
    await db.collection(COLLECTION_NAME).updateOne(
      { id: newBook.id },
      { $set: newBook },
      { upsert: true }
    );

    res.json({ success: true, book: newBook, message: 'Saved playbook to MongoDB Atlas' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/playbooks - Safe bulk upsert / synchronize catalog
app.put('/api/playbooks', async (req, res) => {
  try {
    const books = req.body;
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ success: false, message: 'Expected non-empty array of playbooks' });
    }

    const mongo = await getMongoClient();
    const db = mongo.db(DB_NAME);

    // Safe bulk upsert by playbook ID without wiping unrelated documents
    const bulkOps = books.map(book => ({
      updateOne: {
        filter: { id: book.id },
        update: { $set: book },
        upsert: true
      }
    }));

    const result = await db.collection(COLLECTION_NAME).bulkWrite(bulkOps);

    res.json({
      success: true,
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
      totalSent: books.length,
      message: `Safely synchronized ${books.length} playbooks with MongoDB Atlas`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/playbooks/:id - Update an individual playbook
app.put('/api/playbooks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const mongo = await getMongoClient();
    const db = mongo.db(DB_NAME);
    const result = await db.collection(COLLECTION_NAME).updateOne(
      { id },
      { $set: updates }
    );

    res.json({ success: true, message: 'Updated playbook in MongoDB Atlas', matchedCount: result.matchedCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/playbooks/:id - Delete a playbook by ID
app.delete('/api/playbooks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mongo = await getMongoClient();
    const db = mongo.db(DB_NAME);
    await db.collection(COLLECTION_NAME).deleteOne({ id });

    res.json({ success: true, message: 'Deleted playbook from MongoDB Atlas' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/playbooks/reset - Reset MongoDB collection to default baseline playbooks
app.post('/api/playbooks/reset', async (req, res) => {
  try {
    const mongo = await getMongoClient();
    const db = mongo.db(DB_NAME);
    await db.collection(COLLECTION_NAME).deleteMany({});
    if (FALLBACK_PLAYBOOKS.length > 0) {
      await db.collection(COLLECTION_NAME).insertMany(FALLBACK_PLAYBOOKS);
    }

    res.json({ success: true, message: 'Reset MongoDB collection to default playbooks', count: FALLBACK_PLAYBOOKS.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------- SERVER STARTUP ---------------------- //
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[JNJ Server] Express API running on http://0.0.0.0:${PORT} (env: ${isProd ? 'production' : 'development'})`);
});
