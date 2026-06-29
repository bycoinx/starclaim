const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildTapStarIndex,
  findNearestIndexedStar,
  getNeighborTapCellKeys,
  getTapCellKey,
} = require('../src/sky/skyInteractionIndex');

test('tap cell keys are stable and include neighboring cells', () => {
  assert.equal(getTapCellKey(57, 113), '1:2');
  const keys = getNeighborTapCellKeys(57, 113);
  assert.equal(keys.length, 9);
  assert.ok(keys.includes('1:2'));
  assert.ok(keys.includes('0:1'));
  assert.ok(keys.includes('2:3'));
});

test('tap index selects nearest star from local cell candidates', () => {
  const stars = [
    { id: 'far' },
    { id: 'near' },
    { id: 'outside' },
  ];
  const positions = {
    far: { x: 92, y: 86 },
    near: { x: 105, y: 98 },
    outside: { x: 900, y: 900 },
  };

  const index = buildTapStarIndex({
    stars,
    width: 300,
    height: 200,
    projectStar: (star) => positions[star.id],
  });

  assert.equal(index.projectedStars.length, 2);
  assert.equal(findNearestIndexedStar(index, 103, 100)?.id, 'near');
});

test('tap index filters below-horizon stars when requested', () => {
  const stars = [
    { id: 'above' },
    { id: 'below' },
  ];
  const index = buildTapStarIndex({
    stars,
    width: 300,
    height: 200,
    hideBelowHorizon: true,
    projectStar: (star) => ({
      x: star.id === 'above' ? 100 : 104,
      y: 100,
      skyAltitude: star.id === 'above' ? 12 : -3,
    }),
  });

  assert.equal(index.projectedStars.length, 1);
  assert.equal(findNearestIndexedStar(index, 104, 100)?.id, 'above');
});
