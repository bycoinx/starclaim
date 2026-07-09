#!/usr/bin/env python3
"""Debug HYG normalization - check better stars."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from import_gaia_hyg import fetch_hyg_csv, normalize_to_star_identity

# Fetch HYG
hyg_stars = fetch_hyg_csv(use_cache=True)
print(f'Total HYG stars: {len(hyg_stars)}\n')

# Find Sirius (HIP 32349)
sirius = None
for s in hyg_stars:
    if s.get('hip') == 32349:
        sirius = s
        break

if sirius:
    print(f'Sirius found:')
    for k, v in sirius.items():
        print(f'  {k}: {v}')
    
    normalized = normalize_to_star_identity(sirius)
    print(f'\nNormalized Sirius:')
    if normalized:
        print(f'  canonicalId: {normalized["canonicalId"]}')
        print(f'  properName: {normalized["properName"]}')
        print(f'  raDegrees: {normalized["raDegrees"]}')
        print(f'  magnitude: {normalized["magnitude"]}')
    else:
        print(f'  ✗ Normalization failed')
else:
    print('Sirius not found')

# Find Vega (HIP 91262)
vega = None
for s in hyg_stars:
    if s.get('hip') == 91262:
        vega = s
        break

if vega:
    print(f'\nVega found:')
    normalized = normalize_to_star_identity(vega)
    if normalized:
        print(f'  canonicalId: {normalized["canonicalId"]}')
        print(f'  properName: {normalized["properName"]}')
        print(f'  magnitude: {normalized["magnitude"]}')
    else:
        print(f'  ✗ Normalization failed')
