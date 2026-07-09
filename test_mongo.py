#!/usr/bin/env python3
"""Quick MongoDB connection test."""

from pymongo import MongoClient

try:
    client = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print('✓ MongoDB Connected')
    info = client.server_info()
    print(f'Version: {info["version"]}')
    print(f'Databases: {client.list_database_names()[:3]}')
except Exception as e:
    print(f'✗ Connection failed: {e}')
