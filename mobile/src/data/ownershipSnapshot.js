import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { CONFIG } from '../../constants/Config';
import { SecurityService } from '../../lib/security';

const SNAPSHOT_KEY = '@ownership_snapshot_v1';
const PURCHASES_KEY = '@purchases';
let syncPromise = null;

function normalizeRecords(records) {
  return (Array.isArray(records) ? records : []).map((record) => ({
    id: record.orderId || `${record.starId}-${record.createdAt}`,
    orderId: record.orderId || '',
    starId: record.starId || '',
    canonicalId: record.canonicalId || record.canonical_id || '',
    catalogId: record.catalogId || record.catalog_id || '',
    sourceId: record.sourceId || record.source_id || '',
    gaiaSourceId: record.gaiaSourceId || record.gaia_source_id || record.gaiaId || '',
    hip: record.hip || '',
    hd: record.hd || '',
    starClaimCode: record.starClaimCode || record.star_claim_code || record.code || '',
    code: record.starClaimCode || record.star_claim_code || record.code || '',
    name: record.name || 'StarClaim Yıldızı',
    constellation: record.constellation || '',
    ra: record.ra,
    dec: record.dec,
    message: record.message || '',
    package: record.package || '',
    amount: record.amount,
    createdAt: record.createdAt || '',
    date: record.createdAt || '',
    verified: true,
    snapshotSource: 'backend',
  }));
}

async function verifyEnvelope(envelope, expectedUserId) {
  if (!envelope?.payload || !envelope?.digest || envelope.algorithm !== 'SHA-256') return null;
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    envelope.payload,
  );
  if (digest.toLowerCase() !== String(envelope.digest).toLowerCase()) return null;
  const snapshot = JSON.parse(envelope.payload);
  if (snapshot.schemaVersion !== 1) return null;
  if (expectedUserId && String(snapshot.userId) !== String(expectedUserId)) return null;
  return snapshot;
}

export async function readVerifiedOwnershipSnapshot(expectedUserId = null) {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const envelope = JSON.parse(raw);
    const snapshot = await verifyEnvelope(envelope, expectedUserId);
    if (!snapshot) {
      await AsyncStorage.removeItem(SNAPSHOT_KEY);
      return null;
    }
    return { ...snapshot, purchases: normalizeRecords(snapshot.records) };
  } catch (error) {
    console.warn('Ownership snapshot read failed', error);
    return null;
  }
}

export async function getOwnershipPurchases() {
  const session = await SecurityService.getSession();
  const userId = session?.user?.user_id || session?.user?.userId || session?.user?.id || null;
  const snapshot = await readVerifiedOwnershipSnapshot(userId);
  if (snapshot) return snapshot.purchases;
  try {
    const raw = await AsyncStorage.getItem(PURCHASES_KEY);
    const purchases = raw ? JSON.parse(raw) : [];
    return Array.isArray(purchases)
      ? purchases.map((purchase) => ({ ...purchase, verified: Boolean(purchase.verified) }))
      : [];
  } catch (error) {
    console.warn('Legacy ownership fallback failed', error);
    return [];
  }
}

async function performSync() {
  const session = await SecurityService.getSession();
  if (!session?.token || !session?.user) return { status: 'no-session' };
  const baseUrl = await CONFIG.getAPIUrl();
  const response = await fetch(`${baseUrl}/api/orders/offline-snapshot`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  if (!response.ok) throw new Error(`Ownership snapshot sync failed: ${response.status}`);
  const envelope = await response.json();
  const userId = session.user.user_id || session.user.userId || session.user.id;
  const snapshot = await verifyEnvelope(envelope, userId);
  if (!snapshot) throw new Error('Ownership snapshot integrity verification failed');
  const purchases = normalizeRecords(snapshot.records);
  await AsyncStorage.multiSet([
    [SNAPSHOT_KEY, JSON.stringify(envelope)],
    [PURCHASES_KEY, JSON.stringify(purchases)],
  ]);
  return { status: 'synced', count: purchases.length, generatedAt: snapshot.generatedAt };
}

export async function syncOwnershipSnapshot() {
  if (!syncPromise) {
    syncPromise = performSync().finally(() => { syncPromise = null; });
  }
  return syncPromise;
}

export const OWNERSHIP_SNAPSHOT_KEY = SNAPSHOT_KEY;
export const OWNERSHIP_PURCHASES_KEY = PURCHASES_KEY;
