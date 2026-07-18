"""Read-only quality audit for StarClaim commercial star catalog records."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from typing import Any, Iterable
from urllib.parse import urlencode
from urllib.request import urlopen


CANONICAL_FIELDS = (
    "bayer_designation",
    "constellation_code",
    "hip",
    "gaia_dr3",
    "ra_deg",
    "dec_deg",
    "distance_ly",
    "spect",
)


def _has_value(record: dict[str, Any], field: str) -> bool:
    return record.get(field) not in (None, "", [])


def _coordinate_key(record: dict[str, Any]) -> str | None:
    ra_deg = record.get("ra_deg")
    dec_deg = record.get("dec_deg")
    if ra_deg is not None and dec_deg is not None:
        return f"deg:{float(ra_deg):.6f}:{float(dec_deg):.6f}"
    ra = str(record.get("ra") or "").strip()
    dec = str(record.get("dec") or "").strip()
    return f"text:{ra}:{dec}" if ra and dec else None


def analyze_catalog(records: Iterable[dict[str, Any]]) -> dict[str, Any]:
    rows = list(records)
    coordinate_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        key = _coordinate_key(row)
        if key:
            coordinate_groups[key].append(row)

    duplicate_positions = []
    for key, group in sorted(coordinate_groups.items()):
        if len(group) > 1:
            duplicate_positions.append(
                {
                    "coordinate": key,
                    "records": [
                        {
                            "star_id": row.get("star_id"),
                            "code": row.get("code"),
                            "name": row.get("name"),
                        }
                        for row in group
                    ],
                }
            )

    missing = {
        field: sum(not _has_value(row, field) for row in rows)
        for field in CANONICAL_FIELDS
    }
    negative_magnitude = [
        {
            "star_id": row.get("star_id"),
            "name": row.get("name"),
            "magnitude": row.get("magnitude"),
        }
        for row in rows
        if isinstance(row.get("magnitude"), (int, float)) and row["magnitude"] < 0
    ]

    return {
        "record_count": len(rows),
        "unique_star_ids": len({row.get("star_id") for row in rows if row.get("star_id")}),
        "unique_codes": len({row.get("code") for row in rows if row.get("code")}),
        "constellation_count": len(
            {row.get("constellation") for row in rows if row.get("constellation")}
        ),
        "tier_counts": dict(sorted(Counter(row.get("tier") or "missing" for row in rows).items())),
        "claimed_count": sum(
            bool(row.get("owner_id") or row.get("owner_name") or row.get("claimed_at"))
            for row in rows
        ),
        "missing_fields": missing,
        "negative_magnitude_records": negative_magnitude,
        "duplicate_position_groups": duplicate_positions,
        "duplicate_position_count": sum(len(group) - 1 for group in coordinate_groups.values() if len(group) > 1),
    }


def fetch_catalog(api_base: str, limit: int = 1000) -> list[dict[str, Any]]:
    url = f"{api_base.rstrip('/')}/stars?{urlencode({'limit': limit, 'offset': 0, 'sort': 'name'})}"
    with urlopen(url, timeout=60) as response:  # nosec B310 - explicit operator-provided API URL
        payload = json.load(response)
    if not isinstance(payload, list):
        raise ValueError("Catalog API must return a JSON array")
    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-base", default="https://starclaim.onrender.com/api")
    parser.add_argument("--limit", type=int, default=1000)
    args = parser.parse_args()
    print(json.dumps(analyze_catalog(fetch_catalog(args.api_base, args.limit)), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
