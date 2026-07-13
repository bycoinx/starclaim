import { CelestialEngineRuntime, ENGINE_KIND, ENGINE_STATE } from '../CelestialEngineRuntime';

describe('CelestialEngineRuntime', () => {
  test('provides a shared lifecycle for 2D and 3D renderers', () => {
    const ready = jest.fn();
    const engine = new CelestialEngineRuntime({
      id: 'sky-live',
      kind: ENGINE_KIND.sky2d,
      capabilities: ['catalog', 'view', 'selection'],
      callbacks: { onReady: ready },
    });

    expect(engine.start()).toBe(true);
    expect(engine.state).toBe(ENGINE_STATE.running);
    expect(ready).toHaveBeenCalledTimes(1);
    expect(engine.stop()).toBe(true);
    expect(engine.destroy()).toBe(true);
    expect(engine.start()).toBe(false);
  });

  test('normalizes catalogs, commands and telemetry into one snapshot', () => {
    const telemetry = jest.fn();
    const engine = new CelestialEngineRuntime({
      id: 'voyage',
      kind: ENGINE_KIND.voyage3d,
      callbacks: { onTelemetry: telemetry },
    });

    engine.setCatalog('stars', [{ id: 1 }, { id: 2 }]);
    engine.setView({ ra: 12, dec: -5, zoom: 2 });
    engine.setTarget({ id: 2 });
    engine.reportTelemetry({ fps: 58, quality: 'high', renderedObjects: 2 });

    expect(engine.getSnapshot()).toEqual(expect.objectContaining({
      catalogs: { stars: 2 },
      view: { ra: 12, dec: -5, zoom: 2 },
      target: { id: 2 },
      telemetry: expect.objectContaining({ fps: 58, renderedObjects: 2 }),
    }));
    expect(telemetry).toHaveBeenCalledTimes(1);
  });

  test('reports failures consistently and prevents restart after an error', () => {
    const onError = jest.fn();
    const engine = new CelestialEngineRuntime({
      id: 'voyage',
      kind: ENGINE_KIND.voyage3d,
      callbacks: { onError },
    });

    engine.reportError(new Error('webgl failed'), 'renderer-init');

    expect(engine.state).toBe(ENGINE_STATE.error);
    expect(engine.start()).toBe(false);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ stage: 'renderer-init' })
    );
  });

  test('can recover through the shared lifecycle after a renderer fallback', () => {
    const onRecovery = jest.fn();
    const engine = new CelestialEngineRuntime({
      id: 'voyage',
      kind: ENGINE_KIND.voyage3d,
      callbacks: { onRecovery },
    });
    engine.reportError(new Error('gpu failed'));
    expect(engine.recover({ mode: 'sky-2d' })).toBe(true);
    expect(engine.start()).toBe(true);
    expect(engine.state).toBe(ENGINE_STATE.running);
    expect(onRecovery).toHaveBeenCalledWith(
      { mode: 'sky-2d' },
      expect.objectContaining({ state: ENGINE_STATE.initialized })
    );
  });

  test('suspends without losing the requested running state', () => {
    const onSuspend = jest.fn();
    const onResume = jest.fn();
    const engine = new CelestialEngineRuntime({
      id: 'background-safe',
      kind: ENGINE_KIND.voyage3d,
      callbacks: { onSuspend, onResume },
    });

    engine.start();
    expect(engine.suspend('app-background')).toBe(true);
    expect(engine.getSnapshot()).toEqual(expect.objectContaining({
      state: ENGINE_STATE.suspended,
      suspensionReason: 'app-background',
    }));
    expect(engine.resume({ reason: 'app-active' })).toBe(true);
    expect(engine.state).toBe(ENGINE_STATE.running);
    expect(onSuspend).toHaveBeenCalledTimes(1);
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  test('forwards operational events to the diagnostics observer', () => {
    const diagnostics = {
      recordTelemetry: jest.fn(),
      recordError: jest.fn(),
      recordRecovery: jest.fn(),
      recordLifecycle: jest.fn(),
    };
    const engine = new CelestialEngineRuntime({
      id: 'diagnosed',
      kind: ENGINE_KIND.sky2d,
      diagnostics,
    });

    engine.start();
    engine.reportTelemetry({ fps: 60, quality: 'high' });
    engine.suspend('app-background');
    engine.resume({ reason: 'app-active' });
    engine.reportError(new Error('render failed'), 'frame');
    engine.recover({ mode: 'sky-2d' });

    expect(diagnostics.recordTelemetry).toHaveBeenCalledTimes(1);
    expect(diagnostics.recordLifecycle).toHaveBeenCalledTimes(2);
    expect(diagnostics.recordError).toHaveBeenCalledTimes(1);
    expect(diagnostics.recordRecovery).toHaveBeenCalledTimes(1);
  });
});
