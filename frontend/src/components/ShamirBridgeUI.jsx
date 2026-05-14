import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Smartphone, FileText, Users, Lock, Landmark, CheckCircle2, Download } from "lucide-react";
import { splitKey, distributeShares } from "../lib/shamir";

export default function ShamirBridgeUI({ masterKey, mode, onComplete }) {
  const [step, setStep] = useState(0); // 0: Ready, 1: Splitting, 2: Distributed
  const [distribution, setDistribution] = useState(null);

  const startSplitting = async () => {
    setStep(1);
    // Simulate high-tech processing
    setTimeout(async () => {
      const shares = splitKey(masterKey);
      const map = await distributeShares(shares, mode);
      setDistribution(map);
      setStep(2);
    }, 2500);
  };

  const handleDownloadDust = () => {
    if (!distribution) return;
    const blob = new Blob([distribution.share3.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery_share_${Date.now()}.dust`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-sc-deep/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-2xl bg-sc-gold/10 border border-sc-gold/20 mb-4">
          <Shield className="w-8 h-8 text-sc-gold" />
        </div>
        <h2 className="font-display text-3xl mb-2 gold-gradient-text uppercase">Shamir Bridge</h2>
        <p className="text-xs text-sc-text-muted tracking-widest">STARDUST RECOVERY PROTOCOL (3/5)</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center space-y-6"
          >
            <p className="text-sm text-sc-text-muted leading-relaxed italic">
              "Sir, we are about to split your master key into 5 cosmic shards. 
              Any 3 shards will be enough to rebuild your access if lost."
            </p>
            <div className="grid grid-cols-5 gap-2 opacity-50">
              {[Smartphone, FileText, Landmark, Users, Lock].map((Icon, i) => (
                <div key={i} className="aspect-square glass rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-sc-gold" />
                </div>
              ))}
            </div>
            <button 
              onClick={startSplitting}
              className="w-full py-5 bg-sc-gold text-sc-deep font-display font-bold uppercase tracking-widest text-xs rounded-2xl shadow-lg hover:scale-[1.02] transition-transform"
            >
              Initialize Star Dust Split
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="py-12 flex flex-col items-center gap-6"
          >
            <div className="relative">
              <div className="w-20 h-20 border-4 border-sc-gold/20 border-t-sc-gold rounded-full animate-spin" />
              <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-sc-gold animate-pulse" />
            </div>
            <div className="text-center">
              <div className="text-sm font-display text-sc-gold animate-pulse uppercase tracking-[0.3em]">Processing Lagrange Interpolation...</div>
              <div className="text-[10px] text-sc-text-muted mt-2">Generating 5 Cryptographic Polynomial Points</div>
            </div>
          </motion.div>
        )}

        {step === 2 && distribution && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="grid gap-3">
              {[
                { icon: Smartphone, label: "Share 1: Mobile Enclave", loc: "Stored in StarClaim Mobile" },
                { icon: Shield, label: "Share 2: NFT Metadata", loc: "Inscribed on Solana Chain" },
                { icon: FileText, label: "Share 3: Local Vault (.dust)", loc: "Ready for download", action: handleDownloadDust },
                { icon: Users, label: "Share 4: Guardian Link", loc: "Awaiting Guardian Assignment" },
                { icon: mode === 'citizen' ? Landmark : Lock, label: `Share 5: ${mode === 'citizen' ? 'Institutional Vault' : 'Secret Hash'}`, loc: mode === 'citizen' ? 'Verified Bank Registry' : 'Stored in neural memory' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 glass rounded-2xl border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-sc-gold/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-sc-gold" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white uppercase tracking-wider">{item.label}</div>
                    <div className="text-[10px] text-sc-text-muted">{item.loc}</div>
                  </div>
                  {item.action ? (
                    <button onClick={item.action} className="p-2 hover:bg-sc-gold/20 rounded-lg transition-colors">
                      <Download className="w-4 h-4 text-sc-gold" />
                    </button>
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-sc-green opacity-50" />
                  )}
                </div>
              ))}
            </div>

            <button 
              onClick={onComplete}
              className="w-full py-5 bg-sc-blue text-white font-display font-bold uppercase tracking-widest text-xs rounded-2xl shadow-lg mt-6"
            >
              Protocol Finalized - Close Bridge
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
