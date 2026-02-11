// Ultra Simple Working Script - Compatible with Flutter
function doGet(e) {
  try {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "data": {
        "products": [],
        "category": [],
        "orders": [],
        "order_items": [],
        "customers": [],
        "promotions": []
      },
      "timestamp": new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error",
      "data": error.toString(),
      "timestamp": new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "data": "POST received",
      "timestamp": new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error",
      "data": error.toString(),
      "timestamp": new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
