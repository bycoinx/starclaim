import { RENDERER_KINDS } from "../renderers/rendererContract";
import {
  RECOVERY_MODES,
  advanceRendererRecovery,
  createRendererRecoveryState,
  resetRendererRecovery,
} from "./rendererRecoveryPolicy";

describe("web renderer recovery policy", () => {
  test("degrades 3D before safe 2D and maintenance", () => {
    let state = createRendererRecoveryState({
      primaryRendererId: "galaxy",
      primaryKind: RENDERER_KINDS.THREE_D,
      fallbackRendererId: "background",
    });
    state = advanceRendererRecovery(state, new Error("webgl init"), "renderer-init", () => 10);
    expect(state).toEqual(expect.objectContaining({
      mode: RECOVERY_MODES.LOW_QUALITY,
      activeRendererId: "galaxy",
      qualityProfile: "low",
    }));
    state = advanceRendererRecovery(state, new Error("low failed"), "context-lost", () => 20);
    expect(state).toEqual(expect.objectContaining({
      mode: RECOVERY_MODES.SAFE_2D,
      activeRendererId: "background",
    }));
    state = advanceRendererRecovery(state, new Error("canvas failed"), "canvas-context", () => 30);
    expect(state.mode).toBe(RECOVERY_MODES.MAINTENANCE);
    expect(state.failures).toHaveLength(3);
  });

  test("does not loop a failed 2D renderer back to itself", () => {
    let state = createRendererRecoveryState({
      primaryRendererId: "background",
      primaryKind: RENDERER_KINDS.TWO_D,
      fallbackRendererId: "background",
    });
    state = advanceRendererRecovery(state, new Error("canvas failed"));
    expect(state.mode).toBe(RECOVERY_MODES.LOW_QUALITY);
    state = advanceRendererRecovery(state, new Error("canvas failed again"));
    expect(state.mode).toBe(RECOVERY_MODES.MAINTENANCE);
  });

  test("records diagnostics and resets to the primary renderer", () => {
    const initial = createRendererRecoveryState({
      primaryRendererId: "observatory",
      primaryKind: RENDERER_KINDS.THREE_D,
      fallbackRendererId: "background",
    });
    const failed = advanceRendererRecovery(initial, "GPU unavailable", "lazy-load", () => 42);
    expect(failed.failures[0]).toEqual(expect.objectContaining({
      rendererId: "observatory",
      stage: "lazy-load",
      message: "GPU unavailable",
      occurredAt: 42,
    }));
    expect(resetRendererRecovery(failed)).toEqual(initial);
  });
});
