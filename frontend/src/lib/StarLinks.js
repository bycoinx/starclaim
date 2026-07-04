const MOBILE_SCHEME = "starcalimx";

export function buildStarTarget(star = {}) {
  return {
    starId: star.starId || star.star_id || star.id || "",
    code: star.code || star.starClaimCode || star.star_code || "",
    hip: star.hip || star.raw?.hip || "",
    hd: star.hd || star.raw?.hd || "",
    name: star.name || star.properName || star.proper || "",
    constellation: star.constellation || "",
    ra: star.ra ?? star.raw?.ra ?? "",
    dec: star.dec ?? star.raw?.dec ?? "",
  };
}

export function buildWebStarUrl(star = {}, origin = getOrigin()) {
  const target = buildStarTarget(star);
  const identifier = encodeURIComponent(target.code || target.starId || target.name || "star");
  return `${origin}/star/${identifier}`;
}

export function buildMobileStarDeepLink(star = {}) {
  const target = buildStarTarget(star);
  if (target.code) return `${MOBILE_SCHEME}://star/${encodeURIComponent(target.code)}`;
  if (target.hip) return `${MOBILE_SCHEME}://hip/${encodeURIComponent(target.hip)}`;
  return `${MOBILE_SCHEME}://star/${encodeURIComponent(target.starId || target.name || "star")}`;
}

export function buildMobileVaultDeepLink(star = {}) {
  const target = buildStarTarget(star);
  const id = target.starId || target.code;
  return id
    ? `${MOBILE_SCHEME}://vault/item/${encodeURIComponent(id)}`
    : `${MOBILE_SCHEME}://vault`;
}

export async function copyText(value) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }
  return false;
}

export async function shareStarTarget(star = {}) {
  const url = buildWebStarUrl(star);
  if (navigator?.share) {
    await navigator.share({
      title: `StarClaim - ${star.name || star.code || "Star"}`,
      text: `${star.name || star.code || "Star"} kaydini inceleyin.`,
      url,
    });
    return true;
  }
  return copyText(url);
}

function getOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}
