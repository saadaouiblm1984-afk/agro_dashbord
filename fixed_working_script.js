// Fixed Working Script - Handles undefined parameters
function doGet(e) {
  // Handle undefined e parameter
  if (!e) {
    e = { parameter: {} };
  }
  
  if (!e.parameter) {
    e.parameter = {};
  }
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const action = e.parameter.action || 'getProducts'; // Default action
  
  try {
    switch(action) {
      case 'getProducts':
        return getSheetData('products');
      case 'getOrders':
        return getSheetData('orders');
      case 'getCategories':
        return getSheetData('categories');
      case 'getCustomers':
        return getSheetData('customers');
      case 'getOrderItems':
        return getSheetData('order_items');
      case 'getPromotions':
        return getSheetData('promotions');
      default:
        return ContentService.createTextOutput(JSON.stringify({
          error: 'Invalid action: ' + action,
          availableActions: ['getProducts', 'getOrders', 'getCategories', 'getCustomers', 'getOrderItems', 'getPromotions']
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // Handle undefined e parameter
  if (!e) {
    e = { parameter: {}, postData: { contents: '{}' } };
  }
  
  if (!e.parameter) {
    e.parameter = {};
  }
  
  if (!e.postData) {
    e.postData = { contents: '{}' };
  }
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const action = e.parameter.action || 'addProduct'; // Default action
  
  let data;
  try {
    data = JSON.parse(e.postData.contents || '{}');
  } catch(parseError) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Invalid JSON in postData: ' + parseError.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    switch(action) {
      case 'addProduct':
        return addRow('products', data);
      case 'addOrder':
        return addRow('orders', data);
      case 'addCategory':
        return addRow('categories', data);
      case 'addCustomer':
        return addRow('customers', data);
      case 'updateProduct':
        return updateRow('products', data);
      case 'updateOrder':
        return updateRow('orders', data);
      case 'deleteProduct':
        return deleteRow('products', data);
      case 'deleteOrder':
        return deleteRow('orders', data);
      default:
        return ContentService.createTextOutput(JSON.stringify({
          error: 'Invalid action: ' + action,
          availableActions: ['addProduct', 'addOrder', 'addCategory', 'addCustomer', 'updateProduct', 'updateOrder', 'deleteProduct', 'deleteOrder']
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetData(sheetName) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        error: `Sheet "${sheetName}" not found`,
        availableSheets: getAvailableSheets()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Skip header row and convert to objects
    if (data.length < 2) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    const objects = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] !== null ? row[index].toString() : '';
      });
      return obj;
    });
    
    return ContentService.createTextOutput(JSON.stringify(objects))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      sheetName: sheetName
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function addRow(sheetName, data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        error: `Sheet "${sheetName}" not found`
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get headers to determine column order
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Create row array in the correct order
    const rowData = headers.map(header => {
      return data[header] !== undefined ? data[header] : '';
    });
    
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Row added successfully',
      sheetName: sheetName,
      data: rowData
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      sheetName: sheetName
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateRow(sheetName, data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        error: `Sheet "${sheetName}" not found`
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (!data.row || !data.values) {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Missing required fields: row, values'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const range = sheet.getRange(data.row, 1, 1, data.values.length);
    range.setValues([data.values]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Row updated successfully',
      sheetName: sheetName,
      row: data.row
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      sheetName: sheetName
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteRow(sheetName, data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        error: `Sheet "${sheetName}" not found`
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (!data.row) {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Missing required field: row'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    sheet.deleteRow(data.row);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Row deleted successfully',
      sheetName: sheetName,
      row: data.row
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      sheetName: sheetName
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper function to get available sheets
function getAvailableSheets() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    return spreadsheet.getSheets().map(sheet => sheet.getName());
  } catch(error) {
    return ['Error getting sheets: ' + error.toString()];
  }
}

// Test function for debugging
function testFunction() {
  try {
    const result = getSheetData('products');
    Logger.log('Test result: ' + result.getContent());
    return result;
  } catch(error) {
    Logger.log('Test error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
