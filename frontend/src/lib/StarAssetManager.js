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
  /**
   * Resolves a fully populated asset metadata object from raw star data.
   * This is the main interface used by StarCard and DetailDrawer.
   */
  static getStarAsset(star) {
    if (!star) return null;

    const isClaimed = !!(star.owner_id || star.owner_name || star.claimed);
    const tier = star.tier?.toLowerCase() || "standard";
    const tierMeta = TIER_METADATA[tier] || TIER_METADATA.standard;

    // Resolve preview & hero image variants (could consume star.preview_webp in the future)
    const previewImage = star.preview_url || star.preview_image || FALLBACK_ASSETS.preview;
    const heroImage = star.hero_url || star.hero_image || FALLBACK_ASSETS.hero;

    return {
      starId: star.star_id || star.id || star.code,
      name: star.name || `Star ${star.code}`,
      code: star.code,
      constellation: star.constellation || "Bilinmiyor",
      
      // Asset parameters
      previewImage,
      heroImage,
      
      // Metrics
      spectralType: star.spectralType || star.spect || "G",
      magnitude: star.magnitude !== undefined ? Number(star.magnitude) : 5.0,
      distance: star.distanceParsec ? Math.round(star.distanceParsec * 3.262) : (star.distance || 0),
      
      // Rarity / Classification
      tier: tier,
      tierLabel: tierMeta.label,
      tierClass: tierMeta.tierClass,
      
      // Ownership parameters
      isClaimed,
      ownerName: star.owner_name || (isClaimed ? "Pilot" : null),
      ownerId: star.owner_id || null,
      price: Number(star.price || tierMeta.basePrice),
      
      // Custom certifications and stories
      hasCertificate: isClaimed || !!star.certificate_url,
      certificateUrl: star.certificate_url || (isClaimed ? FALLBACK_ASSETS.certificate : null),
      storyCount: star.stories_count || (star.hasStories ? 1 : 0),
      
      // System fields
      schemaVersion: star.schemaVersion || "1.0.0"
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
