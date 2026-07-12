const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveThreeExampleModule } = require('../build/resolveThreeExampleModule.cjs');

test('expo-three loader imports resolve to canonical Three.js module paths', () => {
  for (const loader of ['ColladaLoader', 'GLTFLoader', 'MTLLoader', 'OBJLoader']) {
    assert.equal(
      resolveThreeExampleModule(`three/examples/jsm/loaders/${loader}`),
      `three/examples/jsm/loaders/${loader}.js`
    );
  }
});

test('Metro leaves unrelated package requests unchanged', () => {
  assert.equal(resolveThreeExampleModule('three'), 'three');
  assert.equal(resolveThreeExampleModule('expo-three'), 'expo-three');
});
