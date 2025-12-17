/**
 * Cache Service
 * IndexedDB wrapper for weather data caching
 */

import { CACHE_CONFIG } from '../utils/constants.js';

class CacheService {
  constructor() {
    this.db = null;
    this.dbName = CACHE_CONFIG.DATABASE_NAME;
    this.storeName = CACHE_CONFIG.WEATHER_STORE;
    this.maxEntries = CACHE_CONFIG.MAX_WEATHER_ENTRIES;
  }

  /**
   * Initialize IndexedDB
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create weather cache store
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('fetchedAt', 'fetchedAt', { unique: false });
          store.createIndex('cacheExpiry', 'cacheExpiry', { unique: false });
        }
      };
    });
  }

  /**
   * Get cached weather data
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object|null>} Weather data or null
   */
  async get(lat, lon) {
    await this.init();
    const key = this.generateKey(lat, lon);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store weather data in cache
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {Object} data - Weather data to cache
   * @returns {Promise<void>}
   */
  async set(lat, lon, data) {
    await this.init();
    const key = this.generateKey(lat, lon);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const cacheEntry = {
        key,
        data,
        fetchedAt: data.fetchedAt || new Date().toISOString(),
        cacheExpiry: data.cacheExpiry,
      };

      const request = store.put(cacheEntry);

      request.onsuccess = async () => {
        await this.enforceMaxEntries();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove cached weather data
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<void>}
   */
  async remove(lat, lon) {
    await this.init();
    const key = this.generateKey(lat, lon);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all cached weather data
   * @returns {Promise<void>}
   */
  async clear() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generate cache key from coordinates
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {string} Cache key
   */
  generateKey(lat, lon) {
    // Round to 2 decimal places for reasonable cache granularity
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLon = Math.round(lon * 100) / 100;
    return `${roundedLat},${roundedLon}`;
  }

  /**
   * Enforce maximum cache entries by removing oldest
   * @returns {Promise<void>}
   */
  async enforceMaxEntries() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('fetchedAt');
      const request = index.openCursor();

      const entries = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          entries.push({
            key: cursor.primaryKey,
            fetchedAt: cursor.value.fetchedAt,
          });
          cursor.continue();
        } else {
          // Sort by fetchedAt (oldest first)
          entries.sort((a, b) => new Date(a.fetchedAt) - new Date(b.fetchedAt));

          // Remove oldest entries if over max
          const entriesToRemove = entries.length - this.maxEntries;
          if (entriesToRemove > 0) {
            const removeTransaction = this.db.transaction([this.storeName], 'readwrite');
            const removeStore = removeTransaction.objectStore(this.storeName);

            for (let i = 0; i < entriesToRemove; i++) {
              removeStore.delete(entries[i].key);
            }

            removeTransaction.oncomplete = () => resolve();
            removeTransaction.onerror = () => reject(removeTransaction.error);
          } else {
            resolve();
          }
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

export default new CacheService();
