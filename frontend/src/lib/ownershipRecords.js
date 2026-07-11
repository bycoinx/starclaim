function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

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
