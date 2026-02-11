// Google Sheets Integration - Compatible with existing schema
// This file handles the integration with Google Sheets API

// Google Sheets Configuration
const GOOGLE_SHEETS_CONFIG = {
    WEB_APP_URL: '', // Will be set from localStorage
    SPREADSHEET_ID: '', // Will be set from localStorage
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
};

// Sheet names matching the existing schema
const SHEET_NAMES = {
    PRODUCTS: 'products',
    CATEGORIES: 'categories', // Fixed: changed from 'category' to 'categories'
    ORDERS: 'orders',
    ORDER_ITEMS: 'order_items',
    CUSTOMERS: 'customers',
    PROMOTIONS: 'promotions'
};

// Google Sheets API Client
class GoogleSheetsAPI {
    constructor() {
        this.webAppUrl = '';
        this.spreadsheetId = '';
        this.cache = {};
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
            this.webAppUrl = 'https://script.google.com/macros/s/AKfycbxKW4EELjDoMzYSZoBiu0G4HujyM2UKSdXyNtPK66owa2nTQ38ltAIgGfvL_vnMzpst3w/exec';
            console.log('Using Google Sheets URL:', this.webAppUrl);
        }
        
        console.log('Google Sheets settings loaded:', {
            webAppUrl: this.webAppUrl,
            spreadsheetId: this.spreadsheetId
        });
        
        GOOGLE_SHEETS_CONFIG.WEB_APP_URL = this.webAppUrl;
        GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID = this.spreadsheetId;
    }

    // Check if configured
    isConfigured() {
        return this.webAppUrl; // Only need web app URL for now
    }

    // Get data from sheet
    async getSheetData(sheetName, range = 'A:Z') {
        if (!this.isConfigured()) {
            console.warn('Google Sheets not configured, using mock data');
            return [];
        }

        const cacheKey = `${sheetName}_${range}`;
        const cached = this.cache[cacheKey];
        
        if (cached && (Date.now() - cached.timestamp < GOOGLE_SHEETS_CONFIG.CACHE_DURATION)) {
            console.log(`Using cached data for ${sheetName}`);
            return cached.data;
        }

        try {
            console.log(`Fetching data from ${sheetName}...`);
            const url = `${this.webAppUrl}?action=get${sheetName.charAt(0).toUpperCase() + sheetName.slice(1)}`;
            console.log('Request URL:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            let data;
            try {
                const parsedResponse = JSON.parse(responseText);
                data = parsedResponse.success ? parsedResponse.data : parsedResponse;
            } catch (parseError) {
                console.warn('Response is not JSON, treating as raw data');
                data = responseText;
            }
            
            console.log(`Received data from ${sheetName}:`, data);
            
            // Cache the result
            this.cache[cacheKey] = {
                data: data,
                timestamp: Date.now()
            };
            
            return data;
            
        } catch (error) {
            console.error(`Error getting data from ${sheetName}:`, error);
            console.error('Full error details:', {
                sheetName,
                webAppUrl: this.webAppUrl,
                error: error.message,
                stack: error.stack
            });
            return [];
        }
    }

    // Add data to sheet
    async addSheetData(sheetName, data) {
        if (!this.isConfigured()) {
            throw new Error('Google Sheets not configured');
        }

        try {
            // Handle special case for categories (both singular and plural)
            let action;
            if (sheetName === 'categories') {
                action = 'addCategorie'; // Use the singular form for compatibility
            } else {
                action = `add${sheetName.charAt(0).toUpperCase() + sheetName.slice(1, -1)}`;
            }
            
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: action,
                    ...data
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Clear cache for this sheet
            this.clearCacheForSheet(sheetName);
            
            console.log(`Data added to ${sheetName}:`, result);
            return result;
            
        } catch (error) {
            console.error(`Error adding data to ${sheetName}:`, error);
            throw error;
        }
    }

    // Update data in sheet
    async updateSheetData(sheetName, data) {
        if (!this.isConfigured()) {
            throw new Error('Google Sheets not configured');
        }

        try {
            const action = `update${sheetName.charAt(0).toUpperCase() + sheetName.slice(1, -1)}`;
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: action,
                    ...data
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Clear cache for this sheet
            this.clearCacheForSheet(sheetName);
            
            console.log(`Data updated in ${sheetName}:`, result);
            return result;
            
        } catch (error) {
            console.error(`Error updating data in ${sheetName}:`, error);
            throw error;
        }
    }

    // Delete data from sheet
    async deleteSheetData(sheetName, data) {
        if (!this.isConfigured()) {
            throw new Error('Google Sheets not configured');
        }

        try {
            const action = `delete${sheetName.charAt(0).toUpperCase() + sheetName.slice(1, -1)}`;
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: action,
                    ...data
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Clear cache for this sheet
            this.clearCacheForSheet(sheetName);
            
            console.log(`Data deleted from ${sheetName}:`, result);
            return result;
            
        } catch (error) {
            console.error(`Error deleting data from ${sheetName}:`, error);
            throw error;
        }
    }

    // Clear cache for specific sheet
    clearCacheForSheet(sheetName) {
        Object.keys(this.cache).forEach(key => {
            if (key.startsWith(sheetName + '_')) {
                delete this.cache[key];
            }
        });
    }

    // Clear all cache
    clearCache() {
        this.cache = {};
    }

    // Test connection
    async testConnection() {
        if (!this.isConfigured()) {
            return { success: false, error: 'Google Sheets not configured' };
        }

        try {
            console.log('Testing connection to:', this.webAppUrl);
            const url = `${this.webAppUrl}?action=getProducts`;
            console.log('Test URL:', url);
            
            // Test with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error text:', errorText);
                
                // Try to parse error as JSON
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    // Not JSON, use raw text
                }
                
                const errorMessage = errorData?.error || errorText || `HTTP ${response.status}: ${response.statusText}`;
                return { success: false, error: errorMessage };
            }
            
            const responseText = await response.text();
            console.log('Raw test response:', responseText);
            
            let data;
            try {
                const parsedResponse = JSON.parse(responseText);
                data = parsedResponse.success ? parsedResponse.data : parsedResponse;
            } catch (parseError) {
                console.warn('Response is not JSON, treating as raw data');
                data = responseText;
            }
            
            console.log('Test response data:', data);
            
            return { 
                success: true, 
                message: 'Connection successful',
                data: data
            };
            
        } catch (error) {
            console.error('Connection test error:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                webAppUrl: this.webAppUrl
            });
            
            // Check for specific error types
            if (error.name === 'AbortError') {
                return { success: false, error: 'Connection timeout - please check your internet connection and Google Apps Script URL' };
            } else if (error.message.includes('fetch')) {
                return { success: false, error: 'Network error - please check your internet connection and CORS settings' };
            } else if (error.message.includes('CORS')) {
                return { success: false, error: 'CORS error - please check Google Apps Script permissions. Make sure the Web App is deployed with "Anyone" access.' };
            } else {
                return { success: false, error: error.message };
            }
        }
    }
}

// Data Sync Manager
class DataSyncManager {
    constructor() {
        this.sheetsAPI = new GoogleSheetsAPI();
        this.lastSyncTime = null;
        this.syncInterval = null;
        this.isUsingGoogleSheets = false;
    }

    // Check if Google Sheets is available
    async checkGoogleSheetsAvailability() {
        const test = await this.sheetsAPI.testConnection();
        this.isUsingGoogleSheets = test.success;
        
        if (test.success) {
            console.log('Google Sheets is available');
        } else {
            console.log('Google Sheets not available, using mock data');
        }
        
        return this.isUsingGoogleSheets;
    }

    // Start auto-sync
    startAutoSync(intervalMinutes = 5) {
        this.stopAutoSync();
        
        this.syncInterval = setInterval(async () => {
            if (this.isUsingGoogleSheets) {
                await this.syncAllData();
            }
        }, intervalMinutes * 60 * 1000);
        
        console.log(`Auto-sync started every ${intervalMinutes} minutes`);
    }

    // Stop auto-sync
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('Auto-sync stopped');
        }
    }

    // Sync all data
    async syncAllData() {
        try {
            console.log('Starting data sync...');
            
            // Check availability first
            await this.checkGoogleSheetsAvailability();
            
            if (!this.isUsingGoogleSheets) {
                console.log('Using mock data - no sync needed');
                return true;
            }
            
            // Sync all sheets
            await Promise.all([
                this.syncProducts(),
                this.syncCategories(),
                this.syncOrders(),
                this.syncCustomers(),
                this.syncPromotions()
            ]);
            
            // Update last sync time
            this.lastSyncTime = new Date();
            
            console.log('Data sync completed successfully');
            return true;
        } catch (error) {
            console.error('Error during data sync:', error);
            return false;
        }
    }

    // Sync products
    async syncProducts() {
        try {
            const sheetData = await this.sheetsAPI.getSheetData(SHEET_NAMES.PRODUCTS);
            
            // Convert to product objects matching the schema
            const products = sheetData.map((row, index) => ({
                id: index + 1,
                product_id: row[0] || '',
                category_id: row[1] || '',
                product_name: row[2] || '',
                quantity_per_pack: parseInt(row[3]) || 1,
                price: parseFloat(row[4]) || 0,
                image_url: row[5] || '',
                status: row[6] || 'active',
                description: row[7] || ''
            }));
            
            // Update global products
            window.products = products;
            
            // Update UI if on products page
            if (typeof displayProducts === 'function') {
                displayProducts();
            }
            
            console.log(`Synced ${products.length} products`);
            return products;
        } catch (error) {
            console.error('Error syncing products:', error);
            throw error;
        }
    }

    // Sync categories
    async syncCategories() {
        try {
            const sheetData = await this.sheetsAPI.getSheetData(SHEET_NAMES.CATEGORIES);
            
            // Convert to category objects
            const categories = sheetData.map((row, index) => ({
                id: index + 1,
                category_id: row.category_id || row[0] || '',
                category_name: row.category_name || row[1] || '',
                image_url: row.image_url || row[2] || ''
            }));
            
            // Update global categories
            window.categories = categories;
            
            console.log(`Synced ${categories.length} categories`);
            return categories;
        } catch (error) {
            console.error('Error syncing categories:', error);
            throw error;
        }
    }

    // Sync orders
    async syncOrders() {
        try {
            const sheetData = await this.sheetsAPI.getSheetData(SHEET_NAMES.ORDERS);
            
            // Convert to order objects
            const orders = sheetData.map((row, index) => ({
                id: index + 1,
                order_id: row[0] || '',
                customer_id: row[1] || '',
                total_price: parseFloat(row[2]) || 0,
                order_status: row[3] || 'pending',
                order_date: row[4] || new Date().toISOString().split('T')[0]
            }));
            
            // Update global orders
            window.orders = orders;
            
            // Update UI if on dashboard
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            }
            
            console.log(`Synced ${orders.length} orders`);
            return orders;
        } catch (error) {
            console.error('Error syncing orders:', error);
            throw error;
        }
    }

    // Sync customers
    async syncCustomers() {
        try {
            const sheetData = await this.sheetsAPI.getSheetData(SHEET_NAMES.CUSTOMERS);
            
            // Convert to customer objects
            const customers = sheetData.map((row, index) => ({
                id: index + 1,
                customer_id: row[0] || '',
                name: row[1] || '',
                phone: row[2] || '',
                address: row[3] || '',
                email: row[4] || '',
                created_date: row[5] || new Date().toISOString().split('T')[0],
                is_active: row[6] === 'true'
            }));
            
            // Update global customers
            window.customers = customers;
            
            console.log(`Synced ${customers.length} customers`);
            return customers;
        } catch (error) {
            console.error('Error syncing customers:', error);
            throw error;
        }
    }

    // Sync promotions
    async syncPromotions() {
        try {
            const sheetData = await this.sheetsAPI.getSheetData(SHEET_NAMES.PROMOTIONS);
            
            // Convert to promotion objects
            const promotions = sheetData.map((row, index) => ({
                id: index + 1,
                promotion_id: row[0] || '',
                title: row[1] || '',
                subtitle: row[2] || '',
                image_url: row[3] || ''
            }));
            
            // Update global promotions
            window.promotions = promotions;
            
            console.log(`Synced ${promotions.length} promotions`);
            return promotions;
        } catch (error) {
            console.error('Error syncing promotions:', error);
            throw error;
        }
    }

    // Add order with items
    async addOrderWithItems(orderData, orderItems) {
        try {
            // Add main order
            await this.sheetsAPI.addSheetData(SHEET_NAMES.ORDERS, orderData);
            
            // Add order items
            for (const item of orderItems) {
                await this.sheetsAPI.addSheetData(SHEET_NAMES.ORDER_ITEMS, item);
            }
            
            // Refresh data
            await this.syncOrders();
            
            console.log('Order and items added successfully');
            return true;
        } catch (error) {
            console.error('Error adding order with items:', error);
            throw error;
        }
    }

    // Update order status
    async updateOrderStatus(orderId, newStatus) {
        try {
            await this.sheetsAPI.updateSheetData(SHEET_NAMES.ORDERS, {
                order_id: orderId,
                order_status: newStatus
            });
            
            // Refresh data
            await this.syncOrders();
            
            console.log(`Order ${orderId} status updated to ${newStatus}`);
            return true;
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    }
}

// Global sync manager instance
window.dataSyncManager = new DataSyncManager();

// Enhanced sync functions for the dashboard
async function syncGoogleSheets() {
    try {
        showLoadingIndicator();
        
        // Check if Google Sheets is configured
        if (!window.dataSyncManager.sheetsAPI.isConfigured()) {
            showAlert('warning', 'يرجى إعداد Google Sheets أولاً');
            hideLoadingIndicator();
            return;
        }
        
        // First test the connection
        const testResult = await window.dataSyncManager.sheetsAPI.testConnection();
        if (!testResult.success) {
            showAlert('danger', 'فشل الاتصال بـ Google Sheets: ' + testResult.error);
            hideLoadingIndicator();
            return;
        }
        
        const success = await window.dataSyncManager.syncAllData();
        
        if (success) {
            showAlert('success', 'تمت المزامنة بنجاح');
            if (typeof refreshData === 'function') {
                refreshData();
            }
        } else {
            showAlert('danger', 'فشلت المزامنة');
        }
    } catch (error) {
        console.error('Sync error:', error);
        showAlert('danger', 'حدث خطأ أثناء المزامنة: ' + error.message);
    } finally {
        hideLoadingIndicator();
    }
}

// Test Google Sheets connection
async function testGoogleSheetsConnection() {
    try {
        showLoadingIndicator();
        
        const result = await window.dataSyncManager.sheetsAPI.testConnection();
        
        if (result.success) {
            showAlert('success', 'اتصال ناجح بـ Google Sheets!');
            console.log('Test data:', result.data);
            
            // Save successful connection
            localStorage.setItem('googleSheetsConnected', 'true');
        } else {
            showAlert('danger', 'فشل الاتصال: ' + result.error);
            localStorage.setItem('googleSheetsConnected', 'false');
        }
    } catch (error) {
        console.error('Test connection error:', error);
        showAlert('danger', 'حدث خطأ أثناء اختبار الاتصال: ' + error.message);
        localStorage.setItem('googleSheetsConnected', 'false');
    } finally {
        hideLoadingIndicator();
    }
}

// Loading indicator functions
function showLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'loadingIndicator';
    indicator.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
    indicator.style.backgroundColor = 'rgba(0,0,0,0.5)';
    indicator.style.zIndex = '9999';
    indicator.innerHTML = `
        <div class="bg-white p-4 rounded-3 text-center">
            <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <h5>جاري المزامنة...</h5>
            <p class="text-muted">يرجى الانتظار</p>
        </div>
    `;
    document.body.appendChild(indicator);
}

function hideLoadingIndicator() {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Initialize Google Sheets integration when page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Check Google Sheets availability
    await window.dataSyncManager.checkGoogleSheetsAvailability();
    
    // Start auto-sync if Google Sheets is available
    if (window.dataSyncManager.isUsingGoogleSheets) {
        window.dataSyncManager.startAutoSync(5);
        console.log('Auto-sync started with Google Sheets');
    } else {
        console.log('Using mock data - no auto-sync');
    }
});

// Export functions for global use
window.syncGoogleSheets = syncGoogleSheets;
window.testGoogleSheetsConnection = testGoogleSheetsConnection;
window.showLoadingIndicator = showLoadingIndicator;
window.hideLoadingIndicator = hideLoadingIndicator;
