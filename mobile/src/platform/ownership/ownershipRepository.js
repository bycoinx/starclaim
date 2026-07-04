import {
  OWNERSHIP_PURCHASES_KEY,
  getOwnershipPurchases,
  readVerifiedOwnershipSnapshot,
  syncOwnershipSnapshot,
} from '../../data/ownershipSnapshot';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadOwnershipRecords() {
  const purchases = await getOwnershipPurchases();
  return normalizeOwnershipRecords(purchases);
}

export async function refreshOwnershipRecords() {
  await syncOwnershipSnapshot();
  return loadOwnershipRecords();
}

export async function appendLocalOwnershipRecord(record) {
  const records = await loadOwnershipRecords();
  const normalized = normalizeOwnershipRecords([{ ...record, verified: Boolean(record.verified) }])[0];
  const next = [normalized, ...records.filter((item) => item.id !== normalized.id && item.starId !== normalized.starId)];
  await AsyncStorage.setItem(OWNERSHIP_PURCHASES_KEY, JSON.stringify(next));
  return next;
}

export async function updateLocalOwnershipMessage(starId, message) {
  const records = await loadOwnershipRecords();
  const next = records.map((record) => (
    ownershipRecordMatchesId(record, starId)
      ? { ...record, message, raw: { ...record.raw, message } }
      : record
  ));
  await AsyncStorage.setItem(OWNERSHIP_PURCHASES_KEY, JSON.stringify(next));
  return next;
}

export async function loadOwnershipSnapshot(expectedUserId = null) {
  return readVerifiedOwnershipSnapshot(expectedUserId);
}

export function summarizeOwnership(records = []) {
  const ownedStars = records.length;
  const certificates = records.filter(hasCertificateLikeData).length;
  const verified = records.filter((record) => record.verified).length;

  return {
    ownedStars,
    certificates,
    verified,
    localOnly: Math.max(0, ownedStars - verified),
  };
}

function normalizeOwnershipRecords(records) {
  return (Array.isArray(records) ? records : []).map((record) => ({
    id: record.id || record.orderId || `${record.starId || record.hip || 'star'}-${record.createdAt || record.date || ''}`,
    orderId: record.orderId || record.id || '',
    starId: record.starId || record.star_id || record.id || '',
    hip: record.hip || '',
    hd: record.hd || '',
    starClaimCode: record.starClaimCode || record.code || '',
    name: record.name || record.properName || record.proper || 'StarClaim Star',
    constellation: record.constellation || '',
    ra: record.ra,
    dec: record.dec,
    method: record.method || record.paymentMethod || '',
    message: record.message || '',
    createdAt: record.createdAt || record.date || '',
    date: record.date || record.createdAt || '',
    verified: Boolean(record.verified),
    raw: record,
  }));
}

function hasCertificateLikeData(record) {
  return Boolean(record.verified || record.orderId || record.starClaimCode || record.code);
}

function ownershipRecordMatchesId(record, starId) {
  const target = String(starId ?? '');
  if (!target) return false;
  return [record.starId, record.id, record.orderId, record.hip, record.hd, record.starClaimCode]
    .some((value) => String(value ?? '') === target);
}
