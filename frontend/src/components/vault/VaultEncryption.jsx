import React, { useState } from 'react';
import { encryptData, validatePassword } from '../../lib/crypto';
import { Lock, Download, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';

export function VaultEncryption({ onComplete }) {
  const [data, setData] = useState('');
  const [password, setPassword] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleEncrypt = async () => {
    // Empty field check
    if (!data.trim()) {
      setError('Please enter some data to encrypt');
      return;
    }
    if (!password) {
      setError('Please enter a master password');
      return;
    }

    // Password strength check (min 12 chars)
    const validation = validatePassword(password);
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }
    
    setError('');
    setIsEncrypting(true);
    
    try {
      const blob = await encryptData(data, password);
      setResult(blob);
      if (onComplete) {
        onComplete(blob);
      }
    } catch (err) {
      console.error('Encryption failed:', err);
      setError('Encryption failed. Please try again.');
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
    <div className="bg-gray-900/50 backdrop-blur-lg p-8 rounded-3xl border border-white/10 shadow-2xl max-w-2xl mx-auto text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-sc-gold/10 border border-sc-gold/20">
          <Lock className="w-6 h-6 text-sc-gold" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">Encrypt Your Data</h2>
          <p className="text-[10px] text-sc-text-muted uppercase tracking-[0.3em]">Digital Legacy Protocol</p>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Textarea: Input Data */}
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-sc-text-muted mb-2 ml-1 font-bold">Secret Data / Message</label>
          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Enter your secret data..."
            rows={8}
            className="w-full p-5 bg-black/40 text-white rounded-2xl border border-white/5 focus:border-sc-gold/40 focus:outline-none transition-all resize-none placeholder:text-white/20 font-mono text-sm"
          />
        </div>
        
        {/* Password Input */}
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-sc-text-muted mb-2 ml-1 font-bold">Master Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 12 characters required"
            className="w-full p-5 bg-black/40 text-white rounded-2xl border border-white/5 focus:border-sc-gold/40 focus:outline-none transition-all placeholder:text-white/20"
          />
        </div>

        {/* Error Display */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] text-sc-red flex items-center gap-1.5 ml-1 italic font-medium"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> {error}
          </motion.div>
        )}
        
        {/* Progress Indicator & Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={handleEncrypt}
            disabled={isEncrypting || !data || !password}
            className="flex-1 bg-gradient-to-r from-sc-gold to-yellow-600 text-sc-deep py-4 rounded-2xl font-display font-bold uppercase tracking-[0.1em] text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_0_30px_rgba(251,191,36,0.2)] active:scale-95 flex items-center justify-center gap-2"
          >
            {isEncrypting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Encrypting...
              </>
            ) : (
              'Encrypt'
            )}
          </button>
          
          {result && (
            <button
              onClick={handleDownload}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-display font-bold uppercase tracking-[0.1em] text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/20"
            >
              <Download className="w-4 h-4" />
              Download .vault
            </button>
          )}
        </div>

        {/* Success Indicator */}
        {result && (
          <div className="bg-sc-green/10 border border-sc-green/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-5 h-5 text-sc-green" />
            <div className="text-xs text-sc-green font-medium">
              Data encrypted locally. You can now download your .vault file.
            </div>
          </div>
        )}
      </div>
      
      <p className="text-gray-400 text-[10px] mt-6 flex items-start gap-2 italic leading-relaxed">
        <span className="text-sc-gold">⚠️</span>
        <span>
          All encryption happens in your browser. No data is sent to any server. 
          <strong> Save your password safely - we cannot recover it.</strong>
        </span>
      </p>
    </div>
  );
}
