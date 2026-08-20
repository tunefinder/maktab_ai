// Ultra-Fast In-Memory Cache with Instant Stale-While-Revalidate (SWR) Pattern

interface CacheEntry {
  data: any;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<any>>();

const CACHE_FRESH_TTL_MS = 30 * 1000;   // 30 seconds fresh
const CACHE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes max stale fallback

export async function fastFetch<T = any>(
  url: string, 
  forceFresh = false,
  onRevalidate?: (freshData: T) => void
): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(url);

  // If cached and fresh, return instantly (0ms)
  if (!forceFresh && cached && (now - cached.timestamp < CACHE_FRESH_TTL_MS)) {
    return cached.data as T;
  }

  // If stale cache exists, return it immediately and revalidate in background!
  if (!forceFresh && cached && (now - cached.timestamp < CACHE_MAX_AGE_MS)) {
    // Background revalidation
    revalidateInBackground<T>(url, onRevalidate);
    return cached.data as T;
  }

  // Deduplicate concurrent inflight requests to the same URL
  if (inflightRequests.has(url)) {
    return inflightRequests.get(url) as Promise<T>;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      memoryCache.set(url, { data, timestamp: Date.now() });
      return data as T;
    } catch (err) {
      if (cached) return cached.data as T;
      throw err;
    } finally {
      inflightRequests.delete(url);
    }
  })();

  inflightRequests.set(url, fetchPromise);
  return fetchPromise;
}

async function revalidateInBackground<T>(url: string, callback?: (freshData: T) => void) {
  if (inflightRequests.has(url)) return;
  try {
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
    if (res.ok) {
      const data = await res.json();
      memoryCache.set(url, { data, timestamp: Date.now() });
      if (callback) callback(data);
    }
  } catch {
    // Silent background fail
  }
}

export function prefetchUrl(url: string) {
  fastFetch(url).catch(() => {});
}

export function invalidateFastCache(urlPrefix?: string) {
  if (!urlPrefix) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(urlPrefix)) {
        memoryCache.delete(key);
      }
    }
  }
}
