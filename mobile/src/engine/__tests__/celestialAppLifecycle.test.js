import { CelestialEngineRuntime, ENGINE_KIND, ENGINE_STATE } from '../CelestialEngineRuntime';
import {
  APP_LIFECYCLE_STATE,
  getAppLifecycleState,
  registerCelestialRuntime,
  setAppLifecycleState,
  subscribeAppLifecycle,
} from '../celestialAppLifecycle';

describe('celestial app lifecycle', () => {
  beforeEach(() => setAppLifecycleState(APP_LIFECYCLE_STATE.active));

  test('suspends and resumes registered runtimes with the app', () => {
    const runtime = new CelestialEngineRuntime({ id: 'sky', kind: ENGINE_KIND.sky2d });
    runtime.start();
    const unregister = registerCelestialRuntime(runtime);

    setAppLifecycleState(APP_LIFECYCLE_STATE.background);
    expect(runtime.state).toBe(ENGINE_STATE.suspended);
    setAppLifecycleState(APP_LIFECYCLE_STATE.active);
    expect(runtime.state).toBe(ENGINE_STATE.running);

    unregister();
  });

  test('normalizes unknown platform states and notifies subscribers once', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeAppLifecycle(listener);

    expect(setAppLifecycleState('extension-state')).toBe(true);
    expect(getAppLifecycleState()).toBe(APP_LIFECYCLE_STATE.unknown);
    expect(setAppLifecycleState('extension-state')).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});
