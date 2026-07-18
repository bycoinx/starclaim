import json
from pathlib import Path

import backend.catalog_curate as catalog_curate
from backend.catalog_curate import CATALOG_VERSION, HipparcosRecord, PilotPolicy, curate_pilot
from backend.catalog_domain import CanonicalStar


ROOT = Path(__file__).parents[2]


def _hyg(hip: str, bayer: str, magnitude: float, proper: str = ""):
    return {
        "id": hip, "hip": hip, "hd": f"HD{hip}", "hr": f"HR{hip}", "proper": proper,
        "ra": "1", "dec": "1", "dist": "10", "mag": str(magnitude), "spect": "A0V",
        "bf": f"{bayer} Tst", "bayer": bayer, "flam": "", "con": "Tst",
        "comp": "1", "comp_primary": hip, "base": "", "var": "", "var_min": "", "var_max": "",
    }


def test_curator_is_deterministic_and_uses_official_hipparcos_values():
    pairs = [("Alp", 1.0), ("Bet", 2.0), ("Gam", 2.5), ("Del", 3.0), ("Eps", 3.5)]
    rows = [_hyg(str(index), bayer, magnitude, "Leader" if index == 1 else "")
            for index, (bayer, magnitude) in enumerate(pairs, start=1)]
    hipparcos = {str(index): HipparcosRecord(str(index), 10.0 + index, -20.0 + index, 10.0, magnitude)
                  for index, (_, magnitude) in enumerate(pairs, start=1)}
    policy = PilotPolicy("Tst", "Test", "Testis", 4.0, 5)
    first = curate_pilot(rows, hipparcos, [policy])
    second = curate_pilot(reversed(rows), hipparcos, [policy])
    assert first == second
    assert first["star_count"] == 5
    assert first["stars"][0]["astrometry"]["epoch"] == "J1991.25 (ICRS)"
    assert first["stars"][0]["photometry"]["apparent_magnitude_v"] == 1.0


def test_hipparcos_query_explicitly_includes_negative_magnitudes(monkeypatch):
    payload = b"HIP\tRAICRS\tDEICRS\tPlx\tVmag\n \tdeg\tdeg\tmas\tmag\n------\t------\t------\t------\t-----\n 71683\t219.90205833\t-60.83399250\t742.12\t-0.01\n"
    captured = {}

    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

        def read(self):
            return payload

    def fake_urlopen(url, timeout):
        captured["url"] = url
        captured["timeout"] = timeout
        return Response()

    monkeypatch.setattr(catalog_curate, "urlopen", fake_urlopen)
    records = catalog_curate.fetch_hipparcos_bright()
    assert "Vmag=-2.0..5.0" in captured["url"]
    assert records["71683"].magnitude_v == -0.01


def test_committed_pilot_manifest_validates_against_domain_and_json_schema():
    manifest = json.loads((ROOT / "shared" / "catalog" / "curated-pilot-v1.json").read_text(encoding="utf-8"))
    assert manifest["catalog_version"] == CATALOG_VERSION
    assert manifest["constellation_count"] == 10
    assert 50 <= manifest["star_count"] <= 120
    canonical_ids, coordinates = [], []
    for payload in manifest["stars"]:
        star = CanonicalStar.model_validate(payload)
        canonical_ids.append(star.canonical_id)
        coordinates.append((star.astrometry.ra_deg, star.astrometry.dec_deg))
        assert star.curation.source_refs
        assert star.designations.bayer_latin
    assert len(canonical_ids) == len(set(canonical_ids))
    assert len(coordinates) == len(set(coordinates))
    assert all(5 <= row["selected_count"] <= 12 for row in manifest["constellations"])
