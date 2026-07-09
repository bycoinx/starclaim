/**
 * P0.3 - Gaia/HYG Import Pipeline & Validation
 * ==============================================
 * 
 * Complete data import workflow:
 * 1. Fetch Gaia DR3 + HYG data from sources
 * 2. Crossmatch HIP → Gaia source_id
 * 3. Normalize to StarIdentity schema
 * 4. Validate & detect conflicts
 * 5. Import to MongoDB backend
 * 6. Generate binary tile catalog
 * 
 * Design: All 3 sources (Gaia, HYG, HD) merge into canonical StarIdentity
 * Source priority: Gaia > HYG > HD (for coordinates/parallax)
 * Fallback: If Gaia missing, use HYG; if both missing, use HD
 */

/**
 * Data Source Configuration
 */
export const GAIA_CONFIG = {
  // ESA Gaia TAP service (ESA CDR3)
  tapService: 'https://gea.esac.esa.int/tap-server/tap/sync',
  
  // Query for Gaia DR3 stars with Hipparcos crossmatch
  // Returns: ~74,000 confirmed Hipparcos stars
  hipparcosCrossmatchQuery: `
    SELECT TOP 75000
      x.source_id,
      x.original_ext_source_id AS hip,
      x.angular_distance,
      x.xm_flag,
      g.phot_g_mean_mag,
      g.ra,
      g.dec,
      g.parallax,
      g.parallax_error,
      g.pm_ra_cosdec,
      g.pm_dec,
      g.teff_gspphot,
      g.logg_gspphot,
      g.mh_gspphot,
      h.hd,
      h.proper,
      h.spect,
      h.con
    FROM gaiadr3.hipparcos2_best_neighbour x
    JOIN gaiadr3.gaia_source g ON g.source_id = x.source_id
    LEFT JOIN gaiadr3.hipparcos2 h ON h.hip = x.original_ext_source_id
    WHERE g.phot_g_mean_mag <= 14
      AND g.ruwe <= 1.4
      AND g.parallax > 0
    ORDER BY g.phot_g_mean_mag ASC
  `,

  // Query for nearby Gaia-only stars (no Hipparcos match)
  nearbyGaiaQuery: `
    SELECT TOP 50000
      source_id,
      ra,
      dec,
      parallax,
      parallax_error,
      phot_g_mean_mag,
      pm_ra_cosdec,
      pm_dec,
      teff_gspphot,
      logg_gspphot,
      mh_gspphot
    FROM gaiadr3.gaia_source
    WHERE 1=distance(
      POINT(ra, dec),
      POINT(0, 0)
    ) < 100
      AND parallax > 0.1
      AND phot_g_mean_mag < 12
      AND ruwe <= 1.4
    ORDER BY parallax DESC
  `,

  version: 'DR3',
  releaseDate: '2022-06-13',
};

export const HYG_CONFIG = {
  // Yale Bright Star Catalog (v4.1)
  csvUrl: 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv',
  localPath: './data/hyg_v41.csv',
  
  // HYG schema (CSV columns)
  schema: {
    id: 'Unique identifier',
    hip: 'Hipparcos catalog ID',
    hd: 'Henry Draper catalog ID',
    hr: 'Harvard Revised Photometry catalog ID',
    gliese: 'Nearby Stars Catalog ID',
    bayer: 'Bayer Greek letter designation',
    flamsteed: 'Flamsteed number',
    proper: 'Proper name',
    ra: 'Right Ascension (hours, 0-24)',
    dec: 'Declination (degrees, -90 to +90)',
    dist: 'Distance (parsecs)',
    mag: 'Visual magnitude',
    absmag: 'Absolute visual magnitude',
    spectrum: 'Harvard spectral type',
    colorindex: 'B-V color index',
    x: 'Cartesian X (parsecs)',
    y: 'Cartesian Y (parsecs)',
    z: 'Cartesian Z (parsecs)',
    vx: 'Velocity X (km/s)',
    vy: 'Velocity Y (km/s)',
    vz: 'Velocity Z (km/s)',
    rarad: 'RA in radians',
    decrad: 'Dec in radians',
    pmra: 'Proper motion RA (mas/yr)',
    pmdec: 'Proper motion Dec (mas/yr)',
    rv: 'Radial velocity (km/s)',
    mult: 'Multiple star?',
    comp: 'Companion info',
    var: 'Variable star?',
  },
  version: '4.1',
  recordCount: '119,614',
};

/**
 * Crossmatch Strategy
 * 
 * 1. Direct HIP match: If Gaia record has HIP crossmatch, use Gaia coordinates + HYG metadata
 * 2. Angular proximity: For unmatched Gaia stars, search HYG within 1 arcsec
 * 3. HYG-only: Include HYG stars with no Gaia match (fallback for distant/faint stars)
 * 4. Conflict resolution: Gaia parallax > HYG distance (parallax more recent)
 */
export const CROSSMATCH_STRATEGY = {
  hipDirectMatch: {
    priority: 1,
    description: 'Use Gaia record with HIP crossmatch from hipparcos2_best_neighbour',
    sources: ['gaia_dr3', 'hyg_v41'],
  },
  angularProximity: {
    priority: 2,
    description: 'Match unmatched Gaia records to HYG by angular distance (<1 arcsec)',
    tolerance: 1.0, // arcseconds
    sources: ['gaia_dr3', 'hyg_v41'],
  },
  hygOnly: {
    priority: 3,
    description: 'Include HYG stars without Gaia match (for faint/distant stars)',
    sources: ['hyg_v41'],
    criteria: 'mag < 9.0 or dist < 100 pc', // Quality threshold
  },
};

/**
 * Expected Import Volumes
 */
export const IMPORT_VOLUMES = {
  gaiaHipparcos: 74000, // Direct Gaia-Hipparcos crossmatch
  gaiaOnly: 50000, // Nearby Gaia-only stars
  hygOnly: 20000, // High-quality HYG without Gaia match
  total: 144000, // All sources combined (with dedup)
  
  // P0.2 targets
  coreTarget: 10000, // Reference quality for embedded catalog
  wideTarget: 120000, // Full mobile availability
};

/**
 * Data Quality Metrics
 */
export const QUALITY_GATES = {
  parallax: {
    minRelativeError: 0.05, // parallax_error / parallax < 5%
    minValue: 0.1, // milliarcseconds (100 parsecs max)
  },
  magnitude: {
    rangeMin: -5.0,
    rangeMax: 20.0,
  },
  coordinates: {
    raRange: [0, 360],
    decRange: [-90, 90],
  },
  spectralType: {
    validTypes: ['O', 'B', 'A', 'F', 'G', 'K', 'M', 'L', 'T'],
  },
};

/**
 * Database Schema for Backend
 * Expected MongoDB collection: "stars"
 */
export const MONGODB_SCHEMA = {
  collection: 'stars',
  indexes: [
    { field: 'id', unique: true }, // StarIdentity id
    { field: 'canonicalId' },
    { field: 'hip', sparse: true },
    { field: 'hd', sparse: true },
    { field: 'gaiaSourceId', sparse: true },
    { field: 'raDegrees, decDegrees', type: '2dsphere' }, // GEO index
    { field: 'magnitude' },
    { field: 'constellation' },
    { field: 'source' },
    { field: 'distanceParsec' },
  ],
  
  document: {
    // P0.2 StarIdentity fields
    id: String, // Primary ID
    canonicalId: String,
    source: String, // 'gaia', 'hyg', 'hd'
    sourceId: String,
    sourceCatalogVersion: String,
    
    // Catalog cross-refs
    hip: String,
    hd: String,
    gaiaSourceId: String,
    
    // Coordinates
    raDegrees: Number,
    decDegrees: Number,
    raHours: Number,
    
    // Distance & parallax
    distanceParsec: Number,
    parallaxMas: Number,
    distanceSource: String,
    
    // Photometry
    magnitude: Number,
    colorIndex: Number,
    temperature: Number,
    luminosity: Number,
    
    // Classification
    spectralType: String,
    constellation: String,
    
    // Naming
    name: String,
    properName: String,
    displayName: String,
    slug: String,
    
    // Metadata
    schemaVersion: Number,
    status: String, // 'available', 'featured', 'reserved'
    qualityFlags: [String], // warnings/issues
    importedAt: Date,
    sourceRecord: Object, // Original Gaia/HYG record (optional, for audit)
  },
};

/**
 * Import Process Checkpoint
 */
export const IMPORT_CHECKPOINT = {
  stage1: 'FETCH_SOURCES', // Download Gaia query results + HYG CSV
  stage2: 'PARSE_SOURCES', // Parse CSV/JSON to intermediate format
  stage3: 'CROSSMATCH', // HIP-based + angular proximity matching
  stage4: 'NORMALIZE', // Convert to StarIdentity schema
  stage5: 'VALIDATE', // Quality gates + schema validation
  stage6: 'DEDUPLICATE', // Remove duplicate sources
  stage7: 'MONGODB_IMPORT', // Bulk insert/update to backend DB
  stage8: 'TILE_GENERATION', // Build binary tile catalog
  stage9: 'VERIFY', // Audit imported data
};

export default {
  GAIA_CONFIG,
  HYG_CONFIG,
  CROSSMATCH_STRATEGY,
  IMPORT_VOLUMES,
  QUALITY_GATES,
  MONGODB_SCHEMA,
  IMPORT_CHECKPOINT,
};
