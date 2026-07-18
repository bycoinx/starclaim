import { createRendererAdapter, RENDERER_KINDS } from "./rendererContract";
import { celestialStore } from "../../stores/celestialStore";

export const WEB_RENDERER_IDS = Object.freeze({
  BACKGROUND: "celestial-background",
  GALAXY: "celestial-galaxy",
  OBSERVATORY: "celestial-observatory",
});

const adapters = [
  createRendererAdapter({
    id: WEB_RENDERER_IDS.BACKGROUND,
    kind: RENDERER_KINDS.TWO_D,
    capabilities: {
      interactive: false,
      selectable: false,
      camera: false,
      catalog: false,
    },
    mapProps: (props, runtime) => ({
      ...props,
      onRendererTelemetry: runtime.onTelemetry,
      onRendererError: runtime.onError,
    }),
    loadComponent: () => import("../../components/StarCanvas"),
  }),
  createRendererAdapter({
    id: WEB_RENDERER_IDS.GALAXY,
    kind: RENDERER_KINDS.THREE_D,
    capabilities: {
      interactive: true,
      selectable: false,
      camera: true,
      catalog: false,
    },
    mapProps: (props, runtime) => {
      const store = celestialStore.getState();
      return {
        ...props,
        cameraTarget: props.cameraTarget ?? store.view.cameraTarget,
        onObserverCoordsChange: (coords) => {
          store.updateObserverCoords(coords);
          props.onObserverCoordsChange?.(coords);
        },
        onCameraViewChange: (view) => store.setCameraView(view),
        onRendererTelemetry: runtime.onTelemetry,
        onRendererError: runtime.onError,
      };
    },
    loadComponent: () => import("../../components/GalaxyScene/GalaxyScene"),
  }),
  createRendererAdapter({
    id: WEB_RENDERER_IDS.OBSERVATORY,
    kind: RENDERER_KINDS.THREE_D,
    capabilities: {
      interactive: true,
      selectable: true,
      camera: true,
      catalog: true,
    },
    mapProps: (props, runtime) => ({
      ...props,
      onRendererTelemetry: runtime.onTelemetry,
      onRendererError: runtime.onError,
    }),
    loadComponent: () => import("../../components/SkySphere"),
  }),
];

const registry = new Map(adapters.map((adapter) => [adapter.id, adapter]));

export function getWebRendererAdapter(rendererId) {
  const adapter = registry.get(rendererId);
  if (!adapter) throw new Error(`Unknown web renderer: ${rendererId}`);
  return adapter;
}

export function listWebRendererAdapters() {
  return [...registry.values()];
}
