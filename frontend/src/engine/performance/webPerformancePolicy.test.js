import {
  WEB_PERFORMANCE_PROFILES,
  applyPerformanceTelemetry,
  createPerformanceState,
  evaluateWebPerformance,
  getDeviceMaximumProfile,
} from "./webPerformancePolicy";

describe("web performance policy", () => {
  test("defines 2D and 3D budgets in every shared profile", () => {
    expect(WEB_PERFORMANCE_PROFILES.low).toEqual(expect.objectContaining({
      canvasStars: 120,
      galaxyStars: 6000,
      observatoryStars: 2500,
      postProcessing: false,
    }));
    expect(WEB_PERFORMANCE_PROFILES.high).toEqual(expect.objectContaining({
      canvasStars: 500,
      galaxyStars: 18000,
      observatoryStars: 12000,
      postProcessing: true,
    }));
  });

  test("selects one device ceiling from pixels, memory, cores and catalog size", () => {
    expect(getDeviceMaximumProfile({ scenePixels: 4_100_000 })).toBe("low");
    expect(getDeviceMaximumProfile({ deviceMemoryGB: 4 })).toBe("medium");
    expect(getDeviceMaximumProfile({ hardwareConcurrency: 2 })).toBe("low");
    expect(getDeviceMaximumProfile({ catalogObjectCount: 16000 })).toBe("medium");
    expect(getDeviceMaximumProfile({ scenePixels: 1_000_000, deviceMemoryGB: 8, hardwareConcurrency: 8 })).toBe("high");
  });

  test("degrades for sustained frame pressure or immediate hard pressure", () => {
    const slow = evaluateWebPerformance({
      current: "high", maximum: "high", fps: 30, frameTimeMs: 33, lowSamples: 2,
    });
    expect(slow).toEqual(expect.objectContaining({ level: "medium", pressure: "frame" }));
    const memory = evaluateWebPerformance({
      current: "medium", maximum: "high", fps: 60, heapPressure: 0.9,
    });
    expect(memory).toEqual(expect.objectContaining({ level: "low", pressure: "memory" }));
    const objects = evaluateWebPerformance({
      current: "high", maximum: "high", fps: 60, renderedObjects: 25000,
    });
    expect(objects).toEqual(expect.objectContaining({ level: "medium", pressure: "objects" }));
  });

  test("recovers gradually without exceeding the device ceiling", () => {
    let state = createPerformanceState("medium", "low");
    for (let index = 0; index < 8; index += 1) {
      state = applyPerformanceTelemetry(state, { fps: 60, frameTimeMs: 16, renderedObjects: 100 });
    }
    expect(state.level).toBe("medium");
    for (let index = 0; index < 8; index += 1) {
      state = applyPerformanceTelemetry(state, { fps: 60, frameTimeMs: 16, renderedObjects: 100 });
    }
    expect(state.level).toBe("medium");
  });
});
