#!/usr/bin/env python3
"""
P0.4 - Build binary tiles from MongoDB canonical stars.

Stages:
1. Export stars from MongoDB starclaim.stars → JSON
2. Build binary sector tiles (Float32Array format)
3. Generate search index (name, HIP, HD, Gaia source ID, StarClaim code)
4. Validate tiles against reference stars
"""

import json
import sys
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

import pymongo

from backend.binary_star_catalog import build_binary_tiles, get_2d_sector_id


def export_mongodb_to_json(
    output_path: Path,
    mongo_uri: str = "mongodb://localhost:27017",
    db_name: str = "starclaim",
    collection_name: str = "stars",
) -> dict:
    """Export all canonical stars from MongoDB to JSON catalog format."""
    print(f"[P0.4.1] Connecting to MongoDB: {mongo_uri}/{db_name}")
    client = pymongo.MongoClient(mongo_uri)
    db = client[db_name]
    collection = db[collection_name]
    
    count = collection.count_documents({})
    print(f"[P0.4.1] Total stars in MongoDB: {count}")
    
    stars = list(collection.find({}, {"_id": 0}))
    print(f"[P0.4.1] Loaded {len(stars)} star documents")
    
    # Convert datetime objects to ISO strings for JSON serialization
    def json_serialize(doc):
        if isinstance(doc, dict):
            return {k: json_serialize(v) for k, v in doc.items()}
        elif isinstance(doc, list):
            return [json_serialize(item) for item in doc]
        elif hasattr(doc, 'isoformat'):  # datetime objects
            return doc.isoformat() + "Z"
        else:
            return doc
    
    stars = [json_serialize(s) for s in stars]
    
    # Validate critical fields
    invalid = 0
    for star in stars:
        if not all(k in star for k in ["raDegrees", "decDegrees", "magnitude"]):
            invalid += 1
    
    if invalid > 0:
        print(f"⚠️  Warning: {invalid} stars missing critical fields")
    
    import datetime
    catalog = {
        "catalogVersion": "gaia-dr3-hip-v1",
        "exportedAt": datetime.datetime.utcnow().isoformat() + "Z",
        "mongoDb": {
            "uri": mongo_uri.split("@")[-1] if "@" in mongo_uri else mongo_uri,
            "database": db_name,
            "collection": collection_name,
            "count": len(stars),
        },
        "stars": stars,
    }
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(catalog, separators=(",", ":"), ensure_ascii=True))
    print(f"[P0.4.1] ✓ Exported to {output_path} ({output_path.stat().st_size / 1024 / 1024:.1f} MB)")
    
    return catalog


def build_tiles_from_catalog(
    catalog_path: Path,
    output_root: Path,
    catalog_version: str = "gaia-dr3-hip-2d-v1",
) -> dict:
    """Build binary sector tiles from JSON catalog."""
    print(f"\n[P0.4.2] Building binary tiles from {catalog_path}")
    manifest = build_binary_tiles(catalog_path, output_root, catalog_version)
    
    print(f"[P0.4.2] ✓ Built {manifest['tileCount']} tiles")
    print(f"[P0.4.2] ✓ Total size: {manifest['tileBytes'] / 1024 / 1024:.1f} MB")
    print(f"[P0.4.2] ✓ Sectors: {', '.join(s['id'] for s in manifest['sectors'][:5])}...")
    
    return manifest


def build_search_index(
    catalog_path: Path,
    output_root: Path,
    catalog_version: str = "gaia-dr3-hip-2d-v1",
) -> dict:
    """Build name/ID search index from catalog."""
    print(f"\n[P0.4.3] Building search index")
    
    catalog = json.loads(catalog_path.read_text())
    stars = catalog.get("stars", [])
    
    # Build multi-key index
    index = {
        "by_name": {},
        "by_hip": {},
        "by_hd": {},
        "by_gaia": {},
        "by_canonical_id": {},
    }
    
    for star in stars:
        canonical_id = star.get("canonicalId", f"gaia-dr3:{star.get('gaiaSourceId')}")
        gaia_id = str(star.get("gaiaSourceId", ""))
        
        # Name index
        if star.get("properName"):
            name = star["properName"].lower()
            if name not in index["by_name"]:
                index["by_name"][name] = []
            index["by_name"][name].append(canonical_id)
        
        # HIP index
        if star.get("hip"):
            hip = str(star["hip"])
            index["by_hip"][hip] = canonical_id
        
        # HD index
        if star.get("hd"):
            hd = str(star["hd"])
            index["by_hd"][hd] = canonical_id
        
        # Gaia index
        if gaia_id:
            index["by_gaia"][gaia_id] = canonical_id
        
        # Canonical ID index (direct)
        index["by_canonical_id"][canonical_id] = {
            "hip": star.get("hip"),
            "hd": star.get("hd"),
            "properName": star.get("properName"),
            "raDegrees": star.get("raDegrees"),
            "decDegrees": star.get("decDegrees"),
        }
    
    index_path = Path(output_root) / catalog_version / "search-index.json"
    index_path.write_text(json.dumps(index, separators=(",", ":"), ensure_ascii=True))
    
    print(f"[P0.4.3] ✓ Index built with:")
    print(f"  - {len(index['by_name'])} unique star names")
    print(f"  - {len(index['by_hip'])} HIP entries")
    print(f"  - {len(index['by_hd'])} HD entries")
    print(f"  - {len(index['by_gaia'])} Gaia source IDs")
    print(f"  - {len(index['by_canonical_id'])} canonical IDs")
    
    return index


def validate_reference_stars(catalog: dict) -> bool:
    """Validate that reference stars are present and correct."""
    print(f"\n[P0.4.4] Validating reference stars")
    
    REFERENCE_STARS = {
        "Sirius": {"hip": 32349, "magnitude_approx": -1.44},
        "Vega": {"hip": 91262, "magnitude_approx": 0.03},
        "Polaris": {"hip": 11767, "magnitude_approx": 1.97},
        "Achernar": {"hip": 1562, "magnitude_approx": 0.46},
    }
    
    stars = {s.get("properName"): s for s in catalog.get("stars", [])}
    passed = 0
    
    for name, expected in REFERENCE_STARS.items():
        star = stars.get(name)
        if not star:
            print(f"  ✗ {name}: NOT FOUND")
            continue
        
        hip_match = star.get("hip") == expected["hip"]
        mag_diff = abs(star.get("magnitude", 0) - expected["magnitude_approx"])
        
        if hip_match and mag_diff < 0.1:
            print(f"  ✓ {name} (HIP {star.get('hip')}, mag {star.get('magnitude'):.2f})")
            passed += 1
        else:
            print(f"  ⚠️  {name}: HIP {star.get('hip')} (expected {expected['hip']}), " +
                  f"mag {star.get('magnitude'):.2f} (expected {expected['magnitude_approx']:.2f})")
    
    return passed == len(REFERENCE_STARS)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Build P0.4 binary tiles")
    parser.add_argument("--export", action="store_true", help="Export MongoDB to JSON")
    parser.add_argument("--build", action="store_true", help="Build binary tiles")
    parser.add_argument("--index", action="store_true", help="Build search index")
    parser.add_argument("--validate", action="store_true", help="Validate reference stars")
    parser.add_argument("--all", action="store_true", help="Run all stages")
    parser.add_argument(
        "--catalog-input",
        type=Path,
        default=Path("backend/data/gaia-hip-50000.json"),
        help="Input catalog JSON path",
    )
    parser.add_argument(
        "--catalog-export",
        type=Path,
        default=Path("backend/data/catalog-mongodb-export.json"),
        help="Output JSON export path",
    )
    parser.add_argument(
        "--tiles-output",
        type=Path,
        default=Path("build/catalog"),
        help="Output tiles root directory",
    )
    parser.add_argument(
        "--mongo-uri",
        default="mongodb://localhost:27017",
        help="MongoDB connection URI",
    )
    
    args = parser.parse_args()
    
    if not (args.export or args.build or args.index or args.validate or args.all):
        parser.print_help()
        return 1
    
    catalog = None
    
    if args.all or args.export:
        catalog = export_mongodb_to_json(
            args.catalog_export,
            mongo_uri=args.mongo_uri,
        )
    
    if args.all or args.build:
        if not args.catalog_export.exists():
            print(f"Error: {args.catalog_export} not found; run --export first")
            return 1
        if not catalog:
            catalog = json.loads(args.catalog_export.read_text())
        build_tiles_from_catalog(args.catalog_export, args.tiles_output)
    
    if args.all or args.index:
        if not args.catalog_export.exists():
            print(f"Error: {args.catalog_export} not found; run --export first")
            return 1
        build_search_index(args.catalog_export, args.tiles_output)
    
    if args.all or args.validate:
        if not catalog:
            if args.catalog_export.exists():
                catalog = json.loads(args.catalog_export.read_text())
        if catalog:
            validate_reference_stars(catalog)
    
    print(f"\n✓ P0.4 complete!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
