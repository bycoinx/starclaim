export const RENDER_MODE = Object.freeze({
  voyage3d: 'voyage-3d',
  voyage3dLow: 'voyage-3d-low',
  sky2d: 'sky-2d',
  maintenance: 'maintenance',
});

export function createRendererRecoveryState() {
  return { mode: RENDER_MODE.voyage3d, failures: [], revision: 0 };
}

export function advanceRendererRecovery(state, error, stage = 'runtime') {
  const failure = {
    stage,
    message: error?.message || String(error || 'Unknown renderer error'),
    occurredAt: Date.now(),
  };
  const failures = [...state.failures, failure];
  let mode;
  if (state.mode === RENDER_MODE.voyage3d) mode = RENDER_MODE.voyage3dLow;
  else if (state.mode === RENDER_MODE.voyage3dLow) mode = RENDER_MODE.sky2d;
  else mode = RENDER_MODE.maintenance;
  return { mode, failures, revision: state.revision + 1 };
}

export function resetRendererRecovery() {
  return createRendererRecoveryState();
}
