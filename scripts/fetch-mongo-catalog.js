/**
 * JNJ Innovations - Direct Build-Time MongoDB Atlas Catalog Fetcher
 * 
 * Fetches the latest live playbooks from MongoDB Atlas during GitHub Actions build
 * and writes them to public/catalog.json and src/data/defaultEbooks.ts.
 * 
 * This enables the static site to display the live database catalog 
 * without needing browser-to-database connections or extra hosting services.
 */

import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || "jnj_innovations";
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || "playbooks";

const publicCatalogPath = path.resolve(__dirname, '../public/catalog.json');
const defaultEbooksPath = path.resolve(__dirname, '../src/data/defaultEbooks.ts');

async function syncCatalogFromMongo() {
  if (!MONGODB_URI) {
    console.log('[SyncCatalog] No MONGODB_URI provided in environment. Using existing local catalog files.');
    return;
  }

  console.log('[SyncCatalog] Connecting to MongoDB Atlas on backend build...');
  const client = new MongoClient(MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000
  });

  try {
    await client.connect();
    console.log('[SyncCatalog] Connected to MongoDB Atlas cluster.');
    const db = client.db(DB_NAME);
    const books = await db.collection(COLLECTION_NAME).find({}).toArray();

    if (Array.isArray(books) && books.length > 0) {
      // Strip internal _id field
      const formatted = books.map((b) => {
        const { _id, ...rest } = b;
        return rest;
      });

      // Write public/catalog.json
      fs.writeFileSync(publicCatalogPath, JSON.stringify(formatted, null, 2));
      console.log(`[SyncCatalog] Updated public/catalog.json with ${formatted.length} playbooks from Atlas.`);

      // Write src/data/defaultEbooks.ts
      const tsContent = `import { EbookItem } from '../types';\n\nexport const DEFAULT_EBOOKS: EbookItem[] = ${JSON.stringify(formatted, null, 2)};\n`;
      fs.writeFileSync(defaultEbooksPath, tsContent);
      console.log(`[SyncCatalog] Updated src/data/defaultEbooks.ts.`);
    } else {
      console.log('[SyncCatalog] Collection is empty or has no records. Keeping existing baseline catalog.');
    }
  } catch (err) {
    console.warn('[SyncCatalog] Warning: Could not fetch from MongoDB Atlas during build:', err.message);
    console.warn('[SyncCatalog] Continuing build with existing local catalog fallback.');
  } finally {
    await client.close().catch(() => {});
  }
}

syncCatalogFromMongo();
