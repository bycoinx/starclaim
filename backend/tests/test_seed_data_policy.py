import importlib


def test_default_seed_policy_never_generates_random_catalog(monkeypatch):
    monkeypatch.delenv("ENABLE_LEGACY_HYG_SEED", raising=False)
    import backend.seed_data as seed_data

    seed_data = importlib.reload(seed_data)
    assert seed_data.LEGACY_HYG_SEED_ENABLED is False
    assert seed_data.STAR_CATALOG == seed_data.MANUAL_CATALOG
    assert all(not star["code"].startswith("sc-") for star in seed_data.STAR_CATALOG)
