import { create } from 'zustand';
import {
  loadMarketplaceListings,
  loadMarketplaceMetrics,
} from './marketplaceRepository';

const EMPTY_METRICS = {
  marketCap: 0,
  volume24h: 0,
  averagePrice: 0,
  listingCount: 0,
};

export const useMarketplaceStore = create((set, get) => ({
  listings: [],
  metrics: EMPTY_METRICS,
  loading: false,
  error: null,
  loadedAt: null,

  load: async (params = {}) => {
    if (get().loading) return get().listings;
    set({ loading: true, error: null });
    try {
      const [listings, metrics] = await Promise.all([
        loadMarketplaceListings(params),
        loadMarketplaceMetrics().catch(() => EMPTY_METRICS),
      ]);
      set({
        listings,
        metrics: { ...EMPTY_METRICS, ...metrics },
        loading: false,
        loadedAt: Date.now(),
      });
      return listings;
    } catch (error) {
      set({ loading: false, error: error.message || String(error) });
      return [];
    }
  },
}));
