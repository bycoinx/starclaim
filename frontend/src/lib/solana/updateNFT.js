import {
  fetchAllDigitalAssetWithTokenByOwner,
  fetchDigitalAsset,
  mplTokenMetadata,
  updateV1,
} from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { clusterApiUrl } from "@solana/web3.js";
import { toStarNftSummary } from "./vaultMetadata";

export { buildVaultMetadataDocument, toStarNftSummary } from "./vaultMetadata";

const STAR_NFT_NAME = /star/i;

function getSolanaEndpoint() {
  return import.meta.env.REACT_APP_SOLANA_RPC || clusterApiUrl("mainnet-beta");
}

function createMetadataClient(wallet) {
  const umi = createUmi(getSolanaEndpoint()).use(mplTokenMetadata());
  return wallet ? umi.use(walletAdapterIdentity(wallet)) : umi;
}

export async function fetchOffchainMetadata(uri, fetchImpl = fetch) {
  if (!uri) return {};
  const response = await fetchImpl(uri);
  if (!response.ok) throw new Error(`NFT metadata could not be loaded (${response.status}).`);
  return response.json();
}

export async function findStarNftsByOwner(ownerPublicKey) {
  const umi = createMetadataClient();
  const assets = await fetchAllDigitalAssetWithTokenByOwner(
    umi,
    publicKey(ownerPublicKey.toString())
  );
  return assets
    .map(toStarNftSummary)
    .filter((asset) => asset.mintAddress && STAR_NFT_NAME.test(asset.name));
}

/**
 * Updates the NFT's on-chain metadata URI using its update-authority wallet.
 * The URI must point to an already uploaded off-chain metadata JSON document.
 */
export async function linkVaultToNFT(nftMintAddress, metadataUri, wallet, retries = 2) {
  try {
    if (!wallet?.publicKey) throw new Error("A connected wallet is required.");
    if (!metadataUri) throw new Error("The updated metadata URI is required.");

    const umi = createMetadataClient(wallet);
    const mint = publicKey(nftMintAddress.toString());
    const asset = await fetchDigitalAsset(umi, mint);
    const { signature } = await updateV1(umi, {
      mint,
      authority: umi.identity,
      data: {
        name: asset.metadata.name,
        symbol: asset.metadata.symbol,
        uri: metadataUri,
        sellerFeeBasisPoints: asset.metadata.sellerFeeBasisPoints,
        creators: asset.metadata.creators,
      },
    }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

    return { success: true, signature: base58.deserialize(signature)[0] };
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return linkVaultToNFT(nftMintAddress, metadataUri, wallet, retries - 1);
    }
    console.error("Link Vault to NFT error:", error);
    return { success: false, error: error.message };
  }
}
