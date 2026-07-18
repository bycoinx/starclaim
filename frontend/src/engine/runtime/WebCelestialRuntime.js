import { RENDERER_EVENTS } from "../renderers/rendererContract";

export const RUNTIME_STATES = Object.freeze({
  IDLE: "idle",
  INITIALIZING: "initializing",
  READY: "ready",
  RUNNING: "running",
  SUSPENDED: "suspended",
  DEGRADED: "degraded",
  ERROR: "error",
  DISPOSED: "disposed",
});

const EMPTY_CALLBACKS = Object.freeze({});
let runtimeSequence = 0;

function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function normalizeError(error, stage) {
  return {
    name: error?.name || "Error",
    message: error?.message || String(error || "Unknown renderer error"),
    stage,
  };
}

export function normalizeRendererTelemetry(telemetry = {}, recordedAt = Date.now()) {
  return {
    ...telemetry,
    fps: finiteOrNull(telemetry.fps),
    frameTimeMs: finiteOrNull(telemetry.frameTimeMs),
    renderedObjects: finiteOrNull(telemetry.renderedObjects),
    memoryMB: finiteOrNull(telemetry.memoryMB),
    quality: telemetry.quality || null,
    recordedAt,
  };
}

export class WebCelestialRuntime {
  constructor({ rendererId, kind, capabilities = {}, callbacks = EMPTY_CALLBACKS, now = Date.now, diagnostics = null } = {}) {
    if (!rendererId || !kind) throw new Error("Web celestial runtime requires rendererId and kind.");
    this.instanceId = `${rendererId}:${++runtimeSequence}`;
    this.rendererId = rendererId;
    this.kind = kind;
    this.capabilities = { ...capabilities };
    this.callbacks = callbacks;
    this.now = now;
    this.diagnostics = diagnostics;
    this.state = RUNTIME_STATES.IDLE;
    this.resumeState = RUNTIME_STATES.RUNNING;
    this.suspensionReason = null;
    this.suspensionReasons = new Set();
    this.telemetry = null;
    this.error = null;
    this.degradation = null;
    this.revision = 0;
    this.listeners = new Set();
  }

  setCallbacks(callbacks = EMPTY_CALLBACKS) {
    this.callbacks = callbacks;
  }

  handleRendererEvent(rendererEvent) {
    if (!rendererEvent || this.state === RUNTIME_STATES.DISPOSED) return false;
    if (rendererEvent.telemetry) this.mergeLifecycleTelemetry(rendererEvent.telemetry);

    switch (rendererEvent.event) {
      case RENDERER_EVENTS.INITIALIZE:
        this.transition(RUNTIME_STATES.INITIALIZING);
        break;
      case RENDERER_EVENTS.RENDER:
        this.transition(RUNTIME_STATES.READY);
        this.transition(RUNTIME_STATES.RUNNING);
        break;
      case RENDERER_EVENTS.UPDATE:
        this.notify();
        break;
      case RENDERER_EVENTS.DISPOSE:
        this.dispose();
        break;
      default:
        return false;
    }
    return true;
  }

  mergeLifecycleTelemetry(telemetry) {
    this.telemetry = { ...(this.telemetry || {}), ...telemetry };
  }

  reportTelemetry(telemetry = {}) {
    if (this.state === RUNTIME_STATES.DISPOSED) return false;
    this.telemetry = {
      ...(this.telemetry || {}),
      ...normalizeRendererTelemetry(telemetry, this.now()),
    };
    this.diagnostics?.recordTelemetry(this.telemetry, this.getSnapshot());
    this.callbacks.onTelemetry?.(this.telemetry, this.getSnapshot());
    this.notify();
    return true;
  }

  reportError(error, stage = "runtime") {
    if (this.state === RUNTIME_STATES.DISPOSED) return false;
    this.error = normalizeError(error, stage);
    this.transition(RUNTIME_STATES.ERROR);
    this.diagnostics?.recordError(error, { stage, runtime: this.getSnapshot() });
    this.callbacks.onError?.(error, { stage, runtime: this.getSnapshot() });
    return true;
  }

  degrade(reason, details = {}) {
    if ([RUNTIME_STATES.DISPOSED, RUNTIME_STATES.ERROR].includes(this.state)) return false;
    this.degradation = { reason, ...details, recordedAt: this.now() };
    this.transition(RUNTIME_STATES.DEGRADED);
    this.callbacks.onDegraded?.(this.degradation, this.getSnapshot());
    return true;
  }

  recover(details = {}) {
    if (![RUNTIME_STATES.ERROR, RUNTIME_STATES.DEGRADED].includes(this.state)) return false;
    this.error = null;
    this.degradation = null;
    this.transition(RUNTIME_STATES.INITIALIZING);
    this.callbacks.onRecovery?.(details, this.getSnapshot());
    return true;
  }

  reportContextRestored(details = {}) {
    if (this.state === RUNTIME_STATES.DISPOSED) return false;
    if ([RUNTIME_STATES.ERROR, RUNTIME_STATES.DEGRADED].includes(this.state)) {
      return this.recover({ reason: "webgl-context-restored", ...details });
    }
    this.callbacks.onRecovery?.({ reason: "webgl-context-restored", ...details }, this.getSnapshot());
    return true;
  }

  suspend(reason = "page-hidden") {
    if (this.state === RUNTIME_STATES.DISPOSED || this.state === RUNTIME_STATES.ERROR) return false;
    this.suspensionReasons.add(reason);
    this.suspensionReason = this.suspensionReasons.values().next().value || null;
    if (this.state === RUNTIME_STATES.SUSPENDED) {
      this.notify();
      return true;
    }
    if (![RUNTIME_STATES.READY, RUNTIME_STATES.RUNNING, RUNTIME_STATES.DEGRADED].includes(this.state)) {
      this.suspensionReasons.delete(reason);
      this.suspensionReason = this.suspensionReasons.values().next().value || null;
      return false;
    }
    this.resumeState = this.state;
    this.transition(RUNTIME_STATES.SUSPENDED);
    return true;
  }

  resume(details = {}) {
    if (this.state !== RUNTIME_STATES.SUSPENDED) return false;
    const suspensionReason = details.suspensionReason;
    if (suspensionReason) this.suspensionReasons.delete(suspensionReason);
    else this.suspensionReasons.clear();
    this.suspensionReason = this.suspensionReasons.values().next().value || null;
    if (this.suspensionReasons.size > 0) {
      this.notify();
      return true;
    }
    this.transition(this.resumeState || RUNTIME_STATES.RUNNING);
    this.callbacks.onResume?.(details, this.getSnapshot());
    return true;
  }

  dispose() {
    if (this.state === RUNTIME_STATES.DISPOSED) return false;
    this.suspensionReasons.clear();
    this.suspensionReason = null;
    this.transition(RUNTIME_STATES.DISPOSED);
    return true;
  }

  transition(nextState, shouldNotify = true) {
    if (this.state === nextState) return false;
    const previousState = this.state;
    this.state = nextState;
    this.revision += 1;
    if (shouldNotify) {
      const snapshot = this.getSnapshot();
      this.diagnostics?.recordLifecycle(snapshot, previousState);
      this.callbacks.onStateChange?.(snapshot, previousState);
      this.listeners.forEach((listener) => listener(snapshot, previousState));
    }
    return true;
  }

  notify() {
    this.revision += 1;
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot, this.state));
  }

  subscribe(listener, emitCurrent = false) {
    this.listeners.add(listener);
    if (emitCurrent) listener(this.getSnapshot(), this.state);
    return () => this.listeners.delete(listener);
  }

  getSnapshot() {
    return {
      instanceId: this.instanceId,
      rendererId: this.rendererId,
      kind: this.kind,
      state: this.state,
      capabilities: { ...this.capabilities },
      telemetry: this.telemetry ? { ...this.telemetry } : null,
      error: this.error ? { ...this.error } : null,
      degradation: this.degradation ? { ...this.degradation } : null,
      suspensionReason: this.suspensionReason,
      suspensionReasons: [...this.suspensionReasons],
      revision: this.revision,
    };
  }
}
