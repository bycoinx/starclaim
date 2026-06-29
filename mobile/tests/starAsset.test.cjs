const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
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
  STAR_ASSET_SCHEMA_VERSION,
  STAR_ASSET_VARIANTS,
  buildStarAssetPath,
  createStarAsset,
  createStarAssetCacheKey,
  createStarAssetPaths,
  getStarAssetVariant,
  normalizeAssetSlug,
} = loadApplicationModule('../../shared/starAsset.js');

test('asset slug normalization is stable and URL-safe', () => {
  assert.equal(normalizeAssetSlug('  Alpha Centauri A / HIP 71683  '), 'alpha-centauri-a-hip-71683');
  assert.equal(normalizeAssetSlug('Cafe Nebula 01'), 'cafe-nebula-01');
});

test('default star asset paths follow the catalog convention', () => {
  const paths = createStarAssetPaths('Sirius HIP 32349');

  assert.equal(paths.previewImage, 'assets/stars/catalog/sirius-hip-32349/preview.webp');
  assert.equal(paths.heroImage, 'assets/stars/catalog/sirius-hip-32349/hero.webp');
  assert.equal(paths.deepImage, 'assets/stars/catalog/sirius-hip-32349/deep.webp');
  assert.equal(paths.textureImage, 'assets/stars/catalog/sirius-hip-32349/texture.webp');
  assert.equal(paths.certificateImage, 'assets/stars/catalog/sirius-hip-32349/certificate.webp');
  assert.equal(paths.storyCoverImage, 'assets/stars/catalog/sirius-hip-32349/story-cover.webp');
  assert.equal(paths.model3D, 'assets/stars/catalog/sirius-hip-32349/model.glb');
  assert.equal(paths.metadataPath, 'assets/stars/catalog/sirius-hip-32349/metadata.json');
});

test('CDN base URL and custom root can be applied without changing the slug contract', () => {
  const pathFromCdn = buildStarAssetPath('Vega HIP 91262', STAR_ASSET_VARIANTS.hero, {
    root: '/starclaim/assets/',
    cdnBaseUrl: 'https://cdn.starclaim.test/',
  });

  assert.equal(pathFromCdn, 'https://cdn.starclaim.test/starclaim/assets/vega-hip-91262/hero.webp');
});

test('StarAsset can be created from a canonical StarIdentity', () => {
  const asset = createStarAsset({}, {
    canonicalId: 'hip:32349',
    slug: 'sirius-hip-32349',
    displayName: 'Sirius',
    assetVersion: 'v2',
  });

  assert.equal(asset.schemaVersion, STAR_ASSET_SCHEMA_VERSION);
  assert.equal(asset.starId, 'hip:32349');
  assert.equal(asset.slug, 'sirius-hip-32349');
  assert.equal(asset.version, 'v2');
  assert.equal(asset.cacheKey, 'hip:32349:sirius-hip-32349:v2');
  assert.equal(asset.previewImage, 'assets/stars/catalog/sirius-hip-32349/preview.webp');
  assert.equal(asset.metadataPath, 'assets/stars/catalog/sirius-hip-32349/metadata.json');
});

test('explicit asset paths override generated defaults', () => {
  const asset = createStarAsset({
    starId: 'gaia-dr3:123',
    slug: 'custom-blue-star',
    previewImage: 'custom/preview.webp',
    textureImage: 'custom/texture.webp',
    cacheKey: 'manual-cache-key',
  });

  assert.equal(asset.previewImage, 'custom/preview.webp');
  assert.equal(asset.textureImage, 'custom/texture.webp');
  assert.equal(asset.heroImage, 'assets/stars/catalog/custom-blue-star/hero.webp');
  assert.equal(asset.cacheKey, 'manual-cache-key');
});

test('cache key remains deterministic for generated and explicit assets', () => {
  assert.equal(createStarAssetCacheKey('hip:91262', 'Vega HIP 91262', 'v3'), 'hip:91262:vega-hip-91262:v3');
  assert.equal(createStarAsset({ starId: 'hip:91262', slug: 'Vega HIP 91262' }).cacheKey, 'hip:91262:vega-hip-91262:v1');
});

test('variant lookup returns the expected asset field', () => {
  const asset = createStarAsset({ starId: 'hip:91262', slug: 'vega-hip-91262' });

  assert.equal(getStarAssetVariant(asset, STAR_ASSET_VARIANTS.preview), asset.previewImage);
  assert.equal(getStarAssetVariant(asset, STAR_ASSET_VARIANTS.hero), asset.heroImage);
  assert.equal(getStarAssetVariant(asset, STAR_ASSET_VARIANTS.model3D), asset.model3D);
  assert.equal(getStarAssetVariant(asset, STAR_ASSET_VARIANTS.metadata), asset.metadataPath);
  assert.equal(getStarAssetVariant(asset, 'invalid'), null);
});

test('invalid asset path inputs fail loudly', () => {
  assert.throws(() => buildStarAssetPath('Sirius', 'thumbnail'), /Unsupported star asset variant/);
  assert.throws(() => buildStarAssetPath('', STAR_ASSET_VARIANTS.preview), /Star asset slug is required/);
  assert.throws(() => createStarAsset({ slug: 'missing-id' }), /StarAsset requires starId/);
});
