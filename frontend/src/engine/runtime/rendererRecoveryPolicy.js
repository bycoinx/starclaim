import { RENDERER_KINDS } from "../renderers/rendererContract";

export const RECOVERY_MODES = Object.freeze({
  PRIMARY: "primary",
  LOW_QUALITY: "low-quality",
  SAFE_2D: "safe-2d",
  MAINTENANCE: "maintenance",
});

export function createRendererRecoveryState({
  primaryRendererId,
  primaryKind,
  fallbackRendererId,
} = {}) {
  if (!primaryRendererId || !primaryKind) {
    throw new Error("Renderer recovery requires a primary renderer id and kind.");
  }
  return {
    primaryRendererId,
    primaryKind,
    fallbackRendererId,
    activeRendererId: primaryRendererId,
    mode: RECOVERY_MODES.PRIMARY,
    qualityProfile: "high",
    failures: [],
    revision: 0,
  };
}

export function advanceRendererRecovery(state, error, stage = "runtime", now = Date.now) {
  const failure = {
    rendererId: state.activeRendererId,
    stage,
    name: error?.name || "Error",
    message: error?.message || String(error || "Unknown renderer error"),
    occurredAt: now(),
  };
  const failures = [...state.failures, failure];
  const canUseSafe2D = state.primaryKind === RENDERER_KINDS.THREE_D
    && state.fallbackRendererId
    && state.fallbackRendererId !== state.primaryRendererId;

  if (state.mode === RECOVERY_MODES.PRIMARY) {
    return {
      ...state,
      mode: RECOVERY_MODES.LOW_QUALITY,
      qualityProfile: "low",
      failures,
      revision: state.revision + 1,
    };
  }

  if (state.mode === RECOVERY_MODES.LOW_QUALITY && canUseSafe2D) {
    return {
      ...state,
      activeRendererId: state.fallbackRendererId,
      mode: RECOVERY_MODES.SAFE_2D,
      qualityProfile: "low",
      failures,
      revision: state.revision + 1,
    };
  }

  return {
    ...state,
    mode: RECOVERY_MODES.MAINTENANCE,
    qualityProfile: "low",
    failures,
    revision: state.revision + 1,
  };
}

export function resetRendererRecovery(state) {
  return createRendererRecoveryState({
    primaryRendererId: state.primaryRendererId,
    primaryKind: state.primaryKind,
    fallbackRendererId: state.fallbackRendererId,
  });
}
