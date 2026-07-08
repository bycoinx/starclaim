import { create } from 'zustand';
import {
  CATALOG_TARGET_SIZE,
  countRemoteStars,
  loadAllStars,
  searchStars,
  getConstellations,
  getSpectralTypes
} from './starRepository';

export const useCatalogStore = create((set, get) => ({
  stars: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedTier: 'all', // 'all' | 'named' | 'nearby'
  constellations: [],
  spectralTypes: [],
  totalCount: 0,
  catalogTargetSize: CATALOG_TARGET_SIZE,
  loadedAt: null,

  loadCatalog: async (forceReload = false) => {
    if (get().loading && !forceReload) return get().stars;
    set({ loading: true, error: null });
    try {
      const [stars, remoteCount] = await Promise.all([
        loadAllStars(CATALOG_TARGET_SIZE),
        countRemoteStars(),
      ]);
      const totalCount = remoteCount || stars.length;
      set({
        stars,
        totalCount,
        constellations: getConstellations(stars),
        spectralTypes: getSpectralTypes(stars),
        loading: false,
        loadedAt: Date.now(),
      });
      return stars;
    } catch (error) {
      set({ loading: false, error: error.message || String(error) });
      return [];
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSelectedTier: (tier) => {
    set({ selectedTier: tier });
  },

  getFilteredStars: () => {
    const { stars, searchQuery, selectedTier } = get();
    return stars.filter((star) => {
      // 1. Search Query Match
      const matchesSearch = String(star.name || star.properName || star.proper || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        String(star.starClaimCode || star.code || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Filter Match
      const distance = Number(star.distanceParsec ?? star.dist ?? 0);
      if (selectedTier === 'named') {
        const isNamed = Boolean(star.properName || star.proper) || !star.localCatalog;
        if (!isNamed) return false;
      } else if (selectedTier === 'nearby') {
        const isNearby = Number.isFinite(distance) && distance > 0 && distance <= 20;
        if (!isNearby) return false;
      }

      return true;
    });
  },

  getVisibleTotalLabel: () => {
    const { totalCount, stars, catalogTargetSize } = get();
    const count = totalCount || stars.length || catalogTargetSize;
    return count >= 1000 ? count.toLocaleString('tr-TR') : String(count);
  },
}));
