#!/usr/bin/env python3
"""Build a deterministic, mobile-ready Gaia DR3 + Hipparcos catalog."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

SCHEMA_VERSION = 1
CATALOG_VERSION = "gaia-dr3-hip-v1"


def _value(row, *names):
    lowered = {str(key).lower(): value for key, value in row.items()}
    for name in names:
        value = lowered.get(name.lower())
        if value not in (None, ""):
            return value
    return None


def _float(value):
    try:
        number = float(value)
        return number if math.isfinite(number) else None
    except (TypeError, ValueError):
        return None


def _int(value):
    number = _float(value)
    return int(number) if number is not None else None


def _bool(value):
    return str(value).strip().lower() in {"1", "true", "t", "yes", "y"}


def _sha256(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_hyg_index(path):
    """Index the existing compact HYG core by HIP for names and cross-IDs."""
    if not path or not Path(path).exists():
        return {}
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    rows = payload.get("stars", payload) if isinstance(payload, dict) else payload
    index = {}
    for row in rows:
        if isinstance(row, list):
            values = row + [None] * (11 - len(row))
            source_id, hip, hd, proper, _, _, _, _, spectral, constellation, _ = values[
                :11
            ]
        else:
            source_id = row.get("id")
            hip = row.get("hip")
            hd = row.get("hd")
            proper = row.get("proper") or row.get("properName")
            spectral = row.get("spectralType") or row.get("spect")
            constellation = row.get("constellation") or row.get("con")
        hip = _int(hip)
        if hip:
            index[hip] = {
                "sourceId": str(source_id) if source_id is not None else None,
                "hd": _int(hd),
                "properName": proper or None,
                "spectralType": spectral or None,
                "constellation": constellation or None,
            }
    return index


def load_hip_crossmatch(path):
    """Resolve Gaia-HIP candidates to a one-to-one map."""
    if not path:
        return {}, Counter()
    candidates = []
    with Path(path).open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            source_id = _value(row, "source_id", "gaia_source_id")
            hip = _int(_value(row, "original_ext_source_id", "hip", "hip_id"))
            if source_id and hip:
                candidates.append(
                    {
                        "sourceId": str(source_id),
                        "hip": hip,
                        "angularDistance": _float(
                            _value(row, "angular_distance", "angular_distance_arcsec")
                        ),
                        "xmFlag": _int(_value(row, "xm_flag")),
                    }
                )
    candidates.sort(
        key=lambda item: (
            (
                item["angularDistance"]
                if item["angularDistance"] is not None
                else math.inf
            ),
            item["xmFlag"] if item["xmFlag"] is not None else math.inf,
            item["sourceId"],
        )
    )
    by_source = {}
    used_hips = set()
    stats = Counter(inputCrossmatches=len(candidates))
    for item in candidates:
        if item["sourceId"] in by_source or item["hip"] in used_hips:
            stats["discardedCrossmatchConflicts"] += 1
            continue
        by_source[item["sourceId"]] = item
        used_hips.add(item["hip"])
    stats["acceptedCrossmatches"] = len(by_source)
    return by_source, stats


def build_catalog(
    gaia_path,
    hip_path=None,
    hyg_path=None,
    limit=50000,
    max_g_mag=14.0,
    max_ruwe=1.4,
    reject_duplicates=True,
):
    hip_map, stats = load_hip_crossmatch(hip_path)
    hyg_index = load_hyg_index(hyg_path)
    records = []
    stats["inputGaiaRows"] = 0

    gaia_paths = (
        list(gaia_path) if isinstance(gaia_path, (list, tuple)) else [gaia_path]
    )
    seen_source_ids = set()
    for current_gaia_path in gaia_paths:
        with Path(current_gaia_path).open(encoding="utf-8-sig", newline="") as handle:
            for row in csv.DictReader(handle):
                stats["inputGaiaRows"] += 1
                source_id = _value(row, "source_id")
                ra = _float(_value(row, "ra"))
                dec = _float(_value(row, "dec"))
                magnitude = _float(_value(row, "phot_g_mean_mag", "magnitude"))
                ruwe = _float(_value(row, "ruwe"))
                if not source_id or ra is None or dec is None or magnitude is None:
                    stats["rejectedMissingCoreFields"] += 1
                    continue
                source_id = str(source_id)
                if source_id in seen_source_ids:
                    stats["mergedDuplicateInputRows"] += 1
                    continue
                seen_source_ids.add(source_id)
                if not 0 <= ra < 360 or not -90 <= dec <= 90:
                    stats["rejectedInvalidCoordinates"] += 1
                    continue
                if magnitude > max_g_mag:
                    stats["rejectedMagnitude"] += 1
                    continue
                if ruwe is not None and ruwe > max_ruwe:
                    stats["rejectedRuwe"] += 1
                    continue
                if reject_duplicates and _bool(_value(row, "duplicated_source")):
                    stats["rejectedDuplicatedSource"] += 1
                    continue

                match = hip_map.get(source_id)
                hip = match["hip"] if match else _int(_value(row, "hip"))
                hyg = hyg_index.get(hip, {})
                parallax = _float(_value(row, "parallax"))
                distance = 1000.0 / parallax if parallax and parallax > 0 else None
                proper_name = _value(row, "proper_name", "proper") or hyg.get(
                    "properName"
                )
                record = {
                    "schemaVersion": SCHEMA_VERSION,
                    "canonicalId": f"gaia-dr3:{source_id}",
                    "source": "gaia-dr3",
                    "sourceId": source_id,
                    "sourceCatalogVersion": "Gaia DR3",
                    "gaiaSourceId": source_id,
                    "hip": hip,
                    "hd": _int(_value(row, "hd")) or hyg.get("hd"),
                    "properName": proper_name or None,
                    "raDegrees": ra,
                    "decDegrees": dec,
                    "parallaxMas": parallax if parallax and parallax > 0 else None,
                    "distanceParsec": distance,
                    "magnitude": magnitude,
                    "colorIndex": _float(_value(row, "bp_rp", "color_index")),
                    "spectralType": _value(row, "spectral_type")
                    or hyg.get("spectralType"),
                    "constellation": _value(row, "constellation")
                    or hyg.get("constellation"),
                    "coordinateFrame": "ICRS",
                    "epoch": "J2016.0",
                    "quality": {
                        "ruwe": ruwe,
                        "duplicatedSource": _bool(_value(row, "duplicated_source")),
                        "hipAngularDistanceArcsec": (
                            match.get("angularDistance") if match else None
                        ),
                    },
                }
                records.append(record)

    records.sort(
        key=lambda item: (
            0 if item["properName"] else 1,
            0 if item["magnitude"] <= 6.5 else 1,
            (
                0
                if item["distanceParsec"] is not None and item["distanceParsec"] <= 100
                else 1
            ),
            0 if item["hip"] else 1,
            item["magnitude"],
            item["sourceId"],
        )
    )
    stats["acceptedGaiaRowsBeforeLimit"] = len(records)
    records = records[:limit]
    stats["outputRecords"] = len(records)
    stats["hipEnrichedRecords"] = sum(1 for item in records if item["hip"])
    stats["namedRecords"] = sum(1 for item in records if item["properName"])
    return records, dict(stats)


def write_catalog(records, stats, output_path, manifest_path, inputs, policy):
    output_path = Path(output_path)
    manifest_path = Path(manifest_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "schemaVersion": SCHEMA_VERSION,
        "catalogVersion": CATALOG_VERSION,
        "coordinateFrame": "ICRS",
        "epoch": "J2016.0",
        "stars": records,
    }
    output_path.write_text(
        json.dumps(payload, ensure_ascii=True, separators=(",", ":")), encoding="utf-8"
    )
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "catalogVersion": CATALOG_VERSION,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "recordCount": len(records),
        "output": {"path": output_path.name, "sha256": _sha256(output_path)},
        "inputs": [
            {"path": str(Path(path)), "sha256": _sha256(path)}
            for path in inputs
            if path and Path(path).exists()
        ],
        "qualityPolicy": policy,
        "statistics": stats,
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=True, indent=2), encoding="utf-8"
    )
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--gaia-csv",
        required=True,
        action="append",
        help="Repeat for bright, nearby, and HIP-selected exports",
    )
    parser.add_argument("--hipparcos-csv")
    parser.add_argument("--hyg-core", default="mobile/assets/catalog/hyg-core-v1.json")
    parser.add_argument("--output", default="build/catalog/gaia-hip-core-v1.json")
    parser.add_argument(
        "--manifest", default="build/catalog/gaia-hip-core-v1.manifest.json"
    )
    parser.add_argument("--limit", type=int, default=50000)
    parser.add_argument("--max-g-mag", type=float, default=14.0)
    parser.add_argument("--max-ruwe", type=float, default=1.4)
    parser.add_argument("--allow-duplicated-source", action="store_true")
    args = parser.parse_args()
    policy = {
        "limit": args.limit,
        "maxGMeanMagnitude": args.max_g_mag,
        "maxRuwe": args.max_ruwe,
        "rejectDuplicatedSource": not args.allow_duplicated_source,
        "selectionPriority": [
            "properName",
            "magnitude<=6.5",
            "distance<=100pc",
            "hipCrossmatch",
            "magnitude",
            "sourceId",
        ],
    }
    records, stats = build_catalog(
        args.gaia_csv,
        args.hipparcos_csv,
        args.hyg_core,
        args.limit,
        args.max_g_mag,
        args.max_ruwe,
        not args.allow_duplicated_source,
    )
    manifest = write_catalog(
        records,
        stats,
        args.output,
        args.manifest,
        [*args.gaia_csv, args.hipparcos_csv, args.hyg_core],
        policy,
    )
    print(
        json.dumps(
            {
                "output": args.output,
                "manifest": args.manifest,
                **manifest["statistics"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
