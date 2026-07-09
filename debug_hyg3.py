#!/usr/bin/env python3
"""Direct test of import_gaia_hyg.py logic."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Force reload modules
if 'import_gaia_hyg' in sys.modules:
    del sys.modules['import_gaia_hyg']

from import_gaia_hyg import fetch_hyg_csv, normalize_to_star_identity

# Get HYG
hyg = fetch_hyg_csv(use_cache=True)
print(f'HYG stars: {len(hyg)}')

# Test normalization on ALL stars, count results
results = []
for i, star in enumerate(hyg):
    norm = normalize_to_star_identity(star)
    if norm:
        results.append(norm)
    
    if (i+1) % 20000 == 0:
        print(f'Processed {i+1}: {len(results)} valid stars so far')

print(f'\nTotal normalized: {len(results)}')
if results:
    print(f'First: {results[0]["canonicalId"]} - {results[0]["properName"]}')
