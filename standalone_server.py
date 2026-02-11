#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Standalone Python HTTP Server for Admin Dashboard
No external dependencies required - uses only Python standard library
"""

import http.server
import socketserver
import json
import os
import urllib.parse
from datetime import datetime

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=".", **kwargs)
    
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        
        # Handle API endpoints
        if parsed_path.path.startswith('/admin/api/'):
            self.handle_api_get(parsed_path.path)
        else:
            # Serve static files
            super().do_GET()
    
    def handle_api_get(self, path):
        try:
            # Extract endpoint name
            endpoint = path.replace('/admin/api/', '').replace('/', '')
            
            # Map endpoints to JSON files
            api_files = {
                'stats': 'api/admin/api/stats.json',
                'products': 'api/admin/api/products.json',
                'orders': 'api/admin/api/stats.json'  # Use recentOrders from stats
            }
            
            if endpoint in api_files:
                file_path = api_files[endpoint]
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # For orders endpoint, return only recentOrders
                    if endpoint == 'orders':
                        data = data.get('recentOrders', [])
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
                else:
                    self.send_error(404, "API endpoint not found")
            else:
                self.send_error(404, "API endpoint not found")
                
        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")
    
    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        
        if parsed_path.path.startswith('/admin/api/'):
            self.handle_api_post(parsed_path.path)
        else:
            self.send_error(404, "Not found")
    
    def handle_api_post(self, path):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Handle different POST endpoints
            if path == '/admin/api/orders':
                # Create order logic
                response_data = {"status": "success", "message": "Order created"}
            elif path == '/admin/sync/google-sheets':
                # Sync logic
                response_data = {"status": "success", "message": "Data synced successfully"}
            else:
                self.send_error(404, "API endpoint not found")
                return
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")
    
    def do_DELETE(self):
        parsed_path = urllib.parse.urlparse(self.path)
        
        if parsed_path.path.startswith('/admin/products/'):
            # Extract product ID
            parts = parsed_path.path.split('/')
            if len(parts) >= 4:
                try:
                    product_id = int(parts[3])
                    # Delete logic would go here
                    response_data = {"status": "success", "message": "Product deleted"}
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))
                except ValueError:
                    self.send_error(400, "Invalid product ID")
            else:
                self.send_error(400, "Invalid request")
        else:
            self.send_error(404, "Not found")
    
    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run_server():
    PORT = 8080
    
    print("🚀 Starting Admin Dashboard Server...")
    print("📊 Dashboard: http://localhost:8080")
    print("📦 Products: http://localhost:8080/admin/products")
    print("🛒 Cart: http://localhost:8080/admin/cart")
    print("📋 Orders: http://localhost:8080/admin/orders")
    print("🎯 Server running on http://localhost:8080")
    print("🌟 Press Ctrl+C to stop")
    print()
    
    with socketserver.TCPServer(("", PORT), DashboardHandler) as httpd:
        print(f"Server started at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped by user")

if __name__ == "__main__":
    run_server()
