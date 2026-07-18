import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Gem,
  LockKeyhole,
  Orbit,
  ShieldCheck,
  Sparkles,
  Star,
  Telescope,
  Zap,
} from "lucide-react";
import { useT } from "../lib/i18n";
import { CatalogProvider, useCatalogStore } from "../lib/CatalogStore";
import {
  ContentGrid,
  MetricCard,
  PageShell,
  PageToolbar,
  SectionHeader,
  StatusBadge,
  SurfacePanel,
} from "../components/shell";
import CatalogSearch from "../components/catalog/CatalogSearch";
import CatalogToolbar from "../components/catalog/CatalogToolbar";
import CatalogGrid from "../components/catalog/CatalogGrid";
import FilterSidebar from "../components/catalog/FilterSidebar";
import CatalogPagination from "../components/catalog/CatalogPagination";
import StarAssetImage from "../components/catalog/StarAssetImage";
import ActionBar from "../components/catalog/ActionBar";
import MobileDeepLinkPanel from "../components/catalog/MobileDeepLinkPanel";
import { NoResultsState, ErrorState } from "../components/catalog/EmptyStates";
import {
  formatDistance,
  formatMagnitude,
  formatPrice,
  formatSpectralType,
  formatTemperature,
} from "../lib/formatters";
import { getFeaturedStars, getNearbyStars, getTierMeta } from "../lib/catalogSelection";

const POPULAR_SEARCHES = ["Sirius", "Vega", "Betelgeuse", "Polaris", "Rigel", "Procyon"];

const HERO_ACTION_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] transition";

function PrimaryAction({ children, icon: Icon }) {
  return (
    <button
      type="button"
      className={`${HERO_ACTION_CLASS} border-sc-gold/40 bg-sc-gold text-black shadow-[0_0_32px_rgba(212,175,55,0.18)] hover:bg-[#f0cf69]`}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function SecondaryAction({ children, icon: Icon, to, testId }) {
  const Component = to ? Link : "button";
  return (
    <Component
      {...(to ? { to } : { type: "button" })}
      data-testid={testId}
      className={`${HERO_ACTION_CLASS} border-sc-blue/30 bg-[#071021]/70 text-white hover:border-sc-blue/60 hover:bg-sc-blue/10`}
    >
      {Icon ? <Icon className="h-4 w-4 text-sc-blue" /> : null}
      {children}
    </Component>
  );
}

function StarsHero({ store }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#050814]/90 shadow-[0_0_80px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 nebula-bg opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(77,124,255,0.2),transparent_28%),radial-gradient(circle_at_78%_8%,rgba(122,92,255,0.18),transparent_34%),linear-gradient(90deg,rgba(2,4,10,0.92),rgba(2,4,10,0.42),rgba(2,4,10,0.85))]" />
      <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border border-sc-blue/25 bg-sc-blue/10 blur-sm" />
      <div className="absolute right-8 top-8 hidden h-44 w-72 rounded-full border border-purple-400/20 bg-purple-500/10 blur-2xl lg:block" />

      <div className="relative z-10 grid gap-8 px-6 py-10 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-12">
        <div className="flex flex-col justify-center">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.36em] text-sc-gold">
            <Telescope className="h-3.5 w-3.5" />
            Star Atlas // Claim Console
          </div>
          <h1 className="font-serif text-5xl leading-[0.92] text-white md:text-7xl">
            Yildizini <span className="text-sc-gold">Sec</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            10.000 yildizlik atlas icinden kendi izini sec. Bilimsel konum, sahiplik kaydi,
            sertifika ve hikaye akisi tek bir premium katalog deneyiminde birlesir.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryAction icon={Star}>Yildizlari Kesfet</PrimaryAction>
            <SecondaryAction icon={ShieldCheck}>Sertifika Sistemini Gor</SecondaryAction>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard icon={Sparkles} label="Toplam Yildiz" value={store.stats.total} caption="Atlas havuzu" tone="gold" />
          <MetricCard icon={Award} label="Sahiplenilen" value={store.stats.claimed} caption="Kayitli iz" tone="purple" />
          <MetricCard icon={Gem} label="Kullanilabilir" value={store.stats.available} caption="Secilebilir" tone="blue" />
          <MetricCard icon={BookOpen} label="Hikayeler" value={store.stats.stories} caption="Yazilmis ani" tone="emerald" />
        </div>
      </div>
    </section>
  );
}

function FeaturedStars({ stars, onSelect, isTR = true }) {
  const featured = useMemo(() => getFeaturedStars(stars, 6), [stars]);
  if (!featured.length) return null;

  return (
    <SurfacePanel variant="strong" className="p-5">
      <SectionHeader title={isTR ? "Öne Çıkan Yıldızlar" : "Featured Stars"} action={isTR ? "Atlas Akışını Gör" : "View Atlas Flow"} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {featured.map((star) => {
          const tierMeta = getTierMeta(star.tier, isTR);
          return (
            <button
              type="button"
              key={star.starId || star.code}
              onClick={() => onSelect(star)}
              className="group rounded-2xl border border-white/10 bg-[#050814]/70 p-3 text-left transition hover:-translate-y-1 hover:border-sc-gold/40 hover:bg-[#0b1026]/85"
            >
              <StarAssetImage star={star} variant="preview" className="h-36" />
              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-lg text-white group-hover:text-sc-gold">{star.name}</div>
                  <div className="mt-1 text-[11px] text-[#8fa0c4]">{star.constellation}</div>
                </div>
                <StatusBadge tone={star.isClaimed ? "blue" : "emerald"}>
                  {star.isClaimed ? (isTR ? "Kayitli" : "Claimed") : (isTR ? "Mevcut" : "Available")}
                </StatusBadge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${tierMeta.accent}`}>
                  {tierMeta.label}
                </span>
                <span className="text-[11px] text-[#8fa0c4]">{formatMagnitude(star.magnitude)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </SurfacePanel>
  );
}

function NearbyStars({ stars, onSelect, isTR = true }) {
  const nearby = useMemo(() => getNearbyStars(stars, 3), [stars]);
  if (!nearby.length) return null;

  return (
    <SurfacePanel variant="subtle" className="p-5">
      <SectionHeader title={isTR ? "Yakın Yıldızlar" : "Nearby Stars"} action={isTR ? "Konuma Göre" : "By Position"} />
      <div className="grid gap-4 md:grid-cols-3">
        {nearby.map((star) => {
          const tierMeta = getTierMeta(star.tier, isTR);
          return (
            <button
              type="button"
              key={star.starId || star.code}
              onClick={() => onSelect(star)}
              className="rounded-2xl border border-white/10 bg-[#050814]/70 p-3 text-left transition hover:border-sc-blue/40 hover:bg-[#0b1026]/85"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-display text-lg text-white">{star.name}</div>
                  <div className="mt-1 text-[11px] text-[#8fa0c4]">{star.constellation}</div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${tierMeta.accent}`}>
                  {tierMeta.label}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-[#8fa0c4]">
                <span>{formatDistance(star.distance, true)}</span>
                <span>{formatPrice(star.price)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </SurfacePanel>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.05] py-2 text-xs">
      <span className="text-[#8fa0c4]">{label}</span>
      <span className="text-right font-mono text-white/85">{value || "N/A"}</span>
    </div>
  );
}

function SelectedStarPanel({ star }) {
  if (!star) {
    return (
      <SurfacePanel variant="strong" className="lg:sticky lg:top-28">
        <SectionHeader title="Secili Yildiz" action={null} />
        <div className="flex min-h-64 flex-col items-center justify-center text-center text-sm text-[#8fa0c4]">
          <Star className="mb-3 h-8 w-8 text-sc-gold/60" />
          Katalogdan bir yildiz secerek detay panelini ac.
        </div>
      </SurfacePanel>
    );
  }

  return (
    <SurfacePanel variant="strong" className="lg:sticky lg:top-28">
      <SectionHeader title="Secili Yildiz" action="Detay" />
      <StarAssetImage star={star} variant="hero" className="h-56" />
      <div className="mt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-white">{star.name}</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-sc-gold">{star.constellation}</p>
          </div>
          <StatusBadge tone={star.isClaimed ? "blue" : "emerald"}>
            {star.isClaimed ? "Sahipli" : "Mevcut"}
          </StatusBadge>
        </div>

        <div className="mt-5 space-y-1">
          <DataRow label="Parlaklik" value={formatMagnitude(star.magnitude)} />
          <DataRow label="Mesafe" value={formatDistance(star.distance, true)} />
          <DataRow label="Spektral Tip" value={formatSpectralType(star.spectralType)} />
          <DataRow label="Bedel" value={formatPrice(star.price)} />
        </div>

        <div className="mt-5 rounded-2xl border border-sc-gold/15 bg-sc-gold/[0.04] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sc-gold">Sahiplik Kaydi</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {star.isClaimed
              ? `${star.ownerName || "Pilot"} tarafindan sahiplenildi.`
              : "Bu yildiz su anda StarClaim kaydi icin uygun gorunuyor."}
          </p>
        </div>

        <div className="mt-5">
          <ActionBar starId={star.starId} layout="drawer" />
        </div>

        <div className="mt-5">
          <MobileDeepLinkPanel star={star} />
        </div>
      </div>
    </SurfacePanel>
  );
}

function ScientificSection({ star }) {
  if (!star) return null;

  const tempEstimate = star.temperature || (star.spectralType?.startsWith("B") ? 12000 : 6200);
  const metrics = [
    { label: "RA", value: star.ra || "Registry pending", icon: Orbit, tone: "blue" },
    { label: "DEC", value: star.dec || "Registry pending", icon: Orbit, tone: "purple" },
    { label: "Magnitude", value: formatMagnitude(star.magnitude), icon: Sparkles, tone: "gold" },
    { label: "Distance", value: formatDistance(star.distance, true), icon: Telescope, tone: "blue" },
    { label: "Temperature", value: formatTemperature(tempEstimate), icon: Zap, tone: "amber" },
    { label: "Luminosity", value: star.luminosity || "Catalog sync", icon: Star, tone: "emerald" },
    { label: "Spectral", value: star.spectralType || "N/A", icon: Gem, tone: "purple" },
    { label: "Constellation", value: star.constellation || "N/A", icon: Award, tone: "gold" },
  ];

  return (
    <SurfacePanel>
      <SectionHeader title="Bilimsel Profil" action={null} />
      <ContentGrid columns="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} caption="Star identity field" />
        ))}
      </ContentGrid>
    </SurfacePanel>
  );
}

function OwnershipAndStory({ star }) {
  if (!star) return null;

  return (
    <ContentGrid columns="dashboard">
      <SurfacePanel>
        <SectionHeader title="Sahiplik ve Sertifika" action="Protokol" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#050814]/70 p-4">
            <LockKeyhole className="mb-3 h-5 w-5 text-sc-gold" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Durum</p>
            <p className="mt-2 text-lg font-semibold text-white">{star.isClaimed ? "Kayitli" : "Sahiplenilebilir"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#050814]/70 p-4">
            <ShieldCheck className="mb-3 h-5 w-5 text-sc-blue" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Sertifika</p>
            <p className="mt-2 text-lg font-semibold text-white">SC_SECURE</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#050814]/70 p-4">
            <BookOpen className="mb-3 h-5 w-5 text-purple-300" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Hikaye</p>
            <p className="mt-2 text-lg font-semibold text-white">{star.storyCount || 0} kayit</p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-400">
          Blockchain, transfer ve sertifika aksiyonlari burada kontrollu olarak yer alacak. Simdilik
          katalog deneyiminin gorsel mimarisi hazir tutuluyor.
        </p>
      </SurfacePanel>

      <SurfacePanel>
        <SectionHeader title="Hikaye Onizlemesi" action="Hikayeye Git" />
        <div className="rounded-2xl border border-purple-400/15 bg-purple-400/[0.04] p-5">
          <p className="font-display text-2xl text-white">{star.name} icin ilk iz</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Bu alan ileride sahibinin anisina, sertifikaya ve StarVault zaman kapsulune baglanacak.
            Katalogdan hikayeye gecis ayni StarIdentity uzerinden kalacak.
          </p>
        </div>
      </SurfacePanel>
    </ContentGrid>
  );
}

function RelatedStars({ stars, selectedStar, onSelect }) {
  const related = useMemo(() => {
    if (!selectedStar) return stars.slice(0, 3);
    const sameConstellation = stars.filter(
      (star) => star.starId !== selectedStar.starId && star.constellation === selectedStar.constellation
    );
    const sameSpectral = stars.filter(
      (star) => star.starId !== selectedStar.starId && star.spectralType?.[0] === selectedStar.spectralType?.[0]
    );
    return [...sameConstellation, ...sameSpectral].slice(0, 3);
  }, [stars, selectedStar]);

  if (!related.length) return null;

  return (
    <SurfacePanel>
      <SectionHeader title="Iliskili Yildizlar" action="Daha Fazla" />
      <div className="grid gap-4 md:grid-cols-3">
        {related.map((star) => (
          <button
            type="button"
            key={star.starId || star.code}
            onClick={() => onSelect(star)}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#050814]/70 p-3 text-left transition hover:border-sc-gold/30 hover:bg-[#0b1026]"
          >
            <div className="h-20 w-20 shrink-0">
              <StarAssetImage star={star} variant="preview" showDecorations={false} />
            </div>
            <div>
              <p className="font-display text-lg text-white">{star.name}</p>
              <p className="mt-1 text-xs text-[#8fa0c4]">{star.constellation}</p>
              <p className="mt-2 text-[11px] text-sc-gold">{formatMagnitude(star.magnitude)}</p>
            </div>
          </button>
        ))}
      </div>
    </SurfacePanel>
  );
}

function CatalogPageOrchestrator() {
  const store = useCatalogStore();
  const { lang } = useT();
  const isTR = lang === "TR";
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const selectedStar =
    store.selectedStar ||
    store.stars.find((star) => star.starId === store.selectedStarId) ||
    store.paginatedStars[0] ||
    store.filteredStars[0] ||
    null;

  const handleSelect = (star) => {
    if (!star?.starId) return;
    store.selectStar(star);
  };

  const sidebarComponent = (
    <FilterSidebar
      filters={store.filters}
      setFilters={store.updateFilters}
      constellations={store.filterOptions.constellations}
      spectralTypes={store.filterOptions.spectralTypes}
      isMobileOpen={isMobileFilterOpen}
      onCloseMobile={() => setIsMobileFilterOpen(false)}
      totalCount={store.totalCount}
    />
  );

  const gridComponent = (
    <CatalogGrid
      items={store.paginatedStars}
      loading={store.loading}
      onClaim={store.onClaim}
      onSelect={handleSelect}
      emptyState={
        store.error && store.stars.length === 0 ? (
          <ErrorState message={store.error} onRetry={store.loadCatalog} />
        ) : (
          <NoResultsState onReset={store.resetFilters} />
        )
      }
    />
  );

  return (
    <PageShell maxWidth="max-w-[1540px]" contentClassName="gap-6">
      <StarsHero store={store} />

      <PageToolbar className="p-4">
        <CatalogSearch
          searchQuery={store.searchQuery}
          setSearchQuery={store.setSearchQuery}
          popularSearches={POPULAR_SEARCHES}
          onPopularSearchClick={store.setSearchQuery}
        />
        <div className="flex justify-end">
          <SecondaryAction icon={ArrowRight} to="/cosmos" testId="open-cosmos">
            Harita Gorunumu
          </SecondaryAction>
        </div>
      </PageToolbar>

      <FeaturedStars stars={store.sortedStars || store.filteredStars} onSelect={handleSelect} isTR={isTR} />
      <NearbyStars stars={store.sortedStars || store.filteredStars} onSelect={handleSelect} isTR={isTR} />

      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)_24rem]">
        <div>{sidebarComponent}</div>

        <div className="min-w-0 space-y-6">
          <CatalogToolbar
            activeFilter={store.filters.starType}
            onFilterChange={(type) => store.updateFilters({ starType: type })}
            sortBy={store.sortBy}
            onSortChange={store.setSortBy}
            totalCount={store.totalCount}
            onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
            observerCoords={store.observerCoords}
            onObserverCoordsChange={store.updateObserverCoords}
            isTR={isTR}
          />
          <SurfacePanel variant="subtle" className="p-4">
            <SectionHeader title="Ana Katalog" action={null} />
            {gridComponent}
          </SurfacePanel>
          {!store.loading && store.totalCount > 0 ? (
            <CatalogPagination
              currentPage={store.currentPage}
              totalPages={store.totalPages}
              pageSize={store.pageSize}
              setPageSize={store.setPageSize}
              onPageChange={store.setCurrentPage}
              totalItems={store.totalCount}
            />
          ) : null}
        </div>

        <SelectedStarPanel star={selectedStar} />
      </div>

      <ScientificSection star={selectedStar} />
      <OwnershipAndStory star={selectedStar} />
      <RelatedStars stars={store.filteredStars} selectedStar={selectedStar} onSelect={handleSelect} />
    </PageShell>
  );
}

export default function StarPicker({ onClaim }) {
  return (
    <CatalogProvider onClaim={onClaim}>
      <CatalogPageOrchestrator />
    </CatalogProvider>
  );
}
