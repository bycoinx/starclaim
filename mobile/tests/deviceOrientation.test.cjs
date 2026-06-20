const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const { transformSync } = require('@babel/core');

function loadApplicationModule(relativePath) {
  const filename = path.resolve(__dirname, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const transformed = transformSync(source, {
    filename,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(transformed.code, filename);
  return loaded.exports;
}

const {
  SCREEN_ORIENTATION,
  adjustHeadingForScreen,
  getScreenTilt,
} = loadApplicationModule('../src/utils/deviceOrientation.js');

test('heading follows the physical top edge in each screen orientation', () => {
  assert.equal(adjustHeadingForScreen(10, SCREEN_ORIENTATION.PORTRAIT_UP), 10);
  assert.equal(adjustHeadingForScreen(10, SCREEN_ORIENTATION.PORTRAIT_DOWN), 190);
  assert.equal(adjustHeadingForScreen(10, SCREEN_ORIENTATION.LANDSCAPE_LEFT), 100);
  assert.equal(adjustHeadingForScreen(10, SCREEN_ORIENTATION.LANDSCAPE_RIGHT), 280);
});

test('heading correction wraps around north', () => {
  assert.equal(adjustHeadingForScreen(350, SCREEN_ORIENTATION.LANDSCAPE_LEFT), 80);
});

test('tilt uses the active landscape axis and remains clamped', () => {
  assert.equal(getScreenTilt(0, 100, SCREEN_ORIENTATION.LANDSCAPE_LEFT), 10);
  assert.equal(getScreenTilt(0, -100, SCREEN_ORIENTATION.LANDSCAPE_RIGHT), 10);
  assert.equal(getScreenTilt(300, 0, SCREEN_ORIENTATION.PORTRAIT_UP), 90);
});
