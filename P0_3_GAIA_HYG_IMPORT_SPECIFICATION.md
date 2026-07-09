/**
 * P0.3 - Gaia/HYG Import Pipeline
 * ===============================
 * 
 * Objective: Import Gaia DR3 + Hipparcos + HYG data into MongoDB backend
 * with canonical StarIdentity normalization and crossmatch validation.
 * 
 * Status: SPECIFICATION COMPLETE - Ready for testing & execution
 */

# P0.3 Design Specification

## Overview

P0.3 is the data foundation phase that:
1. **Fetches** Gaia DR3 (74k Hipparcos + 50k nearby only), HYG (120k total)
2. **Crossmatches** by HIP ID → Gaia source_id → angular proximity fallback
3. **Normalizes** raw catalog data to P0.2 StarIdentity schema
4. **Validates** quality gates (parallax error < 5%, magnitude ranges, coordinates)
5. **Deduplicates** merged sources to single canonical record
6. **Imports** to MongoDB with indexed collections
7. **Generates** binary tile catalog for efficient 2D rendering (P0.4)

### Acceptance Criteria

✓ **Coverage**: 
- Gaia DR3 + Hipparcos: 74,000 stars (confirmed crossmatch)
- Gaia-only nearby: 50,000 stars (distance < 100 pc)
- HYG-only: 20,000 stars (mag < 9.0, high-quality)
- **Total: 144,000 canonical stars**

✓ **Quality**:
- Parallax relative error < 5% (Gaia)
- All coordinates within [0,360) RA, [-90,90] Dec
- Magnitude in [-5, 20] range
- Spectral type from valid OBAFGKMLTS
- Zero duplicate canonical IDs

✓ **Validation**:
- All 4 reference stars (Sirius, Vega, Polaris, Achernar) present
- Coordinate accuracy ±0.01 degrees vs reference
- Magnitude accuracy ±0.1 vs reference
- MongoDB indexes created

✓ **Performance**:
- Import time < 10 minutes for full 144k dataset
- MongoDB query latency < 100ms for single star lookup
- Binary tile generation < 5 minutes

## Data Sources

### Gaia DR3 (via ESA TAP Service)

**Source**: https://gea.esac.esa.int/tap-server/tap/sync

**Hipparcos Crossmatch Query (74k stars)**:
```sql
SELECT TOP 75000
  x.source_id,
  x.original_ext_source_id AS hip,
  x.angular_distance,
  g.phot_g_mean_mag,
  g.ra,
  g.dec,
  g.parallax,
  g.parallax_error,
  g.pm_ra_cosdec,
  g.pm_dec,
  g.teff_gspphot,
  g.mh_gspphot
FROM gaiadr3.hipparcos2_best_neighbour x
JOIN gaiadr3.gaia_source g ON g.source_id = x.source_id
WHERE g.phot_g_mean_mag <= 14
  AND g.ruwe <= 1.4
  AND g.parallax > 0
ORDER BY g.phot_g_mean_mag ASC
```

**Returns**:
- `source_id`: Gaia DR3 source ID (8 digits)
- `hip`: Hipparcos ID (5 digits)
- `phot_g_mean_mag`: G-band magnitude
- `ra`, `dec`: ICRS J2000.0 coordinates (degrees)
- `parallax`: Parallax in milliarcseconds
- `parallax_error`: Parallax uncertainty
- `teff_gspphot`: Effective temperature
- `mh_gspphot`: Metallicity [M/H]

**Quality Gates**:
- `phot_g_mean_mag <= 14` (brighter stars, less noise)
- `ruwe <= 1.4` (astrometric goodness-of-fit)
- `parallax > 0` (valid distance measurement)

### HYG Database (v4.1)

**Source**: Yale Bright Star Catalog via GitHub
- CSV: https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv
- Records: ~119,614 stars
- Notable identifiers: HIP, HD, proper name, constellation

**Schema** (subset used):
- `hip`: Hipparcos ID
- `hd`: Henry Draper catalog ID
- `proper`: Proper name (e.g., "Sirius")
- `ra`: Right Ascension (hours, 0-24)
- `dec`: Declination (degrees)
- `dist`: Distance (parsecs, from parallax)
- `mag`: Visual magnitude (V-band)
- `spect`: Harvard spectral classification
- `con`: Constellation (3-letter IAU code)

**Filtering for P0.3**:
- `mag <= 9.0` (high-quality visual magnitude)
- `dist` and `ra`/`dec` present (valid coordinates)
- Dedup by HIP (one record per Hipparcos ID)

## Crossmatch Strategy

### Priority 1: Direct HIP Match

For Gaia records with `original_ext_source_id` (HIP ID):
```
1. Query Gaia DR3 hipparcos2_best_neighbour (confirms match)
2. Find HYG record by matching HIP
3. Merge: {Gaia coordinates + astrometry, HYG metadata}
4. Result: Single canonical record with full enrichment
```

**Example - Sirius**:
```json
{
  "canonicalId": "gaia-dr3:5793498",
  "hip": "32349",
  "properName": "Sirius",
  "raDegrees": 101.2871,
  "decDegrees": -16.7161,
  "magnitude": -1.46,
  "parallaxMas": 379.5,
  "distanceParsec": 2.637,
  "source": "gaia-dr3+hyg"
}
```

### Priority 2: Angular Proximity

For Gaia stars without HIP crossmatch:
```
1. Search HYG stars within 1 arcsec of Gaia coordinates
2. If found: merge as "gaia-dr3+hyg-proximity"
3. If not found: keep as Gaia-only "gaia-dr3"
```

**Tolerance**: 1.0 arcsecond (0.000277 degrees)

### Priority 3: HYG-Only

Stars in HYG without Gaia match:
```
1. Quality filter: mag <= 9.0, distance known
2. Keep as source: "hyg"
3. Mark with "quality_fallback" flag
```

**Expected**: ~20,000 HYG-only records (fainter stars, older measurements)

## Normalization: Raw → StarIdentity

### Mapping Rules

```
Raw Gaia Field          → StarIdentity Field
───────────────────────────────────────────────
source_id              → gaiaSourceId
original_ext_source_id → hip
hip (from HYG)         → hip
hd (from HYG)          → hd
phot_g_mean_mag        → magnitude
ra                     → raDegrees
dec                     → decDegrees
parallax               → parallaxMas
1000/parallax          → distanceParsec
teff_gspphot           → temperature
mh_gspphot             → metallicity
spect (from HYG)       → spectralType
con (from HYG)         → constellation
proper (from HYG)      → properName
```

### Canonical ID Generation

Priority order:
1. **Gaia DR3**: `"gaia-dr3:{source_id}"` (preferred, e.g., `"gaia-dr3:5793498"`)
2. **Hipparcos**: `"hip:{hip}"` if no Gaia (e.g., `"hip:32349"`)
3. **Henry Draper**: `"hd:{hd}"` if neither (e.g., `"hd:48915"`)

Example canonical IDs:
```
"gaia-dr3:5793498"        → Sirius (Gaia match)
"hip:11767"               → Polaris (HYG-only)
"hd:225213"               → Achernar (historical)
```

### Distance Priority

For `distanceParsec`:
1. **Best**: Gaia parallax → `distance = 1000 / parallax_mas`
   - Mark: `distanceSource: "parallax"`
2. **Fallback**: HYG explicit distance
   - Mark: `distanceSource: "hyg"`
3. **None**: `null` for stars with no valid distance

## Quality Validation

### Gate 1: Parallax Quality

For Gaia records:
```
✓ parallax > 0
✓ parallax_error / parallax < 0.05 (5% relative error)
✗ Reject if either condition fails
```

### Gate 2: Astrometry

All records:
```
✓ raDegrees ∈ [0, 360)
✓ decDegrees ∈ [-90, 90]
✗ Reject if out of range
```

### Gate 3: Magnitude

```
✓ magnitude ∈ [-5, 20]
✗ Reject if outside range (unphysical for optical)
```

### Gate 4: Spectral Type

```
✓ First character ∈ {O, B, A, F, G, K, M, L, T}
✗ Reject if invalid (indicates data error)
```

## Implementation

### Files Created

1. **backend/P0_3_import_pipeline.js** (SPECIFICATION)
   - Configuration for all 3 data sources
   - Crossmatch strategy definition
   - MongoDB schema & index specification
   - Import checkpoint stages

2. **backend/import_gaia_hyg.py** (EXECUTABLE SCRIPT)
   - `fetch_gaia_hipparcos()` - ESA TAP query
   - `fetch_hyg_csv()` - GitHub CSV download with caching
   - `crossmatch_stars()` - HIP-based merge + proximity fallback
   - `normalize_to_star_identity()` - Raw → StarIdentity conversion
   - `import_to_mongodb()` - Bulk upsert with indexes
   - Main CLI: `--fetch-gaia`, `--fetch-hyg`, `--crossmatch`, `--import`, `--all`

3. **backend/test_p03_crossmatch.py** (TEST SUITE)
   - Reference star validation (4 stars: Sirius, Vega, Polaris, Achernar)
   - Quality gate unit tests
   - Coordinate/magnitude validation
   - Parallax consistency checks
   - 15+ test cases
   - `run_all_p03_tests()` for CI/automated testing

### How to Run

#### Prerequisites

```bash
# Install Python dependencies
pip install pymongo httpx

# Verify MongoDB connection
python -c "import pymongo; print(pymongo.version)"

# Optional: set MONGODB_URI if not on localhost:27017
export MONGODB_URI="mongodb://user:pass@host:27017/starclaim"
```

#### Step 1: Fetch Data

```bash
# Download Gaia DR3 + Hipparcos
python backend/import_gaia_hyg.py --fetch-gaia --limit 74000

# Download HYG CSV (cached to ./data/hyg_v41.csv)
python backend/import_gaia_hyg.py --fetch-hyg
```

#### Step 2: Run Full Pipeline

```bash
# Full import (all steps)
python backend/import_gaia_hyg.py --all --limit 74000
```

This will:
1. Fetch Gaia DR3 + Hipparcos (74,000)
2. Fetch HYG (120,000)
3. Crossmatch by HIP + proximity (144,000 total)
4. Normalize to StarIdentity
5. Validate quality gates
6. Bulk import to MongoDB
7. Create indexes

Expected output:
```
INFO: Fetching Gaia DR3 + Hipparcos (limit=74000)...
INFO: Fetched 74000 Gaia+Hipparcos stars
INFO: Loading cached HYG from ./data/hyg_v41.csv
INFO: Parsed 120000 HYG stars
INFO: Crossmatching Gaia + HYG by HIP...
INFO: Matched 74000 stars, 20000 HYG-only
INFO: Normalizing to StarIdentity schema...
INFO: Normalized 94000 valid stars
INFO: Importing 94000 stars to MongoDB...
INFO: Upserted 94000 stars
INFO: Modified 0 existing stars
INFO: MongoDB indexes created
INFO: Import complete
```

#### Step 3: Validate Import

```bash
# Run test suite
python backend/test_p03_crossmatch.py

# Expected output:
# ============================================================
# P0.3 Validation Test Results
# ============================================================
# Tests run: 15
# Failures: 0
# Errors: 0
# Status: ✓ PASS
```

#### Step 4: Verify Reference Stars

```python
from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017')
db = client['starclaim']
stars = db['stars']

# Verify Sirius
sirius = stars.find_one({'canonicalId': 'gaia-dr3:5793498'})
print(f"Sirius: {sirius['properName']} @ {sirius['raDegrees']:.4f}, {sirius['decDegrees']:.4f}")
# Expected: Sirius @ 101.2871, -16.7161

# Verify Vega
vega = stars.find_one({'hip': '91262'})
print(f"Vega: {vega['properName']} @ {vega['magnitude']:.2f} mag")
# Expected: Vega @ 0.03 mag

# Check import stats
print(f"Total stars: {stars.count_documents({})}")
print(f"With Gaia ID: {stars.count_documents({'gaiaSourceId': {'$exists': True}})}")
print(f"With HIP: {stars.count_documents({'hip': {'$exists': True}})}")
```

## Expected Results

### Import Statistics

```
Gaia DR3 + Hipparcos crossmatch:  74,000 stars
Gaia DR3 only (nearby):            50,000 stars
HYG only (mag < 9.0):              20,000 stars
────────────────────────────────────
Total normalized:                  94,000 stars

Deduplication rate: 40% (144k → 94k due to overlaps)
```

### Database Indexes

Created indexes for fast queries:
- `canonicalId` (unique)
- `hip`, `hd`, `gaiaSourceId` (sparse)
- `raDegrees, decDegrees` (2D sphere geo index)
- `magnitude`
- `constellation`

### Query Performance Benchmarks

Expected latency (MongoDB on local machine):
```
Single star lookup by canonicalId:        < 1ms
Range query (constellation):               10-50ms
Spatial query (radius search):             100-500ms
Full collection scan (144k):               200-300ms
```

## Dependencies

### Python Packages

```python
pymongo >= 4.0  # MongoDB driver
httpx >= 0.24   # HTTP client for ESA TAP
```

### Environment Variables

```
MONGODB_URI     # MongoDB connection string (default: mongodb://localhost:27017)
MONGO_DB        # Database name (default: starclaim)
```

### External APIs

- **ESA Gaia TAP Service**: https://gea.esac.esa.int/tap-server/tap/sync
  - No authentication required
  - Response time: 30-60 seconds for 74k records
  - Throttle limit: 10 requests/minute (respected)

- **GitHub Raw Content**: https://raw.githubusercontent.com
  - No authentication required
  - Cached locally after first download

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| ESA TAP timeout | Medium | HIGH | Retry logic + caching |
| Parallax errors in Gaia | Low | LOW | Quality gate: error < 5% |
| HYG-Gaia mismatches | Medium | MEDIUM | Angular proximity fallback |
| Duplicate canonical IDs | Low | HIGH | Dedup + unique index |
| MongoDB unavailable | Low | CRITICAL | Check connection before import |
| Disk space (144k records) | Very Low | LOW | ~200MB MongoDB storage |

## Next Phase (P0.4)

After P0.3 acceptance:
- **Binary Tile Catalog**: Convert 94,000 normalized stars to compressed tile format
- **Tile System**: Sector-based organization for efficient 2D rendering
- **Mobile Distribution**: Package tiles into APK + AsyncStorage cache

P0.4 depends on P0.3 completion and canonical StarIdentity availability.

---

**Phase Status**: ✓ SPECIFICATION COMPLETE
**Target Completion**: P0.3 import pipeline ready to execute
**Acceptance Gate**: All quality tests pass + reference stars verified
