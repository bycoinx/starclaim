const test = require('node:test');
const assert = require('node:assert/strict');
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
    const moduleSource = fs.readFileSync(moduleFilename, 'utf8');
    const moduleTransformed = transformSync(moduleSource, {
      filename: moduleFilename,
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    });
    return module._compile(moduleTransformed.code, moduleFilename);
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

const {
  STAR_RENDER_BUDGET,
  buildStarRenderSet,
} = loadApplicationModule('../src/sky/starRenderSet.js');

const {
  buildSkyRenderPlan,
} = loadApplicationModule('../src/sky/skyRenderPlan.js');

function buildStars(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `star-${index}`,
    canonicalId: `catalog:${index}`,
    hip: index + 1,
    ra: (index % 24),
    dec: ((index % 31) - 15) * 0.5,
    mag: index % 7,
    spect: index % 3 === 0 ? 'B' : 'G',
  }));
}

const baseOptions = {
  selectedStar: null,
  ownedIdSet: new Set(),
  qualityLevel: 'high',
  zoom: 1.2,
  nightVision: false,
  coordinateMode: 'equatorial',
  observerLatitude: 37,
  lstDegrees: 120,
  virtualCenter: { ra: 180, dec: 0 },
  layout: { width: 1000, height: 600 },
};

test('render set respects quality budget for regular stars', () => {
  const rendered = buildStarRenderSet({
    ...baseOptions,
    stars: buildStars(1000),
  });
  assert.ok(rendered.length <= STAR_RENDER_BUDGET.high);
});

test('owned and selected stars survive magnitude and viewport filtering', () => {
  const distantDimStar = {
    id: 'owned-dim',
    canonicalId: 'owned:dim',
    hip: 999,
    ra: 0,
    dec: 80,
    mag: 14,
    spect: 'M',
  };
  const selectedStar = {
    id: 'selected-dim',
    canonicalId: 'selected:dim',
    hip: 998,
    ra: 1,
    dec: -80,
    mag: 13,
    spect: 'M',
  };
  const rendered = buildStarRenderSet({
    ...baseOptions,
    stars: [distantDimStar, selectedStar, ...buildStars(30)],
    selectedStar,
    ownedIdSet: new Set(['999']),
  });
  assert.ok(rendered.some((star) => star.id === 'owned-dim' && star.owned));
  assert.ok(rendered.some((star) => star.id === 'selected-dim'));
});

test('regular stars are sorted by magnitude before budget slicing', () => {
  const rendered = buildStarRenderSet({
    ...baseOptions,
    stars: [
      { id: 'dim', ra: 12, dec: 0, mag: 6, spect: 'M' },
      { id: 'bright', ra: 12, dec: 1, mag: -1, spect: 'A' },
      { id: 'middle', ra: 12, dec: 2, mag: 2, spect: 'G' },
    ],
  });
  assert.deepEqual(rendered.map((star) => star.id), ['bright', 'middle', 'dim']);
});

test('horizontal mode annotates stars with altitude and azimuth', () => {
  const sirius = { id: 'sirius', ra: 6.752481, dec: -16.716116, mag: -1.46, spect: 'A' };
  const rendered = buildStarRenderSet({
    ...baseOptions,
    stars: [sirius],
    selectedStar: sirius,
    coordinateMode: 'horizontal',
  });
  assert.equal(rendered.length, 1);
  assert.ok(Number.isFinite(rendered[0].horizontalAz));
  assert.ok(Number.isFinite(rendered[0].horizontalAlt));
});

test('visual acceptance maps magnitude to stable star radius', () => {
  const rendered = buildStarRenderSet({
    ...baseOptions,
    stars: [
      { id: 'bright', ra: 12, dec: 0, mag: -1.4, spect: 'A' },
      { id: 'middle', ra: 12, dec: 1, mag: 3.5, spect: 'G' },
      { id: 'dim', ra: 12, dec: 2, mag: 8.8, spect: 'M' },
    ],
    zoom: 4,
  });
  const byId = Object.fromEntries(rendered.map((star) => [star.id, star]));
  assert.ok(byId.bright.radius > byId.middle.radius);
  assert.ok(byId.middle.radius > byId.dim.radius);
  assert.ok(byId.bright.radius <= 3.6);
  assert.ok(byId.dim.radius >= 0.5);
});

test('visual acceptance prefers BP-RP color and falls back to spectral type', () => {
  const rendered = buildStarRenderSet({
    ...baseOptions,
    stars: [
      { id: 'blue-index', ra: 12, dec: 0, mag: 1, bpRp: -0.35, spect: 'M' },
      { id: 'red-index', ra: 12, dec: 1, mag: 1, colorIndex: 1.65, spect: 'B' },
      { id: 'spectral-fallback', ra: 12, dec: 2, mag: 1, spect: 'K' },
    ],
  });
  const byId = Object.fromEntries(rendered.map((star) => [star.id, star]));
  assert.equal(byId['blue-index'].color, '#9DBBFF');
  assert.equal(byId['red-index'].color, '#FF9B82');
  assert.equal(byId['spectral-fallback'].color, '#FFD09A');
});

test('visual acceptance keeps night vision stars in red-safe palette', () => {
  const rendered = buildStarRenderSet({
    ...baseOptions,
    nightVision: true,
    stars: [
      { id: 'blue', ra: 12, dec: 0, mag: 1, bpRp: -0.35, spect: 'B' },
      { id: 'red', ra: 12, dec: 1, mag: 4, bpRp: 1.65, spect: 'M' },
    ],
  });
  assert.deepEqual([...new Set(rendered.map((star) => star.color))], ['#FF514A']);
});

test('visual acceptance gates atmospheric layers by quality profile', () => {
  const plan = (qualityLevel) => buildSkyRenderPlan({
    ...baseOptions,
    stars: buildStars(30),
    qualityLevel,
    dsoData: [],
    planetData: [],
    constellations: {
      lines: { features: [] },
      labels: { features: [] },
      boundaries: { features: [] },
    },
    mythologyAssets: {},
    showLabels: false,
    showGrid: true,
    showNebula: true,
    showDSOs: true,
    showPlanets: true,
    showConstellations: true,
    showConstellationLabels: true,
    showConstellationBoundaries: true,
    showMythology: true,
  });

  const low = plan('low');
  const medium = plan('medium');
  const high = plan('high');

  assert.equal(low.enabledLayers.deepAtmosphere, true);
  assert.equal(low.enabledLayers.nebula, false);
  assert.equal(low.enabledLayers.milkyWay, true);
  assert.equal(low.enabledLayers.shootingStars, false);
  assert.equal(medium.enabledLayers.nebula, true);
  assert.equal(medium.enabledLayers.shootingStars, false);
  assert.equal(high.enabledLayers.shootingStars, true);
  assert.equal(high.visualLayerBudget.milkyWaySampleStep < low.visualLayerBudget.milkyWaySampleStep, true);
});
