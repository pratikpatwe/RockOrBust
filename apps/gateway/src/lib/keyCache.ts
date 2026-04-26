interface CacheEntry {
  keyId: string;
  cachedAt: number;
}

const CACHE_TTL = 300000; // 5 minutes in ms

class KeyCache {
  private cache = new Map<string, CacheEntry>();

  /**
   * Returns the cached keyId if it exists and hasn't expired.
   */
  get(keyString: string): string | null {
    const entry = this.cache.get(keyString);
    if (!entry) return null;

    if (Date.now() - entry.cachedAt > CACHE_TTL) {
      this.cache.delete(keyString);
      return null;
    }

    return entry.keyId;
  }

  /**
   * Caches a successful key validation.
   */
  set(keyString: string, keyId: string) {
    this.cache.set(keyString, { keyId, cachedAt: Date.now() });
  }

  /**
   * Removes a key from the cache (e.g., if it's found to be invalid/revoked).
   */
  invalidate(keyString: string) {
    this.cache.delete(keyString);
  }
}

export const keyCache = new KeyCache();
