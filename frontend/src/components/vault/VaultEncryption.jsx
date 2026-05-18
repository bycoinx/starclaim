import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { encryptData } from '../../lib/crypto';
import { UploadToChain } from './UploadToChain';
import ConstellationPicker from '../ConstellationPicker';
import ShamirBridgeUI from '../ShamirBridgeUI';
import { Lock, Star, ShieldCheck, Share2 } from 'lucide-react';

export function VaultEncryption({ onComplete }) {
  const [data, setData] = useState('');
  const [password, setPassword] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptedBlob, setEncryptedBlob] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [authMethod, setAuthMethod] = useState('password'); // password | constellation
  const [showShamir, setShowShamir] = useState(false);

  const handleEncrypt = async (manualPassword = null) => {
    const finalPassword = manualPassword || password;

    if (finalPassword.length < 12) {
      alert('Key must be at least 12 characters. Use a stronger password or complete the constellation.');
      return;
    }

    setIsEncrypting(true);
    try {
      const blob = await encryptData(data, finalPassword);
      setEncryptedBlob(blob);
      setShowShamir(true); // Önce Shamir Bridge göster
      
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

  const handleConstellationFinish = (hash) => {
    setPassword(hash);
    handleEncrypt(hash);
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
    alert(`Vault successfully linked! TX: ${txId.slice(0, 8)}...`);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {showShamir ? (
          <motion.div
            key="shamir-bridge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <ShamirBridgeUI 
              masterKey={password} 
              mode={authMethod === 'constellation' ? 'ghost' : 'citizen'} 
              onComplete={() => {
                setShowShamir(false);
                setShowUpload(true);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="encryption-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="bg-gray-900/50 backdrop-blur-lg p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-sc-gold" /> Encrypt Your Legacy
                </h2>
                
                <div className="bg-sc-deep/50 p-1 rounded-xl flex gap-1 border border-white/5">
                  <button
                    onClick={() => setAuthMethod('password')}
                    className={`px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                      authMethod === 'password' ? 'bg-sc-gold text-sc-deep font-bold' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    <Lock className="w-3 h-3" /> Standard
                  </button>
                  <button
                    onClick={() => setAuthMethod('constellation')}
                    className={`px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                      authMethod === 'constellation' ? 'bg-sc-blue text-white font-bold' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    <Star className="w-3 h-3" /> Constellation
                  </button>
                </div>
              </div>
              
              <textarea
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="Enter your secret data, memories, or messages..."
                rows={6}
                disabled={encryptedBlob !== null}
                className="w-full p-6 bg-sc-deep/50 text-white rounded-2xl mb-6 
                           border border-white/5 focus:border-sc-gold/50 focus:outline-none
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all font-light text-sm"
              />
              
              <AnimatePresence mode="wait">
                {authMethod === 'password' ? (
                  <motion.div
                    key="password-field"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Set your master password (min 12 chars)"
                      disabled={encryptedBlob !== null}
                      className="w-full p-5 bg-sc-deep/50 text-white rounded-2xl mb-6
                                 border border-white/5 focus:border-sc-gold/50 focus:outline-none
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                    />
                    
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleEncrypt()}
                        disabled={isEncrypting || !data || !password || encryptedBlob !== null}
                        className="flex-1 bg-sc-gold hover:bg-sc-gold-light text-sc-deep
                                   py-5 rounded-2xl font-display font-bold uppercase tracking-widest text-xs
                                   disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"
                      >
                        {isEncrypting ? 'Processing...' : 'Secure & Encrypt'}
                      </button>
                      
                      {encryptedBlob && (
                        <button
                          onClick={handleDownload}
                          className="flex-1 bg-sc-blue hover:bg-sc-blue-light text-white 
                                     py-5 rounded-2xl font-display font-bold uppercase tracking-widest text-xs
                                     transition-all shadow-lg"
                        >
                          📥 Download Vault
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="constellation-field"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <div className="mb-4 text-center">
                      <p className="text-xs text-sc-text-muted mb-4 uppercase tracking-[0.2em]">
                        Draw your unique constellation pattern below to generate your private key.
                      </p>
                      <ConstellationPicker onHashGenerated={handleConstellationFinish} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-white/30 text-[10px] flex items-center gap-2 italic uppercase tracking-wider">
                  <span className="text-sc-gold">●</span> Local Zero-Knowledge Encryption Active
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
