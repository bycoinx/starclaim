#!/usr/bin/env python3
"""Debug HYG normalization."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from import_gaia_hyg import fetch_hyg_csv, normalize_to_star_identity

# Fetch HYG
hyg_stars = fetch_hyg_csv(use_cache=True)
print(f'Fetched {len(hyg_stars)} HYG stars')

# Check first star
if hyg_stars:
    first = hyg_stars[0]
    print(f'\nFirst star:')
    for key, value in first.items():
        print(f'  {key}: {value} ({type(value).__name__})')
    
    # Try normalizing
    normalized = normalize_to_star_identity(first)
    print(f'\nNormalized: {normalized}')
