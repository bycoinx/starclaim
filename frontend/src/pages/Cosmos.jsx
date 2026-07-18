import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import CelestialRenderer from "../components/CelestialRenderer";
import { WEB_RENDERER_IDS } from "../engine/renderers/webRendererRegistry";
import { starToWorldCartesian } from "../engine/celestialCoordinates";
import { useCelestialStore } from "../stores/celestialStore";

export function resolveCosmosCameraTarget(star) {
  if (!star) return null;
  if ([star.x, star.y, star.z].every(Number.isFinite)) {
    return { x: star.x, y: star.y, z: star.z };
  }
  return starToWorldCartesian(star);
}

function CosmosLoadingSurface() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#010207]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-sc-gold/20 border-t-sc-gold" />
    </div>
  );
}

export default function Cosmos({ onClaim }) {
  const selectedStar = useCelestialStore((state) => state.selection.star);
  const cameraTarget = useCelestialStore((state) => state.view.cameraTarget);
  const observerCoords = useCelestialStore((state) => state.view.observerCoords);
  const setCameraTarget = useCelestialStore((state) => state.setCameraTarget);
  const [runtime, setRuntime] = useState(null);
  const [recovery, setRecovery] = useState(null);
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    const selectedTarget = resolveCosmosCameraTarget(selectedStar);
    if (selectedTarget) setCameraTarget(selectedTarget);
  }, [selectedStar, setCameraTarget]);

  const rendererProps = useMemo(() => ({ cameraTarget }), [cameraTarget]);
  const starName = selectedStar?.name || selectedStar?.proper || selectedStar?.code || null;
  const status = recovery?.mode && recovery.mode !== "primary"
    ? recovery.mode
    : runtime?.state || "initializing";

  return (
    <main
      className="relative h-screen w-full overflow-hidden bg-black"
      data-testid="cosmos-engine"
      data-renderer-state={status}
      data-quality-profile={performance?.level || "profiling"}
    >
      <div className="absolute inset-0 z-0">
        <CelestialRenderer
          rendererId={WEB_RENDERER_IDS.GALAXY}
          rendererProps={rendererProps}
          fallback={<CosmosLoadingSurface />}
          onRuntimeChange={setRuntime}
          onRecoveryChange={setRecovery}
          onPerformanceChange={setPerformance}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_46%,transparent_0%,transparent_48%,rgba(0,0,0,0.32)_78%,rgba(0,0,0,0.78)_100%)]" />

      <section className="pointer-events-none absolute left-6 top-24 z-20 max-w-[min(520px,calc(100vw-3rem))] md:left-10 md:top-28">
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-3 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.38em] text-sc-gold"
        >
          <span className="h-2 w-2 rounded-full bg-sc-gold shadow-[0_0_18px_rgba(214,177,82,0.8)]" />
          Strategic Observer // Live
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.08 }}
          className="font-display text-4xl uppercase leading-none tracking-normal text-white sm:text-5xl md:text-6xl"
        >
          Cosmos <span className="gold-gradient-text">Engine</span>
        </motion.h1>
      </section>

      <div className="pointer-events-none absolute right-6 top-24 z-20 rounded-full border border-white/10 bg-black/55 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/65 backdrop-blur-md md:right-10 md:top-28">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {status} / {performance?.level || "profiling"}
      </div>

      {starName ? (
        <section
          className="pointer-events-auto absolute bottom-8 left-6 z-20 w-[min(360px,calc(100vw-3rem))] rounded-2xl border border-sc-gold/20 bg-black/65 p-5 backdrop-blur-xl md:left-10"
          data-testid="cosmos-selection"
        >
          <div className="text-[8px] font-black uppercase tracking-[0.3em] text-sc-gold">Camera Target</div>
          <div className="mt-2 font-display text-xl uppercase text-white">{starName}</div>
          <div className="mt-1 text-xs text-white/45">{selectedStar.constellation || "Deep Space"}</div>
          {onClaim ? (
            <button type="button" className="btn-gold mt-4" onClick={() => onClaim(selectedStar)}>
              Yıldızı Sahiplen
            </button>
          ) : null}
        </section>
      ) : null}

      <div className="pointer-events-none absolute bottom-10 right-8 z-20 hidden text-right md:block">
        <div className="mb-1 text-[8px] font-black uppercase tracking-[0.3em] text-white/25">Observer Coordinates</div>
        <div className="font-mono text-[10px] tracking-[0.18em] text-white/42" data-testid="cosmos-observer-coordinates">
          RA {Number(observerCoords?.ra || 0).toFixed(4)}° | DEC {Number(observerCoords?.dec || 0).toFixed(4)}°
        </div>
      </div>
    </main>
  );
}
