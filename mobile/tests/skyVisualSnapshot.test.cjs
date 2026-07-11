const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const { transformSync } = require('@babel/core');

function loadApplicationModule(relativePath) {
  const filename = path.resolve(__dirname, relativePath);
  const previousLoader = require.extensions['.js'];
  require.extensions['.js'] = (module, moduleFilename) => {
    if (!moduleFilename.includes(`${path.sep}src${path.sep}`)) {
      return previousLoader(module, moduleFilename);
    }
    const source = fs.readFileSync(moduleFilename, 'utf8');
    const transformed = transformSync(source, {
      filename: moduleFilename,
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    });
    return module._compile(transformed.code, moduleFilename);
  };
  const source = fs.readFileSync(filename, 'utf8');
  const transformed = transformSync(source, {
    filename,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  try {
    loaded._compile(transformed.code, filename);
    return loaded.exports;
  } finally {
    require.extensions['.js'] = previousLoader;
  }
}

const { buildSkyRenderPlan } = loadApplicationModule('../src/sky/skyRenderPlan.js');
const { buildSkyVisualSnapshotSvg } = loadApplicationModule('../src/sky/skyVisualSnapshot.js');
const { SKY_REFERENCE_VIEWPORTS } = loadApplicationModule('../src/sky/skyVisualQuality.js');

const BASELINE_HASHES = Object.freeze({
  'compact-phone': 'c1cf559af10a9711ee00bef05cc067d8ad277a66191f1ddbcfff63d5dc3ba7cd',
  'mid-phone': 'd1181218abd7a3e40ba3b2f2a2fd10b3d24b91bb4f138c8cd0d5511537afd868',
  'large-phone': 'd2ad0c328e4ea5850e5003ac09c9a20ad982f86505d7c83fa66eae1fac2410ac',
});

const referenceStars = [
  { id: 'sirius', canonicalId: 'hip:32349', ra: 6.752481, dec: -16.716116, mag: -1.46, spect: 'A', proper: 'Sirius' },
  { id: 'vega', canonicalId: 'hip:91262', ra: 18.615649, dec: 38.783689, mag: 0.03, bpRp: 0.0, proper: 'Vega' },
  { id: 'betelgeuse', canonicalId: 'hip:27989', ra: 5.919529, dec: 7.407064, mag: 0.42, bpRp: 1.85, proper: 'Betelgeuse' },
  { id: 'rigel', canonicalId: 'hip:24436', ra: 5.242298, dec: -8.20164, mag: 0.13, bpRp: -0.03, proper: 'Rigel' },
  { id: 'dim-reference', canonicalId: 'ref:dim', ra: 6.3, dec: -3.2, mag: 8.4, spect: 'K' },
];

const basePlanOptions = {
  selectedStar: null,
  ownedIdSet: new Set(),
  nightVision: false,
  coordinateMode: 'equatorial',
  observerLatitude: 37,
  lstDegrees: 120,
  dsoData: [],
  planetData: [],
  constellations: {},
  mythologyAssets: {},
  showLabels: true,
  showGrid: true,
  showNebula: true,
  showDSOs: true,
  showPlanets: true,
  showConstellations: true,
  showConstellationLabels: true,
  showConstellationBoundaries: true,
  showMythology: true,
};

function hashSvg(svg) {
  return crypto.createHash('sha256').update(svg).digest('hex');
}

test('reference visual snapshots match the three device-class baselines', () => {
  SKY_REFERENCE_VIEWPORTS.forEach((viewport) => {
    const virtualCenter = { ra: 95, dec: -6 };
    const zoom = viewport.qualityLevel === 'low' ? 1.1 : 2.4;
    const renderPlan = buildSkyRenderPlan({
      ...basePlanOptions,
      stars: referenceStars,
      qualityLevel: viewport.qualityLevel,
      layout: { width: viewport.width, height: viewport.height },
      virtualCenter,
      zoom,
    });
    const svg = buildSkyVisualSnapshotSvg({
      id: viewport.id,
      renderPlan,
      viewport,
      virtualCenter,
      zoom,
    });

    assert.match(svg, /^<svg /);
    assert.match(svg, /<circle /);
    assert.equal(hashSvg(svg), BASELINE_HASHES[viewport.id], viewport.id);
  });
});
