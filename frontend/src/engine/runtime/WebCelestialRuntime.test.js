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
    const onTelemetry = vi.fn();
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
      recordLifecycle: vi.fn(),
      recordTelemetry: vi.fn(),
      recordError: vi.fn(),
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
    expect(runtime.resume({ reason: "page-visible", suspensionReason: "page-hidden" })).toBe(true);
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

  test("waits for every visibility and focus suspension reason before resuming", () => {
    const runtime = new WebCelestialRuntime({ rendererId: "observatory", kind: "3d" });
    runtime.handleRendererEvent(rendererEvent(RENDERER_EVENTS.INITIALIZE));
    runtime.handleRendererEvent(rendererEvent(RENDERER_EVENTS.RENDER));
    runtime.suspend("window-blur");
    runtime.suspend("page-hidden");

    expect(runtime.getSnapshot().suspensionReasons).toEqual(["window-blur", "page-hidden"]);
    runtime.resume({ reason: "window-focus", suspensionReason: "window-blur" });
    expect(runtime.state).toBe(RUNTIME_STATES.SUSPENDED);
    runtime.resume({ reason: "page-visible", suspensionReason: "page-hidden" });
    expect(runtime.state).toBe(RUNTIME_STATES.RUNNING);
  });

  test("recovers an errored runtime when WebGL context is restored", () => {
    const onRecovery = vi.fn();
    const runtime = new WebCelestialRuntime({
      rendererId: "observatory",
      kind: "3d",
      callbacks: { onRecovery },
    });
    runtime.handleRendererEvent(rendererEvent(RENDERER_EVENTS.INITIALIZE));
    runtime.reportError(new Error("context lost"), "webgl-context-lost");

    expect(runtime.reportContextRestored({ source: "canvas" })).toBe(true);
    expect(runtime.state).toBe(RUNTIME_STATES.INITIALIZING);
    expect(onRecovery).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "webgl-context-restored", source: "canvas" }),
      expect.objectContaining({ state: RUNTIME_STATES.INITIALIZING })
    );
  });

  test("registers multiple mounted renderer instances without id collisions", () => {
    const first = new WebCelestialRuntime({ rendererId: "background", kind: "2d" });
    const second = new WebCelestialRuntime({ rendererId: "background", kind: "2d" });
    const registryListener = vi.fn();
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
