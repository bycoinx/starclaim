import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Palette,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { StarRepository } from "../lib/StarRepository";
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

const buildVaultCertificates = (stars) => {
  return stars.map((star, index) => ({
    id: `${star.starId || `vault-${index}`}-cert`,
    star: star.name,
    issued: star.ownedSince || "Unknown",
    type: star.hasCertificate ? "Star Claim Certificate" : "Claim Pending Certificate",
    owner: star.owner || "Pilot",
    status: star.certificateStatus || (star.hasCertificate ? "Verified" : "Pending"),
  }));
};

const buildVaultStories = (stars) => {
  return stars.slice(0, 3).map((star, index) => ({
    title: `${star.name} ile Yeni Anılar`,
    star: star.name,
    category: star.rarity === "Legendary" ? "Legendary Memoir" : "Vault Chronicle",
    reading: `${4 + index} min read`,
    created: star.ownedSince || "Recently",
    excerpt: `${star.name}'in koleksiyonundaki yeri, takımyıldızı ${star.constellation} içinde yeni bir ışık olarak kaydedildi.`,
  }));
};

const buildVaultCollections = (stars) => {
  const constellations = Array.from(new Set(stars.map((star) => star.constellation).filter(Boolean)));
  const legendaryCount = stars.filter((star) => star.tier?.toLowerCase() === "legendary").length;
  const storyCount = stars.filter((star) => star.storyCount).length;

  return [
    {
      title: "Constellation Vault",
      subtitle: "Curated clusters",
      description: `${constellations.length} takımyıldızı koleksiyonunuza sanatçı titizliğiyle yerleştirir.`,
    },
    {
      title: "Legendary Archive",
      subtitle: "Rare holdings",
      description: `${legendaryCount} efsanevi yıldız, özel bir premium arşivde saklanır.`,
    },
    {
      title: "Storyline Deck",
      subtitle: "Narrative favorites",
      description: `${storyCount} yıldız için hikaye önizlemesi, duygusal koleksiyonu güçlendirir.`,
    },
    {
      title: "Future Reserves",
      subtitle: "Reserved slots",
      description: `Yeni premium yıldızlar için ${stars.length + 1} rezervasyon alanı planlandı.`,
    },
  ];
};

const buildVaultTimeline = (stars) => {
  const events = stars.flatMap((star, index) => {
    const acquiredDate = star.ownedSince || "Unknown";
    return [
      {
        title: "Star Claimed",
        date: acquiredDate,
        description: `${star.name} koleksiyonunuza eklendi ve özel Vault kaydı oluşturuldu.`,
        star: star.name,
        status: "Complete",
        Icon: Star,
      },
      {
        title: "Certificate Generated",
        date: acquiredDate,
        description: `${star.name} için onaylı sertifika başarıyla üretildi.`,
        star: star.name,
        status: star.hasCertificate ? "Verified" : "Pending",
        Icon: ShieldCheck,
      },
      {
        title: "Story Published",
        date: acquiredDate,
        description: `${star.name} için premium hikaye içeriği Vault'ta yayınlandı.`,
        star: star.name,
        status: "Live",
        Icon: BookOpen,
      },
    ];
  });

  return [
    ...events,
    {
      title: "Vault Updated",
      date: "Recently",
      description: "StarVault koleksiyonunuz yeni bir premium yönetim deneyimi kazandı.",
      star: "Vault",
      status: "Complete",
      Icon: Palette,
    },
    {
      title: "Future Asset Reserved",
      date: "Soon",
      description: "Bir sonraki premium yıldız için rezervasyon sırası hazır tutuluyor.",
      star: "Pending",
      status: "Reserved",
      Icon: Sparkles,
    },
  ];
};

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

function normalizeVaultStar(star) {
  const displayName = star.name || star.code || "Untitled Star";
  const constellation = star.constellation || "Unknown";
  const spectralType = star.spectralType || star.spect || "G";
  const tierLabel = star.tierLabel || (star.tier ? star.tier.charAt(0).toUpperCase() + star.tier.slice(1) : "Standard");
  const isClaimed = !!star.isClaimed;

  return {
    starId: star.starId || star.code || star.id || `star-${Math.random().toString(36).slice(2, 8)}`,
    name: displayName,
    code: star.code || star.starId || "UNKNOWN",
    constellation,
    spectralType,
    magnitude: star.magnitude !== undefined ? star.magnitude : star.raw?.magnitude || "N/A",
    distance: star.distance || star.raw?.distance || "N/A",
    rarity: tierLabel,
    acquired: star.raw?.acquired || star.acquired || "Unknown",
    ownedSince: star.ownedSince || star.raw?.ownedSince || "Unknown",
    ownershipStatus: isClaimed ? "Private Reserve" : "Available",
    certificateStatus: star.hasCertificate ? "Verified" : "Pending",
    storyCount: star.storyCount || 0,
    memoryCount: star.memoryCount || (star.storyCount ? star.storyCount * 3 : 0),
    sharedStatus: isClaimed ? "Private" : "Available",
    owner: star.ownerName || star.raw?.owner_name || "Pilot",
    price: star.price || 0,
    hasCertificate: star.hasCertificate || false,
    raw: star,
  };
}

export default function Vault() {
  const [vaultStars, setVaultStars] = useState([]);
  const [selectedStar, setSelectedStar] = useState(null);
  const [vaultStats, setVaultStats] = useState({
    ownedStars: "0",
    certificates: "0",
    stories: "0",
    vaults: "1",
    totalValue: "$0 XCX",
  });

  useEffect(() => {
    document.title = "StarVault - StarClaim";
  }, []);

  useEffect(() => {
    const loadVault = async () => {
      try {
        const allStars = await StarRepository.loadAll();
        const owned = allStars.filter((star) => star.isClaimed).map(normalizeVaultStar);
        const displayStars = owned.length ? owned : myStars.map(normalizeVaultStar);

        setVaultStars(displayStars);
        setSelectedStar((prev) => displayStars.find((star) => star.starId === prev?.starId) || displayStars[0] || null);
        setVaultStats({
          ownedStars: displayStars.length.toString(),
          certificates: displayStars.filter((star) => star.certificateStatus === "Verified").length.toString(),
          stories: displayStars.reduce((sum, star) => sum + (star.storyCount || 0), 0).toString(),
          vaults: "1",
          totalValue: `$${displayStars.reduce((sum, star) => sum + Number(star.price || 0), 0).toLocaleString()} XCX`,
        });
      } catch (error) {
        console.warn("Vault: Failed to load repository stars, using static fallback.", error);
        const fallbackStars = myStars.map(normalizeVaultStar);
        setVaultStars(fallbackStars);
        setSelectedStar(fallbackStars[0] || null);
        setVaultStats({
          ownedStars: fallbackStars.length.toString(),
          certificates: fallbackStars.filter((star) => star.certificateStatus === "Verified").length.toString(),
          stories: fallbackStars.reduce((sum, star) => sum + (star.storyCount || 0), 0).toString(),
          vaults: "1",
          totalValue: `$${fallbackStars.reduce((sum, star) => sum + Number(star.price || 0), 0).toLocaleString()} XCX`,
        });
      }
    };

    loadVault();
  }, []);

  return (
    <PageShell>
      <VaultHero
        stats={vaultStats}
        actions={["Open My Constellation", "Explore Memories"]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.75fr_1fr]">
        <div className="space-y-6">
          <section id="my-constellation">
            <VaultStarsSection stars={vaultStars} selectedStar={selectedStar} onSelectStar={setSelectedStar} />
          </section>

          <section id="memories">
            <VaultStoriesSection stories={buildVaultStories(vaultStars)} />
          </section>

          <section id="certificates">
            <VaultCertificatesSection certificates={buildVaultCertificates(vaultStars)} />
          </section>

          <section id="timeline">
            <VaultTimelineSection events={buildVaultTimeline(vaultStars)} />
          </section>

          <section id="collections">
            <VaultCollectionsSection collections={buildVaultCollections(vaultStars)} />
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
