const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
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
  const previousLoader = Module._extensions['.js'];
  Module._extensions['.js'] = function transformApplicationDependency(moduleInstance, dependencyFilename) {
    const normalized = dependencyFilename.replace(/\\/g, '/');
    if (normalized.includes('/mobile/src/')) {
      const dependencySource = fs.readFileSync(dependencyFilename, 'utf8');
      const dependencyTransformed = transformSync(dependencySource, {
        filename: dependencyFilename,
        plugins: ['@babel/plugin-transform-modules-commonjs'],
      });
      moduleInstance._compile(dependencyTransformed.code, dependencyFilename);
      return;
    }
    previousLoader(moduleInstance, dependencyFilename);
  };
  try {
    loaded._compile(transformed.code, filename);
    return loaded.exports;
  } finally {
    Module._extensions['.js'] = previousLoader;
  }
}

const { parseGaiaBinaryTile, getVisibleGaiaSectorIds } = loadApplicationModule('../src/data/gaiaBinaryCatalog.js');

test('binary tile preserves 64-bit Gaia identity and astronomy fields', () => {
  const buffer = new ArrayBuffer(56);
  const view = new DataView(buffer);
  'SCB1'.split('').forEach((char, index) => view.setUint8(index, char.charCodeAt(0)));
  view.setUint16(4, 1, true);
  view.setUint16(6, 40, true);
  view.setUint32(8, 1, true);
  const sourceId = 123456789012345678n;
  view.setUint32(16, Number(sourceId & 0xffffffffn), true);
  view.setUint32(20, Number(sourceId >> 32n), true);
  view.setUint32(24, 42, true);
  view.setFloat32(32, 101.25, true);
  view.setFloat32(36, -16.5, true);
  view.setFloat32(40, 10, true);
  view.setFloat32(44, -1.2, true);
  view.setFloat32(48, 0.4, true);
  view.setFloat32(52, 100, true);
  const stars = parseGaiaBinaryTile(buffer, { [sourceId.toString()]: { properName: 'Fixture' } });
  assert.equal(stars[0].gaiaSourceId, sourceId.toString());
  assert.equal(stars[0].canonicalId, `gaia-dr3:${sourceId}`);
  assert.equal(stars[0].catalogId, `gaia-dr3:${sourceId}`);
  assert.equal(stars[0].gaiaId, sourceId.toString());
  assert.equal(stars[0].slug, `fixture-gaia-dr3-${sourceId}`);
  assert.equal(stars[0].properName, 'Fixture');
  assert.equal(stars[0].hip, '42');
});

test('visible sectors wrap cleanly across zero RA', () => {
  const ids = getVisibleGaiaSectorIds(359, 0, 30, 20);
  assert.ok(ids.includes('r23-d9'));
  assert.ok(ids.includes('r0-d9'));
  assert.equal(new Set(ids).size, ids.length);
});

test('production Gaia manifest and all binary tiles are internally consistent', () => {
  const root = path.resolve(__dirname, '../../backend/data/star_tiles_2d/gaia-dr3-hip-2d-v1');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const names = fs.readFileSync(path.join(root, manifest.names.path));
  assert.equal(crypto.createHash('sha256').update(names).digest('hex'), manifest.names.sha256);
  let starCount = 0;
  let byteCount = 0;
  for (const sector of manifest.sectors) {
    const bytes = fs.readFileSync(path.join(root, 'tiles', `${sector.id}.bin`));
    assert.equal(bytes.length, sector.bytes);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), sector.sha256);
    const stars = parseGaiaBinaryTile(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    assert.equal(stars.length, sector.count);
    starCount += stars.length;
    byteCount += bytes.length;
  }
  assert.equal(starCount, 50000);
  assert.equal(starCount, manifest.starCount);
  assert.equal(byteCount, manifest.tileBytes);
  assert.equal(manifest.tileCount, 432);
});
