import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

/**
 * Links an Arweave Vault transaction ID to a Star NFT's metadata attributes.
 * @param {string} nftAddress - The mint address of the Star NFT
 * @param {string} vaultTxId - The transaction ID from Arweave
 * @param {object} wallet - The Solana wallet adapter (Phantom/Solflare)
 */
export async function linkVaultToNFT(nftAddress, vaultTxId, wallet) {
  try {
    // 1. Solana Connection & Metaplex Init
    const endpoint = process.env.REACT_APP_SOLANA_RPC || clusterApiUrl("mainnet-beta");
    const connection = new Connection(endpoint, "confirmed");
    const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));

    // 2. Fetch the NFT
    const mintAddress = new PublicKey(nftAddress);
    const nft = await metaplex.nfts().findByMint({ mintAddress });

    if (!nft) {
      throw new Error("NFT not found at provided address.");
    }

    // 3. Prepare updated attributes
    // We check if "Vault" attribute already exists to update it, otherwise push new.
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

    // 4. Update NFT Metadata
    const { response } = await metaplex.nfts().update({
      nftOrSft: nft,
      attributes: attributes,
    });

    console.log("NFT Metadata updated successfully. Signature:", response.signature);

    return {
      success: true,
      signature: response.signature,
      txId: vaultTxId
    };

  } catch (error) {
    console.error("Link Vault to NFT error:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
