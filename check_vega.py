#!/usr/bin/env python3
"""Check Vega in HYG."""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from import_gaia_hyg import fetch_hyg_csv, normalize_to_star_identity

hyg = fetch_hyg_csv(use_cache=True)
for s in hyg:
    if s.get('hip') == 91262:
        print(f'Vega HYG record found!')
        for k, v in s.items():
            if k not in ['colorIndex']:
                print(f'  {k}: {v}')
        
        norm = normalize_to_star_identity(s)
        if norm:
            print(f'\nNormalized Vega:')
            print(f'  canonicalId: {norm["canonicalId"]}')
            print(f'  properName: {norm["properName"]}')
        break
else:
    print('Vega not found in HYG')
