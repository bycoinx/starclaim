import { CONFIG } from '../../../constants/Config';
import { SecurityService } from '../../../lib/security';

export const MARKETPLACE_ACTIONS = Object.freeze([
  'viewDetail',
  'buy',
  'list',
  'unlist',
  'openVault',
  'share',
]);

export async function loadMarketplaceListings(params = {}) {
  const baseUrl = await CONFIG.getAPIUrl();
  const query = new URLSearchParams(compactParams(params)).toString();
  const response = await fetch(`${baseUrl}/api/marketplace/listings${query ? `?${query}` : ''}`);
  if (!response.ok) throw new Error(`Marketplace listings failed: ${response.status}`);
  const data = await response.json();
  return normalizeMarketplaceListings(Array.isArray(data) ? data : data?.items || data?.listings || []);
}

export async function loadMarketplaceMetrics() {
  const baseUrl = await CONFIG.getAPIUrl();
  const response = await fetch(`${baseUrl}/api/marketplace/metrics`);
  if (!response.ok) throw new Error(`Marketplace metrics failed: ${response.status}`);
  const data = await response.json();
  return {
    marketCap: Number(data.marketCap ?? data.market_cap ?? data.total_value ?? 0),
    volume24h: Number(data.volume24h ?? data.volume_24h ?? data.volume ?? 0),
    averagePrice: Number(data.averagePrice ?? data.average_price ?? data.star_price ?? 0),
    listingCount: Number(data.listingCount ?? data.listing_count ?? data.active_listings ?? data.count ?? 0),
    raw: data,
  };
}

export async function listStarOnMarketplace(starId, askingPrice) {
  const session = await SecurityService.getSession();
  if (!session?.token) throw new Error('Marketplace listing requires a session');
  const baseUrl = await CONFIG.getAPIUrl();
  const response = await fetch(`${baseUrl}/api/marketplace/list`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ star_id: starId, asking_price: Number(askingPrice) }),
  });
  if (!response.ok) throw new Error(await readError(response, 'Marketplace listing failed'));
  return normalizeMarketplaceListing(await response.json());
}

export async function unlistStarFromMarketplace({ starId, listingId } = {}) {
  const session = await SecurityService.getSession();
  if (!session?.token) throw new Error('Marketplace unlist requires a session');
  const baseUrl = await CONFIG.getAPIUrl();
  const response = await fetch(`${baseUrl}/api/marketplace/unlist`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ star_id: starId, listing_id: listingId }),
  });
  if (!response.ok) throw new Error(await readError(response, 'Marketplace unlist failed'));
  return normalizeMarketplaceListing(await response.json());
}

export async function createMarketplaceCheckoutSession(listingId, originUrl = 'starcalimx://marketplace') {
  const session = await SecurityService.getSession();
  if (!session?.token) throw new Error('Marketplace checkout requires a session');
  const baseUrl = await CONFIG.getAPIUrl();
  const response = await fetch(`${baseUrl}/api/marketplace/checkout/session`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ listing_id: listingId, origin_url: originUrl }),
  });
  if (!response.ok) throw new Error(await readError(response, 'Marketplace checkout failed'));
  return response.json();
}

export function normalizeMarketplaceListing(listing = {}) {
  const listingId = stringValue(listing.listingId || listing.listing_id || listing.id || listing._id);
  const starId = stringValue(listing.starId || listing.star_id || listing.starCode || listing.star_code || listing.code);
  const starClaimCode = stringValue(listing.starClaimCode || listing.star_code || listing.code || listing.starCode);
  const askingPrice = numberValue(listing.askingPrice ?? listing.asking_price ?? listing.price);
  const status = stringValue(listing.status || (listing.forSale === false ? 'inactive' : 'active')) || 'active';
  const sellerId = stringValue(listing.sellerId || listing.seller_id || listing.owner_id);
  const sellerName = stringValue(listing.sellerName || listing.seller_name || listing.owner_name || listing.seller);
  const actions = normalizeActions(listing.actions, status);

  return {
    ...listing,
    id: listingId || starId,
    listingId,
    listing_id: listingId,
    starId,
    star_id: starId,
    starClaimCode,
    star_code: starClaimCode,
    code: starClaimCode,
    name: listing.name || listing.starName || listing.star_name || 'StarClaim Star',
    starName: listing.starName || listing.star_name || listing.name || 'StarClaim Star',
    tier: listing.tier || listing.importance_label || 'standard',
    constellation: listing.constellation || '',
    askingPrice,
    asking_price: askingPrice,
    price: askingPrice,
    currency: listing.currency || 'USD',
    sellerId,
    seller_id: sellerId,
    sellerName,
    seller_name: sellerName,
    seller: sellerName,
    status,
    forSale: status !== 'sold' && status !== 'inactive',
    listedAt: listing.listedAt || listing.listed_at || listing.created_at || '',
    listed_at: listing.listed_at || listing.listedAt || listing.created_at || '',
    percentIncrease: numberValue(listing.percentIncrease ?? listing.percent_increase),
    percent_increase: numberValue(listing.percent_increase ?? listing.percentIncrease),
    actions,
    canBuy: actions.includes('buy') && status === 'active',
    canUnlist: actions.includes('unlist'),
    raw: listing.raw || listing,
  };
}

export function normalizeMarketplaceListings(listings = []) {
  return (Array.isArray(listings) ? listings : []).map(normalizeMarketplaceListing);
}

function normalizeActions(actions, status) {
  const base = Array.isArray(actions) ? actions : ['viewDetail', 'buy', 'openVault', 'share'];
  const allowed = base.filter((action) => MARKETPLACE_ACTIONS.includes(action));
  if (status !== 'active') return allowed.filter((action) => action !== 'buy');
  return Array.from(new Set(allowed));
}

function compactParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

function stringValue(value) {
  return value == null ? '' : String(value);
}

function numberValue(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

async function readError(response, fallback) {
  try {
    const data = await response.json();
    return data?.detail || fallback;
  } catch {
    return fallback;
  }
}
