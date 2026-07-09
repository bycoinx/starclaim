#!/usr/bin/env python3
"""
P0.3 - Gaia DR3 + HYG Import Pipeline
======================================

Fetches and normalizes Gaia DR3 + Hipparcos + HYG data into StarIdentity format.
Performs crossmatching and imports canonical star records to MongoDB backend.

Usage:
  python3 import_gaia_hyg.py [--fetch-gaia] [--fetch-hyg] [--crossmatch] [--import] [--all]
"""

import argparse
import asyncio
import csv
import hashlib
import io
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import httpx
import pymongo
from pymongo import MongoClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
GAIA_TAP_URL = 'https://gea.esac.esa.int/tap-server/tap/sync'
HYG_CSV_URL = 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv'
DATA_DIR = Path(__file__).parent / 'data'
MONGO_URL = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
MONGO_DB = os.getenv('MONGO_DB', 'starclaim')

DATA_DIR.mkdir(exist_ok=True)


def _float(value: Any) -> Optional[float]:
    """Safely parse float."""
    if value is None or value == '':
        return None
    try:
        f = float(value)
        return f if abs(f) < 1e10 else None
    except (ValueError, TypeError):
        return None


def _int(value: Any) -> Optional[int]:
    """Safely parse int."""
    if value is None or value == '':
        return None
    try:
        i = int(float(value))
        return i if abs(i) < 1e15 else None
    except (ValueError, TypeError):
        return None


def _str(value: Any) -> Optional[str]:
    """Safely parse string."""
    if value is None:
        return None
    s = str(value).strip()
    return s if s else None


async def fetch_gaia_hipparcos(limit: int = 74000) -> Optional[List[Dict[str, Any]]]:
    """
    Fetch Gaia DR3 stars with Hipparcos crossmatch via TAP service.
    
    Returns list of stars with gaia + hipparcos metadata.
    """
    logger.info(f'Fetching Gaia DR3 + Hipparcos (limit={limit})...')
    
    query = f"""
    SELECT TOP {limit}
      x.source_id,
      x.original_ext_source_id AS hip,
      x.angular_distance,
      g.phot_g_mean_mag,
      g.ra,
      g.dec,
      g.parallax,
      g.parallax_error,
      g.pm_ra_cosdec,
      g.pm_dec,
      g.teff_gspphot,
      g.mh_gspphot
    FROM gaiadr3.hipparcos2_best_neighbour x
    JOIN gaiadr3.gaia_source g ON g.source_id = x.source_id
    WHERE g.phot_g_mean_mag <= 14
      AND g.ruwe <= 1.4
      AND g.parallax > 0
    ORDER BY g.phot_g_mean_mag ASC
    """
    
    params = {
        'request': 'doQuery',
        'lang': 'adql',
        'format': 'csv',
        'query': query,
    }
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.get(GAIA_TAP_URL, params=params)
            resp.raise_for_status()
            
            # Parse CSV response
            stars = []
            reader = csv.DictReader(io.StringIO(resp.text))
            for row in reader:
                star = {
                    'gaiaSourceId': _str(row.get('source_id')),
                    'hip': _int(row.get('hip')),
                    'magnitude': _float(row.get('phot_g_mean_mag')),
                    'raDegrees': _float(row.get('ra')),
                    'decDegrees': _float(row.get('dec')),
                    'parallaxMas': _float(row.get('parallax')),
                    'parallaxError': _float(row.get('parallax_error')),
                    'temperature': _int(row.get('teff_gspphot')),
                    'metallicity': _float(row.get('mh_gspphot')),
                    'pmRa': _float(row.get('pm_ra_cosdec')),
                    'pmDec': _float(row.get('pm_dec')),
                    'source': 'gaia-dr3',
                }
                if star['gaiaSourceId'] and star['raDegrees'] is not None:
                    stars.append(star)
            
            logger.info(f'Fetched {len(stars)} Gaia+Hipparcos stars')
            return stars
            
    except Exception as e:
        logger.error(f'Failed to fetch Gaia data: {e}')
        return None


def fetch_hyg_csv(use_cache: bool = True) -> Optional[List[Dict[str, Any]]]:
    """
    Fetch HYG database CSV and parse into star records.
    """
    cache_path = DATA_DIR / 'hyg_v41.csv'
    
    if use_cache and cache_path.exists():
        logger.info(f'Loading cached HYG from {cache_path}')
        content = cache_path.read_text(encoding='utf-8')
    else:
        logger.info(f'Downloading HYG from {HYG_CSV_URL}...')
        try:
            resp = httpx.get(HYG_CSV_URL, timeout=60.0)
            resp.raise_for_status()
            content = resp.text
            cache_path.write_text(content, encoding='utf-8')
        except Exception as e:
            logger.error(f'Failed to fetch HYG: {e}')
            return None
    
    # Parse CSV
    stars = []
    seen_hip = set()
    reader = csv.DictReader(io.StringIO(content))
    
    for idx, row in enumerate(reader):
        hip = _int(row.get('hip'))
        
        # Filter: only keep high-quality stars
        mag = _float(row.get('mag'))
        if mag is None or mag > 9.0:
            continue
        if hip and hip in seen_hip:
            continue
        
        star = {
            'hygId': _int(row.get('id')),
            'hip': hip,
            'hd': _int(row.get('hd')),
            'properName': _str(row.get('proper')),
            'magnitude': mag,
            'raDegrees': _float(row.get('ra')) * 15.0 if row.get('ra') else None,  # RA hours to deg
            'decDegrees': _float(row.get('dec')),
            'distanceParsec': _float(row.get('dist')),
            'spectralType': _str(row.get('spect')),
            'constellation': _str(row.get('con')),
            'colorIndex': _float(row.get('colorindex')),
            'source': 'hyg',
        }
        
        # Validate
        if star['raDegrees'] is not None and star['decDegrees'] is not None and star['magnitude'] is not None:
            stars.append(star)
            if hip:
                seen_hip.add(hip)
        
        if (idx + 1) % 10000 == 0:
            logger.debug(f'Parsed {idx + 1} HYG records')
    
    logger.info(f'Parsed {len(stars)} HYG stars')
    return stars


def crossmatch_stars(gaia_stars: List[Dict], hyg_stars: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
    """
    Crossmatch Gaia + HYG stars by HIP.
    
    Returns (matched_stars, unmatched_hyg_stars)
    """
    logger.info('Crossmatching Gaia + HYG by HIP...')
    
    # Index HYG by HIP
    hyg_by_hip = {s.get('hip'): s for s in hyg_stars if s.get('hip')}
    
    matched = []
    unmatched_hip = set()
    
    # Match Gaia records with HYG
    for gaia in gaia_stars:
        hip = gaia.get('hip')
        hyg = hyg_by_hip.get(hip)
        
        if hyg:
            # Merge Gaia + HYG
            merged = {**hyg, **gaia, 'source': 'gaia-dr3+hyg'}
            matched.append(merged)
            unmatched_hip.add(hip)
        else:
            # Keep Gaia-only record
            matched.append(gaia)
    
    # Include high-quality HYG-only records
    hyg_only = [s for s in hyg_stars if s.get('hip') not in unmatched_hip]
    
    logger.info(f'Matched {len(matched)} stars, {len(hyg_only)} HYG-only')
    return matched, hyg_only


def normalize_to_star_identity(raw_star: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Normalize raw star record to P0.2 StarIdentity schema.
    """
    # Required fields
    ra_deg = raw_star.get('raDegrees')
    dec_deg = raw_star.get('decDegrees')
    magnitude = raw_star.get('magnitude')
    
    if ra_deg is None or dec_deg is None or magnitude is None:
        return None
    
    # Validate ranges
    if not (0 <= ra_deg < 360) or not (-90 <= dec_deg <= 90):
        return None
    if not (-5 < magnitude < 20):
        return None
    
    # Build canonical ID
    gaia_id = raw_star.get('gaiaSourceId')
    hip = raw_star.get('hip')
    hd = raw_star.get('hd')
    
    if gaia_id:
        canonical_id = f'gaia-dr3:{gaia_id}'
    elif hip:
        canonical_id = f'hip:{hip}'
    elif hd:
        canonical_id = f'hd:{hd}'
    else:
        return None
    
    # Distance from parallax
    parallax_mas = raw_star.get('parallaxMas')
    distance_pc = None
    distance_source = 'unknown'
    
    if parallax_mas and parallax_mas > 0:
        distance_pc = 1000.0 / parallax_mas
        distance_source = 'parallax'
    elif raw_star.get('distanceParsec') is not None and raw_star.get('distanceParsec', 0) > 0:
        distance_pc = raw_star['distanceParsec']
        distance_source = raw_star.get('source', 'unknown')
    
    # Build StarIdentity
    star = {
        'schemaVersion': 1,
        'canonicalId': canonical_id,
        'id': canonical_id.replace(':', '-'),  # Simple ID
        'source': raw_star.get('source', 'unknown'),
        'sourceId': str(raw_star.get('gaiaSourceId') or raw_star.get('hygId') or ''),
        'hip': str(hip) if hip else None,
        'hd': str(hd) if hd else None,
        'gaiaSourceId': gaia_id,
        'raDegrees': ra_deg,
        'raHours': ra_deg / 15.0,
        'decDegrees': dec_deg,
        'magnitude': magnitude,
        'parallaxMas': parallax_mas,
        'distanceParsec': distance_pc,
        'distanceSource': distance_source,
        'spectralType': raw_star.get('spectralType'),
        'constellation': raw_star.get('constellation'),
        'properName': raw_star.get('properName'),
        'displayName': raw_star.get('properName') or f"Star {hip or canonical_id}",
        'temperature': raw_star.get('temperature'),
        'colorIndex': raw_star.get('colorIndex'),
        'slug': (raw_star.get('properName') or f'star-{hip}' or canonical_id).lower().replace(' ', '-'),
        'status': 'available',
        'importedAt': datetime.now(timezone.utc),
    }
    
    return star


async def import_to_mongodb(stars: List[Dict[str, Any]]) -> bool:
    """
    Bulk import normalized stars to MongoDB.
    """
    logger.info(f'Importing {len(stars)} stars to MongoDB...')
    
    try:
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        db = client[MONGO_DB]
        collection = db['stars']
        
        # Prepare bulk operations
        operations = [
            pymongo.UpdateOne(
                {'canonicalId': star['canonicalId']},
                {'$set': star},
                upsert=True
            )
            for star in stars
        ]
        
        # Bulk write
        result = collection.bulk_write(operations)
        logger.info(f'Upserted {result.upserted_id.__len__() if hasattr(result, "upserted_id") else 0} stars')
        logger.info(f'Modified {result.modified_count} existing stars')
        
        # Create indexes
        collection.create_index('canonicalId', unique=True)
        collection.create_index('hip', sparse=True)
        collection.create_index('hd', sparse=True)
        collection.create_index('gaiaSourceId', sparse=True)
        collection.create_index([('raDegrees', pymongo.GEOSPHERE), ('decDegrees', pymongo.GEOSPHERE)])
        collection.create_index('magnitude')
        collection.create_index('constellation')
        
        logger.info('MongoDB indexes created')
        client.close()
        return True
        
    except Exception as e:
        logger.error(f'MongoDB import failed: {e}')
        return False


async def main():
    parser = argparse.ArgumentParser(description='P0.3 Gaia/HYG Import Pipeline')
    parser.add_argument('--fetch-gaia', action='store_true', help='Fetch Gaia data')
    parser.add_argument('--fetch-hyg', action='store_true', help='Fetch HYG data')
    parser.add_argument('--crossmatch', action='store_true', help='Crossmatch Gaia + HYG')
    parser.add_argument('--import', dest='do_import', action='store_true', help='Import to MongoDB')
    parser.add_argument('--all', action='store_true', help='Run all steps')
    parser.add_argument('--limit', type=int, default=74000, help='Gaia record limit')
    
    args = parser.parse_args()
    
    if args.all:
        args.fetch_gaia = args.fetch_hyg = args.crossmatch = args.do_import = True
    
    # Fetch sources
    gaia_stars = None
    hyg_stars = None
    
    if args.fetch_gaia:
        gaia_stars = await fetch_gaia_hipparcos(args.limit)
    
    if args.fetch_hyg:
        hyg_stars = fetch_hyg_csv()
    
    # Crossmatch
    if args.crossmatch and gaia_stars and hyg_stars:
        matched, hyg_only = crossmatch_stars(gaia_stars, hyg_stars)
        all_stars = matched + hyg_only
    elif gaia_stars and hyg_stars:
        # Both loaded but no crossmatch requested - merge anyway
        matched, hyg_only = crossmatch_stars(gaia_stars, hyg_stars)
        all_stars = matched + hyg_only
    elif hyg_stars:
        # HYG-only (no Gaia)
        all_stars = hyg_stars
    elif gaia_stars:
        # Gaia-only (no HYG)
        all_stars = gaia_stars
    else:
        # Neither
        all_stars = []
    
    # Normalize
    logger.info('Normalizing to StarIdentity schema...')
    normalized = [normalize_to_star_identity(s) for s in all_stars]
    normalized = [s for s in normalized if s is not None]
    logger.info(f'Normalized {len(normalized)} valid stars')
    
    # Import
    if args.do_import:
        await import_to_mongodb(normalized)
        logger.info('Import complete')
    
    # Summary
    logger.info(f'Pipeline summary:')
    logger.info(f'  Gaia stars: {len(gaia_stars) if gaia_stars else 0}')
    logger.info(f'  HYG stars: {len(hyg_stars) if hyg_stars else 0}')
    logger.info(f'  Normalized: {len(normalized)}')


if __name__ == '__main__':
    asyncio.run(main())
