import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

/**
 * Links an Arweave Vault transaction ID to a Star NFT's metadata attributes.
 * @param {string} nftMintAddress - The mint address of the Star NFT
 * @param {string} vaultTxId - The transaction ID from Arweave
 * @param {object} wallet - The Solana wallet adapter
 * @param {number} retries - Number of retries allowed (default 2)
 */
export async function linkVaultToNFT(nftMintAddress, vaultTxId, wallet, retries = 2) {
  try {
    // 1. Solana Connection & Metaplex Init
    const endpoint = process.env.REACT_APP_SOLANA_RPC || clusterApiUrl("mainnet-beta");
    const connection = new Connection(endpoint, "confirmed");
    const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));

    // 2. Fetch the NFT
    const mintAddress = new PublicKey(nftMintAddress);
    const nft = await metaplex.nfts().findByMint({ mintAddress });

    if (!nft) {
      throw new Error("NFT not found at provided address.");
    }

    // 3. Prepare updated attributes
    let attributes = nft.json?.attributes || [];
    const vaultAttrIndex = attributes.findIndex(a => a.trait_type === "Vault");

    const newVaultAttr = {
      trait_type: "Vault",
      value: vaultTxId
    };

    if (vaultAttrIndex !== -1) {
      attributes[vaultAttrIndex] = newVaultAttr;
    } else {
      attributes.push(newVaultAttr);
    }

    // 4. Update NFT Metadata & Sign with Wallet
    // The metaplex.nfts().update() call handles transaction creation, signing, and sending
    const { response } = await metaplex.nfts().update({
      nftOrSft: nft,
      attributes: attributes,
    });

    return {
      success: true,
      signature: response.signature
    };

  } catch (error) {
    if (retries > 0) {
      // Retry silently to reduce noisy output
      await new Promise(resolve => setTimeout(resolve, 2000));
      return linkVaultToNFT(nftMintAddress, vaultTxId, wallet, retries - 1);
    }
    
    console.error("Link Vault to NFT error:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
