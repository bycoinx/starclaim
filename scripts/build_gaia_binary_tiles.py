#!/usr/bin/env python3
"""Package a normalized Gaia/HIP JSON catalog into binary 2D sky tiles."""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.binary_star_catalog import build_binary_tiles


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", required=True, type=Path)
    parser.add_argument(
        "--output", default=ROOT / "backend" / "data" / "star_tiles_2d", type=Path
    )
    parser.add_argument("--version", default="gaia-dr3-hip-2d-v1")
    args = parser.parse_args()
    manifest = build_binary_tiles(args.catalog, args.output, args.version)
    print(
        json.dumps(
            {
                key: manifest[key]
                for key in (
                    "catalogVersion",
                    "starCount",
                    "tileCount",
                    "tileBytes",
                    "nameCount",
                )
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
