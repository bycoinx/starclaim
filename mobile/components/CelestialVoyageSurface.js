import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CelestialEngineSurface from './CelestialEngineSurface';
import RenderSurfaceBoundary from './RenderSurfaceBoundary';
import StarSystem3D from './StarSystem3D';
import {
  CelestialEngineRuntime,
  ENGINE_KIND,
} from '../src/engine/CelestialEngineRuntime';
import {
  RENDER_MODE,
  advanceRendererRecovery,
  createRendererRecoveryState,
} from '../src/engine/rendererRecoveryPolicy';

export default function CelestialVoyageSurface({
  catalog,
  selection,
  events,
  layers,
  stars,
  ownedStars,
  loadedSectorCount,
  view,
  targetStar,
  onArrival,
  onTargetChange,
  onOwnedStarPress,
  onReady,
  onRenderError,
  onTelemetry,
  onViewChange,
  onWarpStart,
  ...props
}) {
  const [recovery, setRecovery] = useState(createRendererRecoveryState);
  const runtimeRef = useRef(null);
  if (!runtimeRef.current) {
    runtimeRef.current = new CelestialEngineRuntime({
      id: 'celestial-voyage-surface',
      kind: ENGINE_KIND.voyage3d,
      capabilities: ['recovery', 'quality-fallback', 'renderer-fallback'],
    });
    runtimeRef.current.initialize();
    runtimeRef.current.start();
  }
  useEffect(() => () => runtimeRef.current.destroy(), []);

  const surfaceCatalog = catalog || { stars, ownedStars, loadedSectorCount };
  const surfaceSelection = selection || { target: targetStar };
  const surfaceEvents = events || {
    onArrival,
    onTargetChange,
    onOwnedStarPress,
    onReady,
    onError: onRenderError,
    onTelemetry,
    onViewChange,
    onWarpStart,
  };

  const handleRendererError = (error, stage = 'renderer-init') => {
    runtimeRef.current.reportError(error, stage);
    setRecovery((current) => {
      const next = advanceRendererRecovery(current, error, stage);
      if (next.mode !== RENDER_MODE.maintenance) {
        runtimeRef.current.recover({ mode: next.mode, failureCount: next.failures.length });
        runtimeRef.current.start();
      } else {
        surfaceEvents.onError?.(error);
      }
      return next;
    });
  };

  const retry = () => {
    runtimeRef.current.recover({ mode: RENDER_MODE.voyage3d, manual: true });
    runtimeRef.current.start();
    setRecovery(createRendererRecoveryState());
  };

  if (recovery.mode === RENDER_MODE.maintenance) {
    return (
      <View style={styles.maintenance}>
        <Text style={styles.maintenanceTitle}>GÖRÜNTÜ MOTORU KULLANILAMIYOR</Text>
        <Text style={styles.maintenanceBody}>
          3D ve güvenli 2D görünüm başlatılamadı. Cihaz kaynaklarını boşaltıp yeniden deneyin.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryText}>YENİDEN DENE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isSkyFallback = recovery.mode === RENDER_MODE.sky2d;
  const renderer = isSkyFallback ? null : StarSystem3D;
  const engineKind = isSkyFallback ? ENGINE_KIND.sky2d : ENGINE_KIND.voyage3d;
  const fallbackCatalog = isSkyFallback
    ? {
        stars: surfaceCatalog.stars || [],
        ownedStarIds: (surfaceCatalog.ownedStars || []).map((star) => String(star.id)),
      }
    : surfaceCatalog;
  const fallbackEvents = isSkyFallback
    ? {
        onSelect: surfaceEvents.onTargetChange,
        onReady: surfaceEvents.onReady,
        onTelemetry: surfaceEvents.onTelemetry,
        onViewChange: surfaceEvents.onViewChange,
      }
    : { ...surfaceEvents, onError: handleRendererError };

  return (
    <RenderSurfaceBoundary
      resetKey={recovery.revision}
      fallback={<View style={styles.recovering} />}
      onError={(error) => handleRendererError(error, 'render-boundary')}
    >
      <CelestialEngineSurface
        {...props}
        key={`${recovery.mode}-${recovery.revision}`}
        engineKind={engineKind}
        renderer={renderer}
        qualityProfile={recovery.mode === RENDER_MODE.voyage3dLow ? 'low' : undefined}
        catalog={fallbackCatalog}
        selection={surfaceSelection}
        view={view}
        layers={layers}
        events={fallbackEvents}
      />
    </RenderSurfaceBoundary>
  );
}

const styles = StyleSheet.create({
  recovering: { flex: 1, backgroundColor: '#02040A' },
  maintenance: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#02040A',
  },
  maintenanceTitle: { color: '#E6BC4A', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  maintenanceBody: { color: '#9AA9BE', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 12 },
  retryButton: { marginTop: 24, paddingHorizontal: 22, paddingVertical: 12, backgroundColor: '#77BFFF' },
  retryText: { color: '#06101D', fontSize: 12, fontWeight: '900' },
});
