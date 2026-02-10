#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple Python Server for Admin Dashboard
Works without Maven or Java installation
"""

from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import json
import random
import datetime
from dataclasses import dataclass, asdict
from typing import List, Dict, Any

app = Flask(__name__)
CORS(app)

# Data Models
@dataclass
class Product:
    id: int
    product_id: str
    category_id: str
    product_name: str
    quantity_per_pack: int
    price: float
    image_url: str
    status: str
    description: str

@dataclass
class Order:
    id: int
    order_id: str
    customer_id: str
    customer_name: str
    phone: str
    address: str
    total_price: float
    order_status: str
    order_date: str
    items: str

# Sample Data
def generate_sample_products():
    products = [
        Product(1, "PRD001", "electronics", "لابتوب Dell", 1, 45000.0, 
                "https://picsum.photos/seed/laptop1/200/200.jpg", "active", "لابتوب عالي الأداء"),
        Product(2, "PRD002", "electronics", "هاتف Samsung", 1, 25000.0, 
                "https://picsum.photos/seed/phone1/200/200.jpg", "active", "هاتف ذكي متطور"),
        Product(3, "PRD003", "clothing", "تيشيرت رجالي", 1, 1500.0, 
                "https://picsum.photos/seed/shirt1/200/200.jpg", "active", "تيشيرت قطن"),
        Product(4, "PRD004", "clothing", "جينز", 1, 3500.0, 
                "https://picsum.photos/seed/jeans1/200/200.jpg", "active", "بنطال جينز"),
        Product(5, "PRD005", "food", "قهوة", 1, 800.0, 
                "https://picsum.photos/seed/coffee1/200/200.jpg", "active", "قهوة عربية"),
        Product(6, "PRD006", "food", "شاي", 1, 500.0, 
                "https://picsum.photos/seed/tea1/200/200.jpg", "active", "شاي أخضر"),
        Product(7, "PRD007", "books", "رواية عربية", 1, 1200.0, 
                "https://picsum.photos/seed/book1/200/200.jpg", "active", "رواية أدبية"),
        Product(8, "PRD008", "books", "كتاب برمجة", 1, 3500.0, 
                "https://picsum.photos/seed/book2/200/200.jpg", "active", "كتاب تقني"),
    ]
    return products

def generate_sample_orders():
    orders = [
        Order(1, "ORD001", "CUST001", "أحمد محمد", "0551234567", "الجزائر العاصمة", 
              45000.0, "pending", "2024-01-15", "لابتوب Dell x1"),
        Order(2, "ORD002", "CUST002", "فاطمة علي", "0559876543", "وهران", 
              25000.0, "processing", "2024-01-14", "هاتف Samsung x1"),
        Order(3, "ORD003", "CUST003", "محمد سعيد", "0554567890", "قسنطينة", 
              5000.0, "shipped", "2024-01-13", "تيشيرت x2, جينز x1"),
        Order(4, "ORD004", "CUST004", "خديجة عمر", "0553216549", "البليدة", 
              1300.0, "delivered", "2024-01-12", "قهوة x1, شاي x1"),
    ]
    return orders

# Global Data
products = generate_sample_products()
orders = generate_sample_orders()

# Routes
@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/admin')
def admin():
    return render_template('dashboard.html')

@app.route('/admin/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/admin/products')
def products_page():
    return render_template('products.html')

@app.route('/admin/cart')
def cart_page():
    return render_template('cart.html')

@app.route('/admin/orders')
def orders_page():
    return render_template('orders.html')

# API Routes
@app.route('/admin/api/products')
def get_products():
    return jsonify([asdict(p) for p in products])

@app.route('/admin/api/orders')
def get_orders():
    return jsonify([asdict(o) for o in orders])

@app.route('/admin/api/stats')
def get_stats():
    stats = {
        "totalProducts": len(products),
        "totalOrders": len(orders),
        "pendingOrders": len([o for o in orders if o.order_status == "pending"]),
        "totalRevenue": sum(o.total_price for o in orders if o.order_status != "cancelled"),
        "recentOrders": [asdict(o) for o in orders[:5]]
    }
    return jsonify(stats)

@app.route('/admin/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    global products
    products = [p for p in products if p.id != product_id]
    return jsonify({"status": "success", "message": "Product deleted"})

@app.route('/admin/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    new_order = Order(
        id=len(orders) + 1,
        order_id=f"ORD{len(orders) + 1:03d}",
        customer_id=f"CUST{len(orders) + 1:03d}",
        customer_name=data.get('customerName', ''),
        phone=data.get('customerPhone', ''),
        address=data.get('customerAddress', ''),
        total_price=data.get('totalAmount', 0),
        order_status='pending',
        order_date=datetime.datetime.now().strftime('%Y-%m-%d'),
        items=json.dumps(data.get('items', []))
    )
    orders.append(new_order)
    return jsonify({"status": "success", "message": "Order created", "order": asdict(new_order)})

@app.route('/admin/sync/google-sheets', methods=['POST'])
def sync_google_sheets():
    return jsonify({"status": "success", "message": "Data synced successfully"})

# Static files
@app.route('/webjars/<path:filename>')
def webjars(filename):
    # For simplicity, we'll redirect to CDN
    if filename.startswith('bootstrap/'):
        return f'<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">'
    elif filename.startswith('font-awesome/'):
        return f'<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" rel="stylesheet">'
    elif filename.startswith('chart.js/'):
        return f'<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.min.js"></script>'
    return "File not found", 404

if __name__ == '__main__':
    print("🚀 Starting Admin Dashboard Server...")
    print("📊 Dashboard: http://localhost:8080")
    print("📦 Products: http://localhost:8080/admin/products")
    print("🛒 Cart: http://localhost:8080/admin/cart")
    print("📋 Orders: http://localhost:8080/admin/orders")
    print("🎯 Server running on http://localhost:8080")
    print("🌟 Press Ctrl+C to stop")
    
    app.run(host='0.0.0.0', port=8080, debug=True)
