export const ENGINE_STATE = Object.freeze({
  idle: 'idle',
  initialized: 'initialized',
  running: 'running',
  stopped: 'stopped',
  destroyed: 'destroyed',
  error: 'error',
});

export const ENGINE_KIND = Object.freeze({
  sky2d: 'sky-2d',
  voyage3d: 'voyage-3d',
});

const EMPTY_CALLBACKS = Object.freeze({});

function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

export class CelestialEngineRuntime {
  constructor({ id, kind, capabilities = [], callbacks = EMPTY_CALLBACKS } = {}) {
    if (!id || !kind) throw new Error('Celestial engine requires id and kind');
    this.id = id;
    this.kind = kind;
    this.capabilities = new Set(capabilities);
    this.callbacks = callbacks;
    this.state = ENGINE_STATE.idle;
    this.catalogs = new Map();
    this.view = null;
    this.target = null;
    this.telemetry = null;
  }

  setCallbacks(callbacks = EMPTY_CALLBACKS) {
    this.callbacks = callbacks;
  }

  initialize(details = {}) {
    if (this.state === ENGINE_STATE.destroyed) return false;
    if (this.state === ENGINE_STATE.idle) {
      this.state = ENGINE_STATE.initialized;
      this.callbacks.onReady?.(this.getSnapshot(), details);
    }
    return true;
  }

  start() {
    if (this.state === ENGINE_STATE.destroyed || this.state === ENGINE_STATE.error) return false;
    if (this.state === ENGINE_STATE.idle) this.initialize();
    this.state = ENGINE_STATE.running;
    return true;
  }

  stop() {
    if (this.state !== ENGINE_STATE.running) return false;
    this.state = ENGINE_STATE.stopped;
    return true;
  }

  destroy() {
    if (this.state === ENGINE_STATE.destroyed) return false;
    this.catalogs.clear();
    this.state = ENGINE_STATE.destroyed;
    return true;
  }

  setCatalog(name, items = []) {
    if (this.state === ENGINE_STATE.destroyed) return false;
    this.catalogs.set(name, Array.isArray(items) ? items : []);
    return true;
  }

  setView(view) {
    if (this.state === ENGINE_STATE.destroyed) return false;
    this.view = view ? { ...view } : null;
    return true;
  }

  setTarget(target) {
    if (this.state === ENGINE_STATE.destroyed) return false;
    this.target = target || null;
    return true;
  }

  reportTelemetry(telemetry = {}) {
    if (this.state === ENGINE_STATE.destroyed) return false;
    this.telemetry = {
      fps: finiteOrNull(telemetry.fps),
      frameTimeMs: finiteOrNull(telemetry.frameTimeMs),
      quality: telemetry.quality || null,
      renderedObjects: finiteOrNull(telemetry.renderedObjects),
      ...telemetry,
    };
    this.callbacks.onTelemetry?.(this.telemetry, this.getSnapshot());
    return true;
  }

  reportError(error, stage = 'runtime') {
    if (this.state === ENGINE_STATE.destroyed) return false;
    this.state = ENGINE_STATE.error;
    this.callbacks.onError?.(error, { stage, engine: this.getSnapshot() });
    return true;
  }

  recover(details = {}) {
    if (this.state !== ENGINE_STATE.error) return false;
    this.state = ENGINE_STATE.initialized;
    this.callbacks.onRecovery?.(details, this.getSnapshot());
    return true;
  }

  getSnapshot() {
    return {
      id: this.id,
      kind: this.kind,
      state: this.state,
      capabilities: [...this.capabilities],
      catalogs: Object.fromEntries(
        [...this.catalogs].map(([name, items]) => [name, items.length])
      ),
      view: this.view,
      target: this.target,
      telemetry: this.telemetry,
    };
  }
}
