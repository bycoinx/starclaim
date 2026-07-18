from backend.catalog_reconcile import ReferenceStar, parse_dec_deg, parse_ra_deg, reconcile_catalog


def ref(hip="24436", name="Rigel", bayer="Bet", con="Ori", ra=78.634, dec=-8.202, mag=0.18):
    return ReferenceStar(f"hip:{hip}", hip, "1713", "34085", name, bayer, "19", con,
                         ra, dec, mag, 264.0, "B8Ia")


def legacy(star_id, code, name, constellation="Orion", ra="05h 15m", dec="-08° 12'", magnitude=0.18):
    return {"star_id": star_id, "code": code, "name": name, "constellation": constellation,
            "ra": ra, "dec": dec, "magnitude": magnitude}


def test_coordinate_parsers_support_legacy_format():
    assert parse_ra_deg("05h 30m") == 82.5
    assert parse_dec_deg("-08° 30'") == -8.5


def test_exact_name_and_bayer_alias_merge_to_one_canonical_star():
    report = reconcile_catalog([
        legacy("legacy-rigel", "rigel", "Rigel"),
        legacy("legacy-beta", "beta-orionis", "Beta Orionis"),
    ], [ref()])
    assert report["writes_performed"] is False
    assert report["status_counts"] == {"matched": 1, "merge": 1, "quarantine": 0, "unresolved": 0}
    assert report["merge_groups"] == [{
        "canonical_id": "hip:24436", "survivor_legacy_id": "legacy-rigel",
        "redirect_legacy_ids": ["legacy-beta"], "requires_metadata_review": False,
    }]


def test_coordinate_only_match_requires_both_position_and_magnitude():
    alpha_cen = ref("71683", "Rigil Kentaurus", "Alp-1", "Cen", 219.902, -60.834, -0.01)
    good = legacy("sc-012-id", "SC-012", "SC-012", "Centaurus", "14h 39m", "-60° 50'", 0.01)
    bad = legacy("sc-bad-id", "SC-099", "SC-099", "Centaurus", "14h 40m", "-60° 50'", 2.0)
    report = reconcile_catalog([good, bad], [alpha_cen])
    statuses = {row["legacy_id"]: row["status"] for row in report["records"]}
    assert statuses == {"sc-012-id": "matched", "sc-bad-id": "unresolved"}


def test_reviewed_non_stellar_objects_are_quarantined():
    report = reconcile_catalog([
        legacy("m31", "SC-001", "SC-001", "Andromeda", "00h 42m", "+41° 16'", 4.52),
        legacy("m42", "SC-005", "SC-005", "Orion", "05h 35m", "-05° 23'", 4.34),
    ], [])
    assert report["status_counts"]["quarantine"] == 2
    assert all(row["canonical_id"] is None for row in report["records"])


def test_exact_position_conflict_becomes_reviewable_merge():
    spica = ref("65474", "Spica", "Alp", "Vir", 201.298, -11.161, 0.98)
    report = reconcile_catalog([
        legacy("spica-id", "spica", "Spica", "Virgo", "13h 25m", "-11° 09'", 0.97),
        legacy("sc-014-id", "SC-014", "SC-014", "Virgo", "13h 25m", "-11° 09'", 4.25),
    ], [spica])
    assert report["status_counts"] == {"matched": 1, "merge": 1, "quarantine": 0, "unresolved": 0}
    assert report["merge_groups"][0]["requires_metadata_review"] is True
