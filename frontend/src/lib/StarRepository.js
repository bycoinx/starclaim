import { StarRegistry } from "./StarRegistry";
import { StarAssetManager } from "./StarAssetManager";

const FALLBACK_STARS = [
  { star_id: "fallback-sirius", code: "SIRIUS-A", name: "Sirius", constellation: "Canis Major", tier: "legendary", price: 2999, spect: "A1V", distance: 8.6, magnitude: -1.46, claimed: false },
  { star_id: "fallback-vega", code: "VEGA-LYR", name: "Vega", constellation: "Lyra", tier: "legendary", price: 1499, spect: "A0V", distance: 25.0, magnitude: 0.03, claimed: false },
  { star_id: "fallback-rigel", code: "RIGEL-ORI", name: "Rigel", constellation: "Orion", tier: "supernova", price: 1299, spect: "B8Iab", distance: 860, magnitude: 0.18, claimed: true, owner_name: "Pilot One" },
  { star_id: "fallback-polaris", code: "POLARIS-UMI", name: "Polaris", constellation: "Ursa Minor", tier: "nova", price: 899, spect: "F7Ib", distance: 433.8, magnitude: 1.98, claimed: false },
  { star_id: "fallback-betelgeuse", code: "BETELGEUSE-ORI", name: "Betelgeuse", constellation: "Orion", tier: "legendary", price: 2499, spect: "M1-M2Ia-ab", distance: 642.5, magnitude: 0.5, claimed: true, owner_name: "StarSeeker" },
  { star_id: "fallback-procyon", code: "PROCYON-CMI", name: "Procyon", constellation: "Canis Major", tier: "supernova", price: 1199, spect: "F5IV-V", distance: 11.46, magnitude: 0.34, claimed: false },
  { star_id: "fallback-arcturus", code: "ARCTURUS-BOO", name: "Arcturus", constellation: "Bootes", tier: "legendary", price: 1999, spect: "K1.5IIIfe-0.5", distance: 36.7, magnitude: -0.05, claimed: false },
  { star_id: "fallback-aldebaran", code: "ALDEBARAN-TAU", name: "Aldebaran", constellation: "Taurus", tier: "supernova", price: 1099, spect: "K5III", distance: 65.3, magnitude: 0.85, claimed: false }
];

export class StarRepository {
  static cache = [];
  static initialized = false;

  /**
   * Loads all stars from the registry, normalizes them, and caches them in memory.
   * If remote fetching fails, it falls back to the embedded local catalog.
   */
  static async loadAll(forceReload = false) {
    if (this.initialized && !forceReload) {
      return this.cache;
    }

    try {
      const rawStars = await StarRegistry.fetchStars(500);
      if (rawStars && rawStars.length > 0) {
        this.cache = this.normalize(rawStars);
      } else {
        this.cache = this.normalize(FALLBACK_STARS);
      }
    } catch (error) {
      console.warn("StarRepository: registry request failed. Initializing with local fallback catalog.");
      this.cache = this.normalize(FALLBACK_STARS);
    }
    
    this.initialized = true;
    return this.cache;
  }

  /**
   * Normalizes raw rows into rich domain objects using StarAssetManager rules.
   */
  static normalize(rawArray) {
    if (!Array.isArray(rawArray)) return [];
    
    return rawArray.filter(Boolean).map((item, index) => {
      const asset = StarAssetManager.getStarAsset(item);
      return {
        // Core Identity fields
        starId: asset.starId || `star-${index}`,
        code: asset.code || `SC-${index + 1}`,
        name: asset.name,
        constellation: asset.constellation,
        spectralType: asset.spectralType,
        magnitude: asset.magnitude,
        distance: asset.distance,
        
        // Tier & Assets
        tier: asset.tier,
        tierLabel: asset.tierLabel,
        tierClass: asset.tierClass,
        previewImage: asset.previewImage,
        heroImage: asset.heroImage,
        
        // Ownership & Commercial
        isClaimed: asset.isClaimed,
        ownerName: asset.ownerName,
        ownerId: asset.ownerId,
        price: asset.price,
        hasCertificate: asset.hasCertificate,
        certificateUrl: asset.certificateUrl,
        storyCount: asset.storyCount,
        
        // Underlying raw source record (in case specialized hooks need it)
        raw: item
      };
    });
  }

  /**
   * Look up a single normalized star model by its id or code.
   */
  static getStarById(starId) {
    if (!starId) return null;
    return this.cache.find(s => s.starId === starId || s.code === starId) || null;
  }

  /**
   * Returns all stars in the current memory cache.
   */
  static getStars() {
    return this.cache;
  }

  /**
   * Returns sorted list of unique constellations found in cache.
   */
  static getConstellations() {
    const list = this.cache
      .map(s => s.constellation)
      .filter(c => c && c !== "Bilinmiyor");
    return Array.from(new Set(list)).sort();
  }

  /**
   * Returns sorted list of primary spectral classification letters found in cache.
   */
  static getSpectralTypes() {
    const list = this.cache
      .map(s => s.spectralType ? s.spectralType.charAt(0).toUpperCase() : null)
      .filter(letter => ["O", "B", "A", "F", "G", "K", "M"].includes(letter));
    return Array.from(new Set(list)).sort();
  }
}
