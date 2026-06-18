"""Build the bundled mobile core catalog from generated HYG sector tiles."""

from __future__ import annotations

import argparse
import gzip
import json
from pathlib import Path


def build_catalog(tile_root: Path, output: Path, limit: int) -> int:
    stars = []
    for tile_path in tile_root.glob("*.json.gz"):
        with gzip.open(tile_path, "rt", encoding="utf-8") as handle:
            stars.extend(json.load(handle))
    stars.sort(key=lambda star: float(star.get("magnitude", star.get("mag", 99))))
    compact = [
        [
            star.get("id", ""),
            star.get("hip", ""),
            star.get("hd", ""),
            star.get("properName", star.get("proper", "")),
            star.get("raHours", star.get("ra", 0)),
            star.get("decDegrees", star.get("dec", 0)),
            star.get("distanceParsec", star.get("dist", 0)),
            star.get("magnitude", star.get("mag", 0)),
            star.get("spectralType", star.get("spect", "")),
            star.get("constellation", star.get("con", "")),
            star.get("sectorId", ""),
        ]
        for star in stars[:limit]
    ]
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(compact, ensure_ascii=True, separators=(",", ":")), encoding="utf-8")
    return len(compact)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--tiles",
        type=Path,
        default=Path("backend/data/star_tiles/hyg-v4.1-sector-v1/tiles"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("mobile/assets/catalog/hyg-core-v1.json"),
    )
    parser.add_argument("--limit", type=int, default=10000)
    args = parser.parse_args()
    count = build_catalog(args.tiles, args.output, args.limit)
    print(f"Wrote {count} stars to {args.output}")


if __name__ == "__main__":
    main()
