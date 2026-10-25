import { DEFAULT_EBOOKS } from '../src/data/defaultEbooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicCatalogPath = path.resolve(__dirname, '../public/catalog.json');

try {
  fs.writeFileSync(publicCatalogPath, JSON.stringify(DEFAULT_EBOOKS, null, 2));
  console.log('[SyncCatalog] Successfully synchronized valid public/catalog.json from defaultEbooks.ts');
} catch (err: any) {
  console.warn('[SyncCatalog] Notice: Could not sync public/catalog.json:', err.message);
}
