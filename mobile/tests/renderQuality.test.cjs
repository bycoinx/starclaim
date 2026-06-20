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
  getBaseRenderQuality,
  updateAdaptiveQuality,
  estimateLayerNodes,
} = loadApplicationModule('../src/utils/renderQuality.js');

test('base profile protects dense or high-pixel scenes', () => {
  assert.equal(getBaseRenderQuality({ pixelRatio: 2, scenePixels: 1_000_000, catalogStarCount: 10_000 }), 'high');
  assert.equal(getBaseRenderQuality({ pixelRatio: 4, scenePixels: 3_000_000, catalogStarCount: 10_000 }), 'medium');
  assert.equal(getBaseRenderQuality({ pixelRatio: 3, scenePixels: 4_500_000, catalogStarCount: 10_000 }), 'low');
});

test('quality degrades only after sustained low FPS', () => {
  let state = { level: 'high', lowSamples: 0, highSamples: 0 };
  for (let index = 0; index < 2; index += 1) {
    state = updateAdaptiveQuality({ current: state.level, maximum: 'high', fps: 35, lowSamples: state.lowSamples, highSamples: state.highSamples });
  }
  assert.equal(state.level, 'high');
  state = updateAdaptiveQuality({ current: state.level, maximum: 'high', fps: 35, lowSamples: state.lowSamples, highSamples: state.highSamples });
  assert.equal(state.level, 'medium');
});

test('quality recovers slowly and never exceeds the device maximum', () => {
  let state = { level: 'low', lowSamples: 0, highSamples: 0 };
  for (let index = 0; index < 8; index += 1) {
    state = updateAdaptiveQuality({ current: state.level, maximum: 'medium', fps: 60, lowSamples: state.lowSamples, highSamples: state.highSamples });
  }
  assert.equal(state.level, 'medium');
  for (let index = 0; index < 10; index += 1) {
    state = updateAdaptiveQuality({ current: state.level, maximum: 'medium', fps: 60, lowSamples: state.lowSamples, highSamples: state.highSamples });
  }
  assert.equal(state.level, 'medium');
});

test('layer telemetry reports a stable total', () => {
  const estimate = estimateLayerNodes({
    renderedStars: [{ proper: 'Sirius', owned: true }, { proper: '', owned: false }],
    showGrid: true,
    showNebula: true,
    showConstellations: true,
    showConstellationLabels: true,
    showConstellationBoundaries: false,
    showDSOs: true,
    showPlanets: true,
    showMythology: false,
    coordinateMode: 'equatorial',
    constellationLines: 4,
    constellationLabels: 2,
    constellationBoundaries: 8,
    dsoCount: 1,
    planetCount: 1,
    mythologyCount: 0,
    quality: 'high',
  });
  assert.equal(estimate.layers.stars, 4);
  assert.equal(estimate.total, Object.values(estimate.layers).reduce((sum, value) => sum + value, 0));
});
