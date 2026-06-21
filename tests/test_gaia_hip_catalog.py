import csv
import importlib.util
import json
from pathlib import Path

SCRIPT = Path(__file__).parents[1] / "scripts" / "build_gaia_hip_catalog.py"
SPEC = importlib.util.spec_from_file_location("gaia_hip_builder", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def write_csv(path, rows):
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)


def test_build_catalog_filters_crossmatches_and_enriches(tmp_path):
    gaia = tmp_path / "gaia.csv"
    hip = tmp_path / "hip.csv"
    hyg = tmp_path / "hyg.json"
    write_csv(
        gaia,
        [
            {
                "source_id": "10",
                "ra": "101",
                "dec": "-16",
                "parallax": "379.2",
                "phot_g_mean_mag": "-1.46",
                "bp_rp": "0.0",
                "ruwe": "1.0",
                "duplicated_source": "false",
            },
            {
                "source_id": "11",
                "ra": "102",
                "dec": "-17",
                "parallax": "5",
                "phot_g_mean_mag": "7",
                "bp_rp": "1.1",
                "ruwe": "1.1",
                "duplicated_source": "false",
            },
            {
                "source_id": "12",
                "ra": "103",
                "dec": "-18",
                "parallax": "2",
                "phot_g_mean_mag": "8",
                "bp_rp": "1.2",
                "ruwe": "1.8",
                "duplicated_source": "false",
            },
            {
                "source_id": "13",
                "ra": "104",
                "dec": "-19",
                "parallax": "1",
                "phot_g_mean_mag": "9",
                "bp_rp": "1.3",
                "ruwe": "1.0",
                "duplicated_source": "true",
            },
        ],
    )
    write_csv(
        hip,
        [
            {
                "source_id": "10",
                "original_ext_source_id": "32349",
                "angular_distance": "0.3",
                "xm_flag": "1",
            },
            {
                "source_id": "11",
                "original_ext_source_id": "32349",
                "angular_distance": "1.2",
                "xm_flag": "2",
            },
        ],
    )
    hyg.write_text(
        json.dumps(
            {
                "stars": [
                    ["hyg-1", 32349, 48915, "Sirius", 0, 0, 0, 0, "A1V", "CMa", "s"]
                ]
            }
        ),
        encoding="utf-8",
    )

    records, stats = MODULE.build_catalog(gaia, hip, hyg)

    assert [record["sourceId"] for record in records] == ["10", "11"]
    assert records[0]["canonicalId"] == "gaia-dr3:10"
    assert records[0]["hip"] == 32349
    assert records[0]["properName"] == "Sirius"
    assert round(records[0]["distanceParsec"], 3) == 2.637
    assert records[1]["hip"] is None
    assert stats["discardedCrossmatchConflicts"] == 1
    assert stats["rejectedRuwe"] == 1
    assert stats["rejectedDuplicatedSource"] == 1


def test_manifest_hash_matches_output(tmp_path):
    gaia = tmp_path / "gaia.csv"
    write_csv(
        gaia,
        [
            {
                "source_id": "1",
                "ra": "0",
                "dec": "0",
                "parallax": "10",
                "phot_g_mean_mag": "1",
                "bp_rp": "0.5",
                "ruwe": "1",
                "duplicated_source": "false",
            }
        ],
    )
    records, stats = MODULE.build_catalog(gaia, hyg_path=None)
    output = tmp_path / "catalog.json"
    manifest_path = tmp_path / "manifest.json"
    manifest = MODULE.write_catalog(
        records, stats, output, manifest_path, [gaia], {"limit": 50000}
    )

    assert manifest["recordCount"] == 1
    assert manifest["output"]["sha256"] == MODULE._sha256(output)
    assert json.loads(output.read_text(encoding="utf-8"))["epoch"] == "J2016.0"
