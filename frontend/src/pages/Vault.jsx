import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VaultEncryption } from "../components/vault/VaultEncryption";
import { VaultDecryption } from "../components/vault/VaultDecryption";
import { ShieldCheck, Database, Link as LinkIcon, Lock, Unlock, Terminal as TerminalIcon, Activity } from "lucide-react";
import StarCanvas from "../components/StarCanvas";
import "./Console.css";

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
    <div className="min-h-screen bg-sc-deep relative overflow-hidden pt-28 pb-24 dashboard-container">
      <StarCanvas density={180} />
      <div className="absolute inset-0 nebula-bg opacity-30 pointer-events-none" />

      <main className="relative max-w-7xl mx-auto px-6 md:px-10 z-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-6 font-bold"
          >
            <ShieldCheck size={14} className="animate-pulse" />
            SECURITY_PROTOCOL_ACTIVE // VAULT_LOCK_ESTABLISHED
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-6xl mb-6 tracking-tight text-white"
          >
            Digital <span className="gold-gradient-text italic">Legacy Vault</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sc-text-muted max-w-2xl mx-auto text-sm md:text-lg leading-relaxed font-mono opacity-70"
          >
            Secure your most precious memories, messages, or private keys. 
            Everything is encrypted locally and stays under your total control via Aegis Protocols.
          </motion.p>
        </div>

        {/* Tab Switcher - Terminal Style */}
        <div className="flex justify-center mb-12">
          <div className="terminal-frame p-1 rounded-xl flex gap-1 backdrop-blur-xl border-white/5 bg-white/5">
            <button
              onClick={() => setActiveTab("encrypt")}
              className={`px-10 py-3 rounded-lg text-[10px] uppercase tracking-[0.2em] font-bold transition-all flex items-center gap-2.5 ${
                activeTab === "encrypt" 
                  ? "bg-sc-gold text-sc-deep shadow-[0_0_15px_rgba(251,191,36,0.3)]" 
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> EXEC_ENCRYPT
            </button>
            <button
              onClick={() => setActiveTab("decrypt")}
              className={`px-10 py-3 rounded-lg text-[10px] uppercase tracking-[0.2em] font-bold transition-all flex items-center gap-2.5 ${
                activeTab === "decrypt" 
                  ? "bg-sc-blue text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              <Unlock className="w-3.5 h-3.5" /> EXEC_DECRYPT
            </button>
          </div>
        </div>

        {/* Render VaultEncryption / VaultDecryption in Terminal Frame */}
        <div className="mb-24 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="terminal-frame p-8 md:p-12 relative"
            >
              <div className="terminal-scanline" />
              <div className="terminal-header" />
              <div className="flex items-center gap-2 text-[8px] tracking-[0.3em] uppercase text-sc-gold/60 mb-8 font-mono font-bold">
                <TerminalIcon size={12} />
                VAULT_INTERFACE_v1.2.0 // SYSTEM_STATUS: READY
              </div>
              
              {activeTab === "encrypt" ? (
                <VaultEncryption onComplete={() => {}} />
              ) : (
                <VaultDecryption />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Feature Cards Grid - Terminal Aesthetic */}
        <div className="grid md:grid-cols-3 gap-6 mb-24">
          {featureCards.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="terminal-frame p-8 group border-white/5"
            >
              <div className="terminal-scanline opacity-10" />
              <div className="w-12 h-12 rounded-lg bg-sc-gold/5 border border-sc-gold/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-sc-gold/50 transition-all duration-500">
                <f.icon className="w-6 h-6 text-sc-gold/70 group-hover:text-sc-gold" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-lg text-white mb-4 uppercase tracking-wider gold-gradient-text">{f.title}</h3>
              <p className="text-[11px] text-sc-text-muted leading-relaxed font-mono opacity-80">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Footer Info - Terminal Style */}
        <div className="max-w-3xl mx-auto text-center border-t border-white/5 pt-16">
           <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.5em] text-sc-gold/30 mb-2 font-display">
             <Activity size={10} /> STARCLAIM_PROTOCOL
           </div>
           <div className="text-[8px] uppercase tracking-[0.2em] text-white/10 font-mono">
             CIPHER: AES-256-GCM // STORAGE: ARWEAVE_PERMAWEB // ENTROPY_NODE: ACTIVE
           </div>
        </div>
      </main>
    </div>
  );
}
