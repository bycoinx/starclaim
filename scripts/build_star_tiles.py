#!/usr/bin/env python3
"""Generate versioned gzip HYG tiles consumed by the StarClaim mobile app."""

from __future__ import annotations

import argparse
import csv
import io
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.star_tile_catalog import build_star_tiles  # noqa: E402

DEFAULT_SOURCE = "https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv"


def load_rows(source: str):
    local_path = Path(source)
    if local_path.exists():
        handle = local_path.open("r", encoding="utf-8-sig", newline="")
        return csv.DictReader(handle)
    with urllib.request.urlopen(source, timeout=120) as response:
        text = response.read().decode("utf-8-sig")
    return csv.DictReader(io.StringIO(text))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default=DEFAULT_SOURCE, help="Local HYG CSV path or HTTPS URL")
    parser.add_argument("--output", default=str(ROOT / "backend" / "data" / "star_tiles"))
    parser.add_argument("--version", default="hyg-v4.1-sector-v1")
    args = parser.parse_args()

    manifest = build_star_tiles(load_rows(args.source), Path(args.output).resolve(), args.version)
    print(
        f"Built {len(manifest['sectors'])} tiles with "
        f"{manifest['normalizedStarCount']} stars for {manifest['catalogVersion']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
