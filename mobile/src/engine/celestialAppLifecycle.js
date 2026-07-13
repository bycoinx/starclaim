export const APP_LIFECYCLE_STATE = Object.freeze({
  active: 'active',
  inactive: 'inactive',
  background: 'background',
  unknown: 'unknown',
});

let currentState = APP_LIFECYCLE_STATE.unknown;
const listeners = new Set();
const runtimes = new Set();

export function isAppLifecycleActive(state = currentState) {
  return state === APP_LIFECYCLE_STATE.active;
}

export function getAppLifecycleState() {
  return currentState;
}

export function subscribeAppLifecycle(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function registerCelestialRuntime(runtime) {
  if (!runtime) return () => {};
  runtimes.add(runtime);
  if (!isAppLifecycleActive()) runtime.suspend?.(`app-${currentState}`);
  return () => runtimes.delete(runtime);
}

export function setAppLifecycleState(nextState) {
  const normalized = Object.values(APP_LIFECYCLE_STATE).includes(nextState)
    ? nextState
    : APP_LIFECYCLE_STATE.unknown;
  if (normalized === currentState) return false;

  currentState = normalized;
  const active = isAppLifecycleActive(normalized);
  runtimes.forEach((runtime) => {
    if (active) runtime.resume?.({ reason: 'app-active' });
    else runtime.suspend?.(`app-${normalized}`);
  });
  listeners.forEach((listener) => listener());
  return true;
}
