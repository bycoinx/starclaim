import {
  PERFORMANCE_PROFILES,
  evaluatePerformance,
  getDeviceMaximumProfile,
} from '../performancePolicy';

describe('shared performance policy', () => {
  test('exposes 2D and 3D budgets from the same profiles', () => {
    expect(PERFORMANCE_PROFILES.low).toEqual(expect.objectContaining({ skyStars: 100, voyageStars: 3500 }));
    expect(PERFORMANCE_PROFILES.high).toEqual(expect.objectContaining({ skyStars: 380, voyageStars: 10000 }));
  });

  test('selects a device ceiling from pixels, catalog size and memory', () => {
    expect(getDeviceMaximumProfile({ scenePixels: 4_100_000 })).toBe('low');
    expect(getDeviceMaximumProfile({ catalogObjectCount: 16_000 })).toBe('medium');
    expect(getDeviceMaximumProfile({ scenePixels: 1_000_000, catalogObjectCount: 5000 })).toBe('high');
  });

  test('degrades consistently for fps, memory or object pressure', () => {
    const fps = evaluatePerformance({ current: 'high', maximum: 'high', fps: 30, lowSamples: 2 });
    expect(fps).toEqual(expect.objectContaining({ level: 'medium', pressure: 'fps' }));
    const memory = evaluatePerformance({ current: 'medium', maximum: 'high', fps: 60, heapPressure: 0.9 });
    expect(memory).toEqual(expect.objectContaining({ level: 'low', pressure: 'memory' }));
    const objects = evaluatePerformance({ current: 'high', maximum: 'high', fps: 60, renderedObjects: 12000 });
    expect(objects).toEqual(expect.objectContaining({ level: 'medium', pressure: 'objects' }));
  });
});
