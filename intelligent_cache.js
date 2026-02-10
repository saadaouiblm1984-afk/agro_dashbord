// Intelligent Caching Strategy for Java Dashboard
// This implements smart data caching with background sync and offline support

class IntelligentCache {
    constructor() {
        this.cache = new Map();
        this.cacheConfig = {
            // Cache duration in milliseconds
            categories: 30 * 60 * 1000,        // 30 minutes
            products: 15 * 60 * 1000,          // 15 minutes  
            orders: 5 * 60 * 1000,             // 5 minutes
            customers: 60 * 60 * 1000,           // 1 hour
            default: 10 * 60 * 1000              // 10 minutes
        };
        
        this.syncConfig = {
            enabled: true,
            interval: 5 * 60 * 1000,             // Sync every 5 minutes
            retryAttempts: 3,
            retryDelay: 2000                         // 2 seconds between retries
        };
        
        this.isOnline = navigator.onLine;
        this.lastSyncTime = {};
        this.syncInProgress = false;
        
        this.init();
    }
    
    // Initialize the cache system
    init() {
        console.log('🚀 Initializing Intelligent Cache System...');
        
        // Load cached data from localStorage
        this.loadFromStorage();
        
        // Setup online/offline event listeners
        this.setupNetworkListeners();
        
        // Start background sync if online
        if (this.isOnline) {
            this.startBackgroundSync();
        }
        
        // Setup periodic cache cleanup
        this.startCacheCleanup();
        
        console.log('✅ Intelligent Cache System Ready');
    }
    
    // Load cached data from localStorage
    loadFromStorage() {
        try {
            const cachedData = localStorage.getItem('intelligentCache');
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                this.cache = new Map(Object.entries(parsed.data || {}));
                this.lastSyncTime = parsed.lastSyncTime || {};
                console.log('📦 Loaded cache from storage:', this.cache.size, 'items');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load cache from storage:', error);
        }
    }
    
    // Save cache to localStorage
    saveToStorage() {
        try {
            const data = {
                data: Object.fromEntries(this.cache),
                lastSyncTime: this.lastSyncTime,
                timestamp: Date.now()
            };
            localStorage.setItem('intelligentCache', JSON.stringify(data));
            console.log('💾 Saved cache to storage');
        } catch (error) {
            console.warn('⚠️ Failed to save cache to storage:', error);
        }
    }
    
    // Setup network status listeners
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            console.log('🌐 Network connected');
            this.isOnline = true;
            this.startBackgroundSync();
        });
        
        window.addEventListener('offline', () => {
            console.log('📵 Network disconnected');
            this.isOnline = false;
            this.stopBackgroundSync();
        });
    }
    
    // Get cached data with intelligent fallback
    async get(key, forceRefresh = false) {
        const cacheKey = `data_${key}`;
        const cached = this.cache.get(cacheKey);
        const now = Date.now();
        const cacheDuration = this.cacheConfig[key] || this.cacheConfig.default;
        
        // Check if cache is valid
        if (!forceRefresh && cached && (now - cached.timestamp < cacheDuration)) {
            console.log(`🎯 Cache hit for ${key} (${Math.round((now - cached.timestamp) / 1000)}s old)`);
            return {
                success: true,
                data: cached.data,
                fromCache: true,
                age: now - cached.timestamp
            };
        }
        
        // Cache miss or expired - fetch fresh data
        console.log(`🔄 Cache miss for ${key} - fetching fresh data`);
        return await this.fetchAndCache(key);
    }
    
    // Fetch fresh data and cache it
    async fetchAndCache(key) {
        try {
            let data;
            
            // Fetch based on data type
            switch (key) {
                case 'categories':
                    data = await this.fetchCategories();
                    break;
                case 'products':
                    data = await this.fetchProducts();
                    break;
                case 'orders':
                    data = await this.fetchOrders();
                    break;
                default:
                    throw new Error(`Unknown data type: ${key}`);
            }
            
            // Cache the fresh data
            this.set(key, data);
            
            return {
                success: true,
                data: data,
                fromCache: false,
                age: 0
            };
            
        } catch (error) {
            console.error(`❌ Failed to fetch ${key}:`, error);
            
            // Try to return stale cache if available
            const staleCache = this.cache.get(`data_${key}`);
            if (staleCache) {
                console.log(`🔄 Returning stale cache for ${key}`);
                return {
                    success: true,
                    data: staleCache.data,
                    fromCache: true,
                    stale: true,
                    age: Date.now() - staleCache.timestamp
                };
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Set data in cache
    set(key, data) {
        const cacheKey = `data_${key}`;
        const cacheEntry = {
            data: data,
            timestamp: Date.now(),
            version: this.getDataVersion(data)
        };
        
        this.cache.set(cacheKey, cacheEntry);
        this.lastSyncTime[key] = Date.now();
        
        console.log(`💾 Cached ${key} (${data.length || data.size || 'unknown'} items)`);
        this.saveToStorage();
    }
    
    // Fetch categories from Google Sheets
    async fetchCategories() {
        if (window.googleSheetsAPI && window.googleSheetsAPI.isConfigured()) {
            const response = await window.googleSheetsAPI.getSheetData('category');
            if (response.success) {
                return response.data.map((category, index) => ({
                    id: category.id || index + 1,
                    category_id: category.category_id || '',
                    category_name: category.category_name || '',
                    image_url: category.image_url || '',
                    product_count: category.product_count || 0
                }));
            }
            throw new Error(response.error || 'Failed to fetch categories');
        }
        
        // Fallback to local data
        return this.getFallbackCategories();
    }
    
    // Fetch products from Google Sheets
    async fetchProducts() {
        if (window.googleSheetsAPI && window.googleSheetsAPI.isConfigured()) {
            const response = await window.googleSheetsAPI.getSheetData('products');
            if (response.success) {
                return response.data.map((row, index) => ({
                    id: index + 1,
                    product_id: row[0] || '',        // product_id column
                    category_id: row[1] || '',        // category_id column  
                    product_name: row[2] || '',      // product_name column
                    qtepack: parseInt(row[3]) || 1,  // qtepack column
                    price: parseFloat(row[4]) || 0,   // price column
                    image_url: row[5] || '',         // image_url column
                    status: row[6] || 'disponible', // status column
                    description: row[7] || ''        // description column
                }));
            }
            throw new Error(response.error || 'Failed to fetch products');
        }
        
        // Fallback to local data
        return this.getFallbackProducts();
    }
    
    // Fetch orders from Google Sheets
    async fetchOrders() {
        if (window.googleSheetsAPI && window.googleSheetsAPI.isConfigured()) {
            const response = await window.googleSheetsAPI.getSheetData('orders');
            if (response.success) {
                return response.data;
            }
            throw new Error(response.error || 'Failed to fetch orders');
        }
        
        return this.getFallbackOrders();
    }
    
    // Get fallback categories
    getFallbackCategories() {
        return [
            { id: 1, category_id: 'ctg-001', category_name: 'تست', image_url: 'https://res.cloudinary.com/dgtnnmpgz/image/upload/v1770244006/logo_7_by5bdn.png', product_count: 0 },
            { id: 2, category_id: 'ctg-002', category_name: 'بينقو', image_url: 'https://res.cloudinary.com/dgtnnmpgz/image/upload/v1770244005/logo_4_hupdyh.jpg', product_count: 0 },
            { id: 3, category_id: 'ctg-003', category_name: 'مولبيد', image_url: 'https://res.cloudinary.com/dgtnnmpgz/image/upload/v1770244006/logo_6_ptuj7y.png', product_count: 0 },
            { id: 4, category_id: 'ctg-004', category_name: 'مولفيكس', image_url: 'https://res.cloudinary.com/dgtnnmpgz/image/upload/v1770244006/logo_5_umu2gd.png', product_count: 0 },
            { id: 5, category_id: 'ctg-005', category_name: 'بيبام', image_url: 'https://res.cloudinary.com/dgtnnmpgz/image/upload/v1770244005/logo_3_cadwia.png', product_count: 0 },
            { id: 6, category_id: 'ctg-006', category_name: 'كود كير', image_url: 'https://res.cloudinary.com/dgtnnmpgz/image/upload/v1770244006/logo_1_razfy8.png', product_count: 0 }
        ];
    }
    
    // Get fallback products
    getFallbackProducts() {
        return [
            { id: 1, product_id: 'prod-0001', category_id: 'ctg-002', product_name: 'بينغو 1 ليتر غسالة', qtepack: 9, price: 314.00, image_url: 'https://res.cloudinary.com/dgtnnmpgz/image/upload/v1769111352/image_21_rtzqii.jpg', status: 'disponible', description: '' },
            { id: 2, product_id: 'prod-0002', category_id: 'ctg-002', product_name: 'بينغو 1.2ل', qtepack: 12, price: 264.00, image_url: 'https://res.cloudinary.com/dgtnnmpgz/image/upload/v1769111343/image_18_wcwphb.png', status: 'disponible', description: '' },
            { id: 3, product_id: 'prod-0003', category_id: 'ctg-002', product_name: 'بينغو 1.5 كغ', qtepack: 8, price: 409.30, image_url: 'https://res.cloudinary.com/dgtnnmpgz/image/upload/v1769111341/image_11_uwiey3.png', status: 'disponible', description: '' },
            { id: 4, product_id: 'prod-0004', category_id: 'ctg-002', product_name: 'بينغو 2.5كغ*4', qtepack: 4, price: 796.04, image_url: 'https://res.cloudinary.com/dgtnnmpgz/image/upload/v1769111351/image_20_weicnu.png', status: 'disponible', description: '' },
            { id: 5, product_id: 'prod-0005', category_id: 'ctg-002', product_name: 'بينغو 2.7 ليتر', qtepack: 4, price: 714.00, image_url: 'https://res.cloudinary.com/dgtnnmpgz/image/upload/v1769111351/image_19_hzcmew.webp', status: 'disponible', description: '' }
        ];
    }
    
    // Get fallback orders
    getFallbackOrders() {
        return [];
    }
    
    // Start background synchronization
    startBackgroundSync() {
        if (this.syncInterval || !this.syncConfig.enabled) {
            return;
        }
        
        console.log('🔄 Starting background sync...');
        this.syncInterval = setInterval(() => {
            this.performBackgroundSync();
        }, this.syncConfig.interval);
    }
    
    // Stop background synchronization
    stopBackgroundSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏹ Stopped background sync');
        }
    }
    
    // Perform background synchronization
    async performBackgroundSync() {
        if (!this.isOnline || this.syncInProgress) {
            return;
        }
        
        this.syncInProgress = true;
        console.log('🔄 Performing background sync...');
        
        try {
            // Sync categories
            await this.syncData('categories');
            
            // Sync products
            await this.syncData('products');
            
            // Sync orders
            await this.syncData('orders');
            
            console.log('✅ Background sync completed');
        } catch (error) {
            console.warn('⚠️ Background sync failed:', error);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    // Sync specific data type
    async syncData(key) {
        try {
            const result = await this.fetchAndCache(key);
            if (result.success && !result.fromCache) {
                console.log(`🔄 Synced ${key} successfully`);
                this.notifyDataUpdate(key, result.data);
            }
        } catch (error) {
            console.warn(`⚠️ Failed to sync ${key}:`, error);
        }
    }
    
    // Notify components of data updates
    notifyDataUpdate(key, data) {
        const event = new CustomEvent('dataUpdate', {
            detail: { type: key, data: data }
        });
        window.dispatchEvent(event);
    }
    
    // Start periodic cache cleanup
    startCacheCleanup() {
        // Clean cache every hour
        setInterval(() => {
            this.cleanupExpiredCache();
        }, 60 * 60 * 1000);
    }
    
    // Clean expired cache entries
    cleanupExpiredCache() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            const dataKey = key.replace('data_', '');
            const cacheDuration = this.cacheConfig[dataKey] || this.cacheConfig.default;
            
            if (now - entry.timestamp > cacheDuration * 2) { // Keep for double duration
                this.cache.delete(key);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned ${cleanedCount} expired cache entries`);
            this.saveToStorage();
        }
    }
    
    // Get data version for cache invalidation
    getDataVersion(data) {
        if (Array.isArray(data)) {
            return data.length + '_' + (data[0]?.id || 0);
        }
        return JSON.stringify(data).length;
    }
    
    // Force refresh all cached data
    async refreshAll() {
        console.log('🔄 Force refreshing all cached data...');
        
        const keys = ['categories', 'products', 'orders'];
        const results = {};
        
        for (const key of keys) {
            try {
                results[key] = await this.get(key, true);
            } catch (error) {
                console.warn(`⚠️ Failed to refresh ${key}:`, error);
                results[key] = { success: false, error: error.message };
            }
        }
        
        return results;
    }
    
    // Get cache statistics
    getStats() {
        const now = Date.now();
        const stats = {
            totalItems: this.cache.size,
            items: {},
            hitRate: 0,
            lastSync: this.lastSyncTime
        };
        
        for (const [key, entry] of this.cache.entries()) {
            const dataKey = key.replace('data_', '');
            const age = now - entry.timestamp;
            const isExpired = age > (this.cacheConfig[dataKey] || this.cacheConfig.default);
            
            stats.items[dataKey] = {
                age: Math.round(age / 1000),
                expired: isExpired,
                size: JSON.stringify(entry.data).length
            };
        }
        
        return stats;
    }
    
    // Clear all cache
    clear() {
        this.cache.clear();
        this.lastSyncTime = {};
        this.saveToStorage();
        console.log('🗑️ Cleared all cache');
    }
    
    // Clear specific cache entry
    clearKey(key) {
        const cacheKey = `data_${key}`;
        this.cache.delete(cacheKey);
        delete this.lastSyncTime[key];
        this.saveToStorage();
        console.log(`🗑️ Cleared cache for ${key}`);
    }
}

// Export for global use
window.IntelligentCache = IntelligentCache;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (!window.intelligentCache) {
        window.intelligentCache = new IntelligentCache();
        console.log('🚀 Intelligent Cache System Auto-Initialized');
    }
});
