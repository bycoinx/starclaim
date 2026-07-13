import { useSyncExternalStore } from 'react';
import {
  getAppLifecycleState,
  isAppLifecycleActive,
  subscribeAppLifecycle,
} from './celestialAppLifecycle';

export function useCelestialAppLifecycle() {
  const state = useSyncExternalStore(
    subscribeAppLifecycle,
    getAppLifecycleState,
    getAppLifecycleState,
  );
  return { state, active: isAppLifecycleActive(state) };
}
