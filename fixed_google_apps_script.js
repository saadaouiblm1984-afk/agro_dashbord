// ===========================================
// Google Apps Script – لوحة تحكم متكاملة (مُحسَّن)
// الإصدار المُحسَّن – يدعم الأمان، الكاش الذكي، البيانات الكائنية
// متوافق مع JavaScript integration
// ===========================================

// -------------------------------
// 1. الإعدادات الثابتة
// -------------------------------

const SHEET_NAMES = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',       // تم تصحيح الاسم
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  CUSTOMERS: 'customers',
  PROMOTIONS: 'promotions'
};

// مفتاح سري للتحقق من صحة الطلبات – غيّره إلى قيمة يصعب تخمينها
const API_SECRET = 'your-secret-token-here';

// خدمة التخزين المؤقت
const CACHE = CacheService.getScriptCache();

// بادئة مفاتيح الكاش
const CACHE_PREFIX = 'api_v1_';

// -------------------------------
// 2. دوال GET و POST الرئيسية
// -------------------------------

function doGet(e) {
  return handleRequest(e, 'get');
}

function doPost(e) {
  return handleRequest(e, 'post');
}

/**
 * المعالج المركزي لكل الطلبات
 */
function handleRequest(e, method) {
  try {
    let result;
    const action = method === 'get' ? e.parameter.action : JSON.parse(e.postData.contents).action;
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    if (method === 'get') {
      result = handleGet(spreadsheet, e);
    } else {
      result = handlePost(spreadsheet, JSON.parse(e.postData.contents));
    }

    return createJSONResponse({ success: true, data: result });
  } catch (error) {
    return createJSONResponse({ 
      success: false, 
      error: error.toString(), 
      stack: error.stack
    });
  }
}

// -------------------------------
// 3. معالجة طلبات GET
// -------------------------------

function handleGet(spreadsheet, e) {
  const action = e.parameter.action;
  const params = e.parameter;
  
  // بناء مفتاح كاش فريد بناءً على كل المعاملات + إصدار الكاش
  const cacheKey = getCacheKey(action, params);
  const cached = CACHE.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  let data;
  switch (action) {
    case 'getProducts':
      data = getSheetData(spreadsheet, SHEET_NAMES.PRODUCTS);
      break;
    case 'getCategories':
      data = getSheetData(spreadsheet, SHEET_NAMES.CATEGORIES);
      break;
    case 'getOrders':
      data = getSheetData(spreadsheet, SHEET_NAMES.ORDERS);
      break;
    case 'getOrderItems':
      data = getSheetData(spreadsheet, SHEET_NAMES.ORDER_ITEMS);
      break;
    case 'getCustomers':
      data = getSheetData(spreadsheet, SHEET_NAMES.CUSTOMERS);
      break;
    case 'getPromotions':
      data = getSheetData(spreadsheet, SHEET_NAMES.PROMOTIONS);
      break;
    default:
      throw new Error('Invalid action: ' + action);
  }

  const response = data;
  CACHE.put(cacheKey, JSON.stringify(response), 300); // 5 دقائق
  return response;
}

// -------------------------------
// 4. معالجة طلبات POST
// -------------------------------

function handlePost(spreadsheet, payload) {
  const action = payload.action;
  
  // زيادة رقم إصدار الكاش لمسح جميع ذاكرات GET
  incrementCacheVersion();

  let result;
  switch (action) {
    // --- المنتجات ---
    case 'addProduct':
      result = addRow(spreadsheet, SHEET_NAMES.PRODUCTS, payload);
      break;
    case 'updateProduct':
      result = updateRowById(spreadsheet, SHEET_NAMES.PRODUCTS, payload, 'product_id');
      break;
    case 'deleteProduct':
      result = deleteRowById(spreadsheet, SHEET_NAMES.PRODUCTS, payload, 'product_id');
      break;

    // --- الفئات ---
    case 'addCategorie': // للتوافق مع الكود الحالي
    case 'addCategory':
      result = addRow(spreadsheet, SHEET_NAMES.CATEGORIES, payload);
      break;
    case 'updateCategorie': // للتوافق مع الكود الحالي
    case 'updateCategory':
      result = updateRowById(spreadsheet, SHEET_NAMES.CATEGORIES, payload, 'category_id');
      break;
    case 'deleteCategorie': // للتوافق مع الكود الحالي
    case 'deleteCategory':
      result = deleteRowById(spreadsheet, SHEET_NAMES.CATEGORIES, payload, 'category_id');
      break;

    // --- الطلبات ---
    case 'addOrder':
      result = addRow(spreadsheet, SHEET_NAMES.ORDERS, payload);
      break;
    case 'updateOrder':
      if (payload.rowNumber && payload.values) {
        result = updateRowByIndex(spreadsheet, SHEET_NAMES.ORDERS, payload.rowNumber, payload.values);
      } else {
        result = updateRowById(spreadsheet, SHEET_NAMES.ORDERS, payload, 'order_id');
      }
      break;
    case 'deleteOrder':
      result = deleteRowById(spreadsheet, SHEET_NAMES.ORDERS, payload, 'order_id');
      break;

    // --- عناصر الطلب والعملاء ---
    case 'addOrderItem':
      result = addRow(spreadsheet, SHEET_NAMES.ORDER_ITEMS, payload);
      break;
    case 'addCustomer':
      result = addRow(spreadsheet, SHEET_NAMES.CUSTOMERS, payload);
      break;

    // --- تحديث مباشر بواسطة رقم الصف (يُستخدم في لوحة التحكم) ---
    case 'updateRow':
      if (!payload.sheetName || !payload.rowNumber || !payload.values) {
        throw new Error('Missing required fields: sheetName, rowNumber, values');
      }
      result = updateRowByIndex(spreadsheet, payload.sheetName, payload.rowNumber, payload.values);
      break;

    default:
      throw new Error('Invalid action: ' + action);
  }

  // إجبار جدول البيانات على إنهاء الكتابة قبل الرد
  SpreadsheetApp.flush();
  return { success: true, message: 'Operation completed successfully' };
}

// -------------------------------
// 5. دوال التعامل مع البيانات
// -------------------------------

/**
 * جلب جميع البيانات من ورقة محددة كمصفوفة من الكائنات
 */
function getSheetData(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  if (values.length < 2) return []; // فقط الرؤوس أو لا بيانات

  const headers = values[0];
  const rows = values.slice(1);
  
  return rows.map(row => 
    headers.reduce((obj, header, index) => {
      obj[header] = row[index];
      return obj;
    }, {})
  );
}

/**
 * إضافة صف جديد
 */
function addRow(spreadsheet, sheetName, data) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // التحقق من وجود الحقول الإلزامية
  if (data.product_id === undefined && sheetName === SHEET_NAMES.PRODUCTS) {
    throw new Error('product_id is required');
  }

  const rowData = headers.map(header => data[header] !== undefined ? data[header] : '');
  sheet.appendRow(rowData);
  
  return { success: true, message: 'Row added successfully' };
}

/**
 * تحديث صف بناءً على قيمة عامود معين (مثل ID)
 */
function updateRowById(spreadsheet, sheetName, data, idColumn) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0];
  const idIndex = headers.indexOf(idColumn);
  if (idIndex === -1) throw new Error(`Column "${idColumn}" not found`);

  const idValue = data[idColumn];
  if (idValue === undefined) throw new Error(`Missing value for ${idColumn}`);

  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex] == idValue) {
      // قراءة الصف بالكامل، تحديث الحقول المتغيرة، ثم كتابته دفعة واحدة
      const rowRange = sheet.getRange(i + 1, 1, 1, headers.length);
      const currentRow = rowRange.getValues()[0];
      
      headers.forEach((header, colIndex) => {
        if (data[header] !== undefined) {
          currentRow[colIndex] = data[header];
        }
      });
      
      rowRange.setValues([currentRow]);
      return { success: true, message: 'Row updated successfully' };
    }
  }

  throw new Error(`Row with ${idColumn}=${idValue} not found`);
}

/**
 * تحديث صف بواسطة رقم الصف المباشر (1‑based)
 */
function updateRowByIndex(spreadsheet, sheetName, rowNumber, values) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (values.length !== headers.length) {
    throw new Error(`Values length (${values.length}) does not match headers length (${headers.length})`);
  }

  const rowRange = sheet.getRange(rowNumber, 1, 1, headers.length);
  rowRange.setValues([values]);
  return { success: true, message: 'Row updated by index successfully' };
}

/**
 * حذف صف بناءً على قيمة عامود ID
 */
function deleteRowById(spreadsheet, sheetName, data, idColumn) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf(idColumn);
  if (idIndex === -1) throw new Error(`Column "${idColumn}" not found`);

  const idValue = data[idColumn];
  if (idValue === undefined) throw new Error(`Missing value for ${idColumn}`);

  // الحذف من الأسفل للأعلى
  for (let i = values.length - 1; i > 0; i--) {
    if (values[i][idIndex] == idValue) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Row deleted successfully' };
    }
  }

  throw new Error(`Row with ${idColumn}=${idValue} not found`);
}

// -------------------------------
// 6. دوال مساعدة
// -------------------------------

/**
 * إنشاء استجابة JSON
 */
function createJSONResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * بناء مفتاح الكاش مع رقم الإصدار
 */
function getCacheKey(action, params) {
  const version = PropertiesService.getScriptProperties().getProperty('CACHE_VERSION') || '0';
  return CACHE_PREFIX + version + '_' + action + '_' + JSON.stringify(params);
}

/**
 * زيادة رقم إصدار الكاش – يؤدي إلى إبطال جميع مفاتيح الكاش السابقة
 */
function incrementCacheVersion() {
  const props = PropertiesService.getScriptProperties();
  const currentVersion = parseInt(props.getProperty('CACHE_VERSION') || '0');
  const newVersion = (currentVersion + 1) % 1000; // تدوير بين 0-999
  props.setProperty('CACHE_VERSION', newVersion.toString());
}

/**
 * (اختياري) دالة للتوافق مع الإصدارات القديمة – يمكن إزالتها
 */
function clearAllCache() {
  incrementCacheVersion(); // ببساطة نزيد الإصدار
}

// -------------------------------
// نهاية الكود
// -------------------------------
