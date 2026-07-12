const THREE_EXAMPLE_LOADERS = new Set([
  'three/examples/jsm/loaders/ColladaLoader',
  'three/examples/jsm/loaders/GLTFLoader',
  'three/examples/jsm/loaders/MTLLoader',
  'three/examples/jsm/loaders/OBJLoader',
]);

function resolveThreeExampleModule(moduleName) {
  return THREE_EXAMPLE_LOADERS.has(moduleName) ? `${moduleName}.js` : moduleName;
}

module.exports = { resolveThreeExampleModule };
