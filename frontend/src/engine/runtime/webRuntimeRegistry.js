const runtimes = new Map();
const listeners = new Set();

function notifyRegistry() {
  const snapshots = getWebRuntimeSnapshots();
  listeners.forEach((listener) => listener(snapshots));
}

export function registerWebCelestialRuntime(runtime) {
  if (!runtime?.instanceId) return () => {};
  runtimes.set(runtime.instanceId, runtime);
  const unsubscribeRuntime = runtime.subscribe(notifyRegistry);
  notifyRegistry();
  return () => {
    unsubscribeRuntime();
    runtimes.delete(runtime.instanceId);
    notifyRegistry();
  };
}

export function getWebRuntimeSnapshots() {
  return [...runtimes.values()].map((runtime) => runtime.getSnapshot());
}

export function subscribeWebRuntimeRegistry(listener, emitCurrent = false) {
  listeners.add(listener);
  if (emitCurrent) listener(getWebRuntimeSnapshots());
  return () => listeners.delete(listener);
}

export function resetWebRuntimeRegistryForTests() {
  runtimes.clear();
  listeners.clear();
}
