function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

export const OWNERSHIP_SYNC_STORAGE_KEY = "starclaim_pending_ownership_sync";

export function normalizeOwnershipRecord(record = {}) {
  const orderId = firstValue(record.orderId, record.order_id, record.id, "");
  const starId = firstValue(record.starId, record.star_id, record.id, "");
  const starClaimCode = firstValue(record.starClaimCode, record.star_claim_code, record.starCode, record.star_code, record.code, "");
  const createdAt = firstValue(record.createdAt, record.created_at, record.claimedAt, record.claimed_at, record.date, "");

  return {
    ...record,
    id: orderId || `${starId}-${createdAt}`,
    orderId,
    order_id: orderId,
    starId,
    star_id: starId,
    canonicalId: firstValue(record.canonicalId, record.canonical_id, ""),
    catalogId: firstValue(record.catalogId, record.catalog_id, ""),
    sourceId: firstValue(record.sourceId, record.source_id, ""),
    gaiaSourceId: firstValue(record.gaiaSourceId, record.gaia_source_id, record.gaiaId, ""),
    hip: firstValue(record.hip, ""),
    hd: firstValue(record.hd, ""),
    starClaimCode,
    code: firstValue(record.code, starClaimCode, ""),
    name: firstValue(record.customName, record.custom_name, record.name, record.properName, "StarClaim Star"),
    constellation: firstValue(record.constellation, ""),
    createdAt,
    created_at: createdAt,
    certificateStatus: firstValue(record.certificateStatus, record.certificate_status, orderId ? "Verified" : "Pending"),
    verified: Boolean(record.verified || orderId),
    raw: record,
  };
}

export function normalizeCheckoutStatusRecord(status = {}, orders = [], stars = []) {
  const statusStarId = firstValue(status.starId, status.star_id, "");
  const matchingOrder = (Array.isArray(orders) ? orders : [])
    .map(normalizeOwnershipRecord)
    .find((order) => order.starId && order.starId === statusStarId);
  const matchingStar = (Array.isArray(stars) ? stars : [])
    .find((star) => ownershipKeys(star).includes(String(statusStarId)));

  return normalizeOwnershipRecord({
    ...(matchingOrder || {}),
    ...(matchingStar || {}),
    orderId: matchingOrder?.orderId || status.orderId || status.order_id || "",
    starId: statusStarId || matchingOrder?.starId || matchingStar?.star_id || matchingStar?.starId || "",
    customName: status.custom_name || status.customName || matchingOrder?.name || matchingStar?.custom_name,
    name: status.custom_name || status.customName || matchingOrder?.name || matchingStar?.name,
    amount: status.amount_total ? Number(status.amount_total) / 100 : matchingOrder?.amount,
    status: status.status,
    paymentStatus: status.payment_status,
    fulfilled: Boolean(status.fulfilled || status.payment_status === "paid"),
  });
}

function ownershipKeys(record = {}) {
  return [
    record.starId,
    record.star_id,
    record.id,
    record.canonicalId,
    record.canonical_id,
    record.catalogId,
    record.catalog_id,
    record.sourceId,
    record.source_id,
    record.gaiaSourceId,
    record.gaia_source_id,
    record.hip,
    record.hd,
    record.starClaimCode,
    record.star_claim_code,
    record.starCode,
    record.star_code,
    record.code,
  ]
    .filter(Boolean)
    .map((value) => String(value));
}

export function findOrderForStar(star = {}, orders = []) {
  const starKeys = new Set(ownershipKeys(star));
  if (!starKeys.size) return null;
  return orders
    .map(normalizeOwnershipRecord)
    .find((order) => ownershipKeys(order).some((key) => starKeys.has(key))) || null;
}

export function resolveCertificateOrderId(star = {}, orders = []) {
  return firstValue(
    star.orderId,
    star.order_id,
    findOrderForStar(star, orders)?.orderId,
    "",
  );
}

export function buildCertificateFilename(star = {}, order = null) {
  const normalizedOrder = order ? normalizeOwnershipRecord(order) : null;
  const code = firstValue(star.code, star.starClaimCode, star.star_code, normalizedOrder?.starClaimCode, normalizedOrder?.orderId, "star");
  return `StarClaim-${String(code).replace(/[^a-z0-9_-]/gi, "-")}-Certificate.pdf`;
}

export function summarizeOwnershipRecords(records = []) {
  const normalized = (Array.isArray(records) ? records : []).map(normalizeOwnershipRecord);
  const ownedStars = normalized.length;
  const certificates = normalized.filter((record) => record.certificateStatus === "Verified" || record.orderId).length;
  const verified = normalized.filter((record) => record.verified).length;
  return {
    ownedStars,
    certificates,
    verified,
    localOnly: Math.max(0, ownedStars - verified),
  };
}

export function savePendingOwnershipSync(record) {
  if (typeof window === "undefined" || !record?.starId) return null;
  const normalized = normalizeOwnershipRecord(record);
  const payload = {
    savedAt: new Date().toISOString(),
    record: normalized,
  };
  window.localStorage.setItem(OWNERSHIP_SYNC_STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function readPendingOwnershipSync(maxAgeMs = 10 * 60 * 1000) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(OWNERSHIP_SYNC_STORAGE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    const savedAt = Date.parse(payload.savedAt || "");
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > maxAgeMs) {
      window.localStorage.removeItem(OWNERSHIP_SYNC_STORAGE_KEY);
      return null;
    }
    return payload.record ? normalizeOwnershipRecord(payload.record) : null;
  } catch {
    window.localStorage.removeItem(OWNERSHIP_SYNC_STORAGE_KEY);
    return null;
  }
}

export function clearPendingOwnershipSync() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(OWNERSHIP_SYNC_STORAGE_KEY);
  }
}
