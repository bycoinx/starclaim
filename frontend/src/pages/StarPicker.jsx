import React, { useState } from "react";
import { useT } from "../lib/i18n";

// Infrastructure & Store
import { CatalogProvider, useCatalogStore } from "../lib/CatalogStore";

// Decoupled Presentation Layer Components
import CatalogLayout from "../components/catalog/CatalogLayout";
import CatalogHero from "../components/catalog/CatalogHero";
import CatalogToolbar from "../components/catalog/CatalogToolbar";
import CatalogGrid from "../components/catalog/CatalogGrid";
import FilterSidebar from "../components/catalog/FilterSidebar";
import DetailDrawer from "../components/catalog/DetailDrawer";
import CatalogPagination from "../components/catalog/CatalogPagination";
import { NoResultsState, ErrorState } from "../components/catalog/EmptyStates";

const POPULAR_SEARCHES = ["Sirius", "Vega", "Betelgeuse", "Polaris", "Rigel", "Procyon"];

// Presentational Page Orchestrator (Sub-wrapper consuming Context)
function CatalogPageOrchestrator() {
  const store = useCatalogStore();
  const { lang } = useT();
  const isTR = lang === "TR";

  // Purely visual drawer state for mobile view
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const heroComponent = (
    <CatalogHero
      searchQuery={store.searchQuery}
      setSearchQuery={store.setSearchQuery}
      stats={store.stats}
      popularSearches={POPULAR_SEARCHES}
      onPopularSearchClick={store.setSearchQuery}
    />
  );

  const sidebarComponent = (
    <FilterSidebar
      filters={store.filters}
      setFilters={store.updateFilters}
      constellations={store.filterOptions.constellations}
      spectralTypes={store.filterOptions.spectralTypes}
      isMobileOpen={isMobileFilterOpen}
      onCloseMobile={() => setIsMobileFilterOpen(false)}
      totalCount={store.filteredStars.length}
    />
  );

  const toolbarComponent = (
    <CatalogToolbar
      activeFilter={store.filters.starType}
      onFilterChange={(type) => store.updateFilters({ starType: type })}
      sortBy={store.sortBy}
      onSortChange={store.setSortBy}
      totalCount={store.filteredStars.length}
      onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
      isTR={isTR}
    />
  );

  const gridComponent = (
    <CatalogGrid
      items={store.paginatedStars}
      loading={store.loading}
      onClaim={store.onClaim}
      onSelect={(star) => store.setSelectedStarId(star.starId)}
      emptyState={
        store.error && store.stars.length === 0 ? (
          <ErrorState message={store.error} onRetry={store.loadCatalog} />
        ) : (
          <NoResultsState onReset={store.resetFilters} />
        )
      }
    />
  );

  const paginationComponent = !store.loading && store.filteredStars.length > 0 ? (
    <CatalogPagination
      currentPage={store.currentPage}
      totalPages={store.totalPages}
      pageSize={store.pageSize}
      setPageSize={store.setPageSize}
      onPageChange={store.setCurrentPage}
      totalItems={store.filteredStars.length}
    />
  ) : null;

  const drawerComponent = store.selectedStarId ? (
    <DetailDrawer
      selectedStarId={store.selectedStarId}
      onClose={() => store.setSelectedStarId(null)}
    />
  ) : null;

  return (
    <CatalogLayout
      hero={heroComponent}
      sidebar={sidebarComponent}
      toolbar={toolbarComponent}
      grid={gridComponent}
      pagination={paginationComponent}
      drawer={drawerComponent}
    />
  );
}

// Main Page Component exporting Provider wrapper
export default function StarPicker({ onClaim }) {
  return (
    <CatalogProvider onClaim={onClaim}>
      <CatalogPageOrchestrator />
    </CatalogProvider>
  );
}
