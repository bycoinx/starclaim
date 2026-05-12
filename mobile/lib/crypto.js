import forge from 'node-forge';
import { Buffer } from 'buffer';

export async function decryptData(fileUri, password) {
  // Read file as base64 and convert to Buffer
  const response = await fetch(fileUri);
  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // Extract salt, iv, ciphertext
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const ciphertext = data.slice(28);

  // Derive key using PBKDF2
  const derivedKey = forge.pkcs5.pbkdf2(
    password,
    forge.util.createBuffer(salt),
    600000,
    32, // 256 bits
    forge.md.sha256.create()
  );

  // Decrypt using AES-GCM
  const decipher = forge.cipher.createDecipher('AES-GCM', derivedKey);
  
  // forge needs the tag at the end if it's not included in the ciphertext
  // Web Crypto AES-GCM appends the 16-byte tag to the ciphertext
  const tag = ciphertext.slice(-16);
  const actualCiphertext = ciphertext.slice(0, -16);

  decipher.start({
    iv: forge.util.createBuffer(iv),
    tagLength: 128, // 16 bytes
    tag: forge.util.createBuffer(tag)
  });
  
  decipher.update(forge.util.createBuffer(actualCiphertext));
  
  const pass = decipher.finish();
  if (pass) {
    return decipher.output.toString();
  } else {
    throw new Error('Decryption failed. Wrong password or corrupted file.');
  }
}
