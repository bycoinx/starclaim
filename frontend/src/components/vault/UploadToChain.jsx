import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { toast } from 'sonner';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { 
  Database, 
  Link as LinkIcon, 
  ExternalLink, 
  CheckCircle2, 
  Loader2, 
  Wallet, 
  Star,
  ArrowRight,
  ShieldCheck,
  LayoutGrid,
  ChevronRight
} from 'lucide-react';

import { api } from '../../lib/api';
import { linkVaultToNFT } from '../../lib/solana/updateNFT';

export function UploadToChain({ encryptedBlob, onSuccess }) {
  const { publicKey, wallet, connected, signTransaction } = useWallet();
  const { width, height } = useWindowSize();
  
  const [nfts, setNfts] = useState([]);
  const [selectedNft, setSelectedNft] = useState(null);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | uploading | linking | success
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  // 1. Fetch User's StarClaim NFTs when connected
  useEffect(() => {
    if (connected && publicKey) {
      fetchUserNfts(publicKey);
    } else {
      setNfts([]);
      setSelectedNft(null);
    }
  }, [connected, publicKey]);

  const fetchUserNfts = async (ownerPublicKey) => {
    setIsLoadingNfts(true);
    try {
      const endpoint = process.env.REACT_APP_SOLANA_RPC || clusterApiUrl('mainnet-beta');
      const connection = new Connection(endpoint, 'confirmed');
      const metaplex = new Metaplex(connection);
      
      const userNfts = await metaplex.nfts().findAllByOwner({ owner: ownerPublicKey });
      
      // Filter for StarClaim NFTs
      const starNfts = userNfts.filter(n => n.name.toLowerCase().includes('star'));
      setNfts(starNfts);
      if (starNfts.length > 0) setSelectedNft(starNfts[0]);
    } catch (err) {
      console.error('Fetch NFTs error:', err);
      toast.error('Failed to load your NFTs');
    } finally {
      setIsLoadingNfts(false);
    }
  };

  // 2. The Big Flow
  const handleUpload = async () => {
    if (!selectedNft || !encryptedBlob || !connected) return;

    try {
      // Step 1: Prepare
      setProgress(10);
      setStatus('preparing');
      
      const arrayBuffer = await encryptedBlob.arrayBuffer();
      const encryptedData = Array.from(new Uint8Array(arrayBuffer));
      
      // Step 2: Upload to Arweave
      setProgress(30);
      setStatus('uploading');
      
      const { data: arweaveRes } = await api.post('/vault/upload', {
        encryptedData,
        metadata: {
          starName: selectedNft.name || 'Star Vault',
          owner: publicKey.toString()
        }
      });

      if (!arweaveRes.success) throw new Error('Arweave upload failed');
      
      setProgress(60);
      setStatus('confirming');

      // Step 3: Link to Solana NFT
      setProgress(80);
      setStatus('updating');
      
      const solanaRes = await linkVaultToNFT(
        selectedNft.mintAddress.toString(), 
        arweaveRes.txId, 
        window.solana // This is still a bit tricky with adapter, but linkVaultToNFT should handle it
      );

      if (!solanaRes.success) throw new Error(solanaRes.error);

      // Step 4: Success
      setProgress(100);
      setStatus('success');
      setResult({
        txId: arweaveRes.txId,
        arweaveUrl: arweaveRes.url,
        solanaUrl: `https://explorer.solana.com/tx/${solanaRes.signature}?cluster=mainnet-beta`
      });
      
      if (onSuccess) onSuccess(arweaveRes.txId);
      toast.success('Digital Legacy Secured in the Stars!');

    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Operation failed');
      setStatus('idle');
      setProgress(0);
    }
  };

  if (!encryptedBlob) return null;

  return (
    <div className="glass-dark p-6 rounded-2xl border border-white/10 shadow-xl">
      {status === 'success' && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} gravity={0.2} />}
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sc-gold/10 border border-sc-gold/20 text-sc-gold">
            <LinkIcon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Link to Your Star</h3>
        </div>
        {status === 'success' && (
          <div className="flex items-center gap-1 text-sc-green text-[10px] font-bold uppercase tracking-widest">
            <CheckCircle2 className="w-3 h-3" /> Linked
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Step 1: Wallet Connection */}
        {!connected ? (
          <div className="p-6 bg-white/5 rounded-xl border border-dashed border-white/10 flex flex-col items-center text-center">
            <Wallet className="w-10 h-10 text-white/20 mb-4" />
            <h4 className="text-sm font-bold text-white mb-2">Connect Your Wallet</h4>
            <p className="text-xs text-sc-text-muted mb-6">You need to connect your Solana wallet to link this vault to your star.</p>
            <WalletMultiButton className="!bg-sc-gold !text-sc-deep !font-bold !rounded-full !h-12" />
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-sc-blue/5 border border-sc-blue/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sc-blue/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-sc-blue" />
              </div>
              <div className="text-xs font-mono text-white/60">
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
              </div>
            </div>
            <div className="text-[10px] text-sc-blue uppercase font-bold tracking-widest">Connected</div>
          </div>
        )}

        {/* Step 2: NFT Selection */}
        {connected && status !== 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-widest">Which star to link?</h4>
            {isLoadingNfts ? (
              <div className="py-8 flex flex-col items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-sc-gold" />
                <span className="text-[10px] text-sc-text-muted uppercase tracking-widest">Scanning Galaxy...</span>
              </div>
            ) : nfts.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {nfts.map(nft => (
                  <button
                    key={nft.mintAddress.toString()}
                    onClick={() => setSelectedNft(nft)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      selectedNft?.mintAddress.toString() === nft.mintAddress.toString()
                        ? 'bg-sc-gold/10 border-sc-gold/40'
                        : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center">
                        <Star className={`w-5 h-5 ${selectedNft?.mintAddress.toString() === nft.mintAddress.toString() ? 'text-sc-gold fill-sc-gold' : 'text-white/20'}`} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-white">{nft.name}</div>
                        <div className="text-[10px] text-sc-text-muted uppercase tracking-widest">{nft.symbol}</div>
                      </div>
                    </div>
                    {selectedNft?.mintAddress.toString() === nft.mintAddress.toString() && (
                      <CheckCircle2 className="w-4 h-4 text-sc-gold" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-sc-red/5 rounded-xl border border-sc-red/10 text-center">
                <p className="text-xs text-sc-red/60 uppercase tracking-widest">No StarClaim NFTs found</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Progress & Action */}
        {connected && status !== 'success' && (
          <div className="space-y-4">
            {status !== 'idle' && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase tracking-widest">
                  <span className="text-sc-gold font-bold">
                    {status === 'preparing' && 'Preparing upload...'}
                    {status === 'uploading' && 'Uploading to Arweave...'}
                    {status === 'confirming' && 'Confirming transaction...'}
                    {status === 'updating' && 'Updating NFT metadata...'}
                  </span>
                  <span className="text-white/40">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-sc-gold"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={status !== 'idle' || !selectedNft}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2
                ${status === 'idle' && selectedNft
                  ? 'bg-sc-gold text-sc-deep hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
            >
              {status === 'idle' ? (
                <>Upload to Arweave <ArrowRight className="w-4 h-4" /></>
              ) : (
                <><Loader2 className="w-4 h-4 animate-spin" /> {status.toUpperCase()}...</>
              )}
            </button>
          </div>
        )}

        {/* Step 4: Success Results */}
        {status === 'success' && result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="p-4 bg-sc-green/10 border border-sc-green/20 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-sc-green" />
              <div className="text-xs text-sc-green font-bold uppercase tracking-widest">Digital Legacy Secured!</div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <a href={result.arweaveUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-sc-gold/40 transition-all group">
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-white/60">
                  <Database className="w-3 h-3 text-sc-gold" /> Arweave Record
                </div>
                <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white" />
              </a>
              <a href={result.solanaUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-sc-blue/40 transition-all group">
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-white/60">
                  <LinkIcon className="w-3 h-3 text-sc-blue" /> Solana Metadata
                </div>
                <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white" />
              </a>
            </div>

            <button
              onClick={() => window.location.href = '/vault'}
              className="w-full py-4 rounded-xl border border-sc-gold/40 text-sc-gold text-xs font-bold uppercase tracking-widest hover:bg-sc-gold/10 transition-all"
            >
              View in Vault
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
