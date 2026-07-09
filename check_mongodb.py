#!/usr/bin/env python3
"""Check MongoDB import results."""

from pymongo import MongoClient

try:
    client = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=5000)
    db = client['starclaim']
    col = db['stars']
    
    count = col.count_documents({})
    print(f'✓ Total stars in MongoDB: {count}')
    
    # Check reference stars
    sirius = col.find_one({'canonicalId': 'hip:32349'})
    vega = col.find_one({'canonicalId': 'hip:91262'})
    
    if sirius:
        print(f'✓ Sirius found: {sirius["properName"]} @ {sirius["magnitude"]:.2f} mag')
    else:
        print(f'✗ Sirius not found')
    
    if vega:
        print(f'✓ Vega found: {vega["properName"]} @ {vega["magnitude"]:.2f} mag')
    else:
        print(f'✗ Vega not found')
    
    # Index status
    indexes = col.list_indexes()
    print(f'✓ Indexes: {len(list(indexes))}')
    
except Exception as e:
    print(f'✗ Error: {e}')
