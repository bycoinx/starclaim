import { recordRenderDiagnostic } from '../utils/renderDiagnostics';

const TELEMETRY_INTERVAL_MS = 15000;

function errorDetails(error) {
  return {
    message: error?.message || String(error || 'Unknown renderer error'),
    name: error?.name || null,
  };
}

export class RendererDiagnostics {
  constructor({ writer = recordRenderDiagnostic, now = Date.now } = {}) {
    this.writer = writer;
    this.now = now;
    this.telemetryState = new Map();
  }

  recordTelemetry(telemetry, engine) {
    const previous = this.telemetryState.get(engine.id);
    const now = this.now();
    const qualityChanged = previous?.quality !== telemetry.quality;
    if (previous && !qualityChanged && now - previous.recordedAt < TELEMETRY_INTERVAL_MS) {
      return false;
    }
    this.telemetryState.set(engine.id, { recordedAt: now, quality: telemetry.quality });
    void this.writer({
      type: 'telemetry',
      status: 'sample',
      surface: engine.kind,
      engineId: engine.id,
      engineState: engine.state,
      ...telemetry,
    });
    return true;
  }

  recordError(error, context) {
    void this.writer({
      type: 'error',
      status: 'error',
      surface: context.engine.kind,
      engineId: context.engine.id,
      engineState: context.engine.state,
      stage: context.stage,
      ...errorDetails(error),
    });
  }

  recordRecovery(details, engine) {
    void this.writer({
      type: 'recovery',
      status: details.mode === 'maintenance' ? 'maintenance' : 'recovered',
      surface: engine.kind,
      engineId: engine.id,
      engineState: engine.state,
      ...details,
    });
  }

  recordLifecycle(event, details, engine) {
    void this.writer({
      type: 'lifecycle',
      status: event,
      surface: engine.kind,
      engineId: engine.id,
      engineState: engine.state,
      ...details,
    });
  }
}

export const rendererDiagnostics = new RendererDiagnostics();
