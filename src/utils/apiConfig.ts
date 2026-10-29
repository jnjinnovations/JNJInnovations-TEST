/**
 * Production API Configuration & Environment Routing
 * 
 * Manages API endpoint resolution across environments:
 * 1. Google AI Studio / Localhost: Same-origin relative paths ("") handled by local Express server.
 * 2. GitHub Pages / Static Hosting: Routes requests to a separately hosted Node.js backend
 *    (e.g., Google Cloud Run, Render, Railway) via VITE_API_URL or runtime Admin override.
 */

const API_STORAGE_KEY = 'jnj_api_base_url';

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return (import.meta.env.VITE_API_URL as string) || '';
  }

  // 1. Runtime override stored in localStorage (configured via Admin UI)
  const stored = localStorage.getItem(API_STORAGE_KEY);
  if (stored && stored.trim()) {
    return stored.trim().replace(/\/+$/, '');
  }

  // 2. Build-time environment variable from Vite
  const envUrl = (import.meta.env.VITE_API_URL as string) || '';
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 3. Same-origin fallback (Google AI Studio dev environment or full-stack production container)
  return '';
}

export function setApiBaseUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const cleanUrl = url.trim().replace(/\/+$/, '');
  if (cleanUrl) {
    localStorage.setItem(API_STORAGE_KEY, cleanUrl);
  } else {
    localStorage.removeItem(API_STORAGE_KEY);
  }
  window.dispatchEvent(new Event('jnj-api-config-changed'));
}

export function getApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!base) {
    return normalizedEndpoint;
  }
  return `${base}${normalizedEndpoint}`;
}

export function isStaticHostWithoutBackend(): boolean {
  if (typeof window === 'undefined') return false;
  const currentBase = getApiBaseUrl();
  if (currentBase) return false;

  const host = window.location.hostname.toLowerCase();
  // If hosted on GitHub Pages or custom domain without a backend configured
  return host.endsWith('github.io') || host === 'jnjinnovations.com' || host === 'www.jnjinnovations.com';
}
