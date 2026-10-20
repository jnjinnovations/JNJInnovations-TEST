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
    // Dispatch a custom storage event so other components or tabs update immediately
    window.dispatchEvent(new Event('jnj-ebooks-updated'));
  } catch (err) {
    console.error('Failed to save ebooks to localStorage:', err);
  }
}

export function updateEbookItem(id: string, updates: Partial<EbookItem>): EbookItem[] {
  const books = getStoredEbooks();
  const index = books.findIndex(b => b.id === id);
  if (index !== -1) {
    books[index] = { ...books[index], ...updates };
    saveStoredEbooks(books);
  }
  return books;
}

export function addEbookItem(book: EbookItem): EbookItem[] {
  const books = getStoredEbooks();
  books.unshift(book);
  saveStoredEbooks(books);
  return books;
}

export function deleteEbookItem(id: string): EbookItem[] {
  const books = getStoredEbooks().filter(b => b.id !== id);
  saveStoredEbooks(books);
  return books;
}

export function resetEbooksToDefault(): EbookItem[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EBOOKS));
    window.dispatchEvent(new Event('jnj-ebooks-updated'));
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

    // Decrement inventory for items with finite stock
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
      }
    });
    saveStoredEbooks(books);
  } catch (err) {
    console.error('Failed to record order:', err);
  }
}
