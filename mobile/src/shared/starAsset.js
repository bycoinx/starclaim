export const STAR_ASSET_SCHEMA_VERSION = 1;
export const DEFAULT_STAR_ASSET_VERSION = 'v1';
export const DEFAULT_STAR_ASSET_ROOT = 'assets/stars/catalog';
export const DEFAULT_STAR_CDN_BASE_URL = '';

export const STAR_ASSET_VARIANTS = Object.freeze({
  preview: 'preview',
  hero: 'hero',
  deep: 'deep',
  texture: 'texture',
  certificate: 'certificate',
  storyCover: 'storyCover',
  fallback: 'fallback',
  model3D: 'model3D',
  metadata: 'metadata',
});

export const STAR_ASSET_FILENAMES = Object.freeze({
  [STAR_ASSET_VARIANTS.preview]: 'preview.webp',
  [STAR_ASSET_VARIANTS.hero]: 'hero.webp',
  [STAR_ASSET_VARIANTS.deep]: 'deep.webp',
  [STAR_ASSET_VARIANTS.texture]: 'texture.webp',
  [STAR_ASSET_VARIANTS.certificate]: 'certificate.webp',
  [STAR_ASSET_VARIANTS.storyCover]: 'story-cover.webp',
  [STAR_ASSET_VARIANTS.fallback]: 'fallback.webp',
  [STAR_ASSET_VARIANTS.model3D]: 'model.glb',
  [STAR_ASSET_VARIANTS.metadata]: 'metadata.json',
});

function identifier(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeRoot(root) {
  return identifier(root || DEFAULT_STAR_ASSET_ROOT)
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '');
}

export function normalizeAssetSlug(value) {
  return identifier(value)
    .toLocaleLowerCase('en-US')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isStarAssetVariant(variant) {
  return Object.prototype.hasOwnProperty.call(STAR_ASSET_FILENAMES, variant);
}

export function buildStarAssetPath(slug, variant, options = {}) {
  if (!isStarAssetVariant(variant)) {
    throw new Error(`Unsupported star asset variant: ${variant}`);
  }

  const normalizedSlug = normalizeAssetSlug(slug);
  if (!normalizedSlug) throw new Error('Star asset slug is required');

  const root = normalizeRoot(options.root);
  const fileName = identifier(options.fileName) || STAR_ASSET_FILENAMES[variant];
  const relativePath = `${root}/${normalizedSlug}/${fileName}`;
  const cdnBaseUrl = identifier(options.cdnBaseUrl ?? DEFAULT_STAR_CDN_BASE_URL).replace(/\/+$/g, '');

  return cdnBaseUrl ? `${cdnBaseUrl}/${relativePath}` : relativePath;
}

export function createStarAssetPaths(slug, options = {}) {
  return {
    previewImage: buildStarAssetPath(slug, STAR_ASSET_VARIANTS.preview, options),
    heroImage: buildStarAssetPath(slug, STAR_ASSET_VARIANTS.hero, options),
    deepImage: buildStarAssetPath(slug, STAR_ASSET_VARIANTS.deep, options),
    textureImage: buildStarAssetPath(slug, STAR_ASSET_VARIANTS.texture, options),
    certificateImage: buildStarAssetPath(slug, STAR_ASSET_VARIANTS.certificate, options),
    storyCoverImage: buildStarAssetPath(slug, STAR_ASSET_VARIANTS.storyCover, options),
    fallbackImage: buildStarAssetPath(slug, STAR_ASSET_VARIANTS.fallback, options),
    model3D: buildStarAssetPath(slug, STAR_ASSET_VARIANTS.model3D, options),
    metadataPath: buildStarAssetPath(slug, STAR_ASSET_VARIANTS.metadata, options),
  };
}

export function createStarAssetCacheKey(starId, slug, version = DEFAULT_STAR_ASSET_VERSION) {
  const idPart = identifier(starId) || normalizeAssetSlug(slug);
  const slugPart = normalizeAssetSlug(slug) || idPart;
  const versionPart = identifier(version) || DEFAULT_STAR_ASSET_VERSION;
  return `${idPart}:${slugPart}:${versionPart}`;
}

export function createStarAsset(input = {}, starIdentity = {}) {
  const starId = identifier(input.starId ?? input.id ?? starIdentity.canonicalId ?? starIdentity.id);
  const slug = normalizeAssetSlug(input.slug ?? starIdentity.slug ?? starIdentity.displayName ?? starIdentity.name ?? starId);
  if (!starId) throw new Error('StarAsset requires starId');
  if (!slug) throw new Error('StarAsset requires slug');

  const version = identifier(input.version ?? input.assetVersion ?? starIdentity.assetVersion) || DEFAULT_STAR_ASSET_VERSION;
  const cdnBaseUrl = identifier(input.cdnBaseUrl ?? DEFAULT_STAR_CDN_BASE_URL);
  const defaultPaths = createStarAssetPaths(slug, {
    root: input.root,
    cdnBaseUrl,
  });

  return {
    schemaVersion: STAR_ASSET_SCHEMA_VERSION,
    starId,
    slug,
    previewImage: identifier(input.previewImage) || defaultPaths.previewImage,
    heroImage: identifier(input.heroImage) || defaultPaths.heroImage,
    deepImage: identifier(input.deepImage) || defaultPaths.deepImage,
    textureImage: identifier(input.textureImage) || defaultPaths.textureImage,
    certificateImage: identifier(input.certificateImage) || defaultPaths.certificateImage,
    storyCoverImage: identifier(input.storyCoverImage) || defaultPaths.storyCoverImage,
    fallbackImage: identifier(input.fallbackImage) || defaultPaths.fallbackImage,
    model3D: identifier(input.model3D) || defaultPaths.model3D,
    metadataPath: identifier(input.metadataPath) || defaultPaths.metadataPath,
    version,
    cacheKey: identifier(input.cacheKey) || createStarAssetCacheKey(starId, slug, version),
    cdnBaseUrl,
    lastUpdated: identifier(input.lastUpdated) || null,
  };
}

export function getStarAssetVariant(asset, variant) {
  if (!asset || !isStarAssetVariant(variant)) return null;
  const fieldByVariant = {
    [STAR_ASSET_VARIANTS.preview]: 'previewImage',
    [STAR_ASSET_VARIANTS.hero]: 'heroImage',
    [STAR_ASSET_VARIANTS.deep]: 'deepImage',
    [STAR_ASSET_VARIANTS.texture]: 'textureImage',
    [STAR_ASSET_VARIANTS.certificate]: 'certificateImage',
    [STAR_ASSET_VARIANTS.storyCover]: 'storyCoverImage',
    [STAR_ASSET_VARIANTS.fallback]: 'fallbackImage',
    [STAR_ASSET_VARIANTS.model3D]: 'model3D',
    [STAR_ASSET_VARIANTS.metadata]: 'metadataPath',
  };
  return asset[fieldByVariant[variant]] || null;
}
