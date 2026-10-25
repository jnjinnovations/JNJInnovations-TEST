import { EbookItem, OrderConfirmation } from '../types';
import { DEFAULT_EBOOKS } from '../data/defaultEbooks';

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
  error?: string;
  isIpWhitelistError?: boolean;
  ipWhitelistGuide?: string;
}

export async function getMongoDBStatus(force = false): Promise<MongoStatusResponse> {
  try {
    const res = await fetch(`/api/mongodb/status${force ? '?force=1' : ''}`);
    if (res.ok) {
      return await res.json();
    }
    return { connected: false, error: `HTTP ${res.status}: Failed to reach API server` };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}

export async function syncWithMongoDB(): Promise<EbookItem[]> {
  try {
    const res = await fetch('/api/playbooks');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.books) && data.books.length > 0) {
        saveStoredEbooks(data.books);
        return data.books;
      }
    }
  } catch (err) {
    console.warn('[Store] MongoDB fetch fallback to local storage:', err);
  }
  return getStoredEbooks();
}

export async function syncCatalogToMongoDB(books: EbookItem[]): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/playbooks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(books)
    });
    const data = await res.json();
    return { success: res.ok && data.success, message: data.message || data.error || 'Synced' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updateEbookItem(id: string, updates: Partial<EbookItem>): Promise<EbookItem[]> {
  const books = getStoredEbooks();
  const index = books.findIndex(b => b.id === id);
  if (index !== -1) {
    books[index] = { ...books[index], ...updates };
    saveStoredEbooks(books);

    try {
      fetch(`/api/playbooks/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).catch(e => console.warn('[MongoDB] Background update warning:', e));
    } catch (e) {
      console.warn('[MongoDB] Could not sync update to server:', e);
    }
  }
  return books;
}

export async function addEbookItem(book: EbookItem): Promise<EbookItem[]> {
  const books = getStoredEbooks();
  books.unshift(book);
  saveStoredEbooks(books);

  try {
    fetch('/api/playbooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book)
    }).catch(e => console.warn('[MongoDB] Background add warning:', e));
  } catch (e) {
    console.warn('[MongoDB] Could not sync new book to server:', e);
  }

  return books;
}

export async function deleteEbookItem(id: string): Promise<EbookItem[]> {
  const books = getStoredEbooks().filter(b => b.id !== id);
  saveStoredEbooks(books);

  try {
    fetch(`/api/playbooks/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(e => console.warn('[MongoDB] Background delete warning:', e));
  } catch (e) {
    console.warn('[MongoDB] Could not sync delete to server:', e);
  }

  return books;
}

export async function resetEbooksToDefault(): Promise<EbookItem[]> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EBOOKS));
    window.dispatchEvent(new Event('jnj-ebooks-updated'));

    try {
      fetch('/api/playbooks/reset', { method: 'POST' }).catch(e =>
        console.warn('[MongoDB] Background reset warning:', e)
      );
    } catch (e) {
      console.warn('[MongoDB] Could not reset server collection:', e);
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
