import express from 'express';
import { createServer as createViteServer } from 'vite';
import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_EBOOKS } from './src/data/defaultEbooks';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));

// MongoDB Connection Configuration
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://jnjinnovations1_db_user:haLeRUUJGKBJ03Zc@jnjtestcluster.695tiet.mongodb.net/jnj_innovations?retryWrites=true&w=majority";
const DB_NAME = "jnj_innovations";
const COLLECTION_NAME = "playbooks";

let client: MongoClient | null = null;
let mongoConnectionStatus: { connected: boolean; error?: string } = { connected: false };
let lastFailureTime = 0;
let lastFailureError: string | null = null;
const FAILURE_CACHE_MS = 8000;

async function getMongoClient(forceRetry = false): Promise<MongoClient> {
  if (client) {
    return client;
  }

  if (!forceRetry && lastFailureError && Date.now() - lastFailureTime < FAILURE_CACHE_MS) {
    throw new Error(lastFailureError);
  }

  client = new MongoClient(MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
    autoSelectFamily: false,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  });

  try {
    await client.connect();
    mongoConnectionStatus = { connected: true };
    lastFailureError = null;
    console.log('[MongoDB] Successfully connected to cluster jnjtestcluster.695tiet.mongodb.net');
    
    // Seed collection if empty
    const db = client.db(DB_NAME);
    const count = await db.collection(COLLECTION_NAME).countDocuments();
    if (count === 0) {
      console.log('[MongoDB] Collection is empty. Seeding with default playbooks...');
      await db.collection(COLLECTION_NAME).insertMany(DEFAULT_EBOOKS);
      console.log('[MongoDB] Seeded', DEFAULT_EBOOKS.length, 'playbooks.');
    }
  } catch (err: any) {
    lastFailureTime = Date.now();
    lastFailureError = err.message;
    mongoConnectionStatus = { connected: false, error: err.message };
    console.error('[MongoDB] Connection warning:', err.message);
    client = null;
    throw err;
  }
  return client;
}

// Check MongoDB connection status endpoint
app.get('/api/mongodb/status', async (req, res) => {
  try {
    const force = req.query.force === 'true' || req.query.force === '1';
    const mongo = await getMongoClient(force);
    await mongo.db(DB_NAME).command({ ping: 1 });
    res.json({
      connected: true,
      cluster: "jnjtestcluster.695tiet.mongodb.net",
      database: DB_NAME,
      collection: COLLECTION_NAME
    });
  } catch (err: any) {
    const isIpWhitelistError = err.message.includes('SSL alert number 80') || err.message.includes('tlsv1 alert internal error');
    res.json({
      connected: false,
      cluster: "jnjtestcluster.695tiet.mongodb.net",
      error: err.message,
      isIpWhitelistError,
      ipWhitelistGuide: isIpWhitelistError
        ? "MongoDB Atlas requires IP Access List permission. Go to Atlas -> Security -> Network Access -> Add IP Address -> Select 'Allow Access From Anywhere (0.0.0.0/0)'."
        : undefined
    });
  }
});

// GET /api/playbooks - Fetch all playbooks from MongoDB
app.get('/api/playbooks', async (req, res) => {
  try {
    const mongo = await getMongoClient();
    const db = mongo.db(DB_NAME);
    const books = await db.collection(COLLECTION_NAME).find({}).toArray();
    
    // Strip MongoDB internal _id if needed or map
    const formatted = books.map((b: any) => {
      const { _id, ...rest } = b;
      return rest;
    });

    res.json({ success: true, books: formatted.length > 0 ? formatted : DEFAULT_EBOOKS, source: 'mongodb' });
  } catch (err: any) {
    console.warn('[MongoDB Fallback] Serving local books because MongoDB is not yet reached:', err.message);
    res.json({
      success: true,
      books: DEFAULT_EBOOKS,
      source: 'local_fallback',
      warning: err.message
    });
  }
});

// POST /api/playbooks - Create a new playbook
app.post('/api/playbooks', async (req, res) => {
  try {
    const newBook = req.body;
    if (!newBook || !newBook.id || !newBook.title) {
      return res.status(400).json({ success: false, message: 'Invalid playbook payload' });
    }

    const mongo = await getMongoClient();
    const db = mongo.db(DB_NAME);
    await db.collection(COLLECTION_NAME).updateOne(
      { id: newBook.id },
      { $set: newBook },
      { upsert: true }
    );

    res.json({ success: true, book: newBook, message: 'Saved playbook to MongoDB' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/playbooks - Bulk synchronize or seed entire playbook catalog
app.put('/api/playbooks', async (req, res) => {
  try {
    const books = req.body;
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ success: false, message: 'Expected non-empty array of playbooks' });
    }

    const mongo = await getMongoClient();
    const db = mongo.db(DB_NAME);
    await db.collection(COLLECTION_NAME).deleteMany({});
    await db.collection(COLLECTION_NAME).insertMany(books);

    res.json({ success: true, count: books.length, message: `Synchronized ${books.length} playbooks with MongoDB` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/playbooks/:id - Update an existing playbook
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

    res.json({ success: true, message: 'Updated playbook in MongoDB', result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/playbooks/:id - Delete a playbook
app.delete('/api/playbooks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mongo = await getMongoClient();
    const db = mongo.db(DB_NAME);
    await db.collection(COLLECTION_NAME).deleteOne({ id });

    res.json({ success: true, message: 'Deleted playbook from MongoDB' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/playbooks/reset - Reset to factory catalog
app.post('/api/playbooks/reset', async (req, res) => {
  try {
    const mongo = await getMongoClient();
    const db = mongo.db(DB_NAME);
    await db.collection(COLLECTION_NAME).deleteMany({});
    await db.collection(COLLECTION_NAME).insertMany(DEFAULT_EBOOKS);

    res.json({ success: true, message: 'Reset MongoDB collection to default playbooks', books: DEFAULT_EBOOKS });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mount Vite or serve static assets
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
