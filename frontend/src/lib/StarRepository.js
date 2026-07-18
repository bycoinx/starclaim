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

const CATALOG_TARGET_SIZE = 10000;
const LISTING_PRICE_BASE = 250;

function computeListingPrice(item, index) {
  const magnitude = Number(item.magnitude ?? item.mag ?? 5);
  const distance = Number(item.distance ?? item.distanceParsec ?? 1000);
  const tier = String(item.tier || "standard").toLowerCase();
  const baseByTier = {
    legendary: 2800,
    zodiac: 1650,
    supernova: 1200,
    nova: 780,
    standard: 360,
  };
  const base = baseByTier[tier] || baseByTier.standard;
  const magnitudeAdjustment = magnitude < -0.5 ? 320 : magnitude < 1 ? 200 : magnitude < 3 ? 110 : magnitude < 5 ? 55 : 20;
  const distanceAdjustment = distance < 15 ? 220 : distance < 60 ? 130 : distance < 300 ? 70 : distance < 1000 ? 25 : 0;
  const brightnessBand = magnitude < -0.5 ? 140 : magnitude < 1 ? 90 : magnitude < 3 ? 45 : 0;
  const indexAdjustment = index % 17 === 0 ? 140 : index % 7 === 0 ? 60 : 0;
  return Math.round(base + magnitudeAdjustment + distanceAdjustment + brightnessBand + indexAdjustment + LISTING_PRICE_BASE);
}

export class StarRepository {
  static cache = [];
  static initialized = false;
  static loadPromise = null;

  /**
   * Loads all stars from the registry, normalizes them, and caches them in memory.
   * If remote fetching fails, it falls back to the embedded local catalog.
   */
  static async loadAll(forceReload = false) {
    if (this.initialized && !forceReload) {
      return this.cache;
    }
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const rawStars = await StarRegistry.fetchStars({ limit: CATALOG_TARGET_SIZE, sort: "price_asc" });
        if (rawStars && rawStars.length > 0) {
          const mapped = rawStars.map((r) => StarAssetManager.normalizeRawStar(r));
          this.cache = this.normalize(mapped);
        } else {
          const mappedFallback = FALLBACK_STARS.map((r) => StarAssetManager.normalizeRawStar(r));
          this.cache = this.normalize(mappedFallback);
        }
      } catch (error) {
        console.warn("StarRepository: registry request failed. Initializing with local fallback catalog.");
        const mappedFallback = FALLBACK_STARS.map((r) => StarAssetManager.normalizeRawStar(r));
        this.cache = this.normalize(mappedFallback);
      }
      this.initialized = true;
      return this.cache;
    })();

    try {
      return await this.loadPromise;
    } finally {
      this.loadPromise = null;
    }
  }

  static async loadPage(params = {}) {
    try {
      const rawStars = await StarRegistry.fetchStars(params);
      if (rawStars && rawStars.length > 0) {
        const mapped = rawStars.map((r) => StarAssetManager.normalizeRawStar(r));
        return this.normalize(mapped);
      }
      return [];
    } catch (error) {
      console.warn("StarRepository: registry page fetch failed.", error);
      return [];
    }
  }

  static async loadAstronomyCatalog(options = {}) {
    const { loadHygStars } = await import("../data/hygdata_v3_sample");
    return loadHygStars(options);
  }

  /**
   * Normalizes raw rows into rich domain objects using StarAssetManager rules.
   */
  static normalize(rawArray) {
    if (!Array.isArray(rawArray)) return [];
    
    const seenIds = new Set();
    return rawArray.filter(Boolean).map((item, index) => {
      const asset = StarAssetManager.getStarAsset(item);
      const slugSource = (asset.code || asset.name || `star-${index}`).toString().toLowerCase();
      const slug = slugSource
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `star-${index}`;

      const price = asset.price || computeListingPrice(item, index);

      return {
        // Core Identity fields
        starId: asset.starId || `star-${index}`,
        slug,
        code: asset.code || `SC-${index + 1}`,
        name: asset.name,
        constellation: asset.constellation,
        spectralType: asset.spectralType,
        magnitude: asset.magnitude,
        distance: asset.distance,
        coordinates: asset.coordinates,
        frame: asset.coordinates?.frame || null,
        epoch: asset.coordinates?.epoch || null,
        raHours: asset.coordinates?.raHours ?? null,
        raDegrees: asset.coordinates?.raDegrees ?? null,
        decDegrees: asset.coordinates?.decDegrees ?? null,
        distanceParsec: asset.coordinates?.distanceParsec ?? null,
        
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
        price,
        hasCertificate: asset.hasCertificate,
        certificateUrl: asset.certificateUrl,
        storyCount: asset.storyCount,
        
        // Underlying raw source record (in case specialized hooks need it)
        raw: item
      };
    }).filter((star) => {
      const identity = String(star.starId || star.code);
      if (seenIds.has(identity)) return false;
      seenIds.add(identity);
      return true;
    });
  }

  /**
   * Map a raw incoming star object from various registry payload shapes
   * into a consistent shape expected by the repository and asset manager.
   */
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

  static setCache(stars = []) {
    this.cache = Array.isArray(stars) ? stars : [];
    this.initialized = true;
    return this.cache;
  }

  static getStarBySlug(slug) {
    if (!slug) return null;
    return (
      this.cache.find((s) => s.slug === slug || s.starId === slug || s.code === slug) ||
      null
    );
  }

  static getOwnedStars() {
    return this.cache.filter((star) => star.isClaimed);
  }

  static searchStars(query) {
    if (!query || typeof query !== "string") return [];
    const normalized = query.toLowerCase().trim();
    return this.cache.filter((star) => {
      return (
        star.name?.toLowerCase().includes(normalized) ||
        star.code?.toLowerCase().includes(normalized) ||
        star.constellation?.toLowerCase().includes(normalized) ||
        star.slug?.toLowerCase().includes(normalized)
      );
    });
  }

  static queryStars(params = {}) {
    return this.cache.filter((star) => {
      if (params.isClaimed !== undefined && star.isClaimed !== params.isClaimed) return false;
      if (params.constellation && star.constellation !== params.constellation) return false;
      if (params.spectralType && star.spectralType?.charAt(0).toUpperCase() !== params.spectralType.toUpperCase()) return false;
      if (params.tier && star.tier !== params.tier) return false;
      return true;
    });
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
