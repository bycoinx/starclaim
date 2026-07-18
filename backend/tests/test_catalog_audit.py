from backend.catalog_audit import analyze_catalog


def test_catalog_audit_reports_missing_contract_fields_and_duplicate_positions():
    rows = [
        {
            "star_id": "legacy-rigel",
            "code": "rigel",
            "name": "Rigel",
            "constellation": "Orion",
            "tier": "legendary",
            "magnitude": 0.13,
            "ra": "05h 14m",
            "dec": "-08 deg 12m",
        },
        {
            "star_id": "legacy-beta-orionis",
            "code": "beta-orionis",
            "name": "Beta Orionis",
            "constellation": "Orion",
            "tier": "constellation",
            "magnitude": 0.18,
            "ra": "05h 14m",
            "dec": "-08 deg 12m",
        },
        {
            "star_id": "legacy-sirius",
            "code": "sirius",
            "name": "Sirius",
            "constellation": "Canis Major",
            "tier": "legendary",
            "magnitude": -1.46,
            "ra_deg": 101.2875,
            "dec_deg": -16.7161,
            "hip": "32349",
        },
    ]

    report = analyze_catalog(rows)

    assert report["record_count"] == 3
    assert report["constellation_count"] == 2
    assert report["duplicate_position_count"] == 1
    assert report["duplicate_position_groups"][0]["records"][0]["name"] == "Rigel"
    assert report["missing_fields"]["bayer_designation"] == 3
    assert report["missing_fields"]["hip"] == 2
    assert report["negative_magnitude_records"] == [
        {"star_id": "legacy-sirius", "name": "Sirius", "magnitude": -1.46}
    ]
