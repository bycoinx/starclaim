import { DIAGNOSTIC_EVENT_TYPES, WebDiagnostics } from "./webDiagnostics";

describe("WebDiagnostics", () => {
  test("keeps a bounded buffer and notifies subscribers", () => {
    const diagnostics = new WebDiagnostics({ capacity: 2, now: () => 100 });
    const listener = jest.fn();
    diagnostics.subscribe(listener);
    diagnostics.recordCatalog({ stage: "fetching", url: "https://example.test/private?q=secret" });
    diagnostics.recordCatalog({ stage: "parsing", bytes: 12 });
    diagnostics.recordCatalog({ stage: "ready", count: 4 });

    expect(diagnostics.getEvents()).toHaveLength(2);
    expect(listener).toHaveBeenCalledTimes(3);
    expect(JSON.stringify(diagnostics.getEvents())).not.toContain("secret");
  });

  test("samples telemetry by interval and immediately on policy changes", () => {
    let now = 0;
    const diagnostics = new WebDiagnostics({ telemetryIntervalMs: 15000, now: () => now });
    const runtime = { instanceId: "runtime-1", rendererId: "three", kind: "3d", state: "running" };
    expect(diagnostics.recordTelemetry({ fps: 60, quality: "high" }, runtime)).not.toBeNull();
    now = 1000;
    expect(diagnostics.recordTelemetry({ fps: 59, quality: "high" }, runtime)).toBeNull();
    expect(diagnostics.recordTelemetry({ fps: 45, quality: "medium" }, runtime)).not.toBeNull();
    now = 17000;
    expect(diagnostics.recordTelemetry({ fps: 55, quality: "medium" }, runtime)).not.toBeNull();
    expect(diagnostics.getEvents({ type: DIAGNOSTIC_EVENT_TYPES.TELEMETRY })).toHaveLength(3);
  });

  test("whitelists diagnostics fields and isolates transport failures", () => {
    const diagnostics = new WebDiagnostics({ transport: () => { throw new Error("offline"); } });
    diagnostics.subscribe(() => { throw new Error("broken observer"); });
    expect(() => diagnostics.recordError(Object.assign(new Error("failed"), { stack: "private stack" }), {
      stage: "initialize",
      token: "secret-token",
      runtime: { instanceId: "r1", rendererId: "three", kind: "3d", state: "error", user: "private" },
    })).not.toThrow();
    const serialized = JSON.stringify(diagnostics.getEvents());
    expect(serialized).not.toContain("private stack");
    expect(serialized).not.toContain("secret-token");
    expect(serialized).not.toContain('"user"');
  });
});
