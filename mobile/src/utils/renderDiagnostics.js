import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@starclaim_render_diagnostics_v1';
const MAX_ENTRIES = 20;

function getJsHeapBytes() {
  const memory = globalThis?.performance?.memory;
  return Number.isFinite(memory?.usedJSHeapSize) ? memory.usedJSHeapSize : null;
}

export async function recordRenderDiagnostic(entry) {
  const diagnostic = {
    recordedAt: new Date().toISOString(),
    jsHeapBytes: getJsHeapBytes(),
    ...entry,
  };

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const history = Array.isArray(existing) ? existing : [];
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([diagnostic, ...history].slice(0, MAX_ENTRIES)),
    );
  } catch (error) {
    console.warn('Render diagnostic write failed', error);
  }

  if (__DEV__) console.info('[RenderDiagnostic]', diagnostic);
  return diagnostic;
}

export async function getRenderDiagnostics() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Render diagnostic read failed', error);
    return [];
  }
}

export const RENDER_DIAGNOSTICS_STORAGE_KEY = STORAGE_KEY;
