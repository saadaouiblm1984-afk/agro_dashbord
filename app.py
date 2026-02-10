#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple Python Flask Server for Admin Dashboard
Works without Maven or Java installation
"""

from flask import Flask, render_template, jsonify, request, send_from_directory
import json
import os
from datetime import datetime

app = Flask(__name__, static_folder='.', static_url_path='')

# Load mock data from JSON files
def load_mock_data(filename):
    try:
        with open(f'api/admin/api/{filename}.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/admin')
def admin():
    return send_from_directory('.', 'index.html')

@app.route('/admin/dashboard')
def dashboard():
    return send_from_directory('.', 'index.html')

@app.route('/admin/products')
def products_page():
    return send_from_directory('.', 'index.html')

@app.route('/admin/cart')
def cart_page():
    return send_from_directory('.', 'index.html')

@app.route('/admin/orders')
def orders_page():
    return send_from_directory('.', 'index.html')

# API Routes
@app.route('/admin/api/stats')
def get_stats():
    return jsonify(load_mock_data('stats'))

@app.route('/admin/api/products')
def get_products():
    return jsonify(load_mock_data('products'))

@app.route('/admin/api/orders')
def get_orders():
    return jsonify(load_mock_data('stats').get('recentOrders', []))

@app.route('/admin/api/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    # In a real application, you would save this to a database
    return jsonify({"status": "success", "message": "Order created", "order": data})

@app.route('/admin/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    # In a real application, you would delete from database
    return jsonify({"status": "success", "message": "Product deleted"})

@app.route('/admin/sync/google-sheets', methods=['POST'])
def sync_google_sheets():
    return jsonify({"status": "success", "message": "Data synced successfully"})

# Serve static files
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    print("🚀 Starting Admin Dashboard Server...")
    print("📊 Dashboard: http://localhost:8080")
    print("📦 Products: http://localhost:8080/admin/products")
    print("🛒 Cart: http://localhost:8080/admin/cart")
    print("📋 Orders: http://localhost:8080/admin/orders")
    print("🎯 Server running on http://localhost:8080")
    print("🌟 Press Ctrl+C to stop")
    
    app.run(host='0.0.0.0', port=8080, debug=True)
