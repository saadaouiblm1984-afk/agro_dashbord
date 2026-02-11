// Simple Google Sheets Integration - Compatible with Ultra Simple Script
// This file handles the integration with the simple Google Apps Script

// Google Sheets Configuration
const GOOGLE_SHEETS_CONFIG = {
    WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbxKW4EELjDoMzYSZoBiu0G4HujyM2UKSdXyNtPK66owa2nTQ38ltAIgGfvL_vnMzpst3w/exec',
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
};

// Simple Google Sheets API Client
class SimpleGoogleSheetsAPI {
    constructor() {
        this.webAppUrl = GOOGLE_SHEETS_CONFIG.WEB_APP_URL;
        this.cache = {};
        console.log('Simple Google Sheets API initialized with URL:', this.webAppUrl);
    }

    // Check if configured
    isConfigured() {
        return this.webAppUrl && this.webAppUrl !== '';
    }

    // Get data from Google Sheets
    async getData() {
        if (!this.isConfigured()) {
            console.warn('Google Sheets not configured, using mock data');
            return this.getMockData();
        }

        const cacheKey = 'all_data';
        const cached = this.cache[cacheKey];
        
        if (cached && (Date.now() - cached.timestamp < GOOGLE_SHEETS_CONFIG.CACHE_DURATION)) {
            console.log('Using cached data');
            return cached.data;
        }

        try {
            console.log('Fetching data from Google Sheets...');
            const response = await fetch(this.webAppUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Received data:', result);
            
            if (result.status === 'success') {
                // Cache the result
                this.cache[cacheKey] = {
                    data: result.data,
                    timestamp: Date.now()
                };
                return result.data;
            } else {
                throw new Error(result.data || 'Unknown error');
            }
            
        } catch (error) {
            console.error('Error getting data from Google Sheets:', error);
            console.log('Falling back to mock data');
            return this.getMockData();
        }
    }

    // Get mock data for fallback
    getMockData() {
        return {
            products: [
                { id: 1, product_id: 'P001', product_name: 'منتج تجريبي', price: 100, status: 'active' },
                { id: 2, product_id: 'P002', product_name: 'منتج آخر', price: 200, status: 'active' }
            ],
            category: [
                { id: 1, category_id: 'C001', category_name: 'فئة 1' },
                { id: 2, category_id: 'C002', category_name: 'فئة 2' }
            ],
            orders: [
                { id: 1, order_id: 'O001', total_price: 300, order_status: 'pending' }
            ],
            order_items: [],
            customers: [
                { id: 1, customer_id: 'CU001', name: 'عميل تجريبي' }
            ],
            promotions: []
        };
    }

    // Post data to Google Sheets
    async postData(data) {
        if (!this.isConfigured()) {
            throw new Error('Google Sheets not configured');
        }

        try {
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('POST result:', result);
            
            // Clear cache
            this.clearCache();
            
            return result;
            
        } catch (error) {
            console.error('Error posting data to Google Sheets:', error);
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
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(this.webAppUrl, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
            }
            
            const result = await response.json();
            console.log('Test result:', result);
            
            if (result.status === 'success') {
                return { 
                    success: true, 
                    message: 'Connection successful',
                    data: result.data
                };
            } else {
                return { success: false, error: result.data || 'Unknown error' };
            }
            
        } catch (error) {
            console.error('Connection test error:', error);
            
            if (error.name === 'AbortError') {
                return { success: false, error: 'Connection timeout' };
            } else {
                return { success: false, error: error.message };
            }
        }
    }

    // Clear cache
    clearCache() {
        this.cache = {};
        console.log('Cache cleared');
    }
}

// Simple Data Manager
class SimpleDataManager {
    constructor() {
        this.sheetsAPI = new SimpleGoogleSheetsAPI();
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
            
            const data = await this.sheetsAPI.getData();
            
            // Update global variables
            window.products = data.products || [];
            window.categories = data.category || [];
            window.orders = data.orders || [];
            window.orderItems = data.order_items || [];
            window.customers = data.customers || [];
            window.promotions = data.promotions || [];
            
            this.lastSyncTime = new Date();
            
            console.log('Data loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
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
window.simpleDataManager = new SimpleDataManager();

// Simple sync function
async function syncSimpleGoogleSheets() {
    try {
        showLoadingIndicator();
        
        const success = await window.simpleDataManager.loadAllData();
        
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
async function testSimpleConnection() {
    try {
        showLoadingIndicator();
        
        const result = await window.simpleDataManager.sheetsAPI.testConnection();
        
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

// Loading indicator (simple version)
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

// Simple alert function
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
    console.log('Initializing Simple Google Sheets Integration...');
    
    // Load initial data
    await window.simpleDataManager.loadAllData();
    
    console.log('Simple Google Sheets Integration initialized');
});

// Export functions
window.syncSimpleGoogleSheets = syncSimpleGoogleSheets;
window.testSimpleConnection = testSimpleConnection;
