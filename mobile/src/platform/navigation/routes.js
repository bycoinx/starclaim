export const ROUTES = Object.freeze({
  root: '/',
  claim: '/(tabs)/claim',
  catalog: '/(tabs)/catalog',
  sky: '/(tabs)/sky',
  universe: '/(tabs)/universe',
  profile: '/(tabs)/profile',
  marketplace: '/marketplace',
  about: '/about',
  debug: '/debug',
  vaultHome: '/(tabs)/vault/home',
  vaultNewMessage: '/(tabs)/vault/newmessage',
  vaultPurchases: '/(tabs)/vault/purchases',
  vaultLockSettings: '/(tabs)/vault/locksetting',
  myStarsCollection: '/(tabs)/mystars/collection',
  starDetail: '/(tabs)/explore/stardetail',
  starMap: '/(tabs)/explore/starmap',
  starVoyage: '/(tabs)/explore/starvoyage',
});

export const TAB_ITEMS = Object.freeze([
  { key: 'claim', label: 'Yildiz Al', icon: 'star', iconOutline: 'star-outline', href: ROUTES.claim },
  { key: 'sky', label: 'Sky Live', icon: 'telescope', iconOutline: 'telescope-outline', href: ROUTES.sky },
  { key: 'universe', label: '3D Evren', icon: 'cube', iconOutline: 'cube-outline', href: ROUTES.universe },
  { key: 'vault', label: 'StarVault', icon: 'lock-closed', iconOutline: 'lock-closed-outline', href: ROUTES.vaultHome },
  { key: 'profile', label: 'Profil', icon: 'person-circle', iconOutline: 'person-circle-outline', href: ROUTES.profile },
]);

export function getActiveTabKey(pathname = '') {
  if (pathname.includes('/claim') || pathname.includes('/catalog') || pathname === '/stars') return 'claim';
  if (pathname.includes('/sky') || pathname.includes('/starmap')) return 'sky';
  if (pathname.includes('/universe') || pathname.includes('/starvoyage')) return 'universe';
  if (pathname.includes('/vault')) return 'vault';
  if (pathname.includes('/profile') || pathname.includes('/mystars') || pathname.includes('/stardetail')) return 'profile';
  return null;
}

export function starDetailRoute({ starId, name } = {}) {
  return {
    pathname: ROUTES.starDetail,
    params: compactParams({ starId, name }),
  };
}

export function starMapRoute(params = {}) {
  return {
    pathname: ROUTES.starMap,
    params: compactParams(params),
  };
}

export function starVoyageRoute(target) {
  return {
    pathname: ROUTES.starVoyage,
    params: compactParams({
      target: typeof target === 'string' ? target : JSON.stringify(target),
    }),
  };
}

export function safeBackOrReplace(router, fallback = ROUTES.claim) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}

function compactParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}
