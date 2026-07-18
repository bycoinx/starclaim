import { RENDERER_EVENTS } from "../renderers/rendererContract";
import {
  RUNTIME_STATES,
  WebCelestialRuntime,
  normalizeRendererTelemetry,
} from "./WebCelestialRuntime";
import {
  getWebRuntimeSnapshots,
  registerWebCelestialRuntime,
  resetWebRuntimeRegistryForTests,
  subscribeWebRuntimeRegistry,
} from "./webRuntimeRegistry";

function rendererEvent(event, telemetry = {}) {
  return { event, rendererId: "background", kind: "2d", telemetry };
}

describe("web celestial runtime", () => {
  afterEach(() => resetWebRuntimeRegistryForTests());

  test("maps renderer events onto one observable lifecycle", () => {
    const states = [];
    const runtime = new WebCelestialRuntime({ rendererId: "background", kind: "2d" });
    runtime.subscribe((snapshot) => states.push(snapshot.state));

    runtime.handleRendererEvent(rendererEvent(RENDERER_EVENTS.INITIALIZE));
    runtime.handleRendererEvent(rendererEvent(RENDERER_EVENTS.RENDER));
    runtime.handleRendererEvent(rendererEvent(RENDERER_EVENTS.DISPOSE));

    expect(states).toEqual([
      RUNTIME_STATES.INITIALIZING,
      RUNTIME_STATES.READY,
      RUNTIME_STATES.RUNNING,
      RUNTIME_STATES.DISPOSED,
    ]);
  });

  test("normalizes 2D and 3D telemetry into the same snapshot", () => {
    const onTelemetry = jest.fn();
    const runtime = new WebCelestialRuntime({
      rendererId: "galaxy",
      kind: "3d",
      callbacks: { onTelemetry },
      now: () => 250,
    });
    runtime.reportTelemetry({ fps: 58, frameTimeMs: 17.2, renderedObjects: 900, geometries: 12 });

    expect(runtime.getSnapshot().telemetry).toEqual(expect.objectContaining({
      fps: 58,
      frameTimeMs: 17.2,
      renderedObjects: 900,
      memoryMB: null,
      geometries: 12,
      recordedAt: 250,
    }));
    expect(onTelemetry).toHaveBeenCalledTimes(1);
    expect(normalizeRendererTelemetry({ fps: Number.NaN }).fps).toBeNull();
  });

  test("publishes lifecycle, sampled telemetry and errors to diagnostics", () => {
    const diagnostics = {
      recordLifecycle: jest.fn(),
      recordTelemetry: jest.fn(),
      recordError: jest.fn(),
    };
    const runtime = new WebCelestialRuntime({
      rendererId: "galaxy",
      kind: "3d",
      diagnostics,
    });
    runtime.handleRendererEvent(rendererEvent(RENDERER_EVENTS.INITIALIZE));
    runtime.reportTelemetry({ fps: 60 });
    runtime.reportError(new Error("context lost"), "render");

    expect(diagnostics.recordLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ state: RUNTIME_STATES.INITIALIZING }),
      RUNTIME_STATES.IDLE
    );
    expect(diagnostics.recordTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ fps: 60 }),
      expect.objectContaining({ rendererId: "galaxy" })
    );
    expect(diagnostics.recordError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "context lost" }),
      expect.objectContaining({ stage: "render" })
    );
  });

  test("supports suspension, degradation, errors and controlled recovery", () => {
    const runtime = new WebCelestialRuntime({ rendererId: "observatory", kind: "3d", now: () => 400 });
    runtime.handleRendererEvent(rendererEvent(RENDERER_EVENTS.INITIALIZE));
    runtime.handleRendererEvent(rendererEvent(RENDERER_EVENTS.RENDER));
    expect(runtime.suspend("page-hidden")).toBe(true);
    expect(runtime.getSnapshot().suspensionReason).toBe("page-hidden");
    expect(runtime.resume({ reason: "page-visible" })).toBe(true);
    expect(runtime.degrade("low-fps", { profile: "low" })).toBe(true);
    expect(runtime.state).toBe(RUNTIME_STATES.DEGRADED);
    expect(runtime.reportError(new Error("webgl lost"), "context-lost")).toBe(true);
    expect(runtime.getSnapshot().error).toEqual(expect.objectContaining({
      message: "webgl lost",
      stage: "context-lost",
    }));
    expect(runtime.recover({ rendererId: "background" })).toBe(true);
    expect(runtime.state).toBe(RUNTIME_STATES.INITIALIZING);
  });

  test("registers multiple mounted renderer instances without id collisions", () => {
    const first = new WebCelestialRuntime({ rendererId: "background", kind: "2d" });
    const second = new WebCelestialRuntime({ rendererId: "background", kind: "2d" });
    const registryListener = jest.fn();
    const unsubscribeRegistry = subscribeWebRuntimeRegistry(registryListener, true);
    const unregisterFirst = registerWebCelestialRuntime(first);
    const unregisterSecond = registerWebCelestialRuntime(second);

    expect(first.instanceId).not.toBe(second.instanceId);
    expect(getWebRuntimeSnapshots()).toHaveLength(2);
    first.handleRendererEvent(rendererEvent(RENDERER_EVENTS.INITIALIZE));
    expect(registryListener).toHaveBeenCalled();

    unregisterFirst();
    unregisterSecond();
    unsubscribeRegistry();
    expect(getWebRuntimeSnapshots()).toHaveLength(0);
  });
});
