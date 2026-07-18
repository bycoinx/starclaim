import { buildVaultMetadataDocument, toStarNftSummary } from "./vaultMetadata";

describe("supported Metaplex metadata contract", () => {
  test("normalizes Umi digital assets for the Vault UI", () => {
    expect(toStarNftSummary({
      mint: { publicKey: "mint-1" },
      metadata: { name: "Star Sirius\0\0", symbol: "STAR\0", uri: "https://meta/1.json\0" },
    })).toEqual({
      mintAddress: "mint-1",
      name: "Star Sirius",
      symbol: "STAR",
      metadataUri: "https://meta/1.json",
    });
  });

  test("replaces the Vault attribute without discarding other metadata", () => {
    const updated = buildVaultMetadataDocument({
      name: "Star Sirius",
      image: "https://images/sirius.png",
      attributes: [
        { trait_type: "Tier", value: "Legendary" },
        { trait_type: "Vault", value: "old-tx" },
      ],
      properties: { category: "image" },
    }, { txId: "vault-new", url: "https://arweave/vault-new" });

    expect(updated.attributes).toEqual([
      { trait_type: "Tier", value: "Legendary" },
      { trait_type: "Vault", value: "vault-new" },
    ]);
    expect(updated.properties).toEqual({
      category: "image",
      starclaimVault: {
        transactionId: "vault-new",
        url: "https://arweave/vault-new",
        encrypted: true,
      },
    });
    expect(updated.image).toBe("https://images/sirius.png");
  });
});
