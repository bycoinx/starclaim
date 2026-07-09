/**
 * StarAssetManager Facade
 * 
 * Insulates UI from raw star registry fields and database layout.
 * Provides fallback assets, maps variants, and resolves spectral types,
 * ownership status, certificates, and story counts.
 */

// Fallback images for different star tiers or variants
const FALLBACK_ASSETS = {
  preview: "/assets/stars/fallback-preview.webp",
  hero: "/assets/stars/fallback-hero.jpg",
  certificate: "/assets/stars/fallback-certificate.pdf"
};

const TIER_METADATA = {
  legendary: { label: "Efsanevi", tierClass: "legendary", priority: 1, basePrice: 2000 },
  zodiac: { label: "Burç", tierClass: "zodiac", priority: 2, basePrice: 1200 },
  supernova: { label: "Süpernova", tierClass: "supernova", priority: 3, basePrice: 800 },
  nova: { label: "Nova", tierClass: "nova", priority: 4, basePrice: 500 },
  standard: { label: "Standart", tierClass: "standard", priority: 5, basePrice: 200 }
};

export class StarAssetManager {
  static normalizeRawStar(raw = {}) {
    if (!raw) return {};

    return {
      star_id: raw.star_id || raw.starId || raw.id || raw.code || null,
      code: raw.code || raw.star_code || raw.code || raw.star_id || null,
      name: raw.name || raw.title || raw.displayName || null,
      constellation: raw.constellation || raw.const || raw.constellation_name || null,

      preview_url: raw.preview_url || raw.preview_image || raw.preview || raw.previewUrl || null,
      hero_url: raw.hero_url || raw.hero_image || raw.hero || raw.heroUrl || null,

      spect: raw.spect || raw.spectralType || raw.spectral_type || null,
      magnitude: raw.magnitude !== undefined ? Number(raw.magnitude) : raw.mag !== undefined ? Number(raw.mag) : null,
      distance: raw.distance !== undefined ? Number(raw.distance) : raw.distanceLy || raw.distance_ly || null,
      distanceParsec: raw.distanceParsec !== undefined ? Number(raw.distanceParsec) : raw.distanceParsec || null,

      claimed: raw.claimed !== undefined ? !!raw.claimed : !!(raw.owner_id || raw.owner_name || raw.ownerName),
      owner_name: raw.owner_name || raw.ownerName || raw.owner || null,
      owner_id: raw.owner_id || raw.ownerId || null,

      price: raw.price !== undefined ? Number(raw.price) : raw.basePrice || null,
      certificate_url: raw.certificate_url || raw.certificateUrl || null,
      stories_count: raw.stories_count || raw.storyCount || raw.stories || 0,
      tier: raw.tier || raw.tierName || null,
      hasStories: raw.hasStories || false,
      schemaVersion: raw.schemaVersion || "1.0.0",
      raw: raw
    };
  }

  /**
   * Resolves a fully populated asset metadata object from raw star data.
   * This is the main interface used by StarCard and DetailDrawer.
   */
  static getStarAsset(star) {
    if (!star) return null;
    const normalized = this.normalizeRawStar(star);

    const isClaimed = !!(normalized.owner_id || normalized.owner_name || normalized.claimed);
    const tier = normalized.tier?.toLowerCase() || "standard";
    const tierMeta = TIER_METADATA[tier] || TIER_METADATA.standard;

    const previewImage = normalized.preview_url || normalized.preview_image || FALLBACK_ASSETS.preview;
    const heroImage = normalized.hero_url || normalized.hero_image || FALLBACK_ASSETS.hero;

    return {
      starId: normalized.star_id || normalized.id || normalized.code,
      name: normalized.name || `Star ${normalized.code}`,
      code: normalized.code,
      constellation: normalized.constellation || "Bilinmiyor",
      
      // Asset parameters
      previewImage,
      heroImage,
      
      // Metrics
      spectralType: normalized.spectralType || normalized.spect || "G",
      magnitude: normalized.magnitude !== undefined ? Number(normalized.magnitude) : 5.0,
      distance: normalized.distanceParsec ? Math.round(normalized.distanceParsec * 3.262) : (normalized.distance || 0),
      
      // Rarity / Classification
      tier: tier,
      tierLabel: tierMeta.label,
      tierClass: tierMeta.tierClass,
      
      // Ownership parameters
      isClaimed,
      ownerName: normalized.owner_name || (isClaimed ? "Pilot" : null),
      ownerId: normalized.owner_id || null,
      price: Number(normalized.price || tierMeta.basePrice),
      
      // Custom certifications and stories
      hasCertificate: isClaimed || !!normalized.certificate_url,
      certificateUrl: normalized.certificate_url || (isClaimed ? FALLBACK_ASSETS.certificate : null),
      storyCount: normalized.stories_count || (normalized.hasStories ? 1 : 0),
      
      // System fields
      schemaVersion: normalized.schemaVersion || "1.0.0"
    };
  }

  /**
   * Resolves a specific image or document variant for a star asset.
   */
  static getStarAssetVariant(star, variant) {
    const asset = this.getStarAsset(star);
    if (!asset) return null;

    switch (variant) {
      case "preview":
        return asset.previewImage;
      case "hero":
        return asset.heroImage;
      case "certificate":
        return asset.certificateUrl;
      default:
        return FALLBACK_ASSETS[variant] || null;
    }
  }

  /**
   * Validates if a star asset has correct metadata before publishing.
   */
  static validateStarAsset(star) {
    if (!star) return false;
    return !!(star.name && star.code && (star.spectralType || star.spect));
  }

  /**
   * Preloads assets into cache (placeholder interface for mobile/web caching engines).
   */
  static preloadStarAssets(stars, variants = ["preview"]) {
    if (!Array.isArray(stars)) return;
    
    // Future Web/Mobile implementation of cache preloading:
    // console.log(`Preloading ${stars.length} star assets for variants: ${variants.join(', ')}`);
  }
}
