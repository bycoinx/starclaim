import React, { useEffect } from "react";
import {
  Award,
  BookOpen,
  ChevronRight,
  Clock,
  Globe2,
  Lock,
  Palette,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Telescope,
  Trophy,
  Users,
} from "lucide-react";
import StarAssetImage from "../components/catalog/StarAssetImage";
import { PageShell, SectionHeader, SurfacePanel, MetricCard, StatusBadge } from "../components/shell";
import VaultHero from "../components/vault/VaultHero";

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

function ActionCard({ action }) {
  const { Icon, title, description } = action;
  return (
    <button className="group flex h-full flex-col justify-between rounded-[1.75rem] border border-white/10 bg-[#050815]/75 p-6 text-left shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:border-sc-gold/30 hover:bg-white/5 hover:shadow-[0_25px_70px_rgba(212,175,55,0.18)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-sc-gold transition duration-300 group-hover:border-sc-gold/20 group-hover:bg-sc-gold/10">
        <Icon className="h-6 w-6" />
      </div>
      <div className="mt-6 space-y-2">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-sm leading-6 text-slate-400">{description}</p>
      </div>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-sc-gold/80 transition duration-300 group-hover:text-sc-gold">
        Open
        <ChevronRight className="h-4 w-4" />
      </span>
    </button>
  );
}

function StarVaultCard({ star }) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[#050712]/90 shadow-[0_28px_80px_rgba(0,0,0,0.25)] transition hover:-translate-y-1 hover:border-sc-gold/25 hover:shadow-[0_36px_120px_rgba(212,175,55,0.16)]">
      <div className="relative pb-[62%]">
        <StarAssetImage star={star} variant="hero" className="absolute inset-0 h-full w-full" />
        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          <StatusBadge tone="gold">{star.rarity}</StatusBadge>
          <StatusBadge tone="blue">{star.spectralType}</StatusBadge>
        </div>
      </div>
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-sc-gold/80">{star.constellation}</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{star.name}</h3>
          </div>
          <StatusBadge tone="emerald">Owned</StatusBadge>
        </div>

        <p className="text-sm leading-6 text-slate-400">A rare premium star, reserved for your most meaningful collection moments.</p>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.24em] text-white/50">Magnitude</p>
            <p className="mt-2 font-semibold text-white">{star.magnitude}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.24em] text-white/50">Distance</p>
            <p className="mt-2 font-semibold text-white">{star.distance}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.24em] text-white/50">Acquired</p>
            <p className="mt-2 font-semibold text-white">{star.acquired}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button className="rounded-full bg-sc-gold px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#d4aa2a]">View Details</button>
          <button className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:border-sc-gold/30">Show in Sky Map</button>
        </div>
      </div>
    </article>
  );
}

function VaultCertificateCard({ item }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#050712]/90 shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-0.5 hover:border-sc-gold/25 hover:shadow-[0_26px_70px_rgba(212,175,55,0.18)]">
      <div className="relative overflow-hidden rounded-t-[2rem] bg-gradient-to-br from-slate-950 via-[#090c18] to-[#111627] p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.18),transparent_35%)]" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-sc-gold/70">{item.type}</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">{item.star}</h3>
            </div>
            <StatusBadge tone="blue">{item.status}</StatusBadge>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
            Certificate preview placeholder with elegant emboss styling.
          </div>
        </div>
      </div>
      <div className="space-y-4 px-6 pb-6 pt-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">Certificate #</p>
            <p className="mt-2 text-sm font-semibold text-white">{item.id}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">Issued</p>
            <p className="mt-2 text-sm font-semibold text-white">{item.issued}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">Owner</p>
            <p className="mt-2 text-sm font-semibold text-white">{item.owner}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <button className="btn-ghost">Open</button>
          <button className="btn-ghost">Verify</button>
          <button className="btn-ghost">Download</button>
        </div>
      </div>
    </div>
  );
}

function StoryCard({ story }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#050712]/90 shadow-[0_18px_50px_rgba(0,0,0,0.16)] transition duration-300 hover:-translate-y-0.5 hover:border-sc-gold/25 hover:shadow-[0_24px_60px_rgba(212,175,55,0.18)]">
      <div className="relative overflow-hidden rounded-t-[2rem] bg-gradient-to-br from-indigo-950 via-[#080c19] to-[#111827] p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="relative z-10 grid gap-3">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-white/60">{story.category}</span>
            <span className="text-[10px] uppercase tracking-[0.26em] text-white/40">{story.reading}</span>
          </div>
          <h3 className="text-2xl font-semibold text-white">{story.title}</h3>
          <p className="text-sm leading-6 text-slate-400">{story.excerpt}</p>
        </div>
      </div>
      <div className="space-y-4 px-6 pb-6 pt-5">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span>{story.star}</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>{story.created}</span>
        </div>
        <button className="btn-gold">Open Story</button>
      </div>
    </article>
  );
}

function AchievementCard({ achievement }) {
  const { Icon, title, detail, status, tone } = achievement;
  const locked = status !== "Unlocked";
  return (
    <div className={`overflow-hidden rounded-[2rem] border border-white/10 bg-[#050712]/85 p-6 transition hover:-translate-y-0.5 hover:border-sc-gold/25 ${locked ? "opacity-80" : ""}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white/5 text-sc-gold">
          <Icon className="h-6 w-6" />
        </div>
        <StatusBadge tone={locked ? "red" : tone}>{status}</StatusBadge>
      </div>
      <div className="mt-6 space-y-3">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-sm leading-6 text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

function TimelineEvent({ event }) {
  const { Icon, title, date, description, star, status } = event;
  return (
    <div className="relative flex gap-5">
      <div className="flex flex-col items-center">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sc-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.25)]">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="mt-2 h-full w-px bg-white/10" />
      </div>
      <div className="flex-1 rounded-[2rem] border border-white/10 bg-[#050712]/90 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-400">{description}</p>
          </div>
          <span className="text-xs uppercase tracking-[0.22em] text-white/50">{status}</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span>{date}</span>
          <span className="h-1 w-1 rounded-full bg-white/10" />
          <span>{star}</span>
        </div>
      </div>
    </div>
  );
}

function SecurityCard({ item }) {
  return (
    <div className="glass rounded-[2rem] border border-white/10 bg-[#050712]/80 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.14)] transition duration-300 hover:-translate-y-0.5 hover:border-sc-gold/25 hover:shadow-[0_24px_60px_rgba(212,175,55,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
        </div>
        <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
      </div>
    </div>
  );
}

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

      <SurfacePanel className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div>
          <SectionHeader
            title="Universe Summary"
            description="A premium overview of your personal StarVault universe."
            action="Explore Full Vault"
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {universeSummary.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                caption={metric.caption}
                icon={metric.Icon}
                tone={metric.tone}
                className="min-h-[150px]"
              />
            ))}
          </div>
        </div>

        <div>
          <SectionHeader
            title="Quick Actions"
            description="Premium shortcuts to move through your StarVault experience."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {quickActions.map((action) => (
              <ActionCard key={action.title} action={action} />
            ))}
          </div>
        </div>
      </SurfacePanel>

      <SurfacePanel>
        <SectionHeader
          title="My Stars"
          description="The heart of StarVault: premium star cards that communicate ownership and rarity."
          action="Manage Collection"
        />
        <div className="grid gap-6 xl:grid-cols-2">
          {myStars.map((star) => (
            <StarVaultCard key={star.starId} star={star} />
          ))}
        </div>
      </SurfacePanel>

      <SurfacePanel>
        <SectionHeader
          title="Certificates"
          description="Premium certificates that feel like collectible artifacts."
          action="Open Gallery"
        />
        <div className="grid gap-6 xl:grid-cols-3">
          {certificates.map((item) => (
            <VaultCertificateCard key={item.id} item={item} />
          ))}
        </div>
      </SurfacePanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <SurfacePanel>
          <SectionHeader
            title="Stories"
            description="A premium story library for emotional star journeys."
            action="View Library"
          />
          <div className="grid gap-6">
            {stories.map((story) => (
              <StoryCard key={story.title} story={story} />
            ))}
          </div>
        </SurfacePanel>

        <SurfacePanel>
          <SectionHeader
            title="Achievements"
            description="Meaningful milestone cards that celebrate your StarVault progress."
            action="See Achievements"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.title} achievement={achievement} />
            ))}
          </div>
        </SurfacePanel>
      </div>

      <SurfacePanel>
        <SectionHeader
          title="Timeline"
          description="Your StarVault history rendered as an elegant vertical journey."
          action="Review Timeline"
        />
        <div className="space-y-5">
          {timelineEvents.map((event) => (
            <TimelineEvent key={event.title} event={event} />
          ))}
        </div>
      </SurfacePanel>

      <SurfacePanel>
        <SectionHeader
          title="Security Vault"
          description="A luxury archive of trust, recovery and private storage."
          action="View Security"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {securityItems.map((item) => (
            <SecurityCard key={item.title} item={item} />
          ))}
        </div>
      </SurfacePanel>

      <SurfacePanel variant="strong" className="overflow-hidden p-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#060a16]/90 p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(212,175,55,0.16),transparent_32%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_30%,rgba(102,126,234,0.14),transparent_34%)]" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.7fr_0.9fr] lg:items-center">
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
      </SurfacePanel>
    </PageShell>
  );
}
