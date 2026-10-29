import { EbookItem, OrderConfirmation } from '../types';
import { DEFAULT_EBOOKS } from '../data/defaultEbooks';
import { getApiUrl, isStaticHostWithoutBackend, getApiBaseUrl } from './apiConfig';

const STORAGE_KEY = 'jnj_innovations_ebook_catalog_v1';
const ORDERS_KEY = 'jnj_innovations_ebook_orders_v1';

export function getStoredEbooks(): EbookItem[] {
  if (typeof window === 'undefined') return DEFAULT_EBOOKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EBOOKS));
      return DEFAULT_EBOOKS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_EBOOKS;
  } catch (err) {
    console.error('Failed to parse ebooks from localStorage:', err);
    return DEFAULT_EBOOKS;
  }
}

export function saveStoredEbooks(books: EbookItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    window.dispatchEvent(new Event('jnj-ebooks-updated'));
  } catch (err) {
    console.error('Failed to save ebooks to localStorage:', err);
  }
}

export interface MongoStatusResponse {
  connected: boolean;
  cluster?: string;
  database?: string;
  collection?: string;
  documentCount?: number;
  error?: string;
  errorCode?: string;
  isIpWhitelistError?: boolean;
  isAuthError?: boolean;
  isTimeoutError?: boolean;
  isCorsError?: boolean;
  isStaticHostMissingBackend?: boolean;
  ipWhitelistGuide?: string;
  apiTargetUrl?: string;
}

export async function testBackendHealth(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
  const start = Date.now();
  const url = getApiUrl('/api/health');

  if (isStaticHostWithoutBackend()) {
    return {
      ok: false,
      message: 'Static hosting (GitHub Pages) detected: No backend API URL configured.',
      latencyMs: 0
    };
  }

  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    const latency = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      return {
        ok: true,
        message: `Backend reachable (${latency}ms) - Service: ${data.service || 'ok'}`,
        latencyMs: latency
      };
    }
    if (res.status === 404) {
      return {
        ok: false,
        message: `HTTP 404: /api/health not found at ${url}. Ensure backend is deployed and running.`,
        latencyMs: latency
      };
    }
    return {
      ok: false,
      message: `HTTP ${res.status}: Backend responded with error.`,
      latencyMs: latency
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Network/CORS Error: Could not reach ${url} (${err.message})`,
      latencyMs: Date.now() - start
    };
  }
}

export async function getMongoDBStatus(force = false): Promise<MongoStatusResponse> {
  const targetUrl = getApiUrl(`/api/mongodb/status${force ? '?force=1' : ''}`);
  const currentBase = getApiBaseUrl();

  // If running on a static host without a configured backend
  if (isStaticHostWithoutBackend()) {
    return {
      connected: false,
      cluster: "jnjtestcluster.695tiet.mongodb.net",
      database: "jnj_innovations",
      collection: "playbooks",
      isStaticHostMissingBackend: true,
      apiTargetUrl: targetUrl,
      error: "Static hosting (GitHub Pages) cannot execute Node.js backend code. Connect your deployed backend API URL (e.g., Cloud Run / Render) in Admin Settings.",
      ipWhitelistGuide: "GitHub Pages is a static file host. Your backend must be hosted on a platform like Google Cloud Run or Render."
    };
  }

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        apiTargetUrl: currentBase || 'Same-origin (AI Studio / Container)'
      };
    }

    if (res.status === 404) {
      return {
        connected: false,
        cluster: "jnjtestcluster.695tiet.mongodb.net",
        database: "jnj_innovations",
        collection: "playbooks",
        apiTargetUrl: targetUrl,
        error: `HTTP 404: Endpoint not found at ${targetUrl}. When running on static hosting, please set your deployed backend API URL.`
      };
    }

    return {
      connected: false,
      cluster: "jnjtestcluster.695tiet.mongodb.net",
      database: "jnj_innovations",
      collection: "playbooks",
      apiTargetUrl: targetUrl,
      error: `HTTP ${res.status}: Failed to reach API server`
    };
  } catch (err: any) {
    const isCorsOrNetwork = err.name === 'TypeError' || err.message.includes('Failed to fetch');
    return {
      connected: false,
      cluster: "jnjtestcluster.695tiet.mongodb.net",
      database: "jnj_innovations",
      collection: "playbooks",
      apiTargetUrl: targetUrl,
      isCorsError: isCorsOrNetwork,
      error: isCorsOrNetwork
        ? `Network or CORS error connecting to ${targetUrl}. Verify your backend is running and CORS allows ${window.location.origin}.`
        : err.message
    };
  }
}

export async function syncWithMongoDB(strict = false): Promise<EbookItem[]> {
  const url = getApiUrl(`/api/playbooks${strict ? '?strict=1' : ''}`);

  if (isStaticHostWithoutBackend()) {
    if (strict) {
      throw new Error("Cannot sync with MongoDB Atlas: No backend API URL configured for this static deployment. Please configure your deployed backend API URL.");
    }
    return getStoredEbooks();
  }

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.books) && data.books.length > 0) {
        saveStoredEbooks(data.books);
        return data.books;
      }
    } else if (strict) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: Failed to retrieve playbooks from server`);
    }
  } catch (err: any) {
    console.warn('[Store] MongoDB fetch fallback to local storage:', err.message);
    if (strict) {
      throw err;
    }
  }
  return getStoredEbooks();
}

export async function syncCatalogToMongoDB(books: EbookItem[]): Promise<{ success: boolean; message: string; details?: any }> {
  const url = getApiUrl('/api/playbooks');

  if (isStaticHostWithoutBackend()) {
    return {
      success: false,
      message: "Cannot push to MongoDB Atlas: Running on static hosting without a configured backend API URL. Please set your deployed backend URL in Admin Settings."
    };
  }

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(books)
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || `Successfully synced ${books.length} playbooks to MongoDB Atlas`,
        details: data
      };
    }

    return {
      success: false,
      message: data.error || data.message || `HTTP ${res.status}: Database push rejected.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Network/CORS error pushing to ${url}: ${err.message}`
    };
  }
}

export async function updateEbookItem(id: string, updates: Partial<EbookItem>): Promise<EbookItem[]> {
  const books = getStoredEbooks();
  const index = books.findIndex(b => b.id === id);
  if (index !== -1) {
    books[index] = { ...books[index], ...updates };
    saveStoredEbooks(books);

    if (!isStaticHostWithoutBackend()) {
      try {
        fetch(getApiUrl(`/api/playbooks/${encodeURIComponent(id)}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }).catch(e => console.warn('[MongoDB] Background update warning:', e));
      } catch (e) {
        console.warn('[MongoDB] Could not sync update to server:', e);
      }
    }
  }
  return books;
}

export async function addEbookItem(book: EbookItem): Promise<EbookItem[]> {
  const books = getStoredEbooks();
  books.unshift(book);
  saveStoredEbooks(books);

  if (!isStaticHostWithoutBackend()) {
    try {
      fetch(getApiUrl('/api/playbooks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book)
      }).catch(e => console.warn('[MongoDB] Background add warning:', e));
    } catch (e) {
      console.warn('[MongoDB] Could not sync new book to server:', e);
    }
  }

  return books;
}

export async function deleteEbookItem(id: string): Promise<EbookItem[]> {
  const books = getStoredEbooks().filter(b => b.id !== id);
  saveStoredEbooks(books);

  if (!isStaticHostWithoutBackend()) {
    try {
      fetch(getApiUrl(`/api/playbooks/${encodeURIComponent(id)}`), {
        method: 'DELETE'
      }).catch(e => console.warn('[MongoDB] Background delete warning:', e));
    } catch (e) {
      console.warn('[MongoDB] Could not sync delete to server:', e);
    }
  }

  return books;
}

export async function resetEbooksToDefault(): Promise<EbookItem[]> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EBOOKS));
    window.dispatchEvent(new Event('jnj-ebooks-updated'));

    if (!isStaticHostWithoutBackend()) {
      try {
        fetch(getApiUrl('/api/playbooks/reset'), { method: 'POST' }).catch(e =>
          console.warn('[MongoDB] Background reset warning:', e)
        );
      } catch (e) {
        console.warn('[MongoDB] Could not reset server collection:', e);
      }
    }
  }
  return DEFAULT_EBOOKS;
}

export function getStoredOrders(): OrderConfirmation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordCompletedOrder(order: OrderConfirmation): void {
  if (typeof window === 'undefined') return;
  try {
    const orders = getStoredOrders();
    orders.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    const books = getStoredEbooks();
    order.items.forEach(item => {
      const bookIndex = books.findIndex(b => b.id === item.bookId);
      if (bookIndex !== -1) {
        const book = books[bookIndex];
        book.salesCount = (book.salesCount || 0) + item.quantity;
        if (!book.isUnlimited && book.inventoryCount > 0) {
          book.inventoryCount = Math.max(0, book.inventoryCount - item.quantity);
          if (book.inventoryCount === 0) {
            book.status = 'sold_out';
          } else if (book.inventoryCount <= 10) {
            book.status = 'low_stock';
          }
        }
        updateEbookItem(book.id, {
          inventoryCount: book.inventoryCount,
          salesCount: book.salesCount,
          status: book.status
        });
      }
    });
    saveStoredEbooks(books);
  } catch (err) {
    console.error('Failed to record order:', err);
  }
}
