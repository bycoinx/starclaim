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
  SKY_LAYER_BUDGET,
  getSkyVisualLayerBudget,
  buildBoundarySegments,
  buildConstellationSegments,
  buildSkyLayerRenderSet,
  countSegments,
  countFeatureSegments,
  isLayerPointVisible,
} = loadApplicationModule('../src/sky/skyLayerRenderSet.js');

const baseOptions = {
  dsoData: [],
  planetData: [],
  constellations: {},
  mythologyAssets: {},
  showDSOs: true,
  showPlanets: true,
  showConstellations: true,
  showConstellationLabels: true,
  showConstellationBoundaries: true,
  showMythology: true,
  qualityLevel: 'medium',
  zoom: 1,
  virtualCenter: { ra: 180, dec: 0 },
};

function buildFeature(id, raDegrees, decDegrees) {
  return {
    id,
    geometry: {
      type: 'MultiLineString',
      coordinates: [[[raDegrees, decDegrees], [raDegrees + 1, decDegrees + 1]]],
    },
    properties: { name: id },
  };
}

test('point visibility uses RA center and handles wraparound', () => {
  const viewport = { centerRaDegrees: 358, centerDecDegrees: 0, halfFovX: 12, halfFovY: 12 };
  assert.equal(isLayerPointVisible(23.9, 0, viewport), true);
  assert.equal(isLayerPointVisible(12, 0, viewport), false);
});

test('visual layer budget separates expensive sky effects by quality', () => {
  assert.deepEqual(getSkyVisualLayerBudget('low'), {
    deepAtmosphere: true,
    nebula: false,
    milkyWay: true,
    milkyWaySampleStep: 3,
    shootingStars: false,
  });
  assert.equal(getSkyVisualLayerBudget('medium').milkyWaySampleStep, 3);
  assert.equal(getSkyVisualLayerBudget('medium').shootingStars, false);
  assert.equal(getSkyVisualLayerBudget('high').shootingStars, true);
  assert.equal(getSkyVisualLayerBudget('unknown'), getSkyVisualLayerBudget('medium'));
});

test('layer render set applies quality budgets', () => {
  const result = buildSkyLayerRenderSet({
    ...baseOptions,
    dsoData: Array.from({ length: 40 }, (_, index) => ({
      id: `dso-${index}`,
      ra: 12 + (index * 0.01),
      dec: index * 0.01,
    })),
    planetData: Array.from({ length: 12 }, (_, index) => ({
      id: `planet-${index}`,
      ra: 12 + (index * 0.01),
      dec: index * 0.01,
    })),
    constellations: {
      labels: {
        features: Array.from({ length: 20 }, (_, index) => ({
          id: `label-${index}`,
          geometry: { type: 'Point', coordinates: [180 + index * 0.05, 0] },
          properties: { rank: index % 3 },
        })),
      },
      lines: {
        features: Array.from({ length: 40 }, (_, index) => buildFeature(`line-${index}`, 180 + index * 0.05, 0)),
      },
      boundaries: {
        features: Array.from({ length: 20 }, (_, index) => ({
          id: `boundary-${index}`,
          geometry: { type: 'Polygon', coordinates: [[[180 + index * 0.05, 0], [181, 0], [181, 1]]] },
        })),
      },
    },
  });
  assert.equal(result.visibleDSOs.length, SKY_LAYER_BUDGET.medium.dsos);
  assert.equal(result.visiblePlanets.length, SKY_LAYER_BUDGET.medium.planets);
  assert.equal(result.visibleConstellationLabels.length, SKY_LAYER_BUDGET.medium.constellationLabels);
  assert.equal(result.visibleConstellationLines.length, SKY_LAYER_BUDGET.medium.constellationLines);
  assert.equal(result.visibleBoundaries.length, SKY_LAYER_BUDGET.medium.constellationBoundaries);
  assert.ok(result.visibleConstellationLineSegments.length <= SKY_LAYER_BUDGET.medium.constellationSegments);
  assert.ok(result.visibleBoundarySegments.length <= SKY_LAYER_BUDGET.medium.boundarySegments);
});

test('disabled layers return empty lists without scanning output', () => {
  const result = buildSkyLayerRenderSet({
    ...baseOptions,
    dsoData: [{ id: 'm1', ra: 12, dec: 0 }],
    planetData: [{ id: 'mars', ra: 12, dec: 0 }],
    showDSOs: false,
    showPlanets: false,
    showConstellations: false,
    showConstellationLabels: false,
    showConstellationBoundaries: false,
    showMythology: false,
  });
  assert.deepEqual(result.visibleDSOs, []);
  assert.deepEqual(result.visiblePlanets, []);
  assert.deepEqual(result.visibleConstellationLines, []);
  assert.deepEqual(result.visibleConstellationLineSegments, []);
  assert.deepEqual(result.visibleConstellationLabels, []);
  assert.deepEqual(result.visibleBoundaries, []);
  assert.deepEqual(result.visibleBoundarySegments, []);
  assert.deepEqual(result.visibleMythologyKeys, []);
});

test('horizontal sensor mode keeps visible constellation lines in view', () => {
  const result = buildSkyLayerRenderSet({
    ...baseOptions,
    constellations: {
      lines: {
        features: [buildFeature('east-horizon', 90, 0)],
      },
    },
    showConstellations: true,
    coordinateMode: 'horizontal',
    observerLatitude: 0,
    lstDegrees: 0,
    virtualCenter: { ra: 90, dec: 0 },
  });

  assert.ok(result.visibleConstellationLines.length > 0);
  assert.ok(result.visibleConstellationLineSegments.length > 0);
});

test('segment counter handles multiline and polygon features', () => {
  assert.equal(countFeatureSegments([
    buildFeature('orion', 180, 0),
    { geometry: { type: 'Polygon', coordinates: [[[180, 0], [181, 0], [181, 1]]] } },
  ]), 3);
});

test('path segment builders flatten geometry before Skia worklets', () => {
  const regular = buildFeature('orion', 180, 0);
  const emphasized = {
    ...buildFeature('lyra', 181, 1),
    properties: { name: 'Lyra' },
  };
  const constellationSegments = buildConstellationSegments(
    [regular, emphasized],
    { constellation: 'lyra' },
    10,
  );
  const boundarySegments = buildBoundarySegments([
    { geometry: { type: 'Polygon', coordinates: [[[180, 0], [181, 0], [181, 1]]] } },
  ], 10);
  assert.equal(countSegments(constellationSegments), 2);
  assert.equal(constellationSegments.filter((segment) => segment.emphasized).length, 1);
  assert.equal(countSegments(boundarySegments), 2);
});
