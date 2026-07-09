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
        return Number(response.data.count);
      }
      return 0;
    } catch (error) {
      console.warn("StarRegistry: Failed to fetch stars count from endpoint.", error);
      throw error;
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
