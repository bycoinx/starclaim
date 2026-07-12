import {
  RENDER_MODE,
  advanceRendererRecovery,
  createRendererRecoveryState,
} from '../rendererRecoveryPolicy';

describe('renderer recovery policy', () => {
  test('degrades 3D before falling back to 2D and maintenance', () => {
    let state = createRendererRecoveryState();
    state = advanceRendererRecovery(state, new Error('webgl init'), 'renderer-init');
    expect(state.mode).toBe(RENDER_MODE.voyage3dLow);
    state = advanceRendererRecovery(state, new Error('low quality failed'), 'renderer-init');
    expect(state.mode).toBe(RENDER_MODE.sky2d);
    state = advanceRendererRecovery(state, new Error('skia failed'), 'render-boundary');
    expect(state.mode).toBe(RENDER_MODE.maintenance);
    expect(state.failures).toHaveLength(3);
  });

  test('records stable diagnostics for every transition', () => {
    const state = advanceRendererRecovery(createRendererRecoveryState(), 'GPU unavailable', 'gl-context');
    expect(state.failures[0]).toEqual(expect.objectContaining({
      stage: 'gl-context',
      message: 'GPU unavailable',
      occurredAt: expect.any(Number),
    }));
    expect(state.revision).toBe(1);
  });
});
