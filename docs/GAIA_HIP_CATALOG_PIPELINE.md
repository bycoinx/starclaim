# Gaia DR3 + Hipparcos Catalog Pipeline

This build step runs on a workstation. Raw Gaia data is never bundled with the mobile app.

## Inputs

- Gaia DR3 CSV: `source_id`, `ra`, `dec`, `parallax`, `phot_g_mean_mag`, `bp_rp`, `ruwe`, `duplicated_source`
- Hipparcos crossmatch CSV: `source_id`, `original_ext_source_id`, `angular_distance`, `xm_flag`
- Existing HYG core JSON for names, HD identifiers, spectral types, and constellations

Use `scripts/gaia_dr3_hipparcos_subset.adql` for the bright sample,
`scripts/gaia_dr3_nearby_subset.adql` for the 100 pc sample,
`scripts/gaia_dr3_hip_selected.adql` for HIP-selected Gaia rows, and
`scripts/gaia_dr3_hipparcos_crossmatch.adql` for the matching Hipparcos identifiers.
Both queries target the official Gaia DR3 TAP tables. Duplicate-source rejection is
kept in the local build step because TAP services differ in boolean literal syntax.

## Build

```powershell
python scripts/build_gaia_hip_catalog.py `
  --gaia-csv data/import/gaia-dr3-subset.csv `
  --gaia-csv data/import/gaia-dr3-nearby.csv `
  --gaia-csv data/import/gaia-dr3-hip-selected.csv `
  --hipparcos-csv data/import/gaia-hipparcos-best-neighbour.csv
```

The default output is intentionally placed under ignored `build/catalog/`. After its manifest, counts, and device performance are approved, a later packaging step will convert it into binary sector tiles for the mobile renderer.

## Guarantees

- Gaia DR3 `source_id` is the canonical identity.
- A Hipparcos identifier can enrich at most one Gaia record.
- Invalid coordinates, poor RUWE matches, duplicate Gaia sources, and overly dim rows are rejected.
- Output carries ICRS/J2016.0 metadata, input/output SHA-256 hashes, policy, and rejection statistics.
