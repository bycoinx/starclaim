import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VaultEncryption } from "../components/vault/VaultEncryption";
import { VaultDecryption } from "../components/vault/VaultDecryption";
import { ShieldCheck, Database, Link as LinkIcon, Lock, Unlock, HelpCircle } from "lucide-react";
import StarCanvas from "../components/StarCanvas";

const features = [
  {
    icon: Lock,
    title: "Military-grade encryption",
    desc: "AES-256-GCM encryption with 600,000 PBKDF2 iterations ensures your data remains private.",
  },
  {
    icon: Database,
    title: "Permanent storage",
    desc: "Optionally store your encrypted vault on Arweave's permaweb for centuries of data integrity.",
  },
  {
    icon: LinkIcon,
    title: "Link to your star NFT",
    desc: "Bind your digital legacy directly to your Star NFT's on-chain metadata forever.",
  },
];

const faqs = [
  {
    q: "Is my data sent to your servers?",
    a: "Never. All encryption and decryption happens locally in your browser's Web Crypto sandbox. We never see your data or your password.",
  },
  {
    q: "What if I lose my password?",
    a: "Since we don't store your password or data, we have no way to recover it. Please save your master password in a secure place (like a password manager).",
  },
  {
    q: "What is a .vault file?",
    a: "It's a specialized binary file containing your salt, initialization vector, and encrypted data. It can only be opened with the correct password on this platform.",
  },
];

export default function Vault() {
  const [activeTab, setActiveTab] = useState("encrypt"); // encrypt | decrypt

  return (
    <div className="min-h-screen bg-sc-deep relative overflow-hidden pt-28 pb-24">
      <StarCanvas density={180} />
      <div className="absolute inset-0 nebula-bg opacity-30 pointer-events-none" />

      <main className="relative max-w-7xl mx-auto px-6 md:px-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sc-gold/30 text-[10px] uppercase tracking-[0.3em] text-sc-gold mb-6">
            <ShieldCheck className="w-3 h-3" /> Digital Legacy Protocol
          </div>
          <h1 className="font-display text-4xl md:text-6xl mb-6 tracking-tight">
            Your Digital <span className="text-sc-gold font-bold">Legacy Vault</span>
          </h1>
          <p className="text-sc-text-muted max-w-2xl mx-auto text-sm md:text-lg">
            Encrypt your most precious memories, messages, or keys and store them permanently in the stars. 
            Powered by military-grade AES-256-GCM.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/5 border border-white/10 p-1.5 rounded-2xl flex gap-2">
            <button
              onClick={() => setActiveTab("encrypt")}
              className={`px-8 py-3 rounded-xl text-xs uppercase tracking-widest font-display font-bold transition-all flex items-center gap-2 ${
                activeTab === "encrypt" ? "bg-sc-gold text-sc-deep shadow-lg" : "text-white/40 hover:text-white"
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Encrypt
            </button>
            <button
              onClick={() => setActiveTab("decrypt")}
              className={`px-8 py-3 rounded-xl text-xs uppercase tracking-widest font-display font-bold transition-all flex items-center gap-2 ${
                activeTab === "decrypt" ? "bg-sc-blue text-white shadow-lg" : "text-white/40 hover:text-white"
              }`}
            >
              <Unlock className="w-3.5 h-3.5" /> Decrypt
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="mb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {activeTab === "encrypt" ? <VaultEncryption /> : <VaultDecryption />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {features.map((f, i) => (
            <div key={i} className="glass-dark p-8 rounded-3xl border border-white/5">
              <f.icon className="w-6 h-6 text-sc-gold mb-5" strokeWidth={1.5} />
              <h3 className="font-display text-lg text-white mb-3">{f.title}</h3>
              <p className="text-xs text-sc-text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-10 justify-center">
            <HelpCircle className="w-5 h-5 text-sc-gold" />
            <h2 className="font-display text-2xl text-white uppercase tracking-widest">Frequently Asked</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="glass-dark p-6 rounded-2xl border border-white/5">
                <h4 className="text-sc-gold text-sm font-display mb-2 uppercase tracking-wider">{faq.q}</h4>
                <p className="text-xs text-sc-text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
