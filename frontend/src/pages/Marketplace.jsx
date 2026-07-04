import React, { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";
import { TrendingUp, Shield, Loader2, Globe2, Star } from "lucide-react";
import { motion } from "framer-motion";
import { PageShell, SectionHeader, SurfacePanel, MetricCard } from "../components/shell";
import { CatalogProvider, useCatalogStore } from "../lib/CatalogStore";
import CatalogSearch from "../components/catalog/CatalogSearch";
import CatalogToolbar from "../components/catalog/CatalogToolbar";
import FilterSidebar from "../components/catalog/FilterSidebar";
import CatalogGrid from "../components/catalog/CatalogGrid";
import CatalogPagination from "../components/catalog/CatalogPagination";
import { NoResultsState, ErrorState } from "../components/catalog/EmptyStates";
import { StarRepository } from "../lib/StarRepository";
import ListingPreviewDrawer from "../components/catalog/ListingPreviewDrawer";

function MarketplaceCatalog() {
  const store = useCatalogStore();
  const { lang } = useT();
  const isTR = lang === "TR";
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const handleSelect = (star) => {
    if (!star?.starId) return;
    store.setSelectedStarId(star.starId);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
      <div>
        <FilterSidebar
          filters={store.filters}
          setFilters={store.updateFilters}
          constellations={store.filterOptions.constellations}
          spectralTypes={store.filterOptions.spectralTypes}
          starTypes={["all", "legendary", "zodiac", "supernova", "nova", "standard"]}
          isMobileOpen={isMobileFilterOpen}
          onCloseMobile={() => setIsMobileFilterOpen(false)}
          totalCount={store.filteredStars.length}
        />
      </div>

      <div className="min-w-0 space-y-6">
        <SurfacePanel className="p-4">
          <CatalogSearch
            searchQuery={store.searchQuery}
            setSearchQuery={store.setSearchQuery}
            popularSearches={["Sirius", "Vega", "Betelgeuse", "Polaris", "Rigel", "Procyon"]}
            onPopularSearchClick={store.setSearchQuery}
          />
        </SurfacePanel>

        <CatalogToolbar
          activeFilter={store.filters.starType}
          onFilterChange={(type) => store.updateFilters({ starType: type })}
          sortBy={store.sortBy}
          onSortChange={store.setSortBy}
          totalCount={store.filteredStars.length}
          onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
          isTR={isTR}
        />

        <SurfacePanel variant="subtle" className="p-4">
          {store.loading ? (
            <div className="py-40 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-sc-gold opacity-20" />
              <div className="text-[9px] tracking-[0.4em] text-sc-gold uppercase mt-8 font-black">
                {isTR ? "Katalog senkronize ediliyor..." : "Syncing catalog..."}
              </div>
            </div>
          ) : (
            <CatalogGrid
              items={store.paginatedStars}
              loading={store.loading}
              onSelect={handleSelect}
              onClaim={store.onClaim}
              emptyState={
                store.error && store.stars.length === 0 ? (
                  <ErrorState message={store.error} onRetry={store.loadCatalog} />
                ) : (
                  <NoResultsState onReset={store.resetFilters} />
                )
              }
            />
          )}
        </SurfacePanel>

        {!store.loading && store.filteredStars.length > 0 && (
          <CatalogPagination
            currentPage={store.currentPage}
            totalPages={store.totalPages}
            pageSize={store.pageSize}
            setPageSize={store.setPageSize}
            onPageChange={store.setCurrentPage}
            totalItems={store.filteredStars.length}
          />
        )}
      </div>
    </div>
  );
}

export default function Marketplace({ onClaim }) {
  const { lang } = useT();
  const [metrics, setMetrics] = useState({ vol: 0, cap: 0, avg: 0 });
  const isTR = lang === "TR";

  const loadMarketplaceListings = useCallback(async (forceReload = false) => {
    await StarRepository.loadAll(forceReload);
    const { data: listings } = await api.get("/marketplace/listings");
    return listings.map((listing) => {
      const star = StarRepository.getStarById(listing.star_id) || StarRepository.getStarBySlug(listing.star_code) || {};
      return {
        ...star,
        ...listing,
        starId: star.starId || listing.star_id || listing.star_code,
        name: star.name || listing.star_name,
        code: star.code || listing.star_code,
        constellation: star.constellation || listing.constellation,
        tier: star.tier || listing.tier || "standard",
        price: star.price || listing.asking_price || 0,
        isClaimed: true,
        ownerName: listing.owner_name || star.ownerName,
        forSale: true,
        askingPrice: listing.asking_price ?? listing.askingPrice ?? star.askingPrice,
        storyCount: star.storyCount || 0,
        raw: { ...listing, ...star },
      };
    });
  }, []);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const { data: mRes } = await api.get("/marketplace/metrics");
        setMetrics({
          vol: mRes?.volume_24h || 0,
          cap: mRes?.market_cap || 0,
          avg: mRes?.avg_price || 0
        });
      } catch (err) {
        console.warn("Market metrics load error", err);
      }
    };

    loadMetrics();
  }, []);

  return (
    <CatalogProvider onClaim={onClaim || (() => {})} starLoader={loadMarketplaceListings}>
      <PageShell>
        <SectionHeader
          title={isTR ? "Marketplace" : "Marketplace"}
          description={isTR ? "Yıldız alım-satım piyasasını premium bir tezgahla keşfedin." : "Explore star trading with a premium marketplace experience."}
          action={isTR ? "Yıldız Keşfet" : "Browse Listings"}
        />

        <SurfacePanel className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr] mb-8">
          <div>
            <SectionHeader
              title={isTR ? "Pazar Verileri" : "Market Metrics"}
              description={isTR ? "24 saatlik likidite, toplam değer ve ortalama fiyat akışı." : "24h liquidity, total market cap, and average star pricing."}
              action={isTR ? "Tüm Grafikleri Gör" : "View Charts"}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                label={isTR ? "Volume 24s" : "Volume 24h"}
                value={`$${metrics.vol.toLocaleString()}`}
                caption={isTR ? "Son gün içinde gerçekleşen işlem hacmi." : "Trading volume in the last 24 hours."}
                icon={TrendingUp}
                tone="gold"
              />
              <MetricCard
                label={isTR ? "Pazar Değeri" : "Market Cap"}
                value={`$${(metrics.cap / 1000000).toFixed(1)}M`}
                caption={isTR ? "Ekosistem içindeki toplam değer." : "Total value across the marketplace."}
                icon={Globe2}
                tone="blue"
              />
              <MetricCard
                label={isTR ? "Ortalama Fiyat" : "Avg. Price"}
                value={`$${metrics.avg.toFixed(2)}`}
                caption={isTR ? "Her yıldız için dinamik önem bazlı fiyat." : "Dynamic star pricing from importance feed."}
                icon={Star}
                tone="emerald"
              />
            </div>
          </div>

          <div>
            <SectionHeader
              title={isTR ? "Piyasa Durumu" : "Market Pulse"}
              description={isTR ? "Pazarın nabzını premium terminal ekranıyla takip edin." : "Track the pulse of the market with a premium terminal view."}
              action={isTR ? "Detayları İncele" : "Inspect"}
            />
            <div className="grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-[#050614]/80 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
                <div className="flex items-center gap-3 text-sm text-white/80 mb-4">
                  <TrendingUp className="h-4 w-4 text-sc-gold" />
                  <span>{isTR ? "Nadir listede Sirius X-1" : "Rare listing: Sirius X-1"}</span>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">{isTR ? "Ağ Durumu" : "Network Status"}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{isTR ? "Stabil" : "Stable"}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-[#050614]/80 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
                <div className="flex items-center gap-3 text-sm text-white/80 mb-4">
                  <Shield className="h-4 w-4 text-sc-blue" />
                  <span>{isTR ? "Aegis Destek: Çevrimiçi" : "Aegis Support: Online"}</span>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">{isTR ? "Güvenlik" : "Security"}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{isTR ? "Korunuyor" : "Protected"}</p>
                </div>
              </div>
            </div>
          </div>
        </SurfacePanel>

        <div className="relative mb-8 rounded-[2rem] border border-white/10 bg-[#050814]/90 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.24)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.16),transparent_35%)] rounded-[2rem]" />
          <div className="relative z-10 grid gap-4 md:grid-cols-[1.5fr_0.8fr] items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-sc-gold/70">{isTR ? "Öne Çıkan" : "Featured"}</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">{isTR ? "Pazarın en seçkin yıldızlarına göz atın." : "Discover the most coveted stars on the marketplace."}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">{isTR ? "Vault koleksiyonunuz ile bağlantılı, premium alım-satım deneyimini yaşayın." : "Stay connected to your Vault collection with a premium trading experience."}</p>
            </div>
            <button className="btn-gold w-full md:w-auto">{isTR ? "Pazara Git" : "Open Marketplace"}</button>
          </div>
        </div>

        <MarketplaceCatalog />

        <ListingPreviewDrawer />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-24 pt-12 border-t border-white/5 text-center opacity-30">
          <div className="text-[8px] font-mono text-slate-400 max-w-3xl mx-auto uppercase tracking-widest leading-loose">
            {isTR ? "Fiyatlama protokolleri kullanıcı tarafından belirlenir — her işlem Aegis Akıllı Kontratları tarafından doğrulanır." : "Pricing protocols are user-defined — every transaction is verified by Aegis Smart Contracts."}
          </div>
        </motion.div>
      </PageShell>
    </CatalogProvider>
  );
}
