/**
 * MongoDB Atlas Data API & HTTPS App Services Client
 * 
 * Enables direct browser-to-MongoDB-Atlas communication over HTTPS
 * without requiring any intermediate backend server (like Cloud Run or Express).
 * 
 * Works with:
 * 1. MongoDB Atlas Data API (https://<region>.data.mongodb-api.com/app/data-<appId>/endpoint/data/v1)
 * 2. MongoDB Atlas App Services HTTPS Endpoints (https://<region>.aws.data.mongodb-api.com/...)
 */

import { EbookItem } from '../types';

export interface AtlasDataApiConfig {
  endpointUrl: string; // e.g., https://data.mongodb-api.com/app/data-xxxx/endpoint/data/v1
  apiKey: string;      // MongoDB Atlas Data API Key
  clusterName: string; // e.g., jnjtestcluster
  database: string;    // e.g., jnj_innovations
  collection: string;  // e.g., playbooks
  enabled: boolean;
}

const STORAGE_KEY = 'jnj_atlas_data_api_config_v1';

export function getAtlasDataApiConfig(): AtlasDataApiConfig {
  const envUrl = (import.meta.env.VITE_ATLAS_DATA_API_URL as string) || '';
  const envKey = (import.meta.env.VITE_ATLAS_DATA_API_KEY as string) || '';
  const envCluster = (import.meta.env.VITE_ATLAS_CLUSTER_NAME as string) || 'jnjtestcluster';
  const envDb = (import.meta.env.VITE_ATLAS_DB_NAME as string) || 'jnj_innovations';
  const envCollection = (import.meta.env.VITE_ATLAS_COLLECTION as string) || 'playbooks';

  if (typeof window === 'undefined') {
    return {
      endpointUrl: envUrl,
      apiKey: envKey,
      clusterName: envCluster,
      database: envDb,
      collection: envCollection,
      enabled: Boolean(envUrl && envKey)
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        endpointUrl: parsed.endpointUrl || envUrl,
        apiKey: parsed.apiKey || envKey,
        clusterName: parsed.clusterName || envCluster,
        database: parsed.database || envDb,
        collection: parsed.collection || envCollection,
        enabled: parsed.enabled !== undefined ? parsed.enabled : Boolean(parsed.endpointUrl || envUrl)
      };
    }
  } catch (err) {
    console.warn('[AtlasDataAPI] Failed to parse stored config:', err);
  }

  return {
    endpointUrl: envUrl,
    apiKey: envKey,
    clusterName: envCluster,
    database: envDb,
    collection: envCollection,
    enabled: Boolean(envUrl && envKey)
  };
}

export function saveAtlasDataApiConfig(config: AtlasDataApiConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event('jnj-atlas-data-api-updated'));
}

export function isAtlasDataApiConfigured(): boolean {
  const cfg = getAtlasDataApiConfig();
  return Boolean(cfg.enabled && cfg.endpointUrl && cfg.apiKey);
}

/**
 * Normalizes MongoDB Atlas endpoint URL to ensure trailing action paths fit standard Data API format
 */
function cleanEndpointUrl(rawUrl: string, action: string): string {
  let base = rawUrl.trim().replace(/\/+$/, '');
  // If user pasted base root without /action
  if (base.endsWith('/action')) {
    return `${base}/${action}`;
  }
  if (!base.includes('/action/')) {
    return `${base}/action/${action}`;
  }
  return base;
}

/**
 * Test connectivity to MongoDB Atlas Data API
 */
export async function testAtlasDataApiConnection(
  configOverride?: AtlasDataApiConfig
): Promise<{ success: boolean; message: string; count?: number; error?: string }> {
  const cfg = configOverride || getAtlasDataApiConfig();
  if (!cfg.endpointUrl) {
    return { success: false, message: 'Missing MongoDB Atlas Data API URL endpoint.' };
  }
  if (!cfg.apiKey) {
    return { success: false, message: 'Missing MongoDB Atlas Data API Key.' };
  }

  const url = cleanEndpointUrl(cfg.endpointUrl, 'find');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': cfg.apiKey,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        dataSource: cfg.clusterName,
        database: cfg.database,
        collection: cfg.collection,
        filter: {},
        limit: 100
      })
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const documents = Array.isArray(data.documents) ? data.documents : [];
      return {
        success: true,
        message: `Successfully connected directly to MongoDB Atlas Data API! Found ${documents.length} playbooks in collection '${cfg.collection}'.`,
        count: documents.length
      };
    }

    return {
      success: false,
      message: data.error || data.message || `HTTP ${res.status}: Atlas Data API rejected request. Verify Endpoint URL, Data Source / Cluster name, and API Key.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Network error reaching Atlas Data API (${err.message}). Verify CORS permissions in Atlas App Services.`
    };
  }
}

/**
 * Fetch all playbooks directly from MongoDB Atlas using Data API
 */
export async function fetchPlaybooksFromAtlasDataApi(): Promise<EbookItem[]> {
  const cfg = getAtlasDataApiConfig();
  if (!cfg.enabled || !cfg.endpointUrl || !cfg.apiKey) {
    throw new Error('MongoDB Atlas Data API is not configured.');
  }

  const url = cleanEndpointUrl(cfg.endpointUrl, 'find');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apiKey': cfg.apiKey,
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      dataSource: cfg.clusterName,
      database: cfg.database,
      collection: cfg.collection,
      filter: {},
      limit: 100
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `HTTP ${res.status}: Atlas Data API fetch failed.`);
  }

  const documents = Array.isArray(data.documents) ? data.documents : [];
  // Strip Atlas internal _id
  return documents.map((doc: any) => {
    const { _id, ...rest } = doc;
    return rest as EbookItem;
  });
}

/**
 * Push catalog to MongoDB Atlas directly using Data API upserts
 */
export async function pushPlaybooksToAtlasDataApi(books: EbookItem[]): Promise<{ success: boolean; message: string }> {
  const cfg = getAtlasDataApiConfig();
  if (!cfg.enabled || !cfg.endpointUrl || !cfg.apiKey) {
    throw new Error('MongoDB Atlas Data API is not configured.');
  }

  let successCount = 0;
  const updateUrl = cleanEndpointUrl(cfg.endpointUrl, 'updateOne');

  for (const book of books) {
    const res = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': cfg.apiKey,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        dataSource: cfg.clusterName,
        database: cfg.database,
        collection: cfg.collection,
        filter: { id: book.id },
        update: { $set: book },
        upsert: true
      })
    });

    if (res.ok) {
      successCount++;
    } else {
      const err = await res.json().catch(() => ({}));
      console.warn(`[AtlasDataAPI] Failed to upsert playbook ${book.id}:`, err);
    }
  }

  return {
    success: successCount > 0,
    message: `Synchronized ${successCount} of ${books.length} playbooks directly with MongoDB Atlas via Data API.`
  };
}
