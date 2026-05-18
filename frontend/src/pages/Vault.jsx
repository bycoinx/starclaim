import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VaultEncryption } from "../components/vault/VaultEncryption";
import { VaultDecryption } from "../components/vault/VaultDecryption";
import { ShieldCheck, Database, Link as LinkIcon, Lock, Unlock } from "lucide-react";
import StarCanvas from "../components/StarCanvas";

const featureCards = [
  {
    icon: Lock,
    title: "Military-grade encryption",
    desc: "AES-256-GCM encryption with 600,000 PBKDF2 iterations ensures your data remains private and secure forever.",
  },
  {
    icon: Database,
    title: "Permanent Arweave storage",
    desc: "Store your encrypted vault on Arweave's permaweb. Your digital legacy survives for centuries on the blockchain.",
  },
  {
    icon: LinkIcon,
    title: "Linked to your star NFT",
    desc: "Bind your encrypted vault directly to your Star NFT's on-chain metadata. One star, one legacy, one vault.",
  },
];

export default function Vault() {
  const [activeTab, setActiveTab] = useState("encrypt"); // encrypt | decrypt

  useEffect(() => {
    document.title = "StarVault - Your Encrypted Digital Legacy";
  }, []);

  return (
    <div className="min-h-screen bg-sc-deep relative overflow-hidden pt-28 pb-24">
      <StarCanvas density={180} />
      <div className="absolute inset-0 nebula-bg opacity-30 pointer-events-none" />

      <main className="relative max-w-7xl mx-auto px-6 md:px-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sc-gold/20 bg-sc-gold/5 text-[10px] uppercase tracking-[0.4em] text-sc-gold mb-6"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Security Protocol Active
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-6xl mb-6 tracking-tight text-white"
          >
            🔐 Your Digital <span className="text-sc-gold font-bold italic">Legacy Vault</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sc-text-muted max-w-2xl mx-auto text-sm md:text-lg leading-relaxed"
          >
            Secure your most precious memories, messages, or private keys. 
            Everything is encrypted locally and stays under your total control.
          </motion.p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-900/60 border border-white/10 p-1.5 rounded-3xl flex gap-2 backdrop-blur-xl shadow-2xl">
            <button
              onClick={() => setActiveTab("encrypt")}
              className={`px-10 py-3.5 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-display font-bold transition-all flex items-center gap-2.5 ${
                activeTab === "encrypt" 
                  ? "bg-sc-gold text-sc-deep shadow-[0_0_20px_rgba(251,191,36,0.3)]" 
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Encrypt
            </button>
            <button
              onClick={() => setActiveTab("decrypt")}
              className={`px-10 py-3.5 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-display font-bold transition-all flex items-center gap-2.5 ${
                activeTab === "decrypt" 
                  ? "bg-sc-blue text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              <Unlock className="w-3.5 h-3.5" /> Decrypt
            </button>
          </div>
        </div>

        {/* Render VaultEncryption / VaultDecryption */}
        <div className="mb-24 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {activeTab === "encrypt" ? (
                <VaultEncryption onComplete={() => {}} />
              ) : (
                <VaultDecryption />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-24">
          {featureCards.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-gray-900/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 hover:border-sc-gold/20 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-sc-gold/10 border border-sc-gold/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6 text-sc-gold" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-lg text-white mb-4 uppercase tracking-wider">{f.title}</h3>
              <p className="text-xs text-sc-text-muted leading-relaxed font-medium">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="max-w-3xl mx-auto text-center border-t border-white/5 pt-16">
           <div className="text-[10px] uppercase tracking-[0.5em] text-sc-gold/30 mb-2 font-display">StarClaim Protocol</div>
           <div className="text-[8px] uppercase tracking-[0.2em] text-white/10">v1.2.0 - AES-256-GCM - Arweave Permaweb Ready</div>
        </div>
      </main>
    </div>
  );
}
