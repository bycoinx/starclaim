import React, { useState } from 'react';
import { encryptData, validatePassword } from '../../lib/crypto';
import { Lock, Download, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';

export function VaultEncryption({ onComplete }) {
  const [data, setData] = useState('');
  const [password, setPassword] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [result, setResult] = useState(null);
  const [passError, setPassError] = useState('');

  const handleEncrypt = async () => {
    const validation = validatePassword(password);
    if (!validation.valid) {
      setPassError(validation.errors[0]);
      return;
    }
    setPassError('');

    setIsEncrypting(true);
    try {
      const blob = await encryptData(data, password);
      setResult(blob);
      if (onComplete) {
        onComplete(blob, {
          timestamp: Date.now(),
          fileName: `vault_${Date.now()}.vault`,
          size: blob.size
        });
      }
    } catch (error) {
      console.error('Encryption failed:', error);
      alert('Encryption failed. Please try again.');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starvault_${Date.now()}.vault`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-dark p-8 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-sc-gold/10 border border-sc-gold/20">
          <Lock className="w-6 h-6 text-sc-gold" />
        </div>
        <div>
          <h2 className="text-2xl font-display text-white">Encrypt Your Memories</h2>
          <p className="text-xs text-sc-text-muted uppercase tracking-widest">Digital Legacy Vault v1.0</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-sc-text-muted mb-2 ml-1">Secret Data / Message</label>
          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Enter your secret message, keys, or legacy data here..."
            rows={6}
            className="w-full p-5 bg-black/40 text-white rounded-2xl border border-white/5 focus:border-sc-gold/40 focus:outline-none transition-all resize-none placeholder:text-white/20 font-mono text-sm"
          />
        </div>
        
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-sc-text-muted mb-2 ml-1">Master Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 12 chars, upper, lower, number..."
            className={`w-full p-5 bg-black/40 text-white rounded-2xl border ${passError ? 'border-sc-red/50' : 'border-white/5'} focus:border-sc-gold/40 focus:outline-none transition-all placeholder:text-white/20`}
          />
          {passError && (
            <p className="text-[10px] text-sc-red mt-2 flex items-center gap-1.5 ml-1 italic font-medium">
              <ShieldAlert className="w-3 h-3" /> {passError}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={handleEncrypt}
            disabled={isEncrypting || !data || !password}
            className="flex-1 bg-sc-gold text-sc-deep py-4 rounded-2xl font-display font-bold uppercase tracking-[0.1em] text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_0_30px_rgba(251,191,36,0.2)] active:scale-95 flex items-center justify-center gap-2"
          >
            {isEncrypting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Encrypting...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Secure Encrypt
              </>
            )}
          </button>
          
          {result && (
            <button
              onClick={handleDownload}
              className="flex-1 bg-white/10 hover:bg-white/15 text-white py-4 rounded-2xl font-display font-bold uppercase tracking-[0.1em] text-sm border border-white/10 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download .vault
            </button>
          )}
        </div>

        {result && (
          <div className="bg-sc-green/10 border border-sc-green/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-5 h-5 text-sc-green" />
            <div className="text-xs text-sc-green font-medium">
              Data encrypted successfully! File is ready for Arweave upload.
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 pt-6 border-t border-white/5">
        <p className="text-white/30 text-[10px] leading-relaxed flex items-start gap-3 italic">
          <span className="text-sc-gold mt-0.5">⚠️</span>
          <span>
            <strong>IMPORTANT:</strong> All encryption occurs locally in your sandbox. 
            No data or passwords ever leave your device. We cannot recover your data if you lose your password.
          </span>
        </p>
      </div>
    </div>
  );
}
