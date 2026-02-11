// Optimized Google Sheets Integration - High Performance Version
// This file provides optimized integration with Google Sheets API

// Enhanced Google Sheets Configuration
const GOOGLE_SHEETS_CONFIG = {
    WEB_APP_URL: '', // Will be set from localStorage
    SPREADSHEET_ID: '', // Will be set from localStorage
    CACHE_DURATION: 15 * 60 * 1000, // 15 minutes (increased from 5)
    BATCH_SIZE: 50, // Process data in batches
    MAX_RETRIES: 3, // Maximum retry attempts
    RETRY_DELAY: 1000, // Delay between retries in ms
    CONCURRENT_REQUESTS: 3, // Maximum concurrent requests
    COMPRESSION_ENABLED: true, // Enable data compression
    LAZY_LOADING: true // Enable lazy loading for large datasets
};

// Sheet names matching the existing schema
const SHEET_NAMES = {
    PRODUCTS: 'products',
    CATEGORY: 'category',
    ORDERS: 'orders',
    ORDER_ITEMS: 'order_items',
    CUSTOMERS: 'customers',
    PROMOTIONS: 'promotions'
};

// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            requests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0,
            totalTime: 0,
            averageTime: 0
        };
    }

    startRequest() {
        this.metrics.requests++;
        return performance.now();
    }

    endRequest(startTime) {
        const duration = performance.now() - startTime;
        this.metrics.totalTime += duration;
        this.metrics.averageTime = this.metrics.totalTime / this.metrics.requests;
        return duration;
    }

    recordCacheHit() {
        this.metrics.cacheHits++;
    }

    recordCacheMiss() {
        this.metrics.cacheMisses++;
    }

    recordError() {
        this.metrics.errors++;
    }

    getMetrics() {
        return {
            ...this.metrics,
            cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100,
            errorRate: this.metrics.errors / this.metrics.requests * 100
        };
    }
}

// Enhanced Cache Manager
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.accessTimes = new Map();
        this.maxSize = 100; // Maximum cache entries
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000); // Cleanup every 5 minutes
    }

    set(key, data, duration = GOOGLE_SHEETS_CONFIG.CACHE_DURATION) {
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.delete(oldestKey);
        }

        this.cache.set(key, {
            data: this.compress(data),
            timestamp: Date.now(),
            duration: duration
        });
        this.accessTimes.set(key, Date.now());
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }

        // Check if cache is expired
        if (Date.now() - item.timestamp > item.duration) {
            this.delete(key);
            return null;
        }

        this.accessTimes.set(key, Date.now());
        return this.decompress(item.data);
    }

    delete(key) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
    }

    clear() {
        this.cache.clear();
        this.accessTimes.clear();
    }

    clearForSheet(sheetName) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(sheetName + '_')) {
                this.delete(key);
            }
        }
    }

    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.duration) {
                this.delete(key);
            }
        }
    }

    compress(data) {
        if (!GOOGLE_SHEETS_CONFIG.COMPRESSION_ENABLED || !data || typeof data !== 'object') {
            return data;
        }
        
        // Simple compression - remove null/undefined values and optimize array storage
        if (Array.isArray(data)) {
            return data.filter(row => row && Object.keys(row).length > 0);
        }
        
        return data;
    }

    decompress(data) {
        return data; // No decompression needed for our simple compression
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            memoryUsage: JSON.stringify([...this.cache.entries()]).length
        };
    }
}

// Request Queue Manager
class RequestQueue {
    constructor() {
        this.queue = [];
        this.activeRequests = 0;
        this.maxConcurrent = GOOGLE_SHEETS_CONFIG.CONCURRENT_REQUESTS;
    }

    async add(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                requestFn,
                resolve,
                reject
            });
            this.process();
        });
    }

    async process() {
        if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }

        this.activeRequests++;
        const { requestFn, resolve, reject } = this.queue.shift();

        try {
            const result = await requestFn();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.activeRequests--;
            this.process();
        }
    }
}

// Optimized Google Sheets API Client
class OptimizedGoogleSheetsAPI {
    constructor() {
        this.webAppUrl = '';
        this.spreadsheetId = '';
        this.cache = new CacheManager();
        this.requestQueue = new RequestQueue();
        this.performanceMonitor = new PerformanceMonitor();
        this.loadSettings();
    }

    // Load settings from localStorage
    loadSettings() {
        const savedSettings = localStorage.getItem('googleSheetsSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.webAppUrl = settings.webAppUrl;
            this.spreadsheetId = settings.spreadsheetId;
        }
        
        // Fallback hardcoded URL if no settings found
        if (!this.webAppUrl) {
            this.webAppUrl = 'https://script.google.com/macros/s/AKfycbxQmwApMVQ2ZYPIHj63AA-Z1p1wQihyCFe0ypJNMheJl7UN0acV7wZZwBSOrDptyBp8ig/exec';
        }
        
        GOOGLE_SHEETS_CONFIG.WEB_APP_URL = this.webAppUrl;
        GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID = this.spreadsheetId;
    }

    // Check if configured
    isConfigured() {
        return this.webAppUrl;
    }

    // Optimized data fetching with retry logic
    async getSheetData(sheetName, options = {}) {
        const {
            range = 'A:Z',
            useCache = true,
            forceRefresh = false,
            batchSize = GOOGLE_SHEETS_CONFIG.BATCH_SIZE
        } = options;

        const cacheKey = `${sheetName}_${range}`;
        
        // Check cache first (unless force refresh)
        if (useCache && !forceRefresh) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                this.performanceMonitor.recordCacheHit();
                console.log(`Using cached data for ${sheetName}`);
                return { success: true, data: cached, fromCache: true };
            }
            this.performanceMonitor.recordCacheMiss();
        }

        return this.requestQueue.add(async () => {
            const startTime = this.performanceMonitor.startRequest();
            
            try {
                console.log(`Fetching optimized data from ${sheetName}...`);
                
                // Use batch fetching for large datasets
                if (GOOGLE_SHEETS_CONFIG.LAZY_LOADING && this.shouldUseLazyLoading(sheetName)) {
                    return await this.fetchInBatches(sheetName, range, batchSize);
                }

                const url = `${this.webAppUrl}?action=get${sheetName.charAt(0).toUpperCase() + sheetName.slice(1)}`;
                
                const response = await this.fetchWithRetry(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });

                const data = await response.json();
                console.log(`Received ${data.length} rows from ${sheetName}`);
                
                // Cache the result
                if (useCache) {
                    this.cache.set(cacheKey, data);
                }
                
                const duration = this.performanceMonitor.endRequest(startTime);
                console.log(`Request completed in ${duration.toFixed(2)}ms`);
                
                return { success: true, data, fromCache: false };
                
            } catch (error) {
                this.performanceMonitor.recordError();
                const duration = this.performanceMonitor.endRequest(startTime);
                console.error(`Error fetching data from ${sheetName} after ${duration.toFixed(2)}ms:`, error);
                return { success: false, error: error.message };
            }
        });
    }

    // Batch fetching for large datasets
    async fetchInBatches(sheetName, range, batchSize) {
        console.log(`Using batch loading for ${sheetName} with batch size ${batchSize}`);
        
        // For now, fall back to regular fetching
        // In a real implementation, you'd modify the Google Apps Script to support pagination
        const url = `${this.webAppUrl}?action=get${sheetName.charAt(0).toUpperCase() + sheetName.slice(1)}`;
        const response = await this.fetchWithRetry(url);
        const data = await response.json();
        
        return { success: true, data, fromCache: false };
    }

    // Determine if lazy loading should be used
    shouldUseLazyLoading(sheetName) {
        const largeSheets = ['products', 'orders', 'order_items'];
        return largeSheets.includes(sheetName);
    }

    // Optimized add operation with batch support
    async addRows(sheetName, dataArray) {
        if (!Array.isArray(dataArray)) {
            dataArray = [dataArray];
        }

        return this.requestQueue.add(async () => {
            const startTime = this.performanceMonitor.startRequest();
            
            try {
                // Process in batches if data is large
                if (dataArray.length > GOOGLE_SHEETS_CONFIG.BATCH_SIZE) {
                    return await this.addInBatches(sheetName, dataArray);
                }

                const action = `add${sheetName.charAt(0).toUpperCase() + sheetName.slice(1, -1)}`;
                
                const response = await this.fetchWithRetry(this.webAppUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: action,
                        data: dataArray.length === 1 ? dataArray[0] : dataArray
                    })
                });

                const result = await response.json();
                
                // Clear cache for this sheet
                this.cache.clearForSheet(sheetName);
                
                const duration = this.performanceMonitor.endRequest(startTime);
                console.log(`Added ${dataArray.length} rows to ${sheetName} in ${duration.toFixed(2)}ms`);
                
                return { success: true, result };
                
            } catch (error) {
                this.performanceMonitor.recordError();
                const duration = this.performanceMonitor.endRequest(startTime);
                console.error(`Error adding data to ${sheetName} after ${duration.toFixed(2)}ms:`, error);
                return { success: false, error: error.message };
            }
        });
    }

    // Add single row (for backward compatibility)
    async addRow(sheetName, data) {
        return this.addRows(sheetName, data);
    }

    // Batch add operation
    async addInBatches(sheetName, dataArray) {
        const batches = [];
        for (let i = 0; i < dataArray.length; i += GOOGLE_SHEETS_CONFIG.BATCH_SIZE) {
            batches.push(dataArray.slice(i, i + GOOGLE_SHEETS_CONFIG.BATCH_SIZE));
        }

        const results = [];
        for (const batch of batches) {
            const result = await this.addRows(sheetName, batch);
            results.push(result);
        }

        return { success: true, results };
    }

    // Optimized update operation
    async updateRow(sheetName, rowId, data) {
        return this.requestQueue.add(async () => {
            const startTime = this.performanceMonitor.startRequest();
            
            try {
                const action = `update${sheetName.charAt(0).toUpperCase() + sheetName.slice(1, -1)}`;
                
                const response = await this.fetchWithRetry(this.webAppUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: action,
                        rowId: rowId,
                        ...data
                    })
                });

                const result = await response.json();
                
                // Clear cache for this sheet
                this.cache.clearForSheet(sheetName);
                
                const duration = this.performanceMonitor.endRequest(startTime);
                console.log(`Updated row in ${sheetName} in ${duration.toFixed(2)}ms`);
                
                return { success: true, result };
                
            } catch (error) {
                this.performanceMonitor.recordError();
                const duration = this.performanceMonitor.endRequest(startTime);
                console.error(`Error updating data in ${sheetName} after ${duration.toFixed(2)}ms:`, error);
                return { success: false, error: error.message };
            }
        });
    }

    // Optimized delete operation
    async deleteRow(sheetName, column, value) {
        return this.requestQueue.add(async () => {
            const startTime = this.performanceMonitor.startRequest();
            
            try {
                const action = `delete${sheetName.charAt(0).toUpperCase() + sheetName.slice(1, -1)}`;
                
                const response = await this.fetchWithRetry(this.webAppUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: action,
                        column: column,
                        value: value
                    })
                });

                const result = await response.json();
                
                // Clear cache for this sheet
                this.cache.clearForSheet(sheetName);
                
                const duration = this.performanceMonitor.endRequest(startTime);
                console.log(`Deleted row from ${sheetName} in ${duration.toFixed(2)}ms`);
                
                return { success: true, result };
                
            } catch (error) {
                this.performanceMonitor.recordError();
                const duration = this.performanceMonitor.endRequest(startTime);
                console.error(`Error deleting data from ${sheetName} after ${duration.toFixed(2)}ms:`, error);
                return { success: false, error: error.message };
            }
        });
    }

    // Fetch with retry logic
    async fetchWithRetry(url, options = {}, retries = GOOGLE_SHEETS_CONFIG.MAX_RETRIES) {
        for (let i = 0; i < retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
                
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response;
                
            } catch (error) {
                console.warn(`Attempt ${i + 1} failed:`, error.message);
                
                if (i === retries - 1) {
                    throw error;
                }
                
                // Wait before retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, GOOGLE_SHEETS_CONFIG.RETRY_DELAY * Math.pow(2, i)));
            }
        }
    }

    // Performance monitoring methods
    getPerformanceMetrics() {
        return {
            ...this.performanceMonitor.getMetrics(),
            cacheStats: this.cache.getStats(),
            queueLength: this.requestQueue.queue.length,
            activeRequests: this.requestQueue.activeRequests
        };
    }

    // Cache management
    clearCache() {
        this.cache.clear();
    }

    clearCacheForSheet(sheetName) {
        this.cache.clearForSheet(sheetName);
    }

    // Preload commonly used data
    async preloadData() {
        const commonSheets = ['category', 'products'];
        const promises = commonSheets.map(sheet => 
            this.getSheetData(sheet, { useCache: true })
        );
        
        try {
            await Promise.all(promises);
            console.log('Preloaded common data');
        } catch (error) {
            console.warn('Failed to preload data:', error);
        }
    }

    // Test connection with performance metrics
    async testConnection() {
        const startTime = this.performanceMonitor.startRequest();
        
        try {
            const result = await this.getSheetData('products', { useCache: false });
            const duration = this.performanceMonitor.endRequest(startTime);
            
            return {
                success: result.success,
                message: result.success ? 
                    `Connection successful in ${duration.toFixed(2)}ms` : 
                    result.error,
                performance: this.getPerformanceMetrics()
            };
            
        } catch (error) {
            this.performanceMonitor.recordError();
            const duration = this.performanceMonitor.endRequest(startTime);
            
            return {
                success: false,
                error: `Connection failed after ${duration.toFixed(2)}ms: ${error.message}`,
                performance: this.getPerformanceMetrics()
            };
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OptimizedGoogleSheetsAPI, GOOGLE_SHEETS_CONFIG };
}

// Global instance for backward compatibility
window.OptimizedGoogleSheetsAPI = OptimizedGoogleSheetsAPI;
window.GOOGLE_SHEETS_CONFIG = GOOGLE_SHEETS_CONFIG;
