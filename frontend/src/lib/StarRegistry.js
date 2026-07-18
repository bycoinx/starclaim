/**
 * StarRegistry Client
 * 
 * Directly interfaces with the backend APIs / Smart Contracts.
 * Serves as the raw data provider layer.
 */
import { api } from "./api";

export class StarRegistry {
  /**
   * Fetches raw star rows from the backend registry.
   */
  static async fetchStars(params = {}) {
    try {
      const response = await api.get("/stars", { params });
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.warn("StarRegistry: Failed to fetch stars from endpoint, propagating error.", error);
      throw error;
    }
  }

  static async countStars(params = {}) {
    try {
      const response = await api.get("/stars/count", { params });
      if (response && typeof response.data === "object" && response.data.count !== undefined) {
        const count = Number(response.data.count);
        return Number.isFinite(count) ? count : null;
      }
      return null;
    } catch (error) {
      console.warn("StarRegistry: Stars count endpoint unavailable; falling back to loaded page count.", error);
      return null;
    }
  }

  static async fetchConstellations() {
    try {
      const response = await api.get("/stars/constellations");
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.warn("StarRegistry: Failed to fetch constellation list.", error);
      return [];
    }
  }

  static async fetchCuratedStars(params = {}) {
    const response = await api.get("/catalog/stars", { params: { limit: 200, ...params } });
    return Array.isArray(response.data) ? response.data : [];
  }

  static async fetchCuratedPricing(params = {}) {
    const response = await api.get("/catalog/pricing", { params: { limit: 200, ...params } });
    return Array.isArray(response.data) ? response.data : [];
  }

  static async fetchMyStars() {
    try {
      const response = await api.get("/stars/mine/list");
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  }

  static async fetchNftMetadataManifest(params = {}) {
    const response = await api.get("/catalog/nft-manifest", { params });
    return response.data;
  }

  static async fetchNftMetadata(canonicalId, params = {}) {
    const response = await api.get(`/catalog/nft-metadata/${encodeURIComponent(canonicalId)}`, { params });
    return response.data;
  }

  static async verifyNftMetadata(document) {
    const response = await api.post("/catalog/nft-metadata/verify", document);
    return response.data;
  }

  /**
   * Fetches specific star detailed metadata.
   */
  static async getStarDetails(starId) {
    try {
      const response = await api.get(`/stars/${starId}`);
      return response.data || null;
    } catch (error) {
      console.warn(`StarRegistry: Failed to fetch star details for ID ${starId}`, error);
      return null;
    }
  }

  /**
   * Triggers a claim/mint registration on the registry database.
   */
  static async registerClaim(starId, pilotName) {
    try {
      const response = await api.post(`/stars/${starId}/claim`, { owner_name: pilotName });
      return response.data || null;
    } catch (error) {
      console.warn(`StarRegistry: Claim registration failed for star ${starId}`, error);
      throw error;
    }
  }
}
