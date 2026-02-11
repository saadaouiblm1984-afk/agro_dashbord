// Working Google Sheets Integration - Compatible with Real Data Script
// This file handles the integration with the working Google Apps Script

// Google Sheets Configuration
const GOOGLE_SHEETS_CONFIG = {
    WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbxKW4EELjDoMzYSZoBiu0G4HujyM2UKSdXyNtPK66owa2nTQ38ltAIgGfvL_vnMzpst3w/exec',
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
};

// Working Google Sheets API Client
class WorkingGoogleSheetsAPI {
    constructor() {
        this.webAppUrl = GOOGLE_SHEETS_CONFIG.WEB_APP_URL;
        this.cache = {};
        console.log('Working Google Sheets API initialized with URL:', this.webAppUrl);
    }

    // Check if configured
    isConfigured() {
        return this.webAppUrl && this.webAppUrl !== '';
    }

    // Get specific sheet data
    async getSheetData(sheetName) {
        if (!this.isConfigured()) {
            console.warn('Google Sheets not configured, using mock data');
            return this.getMockSheetData(sheetName);
        }

        const cacheKey = sheetName;
        const cached = this.cache[cacheKey];
        
        if (cached && (Date.now() - cached.timestamp < GOOGLE_SHEETS_CONFIG.CACHE_DURATION)) {
            console.log(`Using cached data for ${sheetName}`);
            return cached.data;
        }

        try {
            console.log(`Fetching ${sheetName} from Google Sheets...`);
            const url = `${this.webAppUrl}?action=get${sheetName.charAt(0).toUpperCase() + sheetName.slice(1)}`;
            console.log('Request URL:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const responseText = await response.text();
            console.log(`Raw response for ${sheetName}:`, responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.warn(`Response is not JSON for ${sheetName}, treating as raw array`);
                // If it's not JSON, treat it as a simple array
                data = responseText;
            }
            
            console.log(`Processed data for ${sheetName}:`, data);
            
            // Cache the result
            this.cache[cacheKey] = {
                data: data,
                timestamp: Date.now()
            };
            
            return data;
            
        } catch (error) {
            console.error(`Error getting ${sheetName} from Google Sheets:`, error);
            console.log(`Falling back to mock data for ${sheetName}`);
            return this.getMockSheetData(sheetName);
        }
    }

    // Get all data
    async getAllData() {
        try {
            console.log('Getting all data from Google Sheets...');
            
            // Test connection first
            const testResult = await this.testConnection();
            if (!testResult.success) {
                console.log('Connection test failed, using mock data');
                return this.getMockAllData();
            }
            
            // Get all sheets data
            const [products, orders, categories, customers, orderItems, promotions] = await Promise.all([
                this.getSheetData('products').catch(err => {
                    console.error('Error getting products:', err);
                    return this.getMockSheetData('products');
                }),
                this.getSheetData('orders').catch(err => {
                    console.error('Error getting orders:', err);
                    return this.getMockSheetData('orders');
                }),
                this.getSheetData('categories').catch(err => {
                    console.error('Error getting categories:', err);
                    return this.getMockSheetData('categories');
                }),
                this.getSheetData('customers').catch(err => {
                    console.error('Error getting customers:', err);
                    return this.getMockSheetData('customers');
                }),
                this.getSheetData('orderItems').catch(err => {
                    console.error('Error getting orderItems:', err);
                    return this.getMockSheetData('orderItems');
                }),
                this.getSheetData('promotions').catch(err => {
                    console.error('Error getting promotions:', err);
                    return this.getMockSheetData('promotions');
                })
            ]);

            const result = {
                products,
                orders,
                categories,
                customers,
                orderItems,
                promotions
            };
            
            console.log('All data retrieved:', result);
            return result;
        } catch (error) {
            console.error('Error getting all data:', error);
            return this.getMockAllData();
        }
    }

    // Add data to sheet
    async addSheetData(sheetName, data) {
        if (!this.isConfigured()) {
            throw new Error('Google Sheets not configured');
        }

        try {
            const action = `add${sheetName.charAt(0).toUpperCase() + sheetName.slice(1, -1)}`;
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
            
            const result = await response.text();
            
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
            
            const result = await response.text();
            
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
            
            const result = await response.text();
            
            // Clear cache for this sheet
            this.clearCacheForSheet(sheetName);
            
            console.log(`Data deleted from ${sheetName}:`, result);
            return result;
            
        } catch (error) {
            console.error(`Error deleting data from ${sheetName}:`, error);
            throw error;
        }
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
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
            }
            
            const data = await response.json();
            console.log('Test response data:', data);
            
            return { 
                success: true, 
                message: 'Connection successful',
                data: data
            };
            
        } catch (error) {
            console.error('Connection test error:', error);
            
            if (error.name === 'AbortError') {
                return { success: false, error: 'Connection timeout' };
            } else {
                return { success: false, error: error.message };
            }
        }
    }

    // Get mock sheet data
    getMockSheetData(sheetName) {
        const mockData = {
            products: [
                ['P001', 'C001', 'منتج تجريبي', '10', '100', '', 'active', 'وصف المنتج'],
                ['P002', 'C002', 'منتج آخر', '5', '200', '', 'active', 'وصف آخر']
            ],
            categories: [
                ['C001', 'فئة 1', ''],
                ['C002', 'فئة 2', '']
            ],
            orders: [
                ['O001', 'CU001', 'عميل تجريبي', '0123456789', 'عنوان تجريبي', '300', 'pending', '2024-01-01', '']
            ],
            customers: [
                ['CU001', 'عميل تجريبي', '0123456789', 'عنوان تجريبي', 'email@test.com', '2024-01-01', 'true']
            ],
            orderItems: [],
            promotions: []
        };
        
        return mockData[sheetName] || [];
    }

    // Get mock all data
    getMockAllData() {
        return {
            products: this.getMockSheetData('products'),
            categories: this.getMockSheetData('categories'),
            orders: this.getMockSheetData('orders'),
            customers: this.getMockSheetData('customers'),
            orderItems: this.getMockSheetData('orderItems'),
            promotions: this.getMockSheetData('promotions')
        };
    }

    // Clear cache for specific sheet
    clearCacheForSheet(sheetName) {
        Object.keys(this.cache).forEach(key => {
            if (key.startsWith(sheetName)) {
                delete this.cache[key];
            }
        });
    }

    // Clear all cache
    clearCache() {
        this.cache = {};
        console.log('Cache cleared');
    }
}

// Working Data Manager
class WorkingDataManager {
    constructor() {
        this.sheetsAPI = new WorkingGoogleSheetsAPI();
        this.lastSyncTime = null;
        this.isUsingGoogleSheets = false;
    }

    // Check availability
    async checkAvailability() {
        const test = await this.sheetsAPI.testConnection();
        this.isUsingGoogleSheets = test.success;
        
        if (test.success) {
            console.log('Google Sheets is available');
        } else {
            console.log('Google Sheets not available, using mock data');
        }
        
        return this.isUsingGoogleSheets;
    }

    // Load all data
    async loadAllData() {
        try {
            console.log('Loading data...');
            
            await this.checkAvailability();
            
            const data = await this.sheetsAPI.getAllData();
            
            // Convert array data to objects
            window.products = this.convertToProducts(data.products);
            window.categories = this.convertToCategories(data.categories);
            window.orders = this.convertToOrders(data.orders);
            window.orderItems = this.convertToOrderItems(data.orderItems);
            window.customers = this.convertToCustomers(data.customers);
            window.promotions = this.convertToPromotions(data.promotions);
            
            this.lastSyncTime = new Date();
            
            console.log('Data loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    }

    // Convert products array to objects
    convertToProducts(productsArray) {
        return productsArray.map((row, index) => ({
            id: index + 1,
            product_id: row[0] || '',
            category_id: row[1] || '',
            product_name: row[2] || '',
            qtepack: row[3] || '',
            price: parseFloat(row[4]) || 0,
            image_url: row[5] || '',
            status: row[6] || 'active',
            description: row[7] || ''
        }));
    }

    // Convert categories array to objects
    convertToCategories(categoriesArray) {
        return categoriesArray.map((row, index) => ({
            id: index + 1,
            category_id: row[0] || '',
            category_name: row[1] || '',
            image_url: row[2] || ''
        }));
    }

    // Convert orders array to objects
    convertToOrders(ordersArray) {
        return ordersArray.map((row, index) => ({
            id: index + 1,
            order_id: row[0] || '',
            customer_id: row[1] || '',
            customer_name: row[2] || '',
            phone: row[3] || '',
            address: row[4] || '',
            total_price: parseFloat(row[5]) || 0,
            order_status: row[6] || 'pending',
            order_date: row[7] || '',
            items: row[8] || ''
        }));
    }

    // Convert order items array to objects
    convertToOrderItems(orderItemsArray) {
        return orderItemsArray.map((row, index) => ({
            id: index + 1,
            order_id: row[0] || '',
            product_id: row[1] || '',
            quantity: parseInt(row[2]) || 0,
            price: parseFloat(row[3]) || 0
        }));
    }

    // Convert customers array to objects
    convertToCustomers(customersArray) {
        return customersArray.map((row, index) => ({
            id: index + 1,
            customer_id: row[0] || '',
            name: row[1] || '',
            phone: row[2] || '',
            address: row[3] || '',
            email: row[4] || '',
            created_date: row[5] || '',
            is_active: row[6] === 'true'
        }));
    }

    // Convert promotions array to objects
    convertToPromotions(promotionsArray) {
        return promotionsArray.map((row, index) => ({
            id: index + 1,
            promotion_id: row[0] || '',
            title: row[1] || '',
            subtitle: row[2] || '',
            image_url: row[3] || ''
        }));
    }

    // Get specific data
    getProducts() {
        return window.products || [];
    }

    getCategories() {
        return window.categories || [];
    }

    getOrders() {
        return window.orders || [];
    }

    getCustomers() {
        return window.customers || [];
    }

    getPromotions() {
        return window.promotions || [];
    }
}

// Global instance
window.workingDataManager = new WorkingDataManager();

// Working sync function
async function syncWorkingGoogleSheets() {
    try {
        showLoadingIndicator();
        
        const success = await window.workingDataManager.loadAllData();
        
        if (success) {
            showAlert('success', 'تم تحميل البيانات بنجاح');
            if (typeof refreshData === 'function') {
                refreshData();
            }
        } else {
            showAlert('danger', 'فشل تحميل البيانات');
        }
    } catch (error) {
        console.error('Sync error:', error);
        showAlert('danger', 'حدث خطأ: ' + error.message);
    } finally {
        hideLoadingIndicator();
    }
}

// Test connection
async function testWorkingConnection() {
    try {
        showLoadingIndicator();
        
        const result = await window.workingDataManager.sheetsAPI.testConnection();
        
        if (result.success) {
            showAlert('success', 'اتصال ناجح بـ Google Sheets!');
            console.log('Test data:', result.data);
        } else {
            showAlert('danger', 'فشل الاتصال: ' + result.error);
        }
    } catch (error) {
        console.error('Test error:', error);
        showAlert('danger', 'حدث خطأ أثناء الاختبار');
    } finally {
        hideLoadingIndicator();
    }
}

// Loading indicator
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
            <h5>جاري التحميل...</h5>
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

// Alert function
function showAlert(type, message) {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3" 
             style="z-index: 10000; min-width: 300px;" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', alertHtml);
    
    setTimeout(() => {
        const alert = document.querySelector('.alert');
        if (alert) alert.remove();
    }, 5000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing Working Google Sheets Integration...');
    
    // Load initial data
    await window.workingDataManager.loadAllData();
    
    console.log('Working Google Sheets Integration initialized');
});

// Export functions
window.syncWorkingGoogleSheets = syncWorkingGoogleSheets;
window.testWorkingConnection = testWorkingConnection;
