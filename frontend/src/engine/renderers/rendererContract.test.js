import {
  RENDERER_EVENTS,
  RENDERER_KINDS,
  createRendererAdapter,
  createRendererEvent,
  markRendererRendered,
} from "./rendererContract";
import {
  WEB_RENDERER_IDS,
  getWebRendererAdapter,
  listWebRendererAdapters,
} from "./webRendererRegistry";

describe("web renderer contract", () => {
  test("provides one lifecycle and telemetry shape for every renderer", () => {
    const adapter = createRendererAdapter({
      id: "test-renderer",
      kind: RENDERER_KINDS.TWO_D,
      loadComponent: vi.fn(),
    });
    let session = adapter.initialize({ props: { density: 10 }, now: 100 });
    session = markRendererRendered(session, 110);
    session = adapter.update(session, { density: 20 }, 120);
    const event = createRendererEvent(adapter, RENDERER_EVENTS.UPDATE, session);
    session = adapter.dispose(session, 130);

    expect(event).toEqual(expect.objectContaining({
      event: "update",
      rendererId: "test-renderer",
      kind: "2d",
      telemetry: expect.objectContaining({ renderCount: 1, updateCount: 1 }),
    }));
    expect(adapter.getTelemetry(session).disposedAt).toBe(130);
  });

  test("registers 2D and 3D engines behind purpose-based ids", () => {
    expect(getWebRendererAdapter(WEB_RENDERER_IDS.BACKGROUND).kind).toBe(RENDERER_KINDS.TWO_D);
    expect(getWebRendererAdapter(WEB_RENDERER_IDS.GALAXY).kind).toBe(RENDERER_KINDS.THREE_D);
    expect(getWebRendererAdapter(WEB_RENDERER_IDS.OBSERVATORY).capabilities.selectable).toBe(true);
    expect(listWebRendererAdapters()).toHaveLength(3);
  });

  test("rejects incomplete renderer definitions and unknown ids", () => {
    expect(() => createRendererAdapter({ id: "broken", kind: "2d" })).toThrow("loadComponent");
    expect(() => getWebRendererAdapter("missing")).toThrow("Unknown web renderer");
  });
});
