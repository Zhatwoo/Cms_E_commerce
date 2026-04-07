/**
 * Simple in-memory cache utility for Express responses
 * Stores data with a Time-To-Live (TTL)
 */
class MemoryCache {
    constructor() {
        this.cache = new Map();
    }

    /**
     * set - Stores data in cache
     * @param {string} key - Unique key for the cache entry
     * @param {any} data - The data to cache
     * @param {number} ttlSeconds - Time to live in seconds
     */
    set(key, data, ttlSeconds = 60) {
        const expiresAt = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { data, expiresAt });
    }

    /**
     * get - Retrieves data from cache if not expired
     * @param {string} key - Unique key
     * @returns {any|null} - Cached data or null if not found/expired
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * clear - Removes all entries or entries starting with a prefix
     * @param {string} prefix - Optional prefix to filter keys
     */
    clear(prefix = '') {
        if (!prefix) {
            this.cache.clear();
            return;
        }
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }
}

module.exports = new MemoryCache();
