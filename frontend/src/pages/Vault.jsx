import React, { useEffect } from "react";
import {
  Award,
  BookOpen,
  Globe2,
  Palette,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Telescope,
  Trophy,
} from "lucide-react";
import { PageShell } from "../components/shell";
import VaultHero from "../components/vault/VaultHero";
import VaultSidebar from "../components/vault/VaultSidebar";
import VaultUniverseSummary from "../components/vault/VaultUniverseSummary";
import VaultQuickActions from "../components/vault/VaultQuickActions";
import VaultStarsSection from "../components/vault/VaultStarsSection";
import VaultCertificatesSection from "../components/vault/VaultCertificatesSection";
import VaultStoriesSection from "../components/vault/VaultStoriesSection";
import VaultCollectionsSection from "../components/vault/VaultCollectionsSection";
import VaultAchievementsSection from "../components/vault/VaultAchievementsSection";
import VaultTimelineSection from "../components/vault/VaultTimelineSection";
import VaultSecuritySection from "../components/vault/VaultSecuritySection";
import VaultRecommendationsSection from "../components/vault/VaultRecommendationsSection";

const universeSummary = [
  {
    label: "Owned Stars",
    value: "12",
    caption: "A private constellation in your universe.",
    Icon: Star,
    tone: "gold",
  },
  {
    label: "Certificates",
    value: "9",
    caption: "Verified claim artifacts.",
    Icon: ShieldCheck,
    tone: "blue",
  },
  {
    label: "Stories",
    value: "6",
    caption: "Personal memories and journeys.",
    Icon: BookOpen,
    tone: "purple",
  },
  {
    label: "Achievements",
    value: "14",
    caption: "Milestones unlocked across your vault.",
    Icon: Award,
    tone: "emerald",
  },
  {
    label: "Constellations",
    value: "5",
    caption: "Connected celestial families.",
    Icon: Sparkles,
    tone: "amber",
  },
  {
    label: "Favorite Star",
    value: "Sirius",
    caption: "The brightest treasure in your sky.",
    Icon: Star,
    tone: "gold",
  },
  {
    label: "Total Collection",
    value: "27 items",
    caption: "Stars, certificates, and stories.",
    Icon: Globe2,
    tone: "blue",
  },
  {
    label: "Future Assets",
    value: "7",
    caption: "Reserved spaces for what’s next.",
    Icon: Sparkles,
    tone: "purple",
  },
];

const quickActions = [
  {
    title: "Explore Stars",
    description: "Wander your personal constellation.",
    Icon: Telescope,
  },
  {
    title: "Manage Certificates",
    description: "Review verified ownership artifacts.",
    Icon: ShieldCheck,
  },
  {
    title: "Read Stories",
    description: "Return to meaningful star journeys.",
    Icon: BookOpen,
  },
  {
    title: "Visit Marketplace",
    description: "Discover rare additions for your vault.",
    Icon: Globe2,
  },
  {
    title: "Open Cosmos",
    description: "Step into the broader StarClaim universe.",
    Icon: Sparkles,
  },
  {
    title: "Vault Settings",
    description: "Adjust private access and experience.",
    Icon: Settings,
  },
];

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

const achievements = [
  {
    title: "First Star",
    detail: "Your first claim made the universe personal.",
    status: "Unlocked",
    Icon: Star,
    tone: "gold",
  },
  {
    title: "Explorer",
    detail: "Discoveries earned through quiet curiosity.",
    status: "Unlocked",
    Icon: Telescope,
    tone: "blue",
  },
  {
    title: "Galaxy Collector",
    detail: "A growing premium collection of distant stars.",
    status: "Unlocked",
    Icon: Globe2,
    tone: "emerald",
  },
  {
    title: "Constellation Master",
    detail: "Your stars form meaningful clusters.",
    status: "Locked",
    Icon: Sparkles,
    tone: "purple",
  },
  {
    title: "Story Creator",
    detail: "Personal narratives authored in StarVault.",
    status: "Unlocked",
    Icon: BookOpen,
    tone: "amber",
  },
  {
    title: "Legendary Owner",
    detail: "A rare tier reserved for the most prized stars.",
    status: "Locked",
    Icon: Trophy,
    tone: "gold",
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

const securityItems = [
  {
    title: "Encrypted Vault",
    description: "Core documents and collectibles are stored in private encryption.",
    status: "Protected",
    tone: "gold",
  },
  {
    title: "Recovery Status",
    description: "Recovery keys are ready, yet kept in secure reserve.",
    status: "Ready",
    tone: "blue",
  },
  {
    title: "Cloud Backup",
    description: "Encrypted backups are safely mirrored offsite.",
    status: "Synced",
    tone: "emerald",
  },
  {
    title: "Offline Archive",
    description: "A private offline copy safeguards your most precious stars.",
    status: "Available",
    tone: "purple",
  },
];

const recommendations = [
  {
    title: "Visit the Celestial Market",
    description: "Browse curated drops that complement your existing collection.",
    type: "Stars",
  },
  {
    title: "Create a Story Arc",
    description: "Turn your favorite stars into a connected narrative series.",
    type: "Stories",
  },
  {
    title: "Secure Your Archive",
    description: "Add an extra private key layer to your premium vault.",
    type: "Security",
  },
  {
    title: "Expand Your Constellation",
    description: "Claim the next rare star available for your universe.",
    type: "Collection",
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
          rank: "Explorer",
          totalValue: "12,450 XCX",
        }}
        actions={["Explore StarVault", "Open Certificate Vault"]}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section id="universe-summary">
            <VaultUniverseSummary metrics={universeSummary} />
          </section>

          <section id="quick-actions">
            <VaultQuickActions actions={quickActions} />
          </section>

          <section id="my-stars">
            <VaultStarsSection stars={myStars} />
          </section>

          <section id="certificates">
            <VaultCertificatesSection certificates={certificates} />
          </section>

          <section id="stories">
            <VaultStoriesSection stories={stories} />
          </section>

          <section id="collections">
            <VaultCollectionsSection collections={collections} />
          </section>

          <section id="achievements">
            <VaultAchievementsSection achievements={achievements} />
          </section>

          <section id="timeline">
            <VaultTimelineSection events={timelineEvents} />
          </section>

          <section id="security">
            <VaultSecuritySection items={securityItems} />
          </section>

          <section id="recommendations">
            <VaultRecommendationsSection recommendations={recommendations} />
          </section>

          <section>
            <div className="rounded-[2rem] border border-white/10 bg-[#060a16]/88 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr] lg:items-center">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-sc-gold/70">StarVault Private Universe</p>
                  <h2 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-4xl">
                    Your universe is already waiting. The next chapter is just one step away.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                    This page is the foundation for every star, certificate, story and secure memory you will own in StarClaim.
                  </p>
                </div>
                <button className="inline-flex items-center justify-center rounded-full bg-sc-gold px-8 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black shadow-[0_0_40px_rgba(212,175,55,0.18)] transition hover:bg-[#d4aa2a]">
                  Enter StarVault
                </button>
              </div>
            </div>
          </section>
        </div>

        <VaultSidebar metrics={universeSummary} highlights={sidebarHighlights} />
      </div>
    </PageShell>
  );
}
