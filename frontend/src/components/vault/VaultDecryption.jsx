import React, { useState } from 'react';
import { decryptData } from '../../lib/crypto';
import { Unlock, FileKey2, ShieldAlert, CheckCircle2, Loader2, Upload } from 'lucide-react';

export function VaultDecryption() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedData, setDecryptedData] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError('');
    }
  };

  const handleDecrypt = async () => {
    if (!file || !password) return;

    setIsDecrypting(true);
    setError('');
    try {
      const plaintext = await decryptData(file, password);
      setDecryptedData(plaintext);
    } catch (err) {
      console.error('Decryption failed:', err);
      setError('Decryption failed. Incorrect password or corrupted file.');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="glass-dark p-8 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-sc-blue/10 border border-sc-blue/20">
          <Unlock className="w-6 h-6 text-sc-blue" />
        </div>
        <div>
          <h2 className="text-2xl font-display text-white">Decrypt Your Vault</h2>
          <p className="text-xs text-sc-text-muted uppercase tracking-widest">Access Your Legacy Data</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-sc-text-muted mb-2 ml-1">Vault File (.vault)</label>
          <div className="relative group">
            <input
              type="file"
              accept=".vault"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`w-full p-8 border-2 border-dashed ${file ? 'border-sc-blue/50 bg-sc-blue/5' : 'border-white/10 bg-black/20'} rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group-hover:border-sc-blue/30`}>
              {file ? (
                <>
                  <FileKey2 className="w-8 h-8 text-sc-blue" />
                  <div className="text-sm text-white font-medium">{file.name}</div>
                  <div className="text-[10px] text-sc-text-muted">{(file.size / 1024).toFixed(2)} KB</div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-white/20" />
                  <div className="text-sm text-white/40 font-medium font-display uppercase tracking-widest">Select .vault file</div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-sc-text-muted mb-2 ml-1">Vault Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your master password..."
            className="w-full p-5 bg-black/40 text-white rounded-2xl border border-white/5 focus:border-sc-blue/40 focus:outline-none transition-all placeholder:text-white/20"
          />
          {error && (
            <p className="text-[10px] text-sc-red mt-2 flex items-center gap-1.5 ml-1 italic font-medium">
              <ShieldAlert className="w-3 h-3" /> {error}
            </p>
          )}
        </div>
        
        <button
          onClick={handleDecrypt}
          disabled={isDecrypting || !file || !password}
          className="w-full bg-sc-blue text-white py-4 rounded-2xl font-display font-bold uppercase tracking-[0.1em] text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] active:scale-95 flex items-center justify-center gap-2"
        >
          {isDecrypting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Decrypting...
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4" />
              Unlock Data
            </>
          )}
        </button>

        {decryptedData && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-sc-green/10 border border-sc-green/20 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-sc-green" />
              <div className="text-xs text-sc-green font-medium">Vault decrypted successfully!</div>
            </div>
            
            <div className="relative">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-sc-text-muted mb-2 ml-1">Decrypted Content</label>
              <pre className="w-full p-6 bg-sc-deep border border-sc-blue/20 rounded-2xl text-sc-text font-mono text-sm whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
                {decryptedData}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
