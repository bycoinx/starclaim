import { createSentryDiagnosticsTransport } from "./sentryDiagnosticsTransport";

describe("Sentry diagnostics transport", () => {
  test("maps lifecycle events to breadcrumbs", () => {
    const sentry = { addBreadcrumb: vi.fn() };
    createSentryDiagnosticsTransport(sentry)({
      id: "e1", type: "lifecycle", recordedAt: 1000, rendererId: "three", state: "running",
    });
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({
      category: "web-engine.lifecycle", message: "running", timestamp: 1,
    }));
  });

  test("maps sanitized engine errors to captured exceptions", () => {
    const sentry = { captureException: vi.fn() };
    createSentryDiagnosticsTransport(sentry)({
      id: "e2", type: "error", recordedAt: 1000, rendererId: "three",
      error: { name: "WebGLError", message: "context lost", stage: "render" },
    });
    expect(sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ name: "WebGLError", message: "context lost" }),
      expect.objectContaining({ tags: expect.objectContaining({ stage: "render" }) })
    );
  });
});
