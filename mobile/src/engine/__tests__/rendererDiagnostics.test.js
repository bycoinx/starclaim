import { RendererDiagnostics } from '../rendererDiagnostics';

const engine = {
  id: 'voyage',
  kind: 'voyage-3d',
  state: 'running',
};

describe('RendererDiagnostics', () => {
  test('samples telemetry periodically and immediately on quality changes', () => {
    const writer = jest.fn(() => Promise.resolve());
    let now = 1000;
    const diagnostics = new RendererDiagnostics({ writer, now: () => now });

    expect(diagnostics.recordTelemetry({ fps: 60, quality: 'high' }, engine)).toBe(true);
    now += 1000;
    expect(diagnostics.recordTelemetry({ fps: 59, quality: 'high' }, engine)).toBe(false);
    expect(diagnostics.recordTelemetry({ fps: 42, quality: 'medium' }, engine)).toBe(true);
    now += 15000;
    expect(diagnostics.recordTelemetry({ fps: 55, quality: 'medium' }, engine)).toBe(true);

    expect(writer).toHaveBeenCalledTimes(3);
  });

  test('normalizes errors, recovery decisions and lifecycle events', () => {
    const writer = jest.fn(() => Promise.resolve());
    const diagnostics = new RendererDiagnostics({ writer });

    diagnostics.recordError(new TypeError('GL unavailable'), { stage: 'renderer-init', engine });
    diagnostics.recordRecovery({ mode: 'sky-2d', failureCount: 2 }, engine);
    diagnostics.recordLifecycle('suspended', { reason: 'app-background' }, engine);

    expect(writer).toHaveBeenNthCalledWith(1, expect.objectContaining({
      type: 'error', stage: 'renderer-init', message: 'GL unavailable', engineId: 'voyage',
    }));
    expect(writer).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: 'recovery', status: 'recovered', mode: 'sky-2d',
    }));
    expect(writer).toHaveBeenNthCalledWith(3, expect.objectContaining({
      type: 'lifecycle', status: 'suspended', reason: 'app-background',
    }));
  });
});
