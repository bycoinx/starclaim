import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { encryptData } from '../../lib/crypto';
import { UploadToChain } from './UploadToChain';

export function VaultEncryption({ onComplete }) {
  const [data, setData] = useState('');
  const [password, setPassword] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptedBlob, setEncryptedBlob] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const handleEncrypt = async () => {
    if (password.length < 12) {
      alert('Password must be at least 12 characters');
      return;
    }

    setIsEncrypting(true);
    try {
      const blob = await encryptData(data, password);
      setEncryptedBlob(blob);
      setShowUpload(true); // ← YENİ: Upload section'ı göster
      
      onComplete?.(blob, {
        timestamp: Date.now(),
        fileName: `vault_${Date.now()}.vault`,
        size: blob.size
      });
    } catch (error) {
      console.error('Encryption failed:', error);
      alert('Encryption failed. Please try again.');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDownload = () => {
    if (!encryptedBlob) return;
    const url = URL.createObjectURL(encryptedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starvault_${Date.now()}.vault`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setData('');
    setPassword('');
    setEncryptedBlob(null);
    setShowUpload(false);
  };

  const handleUploadSuccess = (txId) => {
    console.log('Vault uploaded to Arweave:', txId);
    // Optional: show success toast
    alert(`Vault successfully linked! TX: ${txId.slice(0, 8)}...`);
  };

  return (
    <div className="space-y-6">
      {/* EXISTING ENCRYPTION SECTION */}
      <div className="bg-gray-900/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-4">
          🔐 Encrypt Your Data
        </h2>
        
        <textarea
          value={data}
          onChange={(e) => setData(e.target.value)}
          placeholder="Enter your secret data, memories, or messages..."
          rows={8}
          disabled={encryptedBlob !== null}
          className="w-full p-4 bg-gray-800/50 text-white rounded-lg mb-4 
                     border border-gray-700 focus:border-blue-500 focus:outline-none
                     disabled:opacity-50 disabled:cursor-not-allowed transition"
        />
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Master password (min 12 chars)"
          disabled={encryptedBlob !== null}
          className="w-full p-4 bg-gray-800/50 text-white rounded-lg mb-4
                     border border-gray-700 focus:border-blue-500 focus:outline-none
                     disabled:opacity-50 disabled:cursor-not-allowed transition"
        />
        
        <div className="flex gap-4">
          <button
            onClick={handleEncrypt}
            disabled={isEncrypting || !data || !password || encryptedBlob !== null}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 
                       hover:from-blue-700 hover:to-purple-700 text-white 
                       py-4 rounded-lg font-semibold disabled:opacity-50 
                       disabled:cursor-not-allowed transition-all duration-300"
          >
            {isEncrypting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Encrypting...
              </span>
            ) : (
              'Encrypt'
            )}
          </button>
          
          {encryptedBlob && (
            <button
              onClick={handleDownload}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white 
                         py-4 rounded-lg font-semibold transition-all duration-300"
            >
              📥 Download Encrypted File
            </button>
          )}
        </div>
        
        <p className="text-gray-400 text-sm mt-4 flex items-start gap-2">
          <span>⚠️</span>
          <span>
            All encryption happens in your browser. No data is sent to any server.
            <strong> Save your password safely - we cannot recover it.</strong>
          </span>
        </p>
      </div>

      {/* NEW: UPLOAD TO BLOCKCHAIN SECTION */}
      <AnimatePresence>
        {showUpload && encryptedBlob && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                🌟 Link to Your Star
              </h3>
              <button
                onClick={handleReset}
                className="text-gray-400 hover:text-white text-sm transition"
              >
                Create Another Vault
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Upload your encrypted vault to Arweave and link it to your StarClaim NFT.
              Your data will be stored permanently on the blockchain.
            </p>

            <UploadToChain
              encryptedBlob={encryptedBlob}
              onSuccess={handleUploadSuccess}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
