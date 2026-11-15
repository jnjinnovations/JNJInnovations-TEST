/**
 * JNJ Innovations - Bidirectional Backend MongoDB Atlas Catalog Sync
 *
 * Runs during `npm run build` (prebuild hook) on Node.js 24 (e.g. GitHub Actions):
 *
 * 1. PUSH-TO-MONGO (when `public/catalog.json` or `src/data/defaultEbooks.ts` changed in the commit):
 *    Reads the committed catalog from git, upserts new/updated playbooks into MongoDB Atlas,
 *    applies any tagged deletions (`[delete:<id>]`) or resets (`[reset]`), and then writes
 *    the merged live Atlas catalog back to both `public/catalog.json` and `src/data/defaultEbooks.ts`
 *    before Vite bundles the static site.
 *
 * 2. PULL-FROM-MONGO (standard code pushes or manual `workflow_dispatch` runs):
 *    Fetches the latest live playbooks from MongoDB Atlas and writes them to
 *    `public/catalog.json` and `src/data/defaultEbooks.ts` before Vite builds.
 */

import { MongoClient, ServerApiVersion } from 'mongodb';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'jnj_innovations';
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || 'playbooks';

const publicCatalogPath = path.resolve(__dirname, '../public/catalog.json');
const defaultEbooksPath = path.resolve(__dirname, '../src/data/defaultEbooks.ts');

function getRecentGitChangeInfo() {
  try {
    const changedFilesRaw = execSync('git diff --name-only HEAD~1 HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    const changedFiles = changedFilesRaw
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);

    const commitMessage = execSync('git log -1 --pretty=%B', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();

    return { changedFiles, commitMessage };
  } catch {
    return { changedFiles: [], commitMessage: '' };
  }
}

function readCommittedCatalog(changedFiles) {
  // Prefer public/catalog.json if it was the committed file
  if (changedFiles.includes('public/catalog.json') && fs.existsSync(publicCatalogPath)) {
    const parsed = JSON.parse(fs.readFileSync(publicCatalogPath, 'utf8'));
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  }

  // Fallback to parsing src/data/defaultEbooks.ts if that was committed
  if (changedFiles.includes('src/data/defaultEbooks.ts') && fs.existsSync(defaultEbooksPath)) {
    const rawTs = fs.readFileSync(defaultEbooksPath, 'utf8');
    const match = rawTs.match(/DEFAULT_EBOOKS[^=]*=\s*(\[[\s\S]*\]);?/);
    if (match && match[1]) {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  }

  return null;
}

async function syncCatalogWithMongo() {
  if (!MONGODB_URI) {
    console.log('[SyncCatalog] No MONGODB_URI provided in environment. Using existing local catalog files.');
    return;
  }

  const { changedFiles, commitMessage } = getRecentGitChangeInfo();
  const isManualDispatch = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';
  const catalogWasCommitted =
    !isManualDispatch &&
    (changedFiles.includes('public/catalog.json') || changedFiles.includes('src/data/defaultEbooks.ts'));

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
    const collection = db.collection(COLLECTION_NAME);

    // Step 1: If the triggering commit modified the catalog files, push those changes TO MongoDB Atlas first
    if (catalogWasCommitted) {
      const committedBooks = readCommittedCatalog(changedFiles);
      if (committedBooks && committedBooks.length > 0) {
        if (commitMessage.includes('[reset]')) {
          await collection.deleteMany({});
          await collection.insertMany(committedBooks);
          console.log(`[SyncCatalog] Reset MongoDB collection with ${committedBooks.length} playbooks from git.`);
        } else {
          const deleteMatches = [...commitMessage.matchAll(/\[delete:([^\]]+)\]/g)];
          for (const m of deleteMatches) {
            const deleteId = m[1].trim();
            if (deleteId) {
              await collection.deleteOne({ id: deleteId });
              console.log(`[SyncCatalog] Deleted playbook '${deleteId}' from MongoDB Atlas.`);
            }
          }

          const bulkOps = committedBooks.map(book => ({
            updateOne: {
              filter: { id: book.id },
              update: { $set: book },
              upsert: true
            }
          }));

          const result = await collection.bulkWrite(bulkOps);
          console.log(
            `[SyncCatalog] Synced committed catalog to MongoDB Atlas (upserted: ${result.upsertedCount}, modified: ${result.modifiedCount}, matched: ${result.matchedCount}).`
          );
        }
      }
    }

    // Step 2: Fetch live catalog from MongoDB Atlas and write both local catalog files for the build
    const books = await collection.find({}).toArray();

    if (Array.isArray(books) && books.length > 0) {
      const formatted = books.map((b) => {
        const { _id, ...rest } = b;
        return rest;
      });

      fs.writeFileSync(publicCatalogPath, JSON.stringify(formatted, null, 2));
      console.log(`[SyncCatalog] Updated public/catalog.json with ${formatted.length} playbooks from Atlas.`);

      const tsContent = `import { EbookItem } from '../types';\n\nexport const DEFAULT_EBOOKS: EbookItem[] = ${JSON.stringify(formatted, null, 2)};\n`;
      fs.writeFileSync(defaultEbooksPath, tsContent);
      console.log('[SyncCatalog] Updated src/data/defaultEbooks.ts.');
    } else {
      console.log('[SyncCatalog] Collection is empty or has no records. Keeping existing baseline catalog.');
    }
  } catch (err) {
    console.warn('[SyncCatalog] Warning: Could not sync with MongoDB Atlas during build:', err.message);
    console.warn('[SyncCatalog] Continuing build with existing local catalog fallback.');
  } finally {
    await client.close().catch(() => {});
  }
}

syncCatalogWithMongo();
