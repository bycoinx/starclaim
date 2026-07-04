import { createStarTargetFromStar, resolveStarTarget } from '../../utils/starIdentity';
import { ROUTES, starMapRoute } from './routes';

export function resolveParsedDeepLinkRoute(parsedLink = {}, stars = []) {
  const type = parsedLink.hostname;
  const identifier = parsedLink.path;

  if (type === 'vault') {
    return { pathname: ROUTES.vaultHome };
  }

  if (!type || !identifier) return null;

  const target = createDeepLinkTarget(type, identifier);
  if (!target) return null;

  const foundStar = resolveStarTarget(stars, target);
  if (!foundStar) return null;

  return starMapRoute(createStarMapParamsFromStar(foundStar));
}

export function createDeepLinkTarget(type, identifier) {
  if (type === 'star') return { starClaimCode: identifier };
  if (type === 'hip') return { hip: identifier };
  return null;
}

export function createStarMapParamsFromStar(star) {
  const starTarget = createStarTargetFromStar(star);
  return {
    starId: starTarget.id,
    hip: starTarget.hip,
    hd: starTarget.hd,
    properName: starTarget.properName,
    name: starTarget.name,
    starClaimCode: starTarget.starClaimCode,
    raHours: starTarget.raHours,
    raDegrees: starTarget.raDegrees,
    decDegrees: starTarget.decDegrees,
    distanceParsec: starTarget.distanceParsec,
    magnitude: starTarget.magnitude,
    spectralType: starTarget.spectralType,
    constellation: starTarget.constellation,
  };
}
