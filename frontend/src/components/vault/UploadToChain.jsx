import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { 
  Database, 
  Link as LinkIcon, 
  ExternalLink, 
  CheckCircle2, 
  Loader2, 
  Wallet, 
  Star,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

import { api } from '../../lib/api';
import { linkVaultToNFT } from '../../lib/solana/updateNFT';

export function UploadToChain({ encryptedBlob, onSuccess }) {
  const [wallet, setWallet] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [selectedNft, setSelectedNft] = useState('');
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | uploading | linking | success
  const [result, setResult] = useState(null);

  // 1. Connect Wallet Logic (Mock for now, normally use @solana/wallet-adapter)
  const connectWallet = async () => {
    try {
      const { solana } = window;
      if (solana && solana.isPhantom) {
        const response = await solana.connect();
        setWallet(response.publicKey.toString());
        fetchUserNfts(response.publicKey);
      } else {
        window.open('https://phantom.app/', '_blank');
        toast.error('Please install Phantom wallet');
      }
    } catch (err) {
      toast.error('Wallet connection failed');
    }
  };

  // 2. Fetch User's StarClaim NFTs
  const fetchUserNfts = async (ownerPublicKey) => {
    setIsLoadingNfts(true);
    try {
      const endpoint = process.env.REACT_APP_SOLANA_RPC || clusterApiUrl('mainnet-beta');
      const connection = new Connection(endpoint, 'confirmed');
      const metaplex = new Metaplex(connection);
      
      const userNfts = await metaplex.nfts().findAllByOwner({ owner: ownerPublicKey });
      
      // Filter for StarClaim NFTs (you might want to check for a specific creator or collection)
      const starNfts = userNfts.filter(n => n.name.toLowerCase().includes('star'));
      setNfts(starNfts);
      if (starNfts.length > 0) setSelectedNft(starNfts[0].mintAddress.toString());
    } catch (err) {
      console.error('Fetch NFTs error:', err);
      toast.error('Failed to load your NFTs');
    } finally {
      setIsLoadingNfts(false);
    }
  };

  // 3. The Big Flow
  const handleFinalize = async () => {
    if (!selectedNft || !encryptedBlob) return;

    try {
      // Step A: Upload to Arweave
      setStatus('uploading');
      const arrayBuffer = await encryptedBlob.arrayBuffer();
      const encryptedData = Array.from(new Uint8Array(arrayBuffer));
      
      const { data: arweaveRes } = await api.post('/vault/upload', {
        encryptedData,
        metadata: {
          starName: nfts.find(n => n.mintAddress.toString() === selectedNft)?.name || 'Star Vault',
          owner: wallet
        }
      });

      if (!arweaveRes.success) throw new Error('Arweave upload failed');

      // Step B: Link to Solana NFT
      setStatus('linking');
      const solanaRes = await linkVaultToNFT(selectedNft, arweaveRes.txId, window.solana);

      if (!solanaRes.success) throw new Error(solanaRes.error);

      // Step C: Success
      setStatus('success');
      setResult({
        arweaveUrl: arweaveRes.url,
        solanaUrl: `https://explorer.solana.com/tx/${solanaRes.signature}?cluster=mainnet-beta`
      });
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#3b82f6', '#ffffff']
      });
      
      if (onSuccess) onSuccess(arweaveRes.txId);
      toast.success('Digital Legacy Secured in the Stars!');

    } catch (err) {
      console.error('Finalize error:', err);
      toast.error(err.message || 'Operation failed');
      setStatus('idle');
    }
  };

  if (!encryptedBlob) return null;

  return (
    <div className="glass-dark p-8 rounded-[2.5rem] border border-white/10 shadow-2xl max-w-2xl mx-auto mt-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-sc-blue/10 border border-sc-blue/20 text-sc-blue">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-display font-bold text-white">Finalize Digital Legacy</h3>
          <p className="text-[10px] text-sc-text-muted uppercase tracking-[0.3em]">Arweave + Solana Protocol</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Wallet Connection */}
        {!wallet ? (
          <button
            onClick={connectWallet}
            className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 hover:border-sc-blue/40 text-white transition-all flex flex-col items-center justify-center gap-3 group"
          >
            <Wallet className="w-8 h-8 text-sc-blue group-hover:scale-110 transition-transform" />
            <div className="text-sm font-display uppercase tracking-widest">Connect Solana Wallet</div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">Phantom or Solflare</p>
          </button>
        ) : (
          <div className="flex items-center justify-between p-4 bg-sc-blue/5 border border-sc-blue/20 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sc-blue/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-sc-blue" />
              </div>
              <div>
                <div className="text-[10px] text-sc-blue uppercase font-bold tracking-widest">Wallet Connected</div>
                <div className="text-xs text-white/60 font-mono">{wallet.slice(0, 4)}...{wallet.slice(-4)}</div>
              </div>
            </div>
            <button onClick={() => setWallet(null)} className="text-[9px] uppercase tracking-widest text-white/20 hover:text-sc-red transition-colors">Disconnect</button>
          </div>
        )}

        {/* NFT Selection */}
        {wallet && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-sc-text-muted mb-3 ml-1 font-bold">Select Star to Link</label>
            {isLoadingNfts ? (
              <div className="w-full p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-sc-gold" />
                <span className="text-xs text-white/40 uppercase tracking-widest">Scanning Galaxy...</span>
              </div>
            ) : nfts.length > 0 ? (
              <select
                value={selectedNft}
                onChange={(e) => setSelectedNft(e.target.value)}
                className="w-full p-5 bg-black/40 text-white rounded-2xl border border-white/5 focus:border-sc-gold/40 focus:outline-none appearance-none transition-all cursor-pointer font-display tracking-wide"
              >
                {nfts.map(nft => (
                  <option key={nft.mintAddress.toString()} value={nft.mintAddress.toString()}>
                    {nft.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full p-5 bg-sc-red/5 rounded-2xl border border-sc-red/10 flex items-center gap-3">
                <Star className="w-4 h-4 text-sc-red/40" />
                <span className="text-xs text-sc-red/60 italic uppercase tracking-widest">No StarClaim NFTs found in this wallet</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Action Button */}
        <button
          onClick={handleFinalize}
          disabled={status !== 'idle' || !wallet || !selectedNft}
          className={`w-full py-5 rounded-2xl font-display font-bold uppercase tracking-[0.2em] text-xs transition-all relative overflow-hidden flex items-center justify-center gap-3
            ${status === 'idle' 
              ? 'bg-sc-gold text-sc-deep shadow-lg hover:shadow-sc-gold/20 active:scale-[0.98]' 
              : 'bg-white/5 text-white/40 border border-white/5'
            }`}
        >
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div key="idle" className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Upload & Seal to NFT <ArrowRight className="w-4 h-4" />
              </motion.div>
            )}
            {status === 'uploading' && (
              <motion.div key="upload" className="flex items-center gap-3 text-sc-gold" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading to Arweave...
              </motion.div>
            )}
            {status === 'linking' && (
              <motion.div key="link" className="flex items-center gap-3 text-sc-blue" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Linking NFT Metadata...
              </motion.div>
            )}
            {status === 'success' && (
              <motion.div key="success" className="flex items-center gap-3 text-sc-green" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ShieldCheck className="w-4 h-4" /> Secured Forever
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Success Modal/Panel */}
        {status === 'success' && result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-sc-green/10 border border-sc-green/20 rounded-3xl space-y-4"
          >
            <div className="text-center text-sc-green font-display text-lg uppercase tracking-widest mb-4">Verification Records</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a href={result.arweaveUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-sc-gold/40 transition-all group">
                <div className="flex items-center gap-2">
                  <Database className="w-3 h-3 text-sc-gold" />
                  <span className="text-[10px] text-white/60 uppercase font-bold">Arweave Explorer</span>
                </div>
                <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white" />
              </a>
              <a href={result.solanaUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-sc-blue/40 transition-all group">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-3 h-3 text-sc-blue" />
                  <span className="text-[10px] text-white/60 uppercase font-bold">Solana Explorer</span>
                </div>
                <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white" />
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
