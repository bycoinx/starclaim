import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  Award,
  BookOpen,
  CalendarClock,
  ChevronRight,
  Clock,
  Database,
  FileText,
  Heart,
  Lock,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Star,
  Terminal as TerminalIcon,
  Unlock,
  Users,
} from "lucide-react";
import StarAssetImage from "../components/catalog/StarAssetImage";
import VaultHero from "../components/vault/VaultHero";
import { VaultEncryption } from "../components/vault/VaultEncryption";
import { VaultDecryption } from "../components/vault/VaultDecryption";
import "./Console.css";

const ownedStars = [
  {
    starId: "SCX-0001",
    name: "Sirius",
    code: "SIR-CMA",
    constellation: "Canis Major",
    spectralType: "A1V",
    magnitude: -1.46,
    distance: 8.6,
    tier: "legendary",
    isClaimed: true,
    ownerName: "Ali & Zeynep",
    storyCount: 2,
  },
  {
    starId: "SCX-0002",
    name: "Betelgeuse",
    code: "BET-ORI",
    constellation: "Orion",
    spectralType: "M1-2Ia",
    magnitude: 0.5,
    distance: 642.5,
    tier: "supernova",
    isClaimed: true,
    ownerName: "StarSeeker",
    storyCount: 1,
  },
  {
    starId: "SCX-0003",
    name: "Vega",
    code: "VEG-LYR",
    constellation: "Lyra",
    spectralType: "A0V",
    magnitude: 0.03,
    distance: 25.04,
    tier: "legendary",
    isClaimed: true,
    ownerName: "Eda",
    storyCount: 3,
  },
  {
    starId: "SCX-0004",
    name: "Rigel",
    code: "RIG-ORI",
    constellation: "Orion",
    spectralType: "B8Ia",
    magnitude: 0.18,
    distance: 860,
    tier: "supernova",
    isClaimed: true,
    ownerName: "Pilot One",
    storyCount: 1,
  },
];

const certificates = [
  { id: "CERT-0001", star: "Sirius", status: "Onaylandi", tone: "from-blue-500/30" },
  { id: "CERT-0002", star: "Vega", status: "Onaylandi", tone: "from-purple-500/30" },
  { id: "CERT-0003", star: "Betelgeuse", status: "Zaman kilitli", tone: "from-amber-500/30" },
];

const stories = [
  { title: "Sirius'un Yolculugu", desc: "Sirius hakkinda yazdigin hikaye", time: "2 gun once" },
  { title: "Vega ve Lyra Efsanesi", desc: "Lyra takimyildizinin en parlak yildizi", time: "5 gun once" },
  { title: "Betelgeuse: Kirmizi Dev", desc: "Bir devin yasami ve sonu", time: "1 hafta once" },
];

const achievements = [
  { label: "Ilk Yildiz", desc: "1 yildiz sahiplen", Icon: Star },
  { label: "10 Yildiz", desc: "10 yildiz sahiplen", Icon: Award },
  { label: "Hikaye Yazari", desc: "Ilk hikayeni yaz", Icon: BookOpen },
  { label: "Koleksiyoncu", desc: "5 sertifika kazan", Icon: Archive },
];

const timeline = [
  { label: "Sirius yildizini sahiplendin", time: "2 gun once", Icon: Star },
  { label: "Vega icin yeni hikaye yazdin", time: "5 gun once", Icon: BookOpen },
  { label: "Betelgeuse sertifikasi kazandin", time: "1 hafta once", Icon: FileText },
  { label: "Procyon yildizini sahiplendin", time: "2 hafta once", Icon: ShieldCheck },
];

const navItems = [
  { label: "Genel Bakis", Icon: Archive, active: true },
  { label: "Yildizlarim", Icon: Star },
  { label: "Sertifikalarim", Icon: FileText },
  { label: "Hikayelerim", Icon: BookOpen },
  { label: "Basarilarim", Icon: Award },
  { label: "Zaman Cizelgesi", Icon: Clock },
  { label: "Favoriler", Icon: Heart },
  { label: "Paylasilanlar", Icon: Users },
  { label: "Ayarlar", Icon: Settings },
];

function SectionHeader({ title, action = "Tumunu Gor" }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-sc-gold">{title}</h2>
      <button className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-sc-gold/80 hover:text-sc-gold">
        {action}
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function VaultPanel({ children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-[#070b18]/78 p-5 shadow-xl backdrop-blur-xl ${className}`}>
      {children}
    </section>
  );
}

function OwnedStarCard({ star }) {
  return (
    <article className="group rounded-xl border border-white/10 bg-[#070b18]/80 p-3 transition-all duration-300 hover:-translate-y-1 hover:border-sc-gold/40 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]">
      <div className="relative overflow-hidden rounded-lg border border-white/10">
        <StarAssetImage star={star} variant="preview" className="aspect-[4/3] w-full" />
        <div className="absolute left-3 top-3 rounded-md bg-sc-gold px-2 py-1 text-[10px] text-black">
          <Star className="h-3 w-3 fill-current" />
        </div>
      </div>
      <div className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl text-white group-hover:text-sc-gold">{star.name}</h3>
            <p className="text-xs text-white/45">{star.constellation}</p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.16em] text-sc-gold/70">{star.code}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-[11px] text-white/55">
          <span>{star.distance} isik yili</span>
          <span className="text-right">{star.spectralType}</span>
        </div>
        <button className="mt-4 w-full rounded-lg bg-sc-gold/90 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition hover:bg-sc-gold">
          Sahiplenildi
        </button>
      </div>
    </article>
  );
}

function CertificateCard({ item }) {
  return (
    <div className={`min-h-[190px] rounded-xl border border-white/10 bg-gradient-to-br ${item.tone} via-[#10182d] to-[#050814] p-4`}>
      <div className="flex h-full flex-col justify-between rounded-lg border border-sc-gold/25 p-4">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-sc-gold/40 text-sc-gold">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <p className="text-[9px] uppercase tracking-[0.28em] text-sc-gold/70">StarClaim Certificate</p>
          <h3 className="mt-3 font-display text-2xl text-white">{item.star}</h3>
        </div>
        <div className="flex items-center justify-between text-[10px] text-white/55">
          <span>{item.id}</span>
          <span>{item.status}</span>
        </div>
      </div>
    </div>
  );
}

function SecurityVault() {
  const [activeTab, setActiveTab] = useState("encrypt");

  return (
    <VaultPanel className="lg:col-span-2">
      <SectionHeader title="Guvenlik Kasasi" action="Aegis Protokolu" />
      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
        <button
          onClick={() => setActiveTab("encrypt")}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
            activeTab === "encrypt" ? "bg-sc-gold text-black" : "text-white/45 hover:text-white"
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          Encrypt
        </button>
        <button
          onClick={() => setActiveTab("decrypt")}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
            activeTab === "decrypt" ? "bg-sc-blue text-white" : "text-white/45 hover:text-white"
          }`}
        >
          <Unlock className="h-3.5 w-3.5" />
          Decrypt
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="terminal-frame p-5 md:p-7"
        >
          <div className="mb-5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-sc-gold/60">
            <TerminalIcon className="h-3.5 w-3.5" />
            VAULT_INTERFACE // SYSTEM_READY
          </div>
          {activeTab === "encrypt" ? <VaultEncryption onComplete={() => {}} /> : <VaultDecryption />}
        </motion.div>
      </AnimatePresence>
    </VaultPanel>
  );
}

export default function Vault() {
  useEffect(() => {
    document.title = "StarVault - StarClaim";
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#02040a] px-4 pb-20 pt-28 text-white md:px-8">
      <div className="absolute inset-0 nebula-bg opacity-25 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(77,124,255,0.12),transparent_32%),radial-gradient(circle_at_90%_30%,rgba(122,92,255,0.12),transparent_28%)] pointer-events-none" />

      <main className="relative z-10 mx-auto flex max-w-[1500px] flex-col gap-6">
        <VaultHero
          stats={{
            ownedStars: "12",
            certificates: "9",
            stories: "6",
            rank: "Explorer",
            totalValue: "12,450 XCX",
          }}
        />

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden rounded-2xl border border-white/10 bg-[#070b18]/80 p-4 backdrop-blur-xl lg:block">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.Icon;
                return (
                  <button
                    key={item.label}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                      item.active
                        ? "bg-sc-gold/15 text-sc-gold"
                        : "text-white/65 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-10 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sc-gold/30 bg-sc-gold/10 text-sc-gold">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Explorer</p>
                  <p className="text-xs text-white/45">Seviye 3</p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-sc-gold to-purple-500" />
              </div>
              <p className="mt-3 text-[11px] text-white/50">1,250 / 2,000 XP</p>
            </div>
          </aside>

          <div className="grid gap-6">
            <VaultPanel>
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <SectionHeader title="Yildizlarim" action="Tumunu Gor" />
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/45">
                  <Search className="h-4 w-4" />
                  <span className="text-xs">Yildiz ara...</span>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {ownedStars.map((star) => (
                  <OwnedStarCard key={star.starId} star={star} />
                ))}
              </div>
            </VaultPanel>

            <div className="grid gap-6 xl:grid-cols-2">
              <VaultPanel>
                <SectionHeader title="Sertifikalarim" />
                <div className="grid gap-4 sm:grid-cols-3">
                  {certificates.map((item) => (
                    <CertificateCard key={item.id} item={item} />
                  ))}
                </div>
              </VaultPanel>

              <VaultPanel>
                <SectionHeader title="Hikayelerim" />
                <div className="space-y-3">
                  {stories.map((story, index) => (
                    <div key={story.title} className="flex items-center gap-4 border-b border-white/10 pb-3 last:border-0">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sc-gold">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-white">{story.title}</h3>
                        <p className="truncate text-xs text-white/45">{story.desc}</p>
                      </div>
                      <span className="text-[11px] text-white/40">{story.time}</span>
                    </div>
                  ))}
                </div>
              </VaultPanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <VaultPanel>
                <SectionHeader title="Basarilarim" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {achievements.map((achievement) => {
                    const Icon = achievement.Icon;
                    return (
                      <div key={achievement.label} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-sc-gold/30 bg-sc-gold/10 text-sc-gold">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-xs font-semibold text-white">{achievement.label}</h3>
                        <p className="mt-1 text-[10px] text-white/40">{achievement.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </VaultPanel>

              <VaultPanel>
                <SectionHeader title="Zaman Cizelgesi" />
                <div className="space-y-4">
                  {timeline.map((entry) => {
                    const Icon = entry.Icon;
                    return (
                      <div key={entry.label} className="flex items-center gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sc-gold">
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="min-w-0 flex-1 text-sm text-white/75">{entry.label}</p>
                        <span className="text-[11px] text-white/40">{entry.time}</span>
                      </div>
                    );
                  })}
                </div>
              </VaultPanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <SecurityVault />

              <VaultPanel>
                <SectionHeader title="Paylasim ve Yedek" action="Yonet" />
                <div className="space-y-3">
                  {[
                    { label: "Aile paylasimi", Icon: Users },
                    { label: "Zaman kilitleri", Icon: CalendarClock },
                    { label: "Arweave yedekleri", Icon: Database },
                    { label: "Guvenli link", Icon: Share2 },
                  ].map((item) => {
                    const Icon = item.Icon;
                    return (
                      <button key={item.label} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 hover:border-sc-gold/30 hover:text-white">
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-sc-gold" />
                          {item.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-white/30" />
                      </button>
                    );
                  })}
                </div>
              </VaultPanel>
            </div>

            <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#090d1a] p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_45%,rgba(122,92,255,0.22),transparent_35%)] pointer-events-none" />
              <div className="relative max-w-3xl">
                <p className="font-display text-2xl leading-relaxed text-white md:text-3xl">
                  "Yildizlara sahip olamazsin, ama onlarin hikayelerine ortak olabilirsin."
                </p>
                <p className="mt-4 text-sm font-semibold text-sc-gold">- StarClaimX</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
