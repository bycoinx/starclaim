import { DIAGNOSTIC_EVENT_TYPES } from "./webDiagnostics";

function sentryContext(event) {
  const { id, type, recordedAt, error, ...data } = event;
  return { id, type, recordedAt, ...data };
}

export function createSentryDiagnosticsTransport(sentry) {
  if (!sentry) return null;
  return (event) => {
    if (event.type === DIAGNOSTIC_EVENT_TYPES.ERROR) {
      const error = new Error(event.error?.message || "Web engine error");
      error.name = event.error?.name || "Error";
      sentry.captureException?.(error, {
        tags: {
          diagnostic_type: event.type,
          renderer: event.rendererId || "unknown",
          stage: event.error?.stage || "runtime",
        },
        extra: { webEngine: sentryContext(event) },
      });
      return;
    }
    sentry.addBreadcrumb?.({
      category: `web-engine.${event.type}`,
      level: event.type === DIAGNOSTIC_EVENT_TYPES.RECOVERY ? "warning" : "info",
      message: event.stage || event.state || event.mode || event.type,
      data: sentryContext(event),
      timestamp: event.recordedAt / 1000,
    });
  };
}
