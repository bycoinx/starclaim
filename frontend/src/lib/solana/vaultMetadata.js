function cleanMetadataText(value) {
  return String(value || "").replace(/\0/g, "").trim();
}

export function toStarNftSummary(asset) {
  return {
    mintAddress: asset?.mint?.publicKey || asset?.publicKey || null,
    name: cleanMetadataText(asset?.metadata?.name),
    symbol: cleanMetadataText(asset?.metadata?.symbol),
    metadataUri: cleanMetadataText(asset?.metadata?.uri),
  };
}

export function buildVaultMetadataDocument(currentMetadata = {}, vault = {}) {
  const attributes = Array.isArray(currentMetadata.attributes)
    ? currentMetadata.attributes.filter((attribute) => attribute?.trait_type !== "Vault")
    : [];

  return {
    ...currentMetadata,
    attributes: [
      ...attributes,
      { trait_type: "Vault", value: String(vault.txId || "") },
    ],
    properties: {
      ...(currentMetadata.properties || {}),
      starclaimVault: {
        transactionId: String(vault.txId || ""),
        url: String(vault.url || ""),
        encrypted: true,
      },
    },
  };
}
