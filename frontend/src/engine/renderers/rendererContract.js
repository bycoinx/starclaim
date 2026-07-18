import React from "react";

export const RENDERER_KINDS = Object.freeze({
  TWO_D: "2d",
  THREE_D: "3d",
});

export const RENDERER_EVENTS = Object.freeze({
  INITIALIZE: "initialize",
  RENDER: "render",
  UPDATE: "update",
  DISPOSE: "dispose",
});

const REQUIRED_METHODS = ["initialize", "update", "render", "dispose", "getTelemetry"];

function createInitialSession(adapter, { props = {}, now = Date.now() } = {}) {
  return {
    rendererId: adapter.id,
    kind: adapter.kind,
    initializedAt: now,
    lastUpdatedAt: now,
    disposedAt: null,
    renderCount: 0,
    updateCount: 0,
    props,
  };
}

export function createRendererAdapter(definition) {
  if (!definition?.id || !Object.values(RENDERER_KINDS).includes(definition.kind)) {
    throw new Error("Renderer adapters require an id and a supported kind.");
  }
  if (typeof definition.loadComponent !== "function") {
    throw new Error(`Renderer adapter "${definition.id}" requires loadComponent().`);
  }

  const adapter = {
    id: definition.id,
    kind: definition.kind,
    capabilities: Object.freeze({ ...(definition.capabilities || {}) }),
    loadComponent: definition.loadComponent,
    mapProps: definition.mapProps || ((props) => props),
    initialize: definition.initialize || ((context) => createInitialSession(adapter, context)),
    update: definition.update || ((session, props, now = Date.now()) => ({
      ...session,
      props,
      lastUpdatedAt: now,
      updateCount: session.updateCount + 1,
    })),
    render: definition.render || ((Component, props) => React.createElement(Component, props)),
    dispose: definition.dispose || ((session, now = Date.now()) => ({ ...session, disposedAt: now })),
    getTelemetry: definition.getTelemetry || ((session) => ({
      rendererId: session.rendererId,
      kind: session.kind,
      initializedAt: session.initializedAt,
      lastUpdatedAt: session.lastUpdatedAt,
      disposedAt: session.disposedAt,
      renderCount: session.renderCount,
      updateCount: session.updateCount,
    })),
  };

  for (const method of REQUIRED_METHODS) {
    if (typeof adapter[method] !== "function") {
      throw new Error(`Renderer adapter "${definition.id}" is missing ${method}().`);
    }
  }

  return Object.freeze(adapter);
}

export function markRendererRendered(session, now = Date.now()) {
  return {
    ...session,
    lastUpdatedAt: now,
    renderCount: session.renderCount + 1,
  };
}

export function createRendererEvent(adapter, event, session) {
  return {
    event,
    rendererId: adapter.id,
    kind: adapter.kind,
    capabilities: adapter.capabilities,
    telemetry: adapter.getTelemetry(session),
  };
}
