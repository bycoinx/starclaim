import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Palette,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { PageShell } from "../components/shell";
import VaultHero from "../components/vault/VaultHero";
import VaultSidebar from "../components/vault/VaultSidebar";
import VaultStarsSection from "../components/vault/VaultStarsSection";
import VaultCertificatesSection from "../components/vault/VaultCertificatesSection";
import VaultStoriesSection from "../components/vault/VaultStoriesSection";
import VaultCollectionsSection from "../components/vault/VaultCollectionsSection";
import VaultTimelineSection from "../components/vault/VaultTimelineSection";


const myStars = [
  {
    starId: "SCX-0001",
    name: "Sirius",
    code: "SIR-CMA",
    constellation: "Canis Major",
    spectralType: "A1V",
    magnitude: "-1.46",
    distance: "8.6 ly",
    rarity: "Legendary",
    acquired: "20 May 2026",
    ownedSince: "May 20, 2026",
    ownershipStatus: "Private Reserve",
    certificateStatus: "Verified",
    storyCount: 3,
    memoryCount: 12,
    sharedStatus: "Private",
    owner: "Ali & Zeynep",
  },
  {
    starId: "SCX-0002",
    name: "Betelgeuse",
    code: "BET-ORI",
    constellation: "Orion",
    spectralType: "M1-2Ia",
    magnitude: "0.5",
    distance: "642 ly",
    rarity: "Supernova",
    acquired: "14 Feb 2026",
    ownedSince: "Feb 14, 2026",
    ownershipStatus: "Collector Tier",
    certificateStatus: "Verified",
    storyCount: 2,
    memoryCount: 8,
    sharedStatus: "Private",
    owner: "StarSeeker",
  },
  {
    starId: "SCX-0003",
    name: "Vega",
    code: "VEG-LYR",
    constellation: "Lyra",
    spectralType: "A0V",
    magnitude: "0.03",
    distance: "25 ly",
    rarity: "Legendary",
    acquired: "05 Mar 2026",
    ownedSince: "Mar 05, 2026",
    ownershipStatus: "Legacy Vault",
    certificateStatus: "Verified",
    storyCount: 4,
    memoryCount: 15,
    sharedStatus: "Shared",
    owner: "Eda",
  },
  {
    starId: "SCX-0004",
    name: "Rigel",
    code: "RIG-ORI",
    constellation: "Orion",
    spectralType: "B8Ia",
    magnitude: "0.18",
    distance: "860 ly",
    rarity: "Supernova",
    acquired: "12 Jan 2026",
    ownedSince: "Jan 12, 2026",
    ownershipStatus: "Premium Tier",
    certificateStatus: "Verified",
    storyCount: 1,
    memoryCount: 7,
    sharedStatus: "Private",
    owner: "Pilot One",
  },
];

const certificates = [
  {
    id: "SCX-2026-0001",
    star: "Sirius",
    issued: "20 May 2026",
    type: "Star Claim Certificate",
    owner: "Ali & Zeynep",
    status: "Verified",
  },
  {
    id: "SCX-2026-0002",
    star: "Vega",
    issued: "14 Feb 2026",
    type: "Star Claim Certificate",
    owner: "Eda",
    status: "Verified",
  },
  {
    id: "SCX-2026-0003",
    star: "Betelgeuse",
    issued: "05 Mar 2026",
    type: "Time Capsule Certificate",
    owner: "StarSeeker",
    status: "Verified",
  },
];

const stories = [
  {
    title: "Sirius’un Yolculuğu",
    star: "Sirius",
    category: "Private Odyssey",
    reading: "4 min read",
    created: "May 20, 2026",
    excerpt: "A luminous memory of the first star that became your own, written as a private testament.",
  },
  {
    title: "Vega ve Lyra Efsanesi",
    star: "Vega",
    category: "Constellation Tale",
    reading: "5 min read",
    created: "Feb 14, 2026",
    excerpt: "The brightest jewel of Lyra reveals its ancient myth and your place within it.",
  },
  {
    title: "Betelgeuse: Kırmızı Dev",
    star: "Betelgeuse",
    category: "Cosmic Journey",
    reading: "6 min read",
    created: "Mar 05, 2026",
    excerpt: "A dramatic narrative of change, endurance, and the promise of distant light.",
  },
];

const collections = [
  {
    title: "Constellation Vault",
    subtitle: "Curated clusters",
    description: "Group your star holdings into themed collections for easier storytelling.",
  },
  {
    title: "Legendary Archive",
    subtitle: "Rare holdings",
    description: "Hold your most legendary stars in a distinct premium collection.",
  },
  {
    title: "Storyline Deck",
    subtitle: "Narrative favorites",
    description: "Keep your most emotional and historic star stories in one place.",
  },
  {
    title: "Future Reserves",
    subtitle: "Reserved slots",
    description: "Plan the next additions to your private universe before they arrive.",
  },
];

const timelineEvents = [
  {
    title: "Star Claimed",
    date: "20 May 2026",
    description: "Sirius entered your private vault as your first owned star.",
    star: "Sirius",
    status: "Complete",
    Icon: Star,
  },
  {
    title: "Certificate Generated",
    date: "21 May 2026",
    description: "A premium claim certificate was minted for your new star.",
    star: "Sirius",
    status: "Verified",
    Icon: ShieldCheck,
  },
  {
    title: "Story Published",
    date: "22 May 2026",
    description: "Your first personal star story was added to the vault library.",
    star: "Sirius",
    status: "Live",
    Icon: BookOpen,
  },
  {
    title: "Vault Updated",
    date: "27 May 2026",
    description: "The StarVault interface received a premium experience refresh.",
    star: "Vault",
    status: "Complete",
    Icon: Palette,
  },
  {
    title: "Future Asset Reserved",
    date: "Soon",
    description: "A reserved slot is waiting for your next premium collectible.",
    star: "Pending",
    status: "Reserved",
    Icon: Sparkles,
  },
];

const sidebarHighlights = [
  {
    title: "Vault health is optimal",
    description: "All private assets are encrypted and synced.",
    status: "Stable",
    tone: "emerald",
  },
  {
    title: "3 new story prompts",
    description: "Add fresh narrative depth to your brightest stars.",
    status: "Active",
    tone: "purple",
  },
  {
    title: "Reserved asset awaiting review",
    description: "Finalize your next premium star reservation.",
    status: "Reserved",
    tone: "amber",
  },
];

export default function Vault() {
  const [selectedStar, setSelectedStar] = useState(myStars[0]);

  useEffect(() => {
    document.title = "StarVault - StarClaim";
  }, []);

  return (
    <PageShell>
      <VaultHero
        stats={{
          ownedStars: "12",
          certificates: "9",
          stories: "6",
          vaults: "4",
          totalValue: "12,450 XCX",
        }}
        actions={["Open My Constellation", "Explore Memories"]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.75fr_1fr]">
        <div className="space-y-6">
          <section id="my-constellation">
            <VaultStarsSection stars={myStars} selectedStar={selectedStar} onSelectStar={setSelectedStar} />
          </section>

          <section id="memories">
            <VaultStoriesSection stories={stories} />
          </section>

          <section id="certificates">
            <VaultCertificatesSection certificates={certificates} />
          </section>

          <section id="timeline">
            <VaultTimelineSection events={timelineEvents} />
          </section>

          <section id="collections">
            <VaultCollectionsSection collections={collections} />
          </section>

          <section id="legacy-actions">
            <div className="rounded-[2rem] border border-white/10 bg-[#060a16]/88 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr] lg:items-center">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-sc-gold/70">Legacy Actions</p>
                  <h2 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-4xl">
                    Protect your premium collection for the long term.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                    These are the high-value actions that preserve your star legacy across time and ownership.
                  </p>
                </div>
                <div className="grid gap-3">
                  {[
                    "Secure Vault",
                    "Create Time Capsule",
                    "Publish Certificate",
                    "Authorize Transfer",
                    "Invite Keeper",
                  ].map((label) => (
                    <button
                      key={label}
                      className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:border-sc-gold/30 hover:bg-white/10"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="rounded-[2rem] border border-white/10 bg-[#060a16]/88 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr] lg:items-center">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-sc-gold/70">Long-term Ownership</p>
                  <h2 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-4xl">
                    Every star in StarVault is part of your legacy.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                    Share, secure and pass forward your collection with confidence. These are the actions that keep your universe alive.
                  </p>
                </div>
                <div className="grid gap-3">
                  {[
                    "Share",
                    "Backup",
                    "Encrypt",
                    "Legacy",
                    "Transfer",
                  ].map((label) => (
                    <button
                      key={label}
                      className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:border-sc-gold/30 hover:bg-white/10"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <VaultSidebar selectedStar={selectedStar} highlights={sidebarHighlights} />
      </div>
    </PageShell>
  );
}
