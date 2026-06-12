function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9]+/g, '');
}

export function getStarSearchTokens(star) {
  return [
    star?.id,
    star?.hip,
    star?.hip ? `HIP ${star.hip}` : null,
    star?.hd,
    star?.hd ? `HD ${star.hd}` : null,
    star?.proper,
    star?.properName,
    star?.name,
    star?.starClaimCode,
    star?.code,
  ]
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map(normalizeText);
}

export function starMatchesQuery(star, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return false;
  return getStarSearchTokens(star).some((token) => token.includes(normalizedQuery));
}

export function starMatchesTarget(star, target) {
  const candidates = [
    target?.starId,
    target?.id,
    target?.hip,
    target?.hd,
    target?.starClaimCode,
    target?.code,
    target?.name,
  ]
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map(normalizeText);
  if (candidates.length === 0) return false;

  const starTokens = new Set(getStarSearchTokens(star));
  return candidates.some((candidate) => starTokens.has(candidate));
}

export function resolveStarTarget(stars, target) {
  return stars.find((star) => starMatchesTarget(star, target)) || null;
}

export function purchaseMatchesStar(purchase, star) {
  return starMatchesTarget(star, purchase);
}

export function getPurchaseMapParams(purchase) {
  return {
    starId: String(purchase?.starId ?? ''),
    hip: String(purchase?.hip ?? ''),
    hd: String(purchase?.hd ?? ''),
    starClaimCode: String(purchase?.starClaimCode ?? purchase?.code ?? ''),
    name: String(purchase?.name ?? ''),
  };
}
