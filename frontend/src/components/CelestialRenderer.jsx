import React, { Suspense, lazy, useEffect, useMemo, useRef } from "react";
import {
  RENDERER_EVENTS,
  createRendererEvent,
  markRendererRendered,
} from "../engine/renderers/rendererContract";
import {
  WEB_RENDERER_IDS,
  getWebRendererAdapter,
} from "../engine/renderers/webRendererRegistry";
import { WebCelestialRuntime } from "../engine/runtime/WebCelestialRuntime";
import { registerWebCelestialRuntime } from "../engine/runtime/webRuntimeRegistry";
import {
  RECOVERY_MODES,
  advanceRendererRecovery,
  createRendererRecoveryState,
  resetRendererRecovery,
} from "../engine/runtime/rendererRecoveryPolicy";
import {
  PERFORMANCE_LEVELS,
  applyPerformanceTelemetry,
  createPerformanceState,
  getBrowserHeapPressure,
  getDeviceMaximumProfile,
  getWebDeviceCapabilities,
} from "../engine/performance/webPerformancePolicy";
import { celestialStore, useCelestialStore } from "../stores/celestialStore";
import { webDiagnostics } from "../engine/diagnostics/webDiagnostics";

const EMPTY_PROPS = Object.freeze({});
const WEBGL_RESTORE_GRACE_MS = 2000;

function RendererMountSignal({ onMounted }) {
  useEffect(() => onMounted(), [onMounted]);
  return null;
}

class RendererErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.props.onError?.(error, "render-boundary", errorInfo);
  }

  render() {
    return this.state.error ? this.props.fallback : this.props.children;
  }
}

function RendererRecoveringSurface() {
  return <div className="absolute inset-0 bg-[#02040a]" aria-hidden />;
}

function RendererMaintenanceSurface({ failures, onRetry }) {
  const lastFailure = failures[failures.length - 1];
  return (
    <div className="absolute inset-0 flex min-h-[18rem] items-center justify-center bg-[#02040a] p-6 text-center">
      <div className="max-w-lg rounded-3xl border border-amber-300/20 bg-black/70 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.32em] text-amber-300">
          Renderer Maintenance
        </div>
        <h2 className="font-display text-2xl uppercase text-white">Görüntü motoru kullanılamıyor</h2>
        <p className="mt-4 text-sm leading-6 text-white/65">
          3D ve güvenli 2D görünüm başlatılamadı. Cihaz kaynaklarını boşaltıp yeniden deneyin.
        </p>
        {lastFailure ? (
          <p className="mt-3 font-mono text-[10px] text-white/35">
            {lastFailure.stage}: {lastFailure.message}
          </p>
        ) : null}
        <button type="button" onClick={onRetry} className="btn-gold pointer-events-auto mt-6">
          Yeniden Dene
        </button>
      </div>
    </div>
  );
}

function RendererInstance({
  rendererId,
  rendererProps = EMPTY_PROPS,
  fallback = null,
  onRendererEvent,
  onRuntimeChange,
  onRendererTelemetry,
  onRendererError,
  onRendererFailure,
  onRendererRestore,
}) {
  const adapter = useMemo(() => getWebRendererAdapter(rendererId), [rendererId]);
  const RendererComponent = useMemo(() => lazy(adapter.loadComponent), [adapter]);
  const runtime = useMemo(() => new WebCelestialRuntime({
    rendererId: adapter.id,
    kind: adapter.kind,
    capabilities: adapter.capabilities,
    diagnostics: webDiagnostics,
  }), [adapter]);
  const eventHandlerRef = useRef(onRendererEvent);
  const runtimeChangeRef = useRef(onRuntimeChange);
  const telemetryHandlerRef = useRef(onRendererTelemetry);
  const errorHandlerRef = useRef(onRendererError);
  const failureHandlerRef = useRef(onRendererFailure);
  const restoreHandlerRef = useRef(onRendererRestore);
  const sessionRef = useRef(null);
  const latestPropsRef = useRef(rendererProps);
  const previousPropsRef = useRef(rendererProps);
  const contextRecoveryTimerRef = useRef(null);

  latestPropsRef.current = rendererProps;

  useEffect(() => {
    eventHandlerRef.current = onRendererEvent;
    runtimeChangeRef.current = onRuntimeChange;
    telemetryHandlerRef.current = onRendererTelemetry;
    errorHandlerRef.current = onRendererError;
    failureHandlerRef.current = onRendererFailure;
    restoreHandlerRef.current = onRendererRestore;
  }, [onRendererError, onRendererEvent, onRendererFailure, onRendererRestore, onRendererTelemetry, onRuntimeChange]);

  useEffect(() => {
    runtime.setCallbacks({
      onTelemetry: (telemetry, snapshot) => telemetryHandlerRef.current?.(telemetry, snapshot),
      onError: (error, context) => errorHandlerRef.current?.(error, context),
    });
    return runtime.subscribe((snapshot) => runtimeChangeRef.current?.(snapshot));
  }, [runtime]);

  useEffect(() => () => clearTimeout(contextRecoveryTimerRef.current), []);

  useEffect(() => {
    const unregisterRuntime = registerWebCelestialRuntime(runtime);
    previousPropsRef.current = latestPropsRef.current;
    sessionRef.current = adapter.initialize({ props: latestPropsRef.current });
    const initializeEvent = createRendererEvent(
      adapter,
      RENDERER_EVENTS.INITIALIZE,
      sessionRef.current
    );
    runtime.handleRendererEvent(initializeEvent);
    eventHandlerRef.current?.(initializeEvent);

    return () => {
      sessionRef.current = adapter.dispose(sessionRef.current);
      const disposeEvent = createRendererEvent(
        adapter,
        RENDERER_EVENTS.DISPOSE,
        sessionRef.current
      );
      runtime.handleRendererEvent(disposeEvent);
      eventHandlerRef.current?.(disposeEvent);
      unregisterRuntime();
    };
  }, [adapter, runtime]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const handleVisibility = () => {
      if (document.hidden) runtime.suspend("page-hidden");
      else runtime.resume({ reason: "page-visible", suspensionReason: "page-hidden" });
    };
    const handleBlur = () => runtime.suspend("window-blur");
    const handleFocus = () => runtime.resume({ reason: "window-focus", suspensionReason: "window-blur" });
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    handleVisibility();
    if (typeof document.hasFocus === "function" && !document.hasFocus()) handleBlur();
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [runtime]);

  useEffect(() => {
    if (!sessionRef.current || previousPropsRef.current === rendererProps) return;
    previousPropsRef.current = rendererProps;
    sessionRef.current = adapter.update(sessionRef.current, rendererProps);
    const updateEvent = createRendererEvent(
      adapter,
      RENDERER_EVENTS.UPDATE,
      sessionRef.current
    );
    runtime.handleRendererEvent(updateEvent);
    eventHandlerRef.current?.(updateEvent);
  }, [adapter, rendererProps, runtime]);

  const handleMounted = React.useCallback(() => {
    if (!sessionRef.current) return;
    sessionRef.current = markRendererRendered(sessionRef.current);
    const renderEvent = createRendererEvent(
      adapter,
      RENDERER_EVENTS.RENDER,
      sessionRef.current
    );
    runtime.handleRendererEvent(renderEvent);
    if (typeof document !== "undefined" && document.hidden) runtime.suspend("page-hidden");
    if (typeof document !== "undefined" && typeof document.hasFocus === "function" && !document.hasFocus()) {
      runtime.suspend("window-blur");
    }
    eventHandlerRef.current?.(renderEvent);
  }, [adapter, runtime]);

  const handleTelemetry = React.useCallback(
    (telemetry) => runtime.reportTelemetry(telemetry),
    [runtime]
  );
  const handleRendererError = React.useCallback(
    (error, stage) => {
      runtime.reportError(error, stage);
      if (stage === "webgl-context-lost") {
        clearTimeout(contextRecoveryTimerRef.current);
        contextRecoveryTimerRef.current = setTimeout(() => {
          contextRecoveryTimerRef.current = null;
          failureHandlerRef.current?.(error, stage, true);
        }, WEBGL_RESTORE_GRACE_MS);
      } else {
        failureHandlerRef.current?.(error, stage, true);
      }
    },
    [runtime]
  );
  const handleRendererRestore = React.useCallback((details) => {
    clearTimeout(contextRecoveryTimerRef.current);
    contextRecoveryTimerRef.current = null;
    runtime.reportContextRestored(details);
    restoreHandlerRef.current?.(details, runtime.getSnapshot());
  }, [runtime]);

  const mappedProps = adapter.mapProps(rendererProps, {
    onTelemetry: handleTelemetry,
    onError: handleRendererError,
    onRestore: handleRendererRestore,
    runtime,
  });

  return (
    <Suspense fallback={fallback}>
      {adapter.render(RendererComponent, mappedProps)}
      <RendererMountSignal onMounted={handleMounted} />
    </Suspense>
  );
}

export default function CelestialRenderer({
  rendererId,
  rendererProps = EMPTY_PROPS,
  fallback = null,
  fallbackRendererId = WEB_RENDERER_IDS.BACKGROUND,
  onRendererEvent,
  onRuntimeChange,
  onRendererTelemetry,
  onRendererError,
  onRendererRestore,
  onRecoveryChange,
  onPerformanceChange,
}) {
  const beginInteraction = useCelestialStore((state) => state.beginInteraction);
  const markInteractionMoved = useCelestialStore((state) => state.markInteractionMoved);
  const endInteraction = useCelestialStore((state) => state.endInteraction);
  const primaryAdapter = useMemo(() => getWebRendererAdapter(rendererId), [rendererId]);
  const catalogObjectCount = Array.isArray(rendererProps.stars)
    ? rendererProps.stars.length
    : celestialStore.getState().catalog.stars.length;
  const maximumProfile = useMemo(() => {
    const deviceMaximum = getDeviceMaximumProfile({
      ...getWebDeviceCapabilities(),
      catalogObjectCount,
    });
    const requestedMaximum = PERFORMANCE_LEVELS.includes(rendererProps.qualityProfile)
      ? rendererProps.qualityProfile
      : deviceMaximum;
    return PERFORMANCE_LEVELS[
      Math.min(PERFORMANCE_LEVELS.indexOf(deviceMaximum), PERFORMANCE_LEVELS.indexOf(requestedMaximum))
    ];
  }, [catalogObjectCount, rendererProps.qualityProfile]);
  const [recovery, setRecovery] = React.useState(() => createRendererRecoveryState({
    primaryRendererId: rendererId,
    primaryKind: primaryAdapter.kind,
    fallbackRendererId,
  }));
  const [performanceState, setPerformanceState] = React.useState(() => (
    createPerformanceState(maximumProfile, maximumProfile)
  ));
  const performanceDiagnosticKeyRef = useRef(null);

  useEffect(() => {
    setRecovery(createRendererRecoveryState({
      primaryRendererId: rendererId,
      primaryKind: primaryAdapter.kind,
      fallbackRendererId,
    }));
  }, [fallbackRendererId, primaryAdapter.kind, rendererId]);

  useEffect(() => {
    onRecoveryChange?.(recovery);
    webDiagnostics.recordRecovery(recovery, { rendererId });
  }, [onRecoveryChange, recovery, rendererId]);

  useEffect(() => {
    setPerformanceState((current) => createPerformanceState(maximumProfile, current.level));
  }, [maximumProfile]);

  useEffect(() => {
    onPerformanceChange?.(performanceState);
    const diagnosticKey = `${performanceState.level}:${performanceState.maximum}:${performanceState.pressure}`;
    if (performanceDiagnosticKeyRef.current !== diagnosticKey) {
      performanceDiagnosticKeyRef.current = diagnosticKey;
      webDiagnostics.recordPerformance(performanceState, { rendererId });
    }
  }, [onPerformanceChange, performanceState, rendererId]);

  const handleFailure = React.useCallback((error, stage = "runtime", alreadyReported = false) => {
    setRecovery((current) => advanceRendererRecovery(current, error, stage));
    if (!alreadyReported) {
      webDiagnostics.recordError(error, { stage, rendererId });
      onRendererError?.(error, { stage, recovery });
    }
  }, [onRendererError, recovery, rendererId]);

  const retry = React.useCallback(() => {
    setRecovery((current) => resetRendererRecovery(current));
    setPerformanceState(createPerformanceState(maximumProfile, maximumProfile));
  }, [maximumProfile]);

  const handleRestore = React.useCallback((details, runtimeSnapshot) => {
    setRecovery((current) => resetRendererRecovery(current));
    onRendererRestore?.(details, runtimeSnapshot);
  }, [onRendererRestore]);

  const handleTelemetry = React.useCallback((telemetry, runtimeSnapshot) => {
    const enrichedTelemetry = {
      ...telemetry,
      heapPressure: telemetry.heapPressure ?? getBrowserHeapPressure(),
      quality: telemetry.quality || performanceState.level,
      maximumQuality: performanceState.maximum,
    };
    setPerformanceState((current) => applyPerformanceTelemetry(current, enrichedTelemetry));
    onRendererTelemetry?.(enrichedTelemetry, runtimeSnapshot);
  }, [onRendererTelemetry, performanceState.level, performanceState.maximum]);

  const effectiveQualityProfile = recovery.mode === RECOVERY_MODES.PRIMARY
    ? performanceState.level
    : recovery.qualityProfile;

  const effectiveRendererProps = useMemo(() => ({
    ...rendererProps,
    qualityProfile: effectiveQualityProfile,
  }), [effectiveQualityProfile, rendererProps]);

  if (recovery.mode === RECOVERY_MODES.MAINTENANCE) {
    return <RendererMaintenanceSurface failures={recovery.failures} onRetry={retry} />;
  }

  return (
    <div
      className="contents"
      onPointerDownCapture={(event) => beginInteraction({ pointerType: event.pointerType })}
      onPointerMoveCapture={() => markInteractionMoved()}
      onPointerUpCapture={() => endInteraction()}
      onPointerCancelCapture={() => endInteraction()}
    >
    <RendererErrorBoundary
      key={`${recovery.activeRendererId}-${recovery.revision}`}
      fallback={fallback || <RendererRecoveringSurface />}
      onError={handleFailure}
    >
      <RendererInstance
        rendererId={recovery.activeRendererId}
        rendererProps={effectiveRendererProps}
        fallback={fallback}
        onRendererEvent={onRendererEvent}
        onRuntimeChange={onRuntimeChange}
        onRendererTelemetry={handleTelemetry}
        onRendererError={onRendererError}
        onRendererFailure={handleFailure}
        onRendererRestore={handleRestore}
      />
    </RendererErrorBoundary>
    </div>
  );
}

export function CelestialBackground({
  density = 320,
  className = "",
  onRendererEvent,
  onRuntimeChange,
  onRendererError,
  onRecoveryChange,
  onPerformanceChange,
}) {
  const rendererProps = useMemo(() => ({ density, className }), [density, className]);
  return (
    <CelestialRenderer
      rendererId={WEB_RENDERER_IDS.BACKGROUND}
      rendererProps={rendererProps}
      onRendererEvent={onRendererEvent}
      onRuntimeChange={onRuntimeChange}
      onRendererError={onRendererError}
      onRecoveryChange={onRecoveryChange}
      onPerformanceChange={onPerformanceChange}
    />
  );
}
