const listeners = new Set();

export const OWNERSHIP_SYNC_EVENT = Object.freeze({
  PURCHASE_COMMITTED: 'purchase-committed',
});

export function onOwnershipSync(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitOwnershipSync(event, payload = {}) {
  listeners.forEach((listener) => {
    try {
      listener(event, payload);
    } catch (error) {
      console.warn('ownership sync listener failed', error);
    }
  });
}
