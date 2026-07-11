const listeners = new Set();

export const OWNERSHIP_SYNC_EVENT = Object.freeze({
  PURCHASE_COMMITTED: 'purchase-committed',
});

export function normalizeOwnershipSyncPayload(record = {}, extra = {}) {
  return {
    ...extra,
    id: record.id || record.orderId || extra.id || '',
    orderId: record.orderId || record.id || extra.orderId || '',
    starId: record.starId || record.star_id || record.id || extra.starId || '',
    canonicalId: record.canonicalId || record.canonical_id || extra.canonicalId || '',
    catalogId: record.catalogId || record.catalog_id || extra.catalogId || '',
    sourceId: record.sourceId || record.source_id || extra.sourceId || '',
    gaiaSourceId: record.gaiaSourceId || record.gaia_source_id || record.gaiaId || extra.gaiaSourceId || '',
    hip: record.hip || extra.hip || '',
    hd: record.hd || extra.hd || '',
    starClaimCode: record.starClaimCode || record.star_claim_code || record.code || extra.starClaimCode || '',
    name: record.name || record.customName || record.properName || extra.name || '',
    committedAt: extra.committedAt || record.createdAt || record.date || new Date().toISOString(),
  };
}

export function onOwnershipSync(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function emitOwnershipSync(event, payload = {}) {
  const results = [...listeners].map((listener) => {
    try {
      return Promise.resolve(listener(event, payload));
    } catch (error) {
      console.warn('ownership sync listener failed', error);
      return Promise.resolve(null);
    }
  });
  return Promise.allSettled(results);
}

export function emitPurchaseCommitted(record = {}, extra = {}) {
  return emitOwnershipSync(
    OWNERSHIP_SYNC_EVENT.PURCHASE_COMMITTED,
    normalizeOwnershipSyncPayload(record, extra),
  );
}
