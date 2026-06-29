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

const {
  buildEnabledSkyLayers,
  buildOverlayStars,
  buildSkyRenderPlan,
  buildStarBatches,
  getSkyRenderLayerBudgets,
} = loadApplicationModule('../src/sky/skyRenderPlan.js');

const basePlanOptions = {
  stars: [],
  selectedStar: null,
  ownedIdSet: new Set(),
  qualityLevel: 'medium',
  zoom: 1,
  nightVision: false,
  coordinateMode: 'equatorial',
  observerLatitude: 37,
  lstDegrees: 120,
  virtualCenter: { ra: 180, dec: 0 },
  layout: { width: 1000, height: 600 },
  dsoData: [],
  planetData: [],
  constellations: {},
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
};

test('star batches group equal color and quantized radius together', () => {
  const batches = buildStarBatches([
    { id: 'a', color: '#fff', radius: 1.13 },
    { id: 'b', color: '#fff', radius: 1.24 },
    { id: 'c', color: '#f00', radius: 1.13 },
  ]);
  assert.equal(batches.length, 2);
  assert.equal(batches.find((batch) => batch.color === '#fff').stars.length, 2);
});

test('overlay stars keep owned and label-worthy proper stars within a cap', () => {
  const stars = Array.from({ length: 40 }, (_, index) => ({
    id: `star-${index}`,
    owned: index === 0,
    proper: index > 0,
  }));
  const overlayStars = buildOverlayStars(stars, { showLabels: true, zoom: 1, limit: 12 });
  assert.equal(overlayStars.length, 12);
  assert.equal(overlayStars[0].id, 'star-0');
});

test('sky render plan prepares stars, layers, visual budget and node estimate together', () => {
  const plan = buildSkyRenderPlan({
    ...basePlanOptions,
    stars: [
      { id: 'sol', ra: 12, dec: 0, mag: -26, spect: 'G', proper: 'Sol' },
      { id: 'sirius', ra: 12.05, dec: 0.5, mag: -1.46, spect: 'A', proper: 'Sirius' },
    ],
    dsoData: [{ id: 'm1', ra: 12, dec: 0 }],
    planetData: [{ id: 'mars', ra: 12, dec: 0 }],
    showLabels: true,
  });
  assert.equal(plan.renderedStars.length, 2);
  assert.ok(plan.starBatches.length > 0);
  assert.equal(plan.overlayStars.length, 2);
  assert.equal(plan.visibleDSOs.length, 1);
  assert.equal(plan.visiblePlanets.length, 1);
  assert.equal(plan.visualLayerBudget.deepAtmosphere, true);
  assert.equal(plan.enabledLayers.dsos, true);
  assert.equal(plan.layerRenderBudgets.dsos.maxVisible, 12);
  assert.ok(plan.layerNodeEstimate.total > 0);
});

test('enabled layer policy disables optional low-quality label and mythology layers', () => {
  const enabledLayers = buildEnabledSkyLayers({
    qualityLevel: 'low',
    coordinateMode: 'horizontal',
    showGrid: true,
    showNebula: true,
    showDSOs: true,
    showPlanets: true,
    showConstellations: true,
    showConstellationLabels: true,
    showConstellationBoundaries: true,
    showMythology: true,
  });

  assert.equal(enabledLayers.grid, true);
  assert.equal(enabledLayers.milkyWay, true);
  assert.equal(enabledLayers.nebula, false);
  assert.equal(enabledLayers.constellationLabels, false);
  assert.equal(enabledLayers.constellationBoundaries, false);
  assert.equal(enabledLayers.mythology, false);
});

test('layer budgets expose per-layer limits for renderer scheduling', () => {
  const lowBudget = getSkyRenderLayerBudgets('low');
  const highBudget = getSkyRenderLayerBudgets('high');
  assert.ok(lowBudget.stars.maxVisible < highBudget.stars.maxVisible);
  assert.ok(lowBudget.constellations.maxSegments < highBudget.constellations.maxSegments);
  assert.equal(lowBudget.shootingStars.enabled, false);
  assert.equal(highBudget.shootingStars.enabled, true);
});
