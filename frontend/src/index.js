import "./polyfills";
import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import "@/index.css";
import App from "@/App";
import { configureWebDiagnosticsTransport } from "@/engine/diagnostics/webDiagnostics";
import { createSentryDiagnosticsTransport } from "@/engine/diagnostics/sentryDiagnosticsTransport";

// ── Sentry Initialization (must run before React render) ──
Sentry.init({
  dsn: "https://ba20b5d632cbc30c9b6a084a4e10cc04@o4511729653448704.ingest.de.sentry.io/4511729666490448",

  // Adds more context data to events (IP address, cookies, user, etc.)
  sendDefaultPii: true,

  // Performance monitoring — sample 20% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Session Replay — capture 10% of sessions, 100% on error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],

  // Environment tag for filtering in Sentry dashboard
  environment: process.env.NODE_ENV || "development",

  // Filter out noisy errors
  ignoreErrors: [
    "ResizeObserver loop",
    "Non-Error promise rejection",
  ],
});

configureWebDiagnosticsTransport(createSentryDiagnosticsTransport(Sentry));

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <App />
);
