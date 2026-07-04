import { CONFIG } from '../../../constants/Config';

export async function loadMarketplaceListings(params = {}) {
  const baseUrl = await CONFIG.getAPIUrl();
  const query = new URLSearchParams(compactParams(params)).toString();
  const response = await fetch(`${baseUrl}/api/marketplace/listings${query ? `?${query}` : ''}`);
  if (!response.ok) throw new Error(`Marketplace listings failed: ${response.status}`);
  const data = await response.json();
  return normalizeListings(Array.isArray(data) ? data : data?.items || data?.listings || []);
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

function normalizeListings(listings) {
  return listings.map((listing) => ({
    id: listing.id || listing.listingId || listing.listing_id || listing._id || `${listing.starId || listing.star_id}`,
    starId: listing.starId || listing.star_id || '',
    name: listing.name || listing.starName || listing.star_name || 'StarClaim Star',
    tier: listing.tier || listing.importance_label || '',
    constellation: listing.constellation || '',
    price: Number(listing.price || listing.askingPrice || listing.asking_price || 0),
    currency: listing.currency || 'USD',
    seller: listing.seller || listing.ownerName || listing.owner_name || '',
    status: listing.status || (listing.forSale === false ? 'inactive' : 'active'),
    percentIncrease: Number(listing.percentIncrease ?? listing.percent_increase ?? 0),
    raw: listing,
  }));
}

function compactParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}
