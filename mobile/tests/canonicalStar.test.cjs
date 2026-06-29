const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const Module = require('node:module');
const path = require('node:path');
const { transformSync } = require('@babel/core');

function loadApplicationModule(relativePath) {
  const filename = path.resolve(__dirname, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const transformed = transformSync(source, { filename, plugins: ['@babel/plugin-transform-modules-commonjs'] });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(transformed.code, filename);
  return loaded.exports;
}

const {
  createCanonicalStar,
  createStarSlug,
  normalizeDistanceParsec,
  DEFAULT_OWNERSHIP_STATUS,
  DEFAULT_STAR_ASSET_VERSION,
  STAR_COORDINATE_FRAME,
  STAR_EPOCH,
} = loadApplicationModule('../src/data/canonicalStar.js');

test('HYG record is normalized to the canonical ICRS/J2000 contract', () => {
  const star = createCanonicalStar({
    id: '32263', hip: '32349', hd: '48915', proper: 'Sirius',
    ra: 6.752481, dec: -16.716116, dist: 2.6371, mag: -1.44,
    spect: 'A0m', con: 'CMa',
  }, { source: 'hyg', sourceCatalogVersion: '4.1' });

  assert.equal(star.canonicalId, 'hip:32349');
  assert.equal(star.source, 'hyg');
  assert.equal(star.sourceId, '32263');
  assert.equal(star.epoch, STAR_EPOCH);
  assert.equal(star.coordinateFrame, STAR_COORDINATE_FRAME);
  assert.equal(star.raDegrees, 6.752481 * 15);
  assert.equal(star.distanceParsec, 2.6371);
  assert.equal(star.magnitude, -1.44);
  assert.equal(star.slug, 'sirius-hip-32349');
  assert.equal(star.catalogId, 'hip:32349');
  assert.equal(star.displayName, 'Sirius');
  assert.equal(star.category, 'star');
  assert.equal(star.rarity, 'legendary');
  assert.equal(star.ownershipStatus, DEFAULT_OWNERSHIP_STATUS);
  assert.equal(star.assetVersion, DEFAULT_STAR_ASSET_VERSION);
});

test('Gaia identity takes priority and distance can be derived from parallax', () => {
  const star = createCanonicalStar({
    id: 'local-1', gaiaSourceId: '123456789', hip: '1',
    raDegrees: 15, decDegrees: 5, parallaxMas: 20, magnitude: 4.2,
    colorIndex: 0.65,
  }, { source: 'gaia-dr3' });

  assert.equal(star.canonicalId, 'gaia-dr3:123456789');
  assert.equal(star.raHours, 1);
  assert.equal(star.distanceParsec, 50);
  assert.equal(star.distanceSource, 'parallax');
  assert.equal(star.colorIndex, 0.65);
  assert.equal(star.gaiaId, '123456789');
  assert.equal(star.catalogId, 'gaia-dr3:123456789');
});

test('platform identity fields accept ownership and story metadata without renderer coupling', () => {
  const star = createCanonicalStar({
    id: 'vega-row',
    hip: '91262',
    properName: 'Vega',
    raHours: 18.615649,
    decDegrees: 38.78369,
    distanceParsec: 7.68,
    magnitude: 0.03,
    spectralType: 'A0V',
    constellation: 'Lyr',
    temperature: 9602,
    luminosity: 40.12,
    ownerCount: 2,
    storyCount: 4,
    certificateCount: 1,
    ownershipStatus: 'owned',
    assetVersion: 'v2',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  }, { source: 'hyg' });

  assert.equal(star.slug, 'vega-hip-91262');
  assert.equal(star.temperature, 9602);
  assert.equal(star.luminosity, 40.12);
  assert.equal(star.ownerCount, 2);
  assert.equal(star.storyCount, 4);
  assert.equal(star.certificateCount, 1);
  assert.equal(star.ownershipStatus, 'owned');
  assert.equal(star.assetVersion, 'v2');
  assert.equal(star.createdAt, '2026-01-01T00:00:00.000Z');
  assert.equal(star.updatedAt, '2026-01-02T00:00:00.000Z');
});

test('slug generation is stable and URL-safe', () => {
  assert.equal(createStarSlug({ name: 'Alpha Centauri A', catalogId: 'hip:71683' }), 'alpha-centauri-a-hip-71683');
  assert.equal(createStarSlug({ slug: '  Custom Star! ' }), 'custom-star');
});

test('HYG sentinel and invalid distances become unknown', () => {
  assert.equal(normalizeDistanceParsec(100000, 'hyg'), null);
  assert.equal(normalizeDistanceParsec(-4, 'hyg'), null);
  assert.equal(normalizeDistanceParsec(0, 'hyg'), null);
});

test('invalid coordinates and missing magnitude are rejected', () => {
  assert.equal(createCanonicalStar({ id: 'bad', raHours: 2, decDegrees: 91, magnitude: 2 }, { source: 'hyg' }), null);
  assert.equal(createCanonicalStar({ id: 'bad', raHours: 2, decDegrees: 20 }, { source: 'hyg' }), null);
});

test('bundled HYG core fully satisfies the canonical contract', () => {
  const catalogPath = path.resolve(__dirname, '../assets/catalog/hyg-core-v1.json');
  const rows = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const canonicalIds = new Set();
  let unknownDistanceCount = 0;

  rows.forEach((row) => {
    const [id, hip, hd, properName, raHours, decDegrees, distanceParsec, magnitude, spectralType, constellation] = row;
    const star = createCanonicalStar({
      id,
      hip,
      hd,
      properName,
      raHours,
      decDegrees,
      distanceParsec,
      magnitude,
      spectralType,
      constellation,
    }, { source: 'hyg', sourceId: id, sourceCatalogVersion: '4.1' });

    assert.ok(star, `HYG row ${id} must normalize`);
    assert.equal(star.coordinateFrame, STAR_COORDINATE_FRAME);
    assert.equal(star.epoch, STAR_EPOCH);
    assert.equal(canonicalIds.has(star.canonicalId), false, `Duplicate canonical ID: ${star.canonicalId}`);
    canonicalIds.add(star.canonicalId);
    if (star.distanceParsec == null) unknownDistanceCount += 1;
  });

  assert.equal(rows.length, 10000);
  assert.equal(canonicalIds.size, rows.length);
  assert.ok(unknownDistanceCount > 0);
});

test('bundled catalog manifest matches the packaged data', () => {
  const catalogPath = path.resolve(__dirname, '../assets/catalog/hyg-core-v1.json');
  const manifestPath = path.resolve(__dirname, '../assets/catalog/hyg-core-v1.manifest.json');
  const catalogBuffer = fs.readFileSync(catalogPath);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const digest = crypto.createHash('sha256').update(catalogBuffer).digest('hex');
  const rows = JSON.parse(catalogBuffer.toString('utf8'));

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.starSchemaVersion, 1);
  assert.equal(manifest.coordinateFrame, STAR_COORDINATE_FRAME);
  assert.equal(manifest.epoch, STAR_EPOCH);
  assert.equal(manifest.recordCount, rows.length);
  assert.equal(manifest.sha256, digest);
  assert.ok(Number.isFinite(Date.parse(manifest.generatedAt)));
});
