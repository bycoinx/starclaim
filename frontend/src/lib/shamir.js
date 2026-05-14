import sss from 'shamirs-secret-sharing';
import { Buffer } from 'buffer';

/**
 * Shamir Bridge - Key Splitting & Reconstruction
 * Threshold: 3/5 (3 parts needed to recover)
 */

export function splitKey(key) {
  const secret = Buffer.from(key);
  const shares = sss.split(secret, { shares: 5, threshold: 3 });
  
  // Convert Buffer shares to hex strings for storage
  return shares.map(share => share.toString('hex'));
}

export function reconstructKey(sharesHex) {
  try {
    const shares = sharesHex.map(hex => Buffer.from(hex, 'hex'));
    const recovered = sss.combine(shares);
    return recovered.toString();
  } catch (error) {
    console.error("Shamir Bridge: Reconstruction failed", error);
    return null;
  }
}

/**
 * Dual-Nexus Share Distribution Logic
 * @param {string[]} shares 
 * @param {string} mode - 'ghost' | 'citizen'
 */
export async function distributeShares(shares, mode) {
  const distributionMap = {
    share1: { type: 'NFT_METADATA', value: shares[0], location: 'Solana/Arweave' },
    share2: { type: 'MOBILE_ENCLAVE', value: shares[1], location: 'Secure Enclave' },
    share3: { type: 'LOCAL_FILE', value: shares[2], location: 'User Device (.dust)' },
    share4: { type: 'GUARDIAN_WALLET', value: shares[3], location: 'Assigned Guardian' },
  };

  if (mode === 'citizen') {
    distributionMap.share5 = { type: 'INSTITUTIONAL_VAULT', value: shares[4], location: 'Bank Registry (Option A)' };
  } else {
    distributionMap.share5 = { type: 'SECRET_QUESTION', value: shares[4], location: 'User Memory (Hash)' };
  }

  return distributionMap;
}
