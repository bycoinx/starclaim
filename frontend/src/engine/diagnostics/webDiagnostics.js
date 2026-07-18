export const DIAGNOSTIC_EVENT_TYPES = Object.freeze({
  LIFECYCLE: "lifecycle",
  TELEMETRY: "telemetry",
  RECOVERY: "recovery",
  PERFORMANCE: "performance",
  CATALOG: "catalog",
  ERROR: "error",
});

const DEFAULT_CAPACITY = 200;
const DEFAULT_TELEMETRY_INTERVAL_MS = 15000;

function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function shortText(value, fallback = null) {
  if (value == null) return fallback;
  return String(value).replace(/[\r\n]+/g, " ").slice(0, 240);
}

function errorDetails(error, stage) {
  return {
    name: shortText(error?.name, "Error"),
    message: shortText(error?.message || error, "Unknown error"),
    stage: shortText(stage, "runtime"),
  };
}

function catalogStats(stats) {
  if (!stats || typeof stats !== "object") return null;
  return Object.fromEntries(
    ["rows", "parsed", "accepted", "rejected", "limited", "durationMs"]
      .map((key) => [key, finiteOrNull(stats[key])])
      .filter(([, value]) => value != null)
  );
}

export class WebDiagnostics {
  constructor({ capacity = DEFAULT_CAPACITY, telemetryIntervalMs = DEFAULT_TELEMETRY_INTERVAL_MS, now = Date.now, transport = null } = {}) {
    this.capacity = Math.max(1, capacity);
    this.telemetryIntervalMs = Math.max(0, telemetryIntervalMs);
    this.now = now;
    this.transport = transport;
    this.events = [];
    this.listeners = new Set();
    this.telemetrySamples = new Map();
    this.sequence = 0;
  }

  setTransport(transport) {
    this.transport = typeof transport === "function" ? transport : null;
  }

  append(type, payload = {}) {
    const event = Object.freeze({
      id: `web-diagnostic-${++this.sequence}`,
      type,
      recordedAt: this.now(),
      ...payload,
    });
    this.events.push(event);
    if (this.events.length > this.capacity) this.events.splice(0, this.events.length - this.capacity);
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // A development observer must not affect the application.
      }
    });
    try {
      this.transport?.(event);
    } catch {
      // Diagnostics must never interrupt rendering or recovery.
    }
    return event;
  }

  recordLifecycle(snapshot = {}, previousState = null) {
    return this.append(DIAGNOSTIC_EVENT_TYPES.LIFECYCLE, {
      runtimeId: shortText(snapshot.instanceId),
      rendererId: shortText(snapshot.rendererId),
      rendererKind: shortText(snapshot.kind),
      previousState: shortText(previousState),
      state: shortText(snapshot.state),
      revision: finiteOrNull(snapshot.revision),
    });
  }

  recordTelemetry(telemetry = {}, snapshot = {}) {
    const runtimeId = shortText(snapshot.instanceId, shortText(snapshot.rendererId, "renderer"));
    const quality = shortText(telemetry.quality);
    const pressure = shortText(telemetry.heapPressure);
    const previous = this.telemetrySamples.get(runtimeId);
    const now = this.now();
    const shouldSample = !previous
      || now - previous.recordedAt >= this.telemetryIntervalMs
      || previous.quality !== quality
      || previous.pressure !== pressure;
    if (!shouldSample) return null;
    this.telemetrySamples.set(runtimeId, { recordedAt: now, quality, pressure });
    return this.append(DIAGNOSTIC_EVENT_TYPES.TELEMETRY, {
      runtimeId,
      rendererId: shortText(snapshot.rendererId),
      rendererKind: shortText(snapshot.kind),
      state: shortText(snapshot.state),
      fps: finiteOrNull(telemetry.fps),
      frameTimeMs: finiteOrNull(telemetry.frameTimeMs),
      renderedObjects: finiteOrNull(telemetry.renderedObjects),
      memoryMB: finiteOrNull(telemetry.memoryMB),
      quality,
      maximumQuality: shortText(telemetry.maximumQuality),
      heapPressure: pressure,
    });
  }

  recordRecovery(recovery = {}, context = {}) {
    const lastFailure = recovery.failures?.[recovery.failures.length - 1];
    return this.append(DIAGNOSTIC_EVENT_TYPES.RECOVERY, {
      rendererId: shortText(context.rendererId || recovery.activeRendererId),
      mode: shortText(recovery.mode),
      quality: shortText(recovery.qualityProfile),
      revision: finiteOrNull(recovery.revision),
      failureCount: Array.isArray(recovery.failures) ? recovery.failures.length : 0,
      failure: lastFailure ? errorDetails(lastFailure, lastFailure.stage) : null,
    });
  }

  recordPerformance(state = {}, context = {}) {
    return this.append(DIAGNOSTIC_EVENT_TYPES.PERFORMANCE, {
      rendererId: shortText(context.rendererId),
      level: shortText(state.level),
      maximum: shortText(state.maximum),
      pressure: shortText(state.pressure),
      revision: finiteOrNull(state.revision),
    });
  }

  recordCatalog(status = {}, pipeline = "hyg") {
    return this.append(DIAGNOSTIC_EVENT_TYPES.CATALOG, {
      pipeline: shortText(pipeline),
      stage: shortText(status.stage),
      source: shortText(status.source),
      bytes: finiteOrNull(status.bytes),
      count: finiteOrNull(status.count),
      stats: catalogStats(status.stats),
      error: status.error ? errorDetails(status.error, status.stage) : null,
    });
  }

  recordError(error, context = {}) {
    return this.append(DIAGNOSTIC_EVENT_TYPES.ERROR, {
      runtimeId: shortText(context.runtime?.instanceId || context.runtimeId),
      rendererId: shortText(context.runtime?.rendererId || context.rendererId),
      rendererKind: shortText(context.runtime?.kind || context.rendererKind),
      state: shortText(context.runtime?.state),
      error: errorDetails(error, context.stage),
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getEvents({ type, limit } = {}) {
    const filtered = type ? this.events.filter((event) => event.type === type) : this.events;
    const count = Number.isFinite(limit) ? Math.max(0, limit) : filtered.length;
    return filtered.slice(-count);
  }

  getSnapshot() {
    return Object.freeze({ count: this.events.length, latest: this.events.at(-1) || null });
  }

  clear() {
    this.events = [];
    this.telemetrySamples.clear();
  }
}

export const webDiagnostics = new WebDiagnostics();

export function configureWebDiagnosticsTransport(transport) {
  webDiagnostics.setTransport(transport);
}
