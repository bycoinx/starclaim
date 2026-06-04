import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL || "";
export const API = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

export const api = axios.create({
  baseURL: API,
  withCredentials: false,
  timeout: 60000, // 60s timeout
});

/**
 * Uploads an encrypted vault blob to Arweave via the backend.
 * Includes retry logic (up to 3 times).
 */
export async function uploadToArweave(encryptedBlob, metadata, retries = 3) {
  try {
    // 1. Convert Blob to ArrayBuffer
    const arrayBuffer = await encryptedBlob.arrayBuffer();
    const encryptedData = Array.from(new Uint8Array(arrayBuffer));

    // 2. Prepare payload
    const payload = {
      encryptedData,
      metadata: {
        ...metadata,
        timestamp: Date.now()
      }
    };

    // 3. POST /api/vault/upload
    const response = await api.post('/vault/upload', payload);

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'Arweave upload failed');
    }

    return response.data; // { success, txId, url }

  } catch (error) {
    if (retries > 0) {
      // Retry silently to avoid noisy logs in production
      return uploadToArweave(encryptedBlob, metadata, retries - 1);
    }
    throw error;
  }
}
