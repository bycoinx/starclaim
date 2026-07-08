import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Palette,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { api } from "../lib/api";
import { StarRepository } from "../lib/StarRepository";
import { PageShell } from "../components/shell";
import VaultHero from "../components/vault/VaultHero";
import VaultSidebar from "../components/vault/VaultSidebar";
import VaultNFTGrid from "../components/vault/VaultNFTGrid";
import VaultCertificatesSection from "../components/vault/VaultCertificatesSection";
import VaultStoriesSection from "../components/vault/VaultStoriesSection";
import VaultCollectionsSection from "../components/vault/VaultCollectionsSection";
import VaultTimelineSection from "../components/vault/VaultTimelineSection";
import VaultWalletPanel from "../components/vault/VaultWalletPanel";
import WalletConnectModal from "../components/vault/WalletConnectModal";
import VaultActions from "../components/vault/VaultActions";
import MobileDeepLinkPanel from "../components/catalog/MobileDeepLinkPanel";


const WALLET_STORAGE_KEY = 'starclaim_mock_wallet'

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

function starLookupKeys(star = {}) {
  return [
    star.starId,
    star.star_id,
    star.id,
    star.code,
    star.star_code,
    star.slug,
  ]
    .filter(Boolean)
    .map((value) => String(value));
}

function buildStarIndex(stars = []) {
  const index = new Map();
  stars.forEach((star) => {
    starLookupKeys(star).forEach((key) => index.set(key, star));
  });
  return index;
}

async function fetchMyVaultStars() {
  try {
    const { data } = await api.get("/stars/mine/list");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function mergeVaultOwnership(catalogStars = [], ownedRows = []) {
  if (!ownedRows.length) return catalogStars;

  const catalogIndex = buildStarIndex(catalogStars);
  const mergedById = new Map(catalogStars.map((star) => [star.starId, star]));

  ownedRows.forEach((ownedRow) => {
    const base =
      starLookupKeys(ownedRow)
        .map((key) => catalogIndex.get(key))
        .find(Boolean) || {};

    const merged = {
      ...base,
      ...ownedRow,
      starId: base.starId || ownedRow.star_id || ownedRow.starId || ownedRow.id || ownedRow.code,
      code: base.code || ownedRow.code || ownedRow.star_code,
      name: base.name || ownedRow.custom_name || ownedRow.name,
      constellation: base.constellation || ownedRow.constellation,
      spectralType: base.spectralType || ownedRow.spect || ownedRow.spectralType,
      magnitude: base.magnitude ?? ownedRow.magnitude,
      distance: base.distance ?? ownedRow.dist ?? ownedRow.distance,
      tier: base.tier || ownedRow.tier || "standard",
      tierLabel: base.tierLabel,
      price: base.price || ownedRow.price || 0,
      isClaimed: true,
      ownerName: ownedRow.owner_name || base.ownerName,
      ownerId: ownedRow.owner_id || base.ownerId,
      hasCertificate: true,
      certificateStatus: "Verified",
      ownedSince: ownedRow.claimed_at || ownedRow.ownedSince || base.ownedSince,
      orderId: ownedRow.order_id,
      raw: { ...(base.raw || {}), ...ownedRow },
    };

    if (merged.starId) {
      mergedById.set(merged.starId, merged);
    }
  });

  return Array.from(mergedById.values());
}

function normalizeVaultStar(star) {
  const displayName = star.name || star.code || "Untitled Star";
  const constellation = star.constellation || "Unknown";
  const spectralType = star.spectralType || star.spect || "G";
  const tierLabel = star.tierLabel || (star.tier ? star.tier.charAt(0).toUpperCase() + star.tier.slice(1) : "Standard");
  const isClaimed = !!(star.isClaimed || star.ownerId || star.owner_id || star.ownerName || star.owner_name);

  return {
    starId: star.starId || star.code || star.id || `star-${Math.random().toString(36).slice(2, 8)}`,
    name: displayName,
    code: star.code || star.starId || "UNKNOWN",
    constellation,
    spectralType,
    magnitude: star.magnitude !== undefined ? star.magnitude : star.raw?.magnitude || "N/A",
    distance: star.distance || star.raw?.distance || "N/A",
    rarity: tierLabel,
    acquired: star.raw?.acquired || star.acquired || star.raw?.claimed_at || "Unknown",
    ownedSince: star.ownedSince || star.raw?.ownedSince || star.raw?.claimed_at || "Unknown",
    ownershipStatus: isClaimed ? "Private Reserve" : "Available",
    certificateStatus: star.certificateStatus || (star.hasCertificate ? "Verified" : "Pending"),
    storyCount: star.storyCount || 0,
    memoryCount: star.memoryCount || (star.storyCount ? star.storyCount * 3 : 0),
    sharedStatus: isClaimed ? "Private" : "Available",
    owner: star.ownerName || star.owner_name || star.raw?.owner_name || star.raw?.owner || "Pilot",
    price: star.price || star.raw?.price || 0,
    hasCertificate: star.hasCertificate || star.certificateStatus === "Verified" || false,
    isClaimed,
    tierLabel: star.tierLabel || tierLabel,
    previewImage: star.previewImage || star.raw?.previewImage || star.raw?.heroImage || "https://via.placeholder.com/240x240?text=Star",
    heroImage: star.heroImage || star.raw?.heroImage || "https://via.placeholder.com/500x500?text=Star",
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
    rank: "Cadet",
  });
  const [wallet, setWallet] = useState(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [previewStar, setPreviewStar] = useState(null);

  useEffect(() => {
    document.title = "StarVault - StarClaim";
  }, []);

  useEffect(() => {
    const savedWallet = localStorage.getItem(WALLET_STORAGE_KEY);
    if (savedWallet) {
      try {
        setWallet(JSON.parse(savedWallet));
      } catch (error) {
        console.warn('Vault: invalid saved wallet state', error);
        localStorage.removeItem(WALLET_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    const loadVault = async () => {
      try {
        const catalogStars = await StarRepository.loadAll(true);
        const myOwnedRows = await fetchMyVaultStars();
        const mergedCatalog = mergeVaultOwnership(catalogStars, myOwnedRows);
        StarRepository.setCache(mergedCatalog);

        const ownedSource = myOwnedRows.length
          ? mergedCatalog.filter((star) =>
              myOwnedRows.some((ownedRow) =>
                starLookupKeys(ownedRow).some((key) => starLookupKeys(star).includes(key))
              )
            )
          : StarRepository.getOwnedStars();
        const owned = ownedSource.map(normalizeVaultStar);
        const displayStars = owned.length ? owned : myStars.map(normalizeVaultStar);
        const starCount = displayStars.length;
        const totalValueNumber = displayStars.reduce((sum, star) => sum + Number(star.price || 0), 0);

        setVaultStars(displayStars);
        setSelectedStar((prev) => displayStars.find((star) => star.starId === prev?.starId) || displayStars[0] || null);
        setVaultStats({
          ownedStars: starCount.toString(),
          certificates: displayStars.filter((star) => star.certificateStatus === "Verified").length.toString(),
          stories: displayStars.reduce((sum, star) => sum + (star.storyCount || 0), 0).toString(),
          vaults: "1",
          totalValue: `$${totalValueNumber.toLocaleString()} XCX`,
          rank: starCount >= 8 ? "Galactic" : starCount >= 5 ? "Voyager" : starCount >= 3 ? "Navigator" : starCount >= 1 ? "Explorer" : "Cadet",
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

  function handleConnect(newWallet) {
    setWallet(newWallet);
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(newWallet));
    setConnectOpen(false);
  }

  function handleDisconnect() {
    setWallet(null);
    localStorage.removeItem(WALLET_STORAGE_KEY);
  }

  return (
    <PageShell>
      <VaultHero
        stats={vaultStats}
        actions={["Open My Constellation", "Explore Memories"]}
      />

        <div className="grid gap-6 xl:grid-cols-[1.75fr_1fr]">
        <div className="space-y-6">
          <section id="my-constellation">
            <VaultNFTGrid
              stars={vaultStars}
              selectedStar={selectedStar}
              wallet={wallet}
              onSelectStar={setSelectedStar}
              onPreview={(st) => {
                setPreviewStar(st);
              }}
              onList={(star, price) => {
                setVaultStars((currentStars) =>
                  currentStars.map((item) =>
                    item.starId === star.starId ? { ...item, price } : item
                  )
                );
              }}
              onRequireWallet={() => setConnectOpen(true)}
            />
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
            <div className="grid gap-6 lg:grid-cols-[1fr]">
              <VaultActions selectedStar={selectedStar} wallet={wallet} />
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
      <div className="fixed bottom-6 left-6 z-40 hidden lg:block">
        <VaultWalletPanel wallet={wallet} onOpenConnect={() => setConnectOpen(true)} onDisconnect={handleDisconnect} />
      </div>

      <WalletConnectModal open={connectOpen} onClose={() => setConnectOpen(false)} onConnect={handleConnect} />
      {previewStar && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPreviewStar(null)} />
          <div className="relative w-full max-w-4xl rounded-[2rem] overflow-hidden border border-white/10 bg-[#050814]/95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="text-lg font-semibold text-white">Yıldız Önizlemesi</div>
              <button onClick={() => setPreviewStar(null)} className="text-white/70 hover:text-white">✕</button>
            </div>
            <div className="p-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <div className="rounded-3xl bg-[#020614]/90 p-4 border border-white/5">
                  <div className="flex justify-center py-6">
                    <img src={previewStar.raw?.heroImage || previewStar.heroImage || "https://via.placeholder.com/300x300"} alt={previewStar.name} className="h-64 w-full max-w-sm rounded-3xl object-cover" />
                  </div>
                </div>
                <div className="rounded-3xl bg-[#020614]/90 p-6 border border-white/5">
                  <h2 className="text-3xl font-semibold text-white">{previewStar.name}</h2>
                  <p className="mt-2 text-sm text-slate-400">{previewStar.constellation} • {previewStar.spectralType || previewStar.spect}</p>
                  <div className="mt-6 grid gap-3">
                    <div className="rounded-2xl bg-[#04091d]/80 p-4">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Fiyat</div>
                      <div className="mt-2 text-xl font-semibold text-white">{previewStar.price ? `$${previewStar.price}` : "Not listed"}</div>
                    </div>
                    <div className="rounded-2xl bg-[#04091d]/80 p-4">
                      <div className="grid gap-2 text-xs text-slate-400">
                        <div><strong>Spektral Tip:</strong> {previewStar.spectralType || previewStar.spect || "N/A"}</div>
                        <div><strong>Parlaklık:</strong> {previewStar.magnitude || "N/A"}</div>
                        <div><strong>Uzaklık:</strong> {previewStar.distance}</div>
                        <div><strong>Owner:</strong> {previewStar.owner || previewStar.ownerName || "Unknown"}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button className="flex-1 rounded-full bg-sc-gold px-4 py-3 text-sm font-semibold text-black">List for Sale</button>
                      <button className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">View Story</button>
                    </div>
                    <div className="mt-4">
                      <MobileDeepLinkPanel star={previewStar} mode="vault" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
