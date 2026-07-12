import React, { forwardRef } from 'react';
import StarCanvas from './StarCanvas';
import { ENGINE_KIND } from '../src/engine/CelestialEngineRuntime';
import { createRendererProps } from '../src/engine/celestialSurfaceProps';

const CelestialEngineSurface = forwardRef(function CelestialEngineSurface(
  { engineKind, renderer: RendererComponent, ...surfaceProps },
  ref
) {
  const rendererProps = createRendererProps(engineKind, surfaceProps);

  if (engineKind === ENGINE_KIND.sky2d) {
    return <StarCanvas ref={ref} {...rendererProps} />;
  }
  if (engineKind === ENGINE_KIND.voyage3d && RendererComponent) {
    return <RendererComponent {...rendererProps} />;
  }
  return null;
});

CelestialEngineSurface.displayName = 'CelestialEngineSurface';

export default React.memo(CelestialEngineSurface);
