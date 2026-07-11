export const MARKETPLACE_ACTIONS = Object.freeze([
  "viewDetail",
  "buy",
  "list",
  "unlist",
  "openVault",
  "share",
]);

export function normalizeMarketplaceListing(listing = {}) {
  const listingId = stringValue(listing.listingId || listing.listing_id || listing.id || listing._id);
  const starId = stringValue(listing.starId || listing.star_id || listing.starCode || listing.star_code || listing.code);
  const starClaimCode = stringValue(listing.starClaimCode || listing.star_code || listing.code || listing.starCode);
  const askingPrice = numberValue(listing.askingPrice ?? listing.asking_price ?? listing.price);
  const status = stringValue(listing.status || (listing.forSale === false ? "inactive" : "active")) || "active";
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
    name: listing.name || listing.starName || listing.star_name || "StarClaim Star",
    starName: listing.starName || listing.star_name || listing.name || "StarClaim Star",
    tier: listing.tier || listing.importance_label || "standard",
    constellation: listing.constellation || "",
    askingPrice,
    asking_price: askingPrice,
    price: askingPrice,
    currency: listing.currency || "USD",
    sellerId,
    seller_id: sellerId,
    sellerName,
    seller_name: sellerName,
    seller: sellerName,
    status,
    forSale: status !== "sold" && status !== "inactive",
    listedAt: listing.listedAt || listing.listed_at || listing.created_at || "",
    listed_at: listing.listed_at || listing.listedAt || listing.created_at || "",
    percentIncrease: numberValue(listing.percentIncrease ?? listing.percent_increase),
    percent_increase: numberValue(listing.percent_increase ?? listing.percentIncrease),
    actions,
    canBuy: actions.includes("buy") && status === "active",
    canUnlist: actions.includes("unlist"),
    raw: listing.raw || listing,
  };
}

export function normalizeMarketplaceListings(listings = []) {
  return (Array.isArray(listings) ? listings : []).map(normalizeMarketplaceListing);
}

export function marketplaceListingKeys(listing = {}) {
  const normalized = normalizeMarketplaceListing(listing);
  return [
    normalized.listingId,
    normalized.starId,
    normalized.starClaimCode,
    normalized.code,
  ].filter(Boolean).map(String);
}

function normalizeActions(actions, status) {
  const base = Array.isArray(actions) ? actions : ["viewDetail", "buy", "openVault", "share"];
  const allowed = base.filter((action) => MARKETPLACE_ACTIONS.includes(action));
  if (status !== "active") return allowed.filter((action) => action !== "buy");
  return Array.from(new Set(allowed));
}

function stringValue(value) {
  return value == null ? "" : String(value);
}

function numberValue(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}
