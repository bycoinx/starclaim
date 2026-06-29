import React, { useCallback, useEffect, useState, useMemo } from "react";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";

// Architectural Layout & Component Suite
import CatalogLayout from "../components/catalog/CatalogLayout";
import CatalogHero from "../components/catalog/CatalogHero";
import CatalogToolbar from "../components/catalog/CatalogToolbar";
import CatalogGrid from "../components/catalog/CatalogGrid";
import FilterSidebar from "../components/catalog/FilterSidebar";
import DetailDrawer from "../components/catalog/DetailDrawer";
import CatalogPagination from "../components/catalog/CatalogPagination";
import { NoResultsState, ErrorState } from "../components/catalog/EmptyStates";

import { StarAssetManager } from "../lib/StarAssetManager";

const FALLBACK_STARS = [
  { star_id: "fallback-sirius", code: "SIRIUS-A", name: "Sirius", constellation: "Canis Major", tier: "legendary", price: 2999, spect: "A1V", distance: 8.6, magnitude: -1.46, claimed: false },
  { star_id: "fallback-vega", code: "VEGA-LYR", name: "Vega", constellation: "Lyra", tier: "legendary", price: 1499, spect: "A0V", distance: 25.0, magnitude: 0.03, claimed: false },
  { star_id: "fallback-rigel", code: "RIGEL-ORI", name: "Rigel", constellation: "Orion", tier: "supernova", price: 1299, spect: "B8Iab", distance: 860, magnitude: 0.18, claimed: true, owner_name: "Pilot One" },
  { star_id: "fallback-polaris", code: "POLARIS-UMI", name: "Polaris", constellation: "Ursa Minor", tier: "nova", price: 899, spect: "F7Ib", distance: 433.8, magnitude: 1.98, claimed: false },
  { star_id: "fallback-betelgeuse", code: "BETELGEUSE-ORI", name: "Betelgeuse", constellation: "Orion", tier: "legendary", price: 2499, spect: "M1-M2Ia-ab", distance: 642.5, magnitude: 0.5, claimed: true, owner_name: "StarSeeker" },
  { star_id: "fallback-procyon", code: "PROCYON-CMI", name: "Procyon", constellation: "Canis Major", tier: "supernova", price: 1199, spect: "F5IV-V", distance: 11.46, magnitude: 0.34, claimed: false },
  { star_id: "fallback-arcturus", code: "ARCTURUS-BOO", name: "Arcturus", constellation: "Bootes", tier: "legendary", price: 1999, spect: "K1.5IIIfe-0.5", distance: 36.7, magnitude: -0.05, claimed: false },
  { star_id: "fallback-aldebaran", code: "ALDEBARAN-TAU", name: "Aldebaran", constellation: "Taurus", tier: "supernova", price: 1099, spect: "K5III", distance: 65.3, magnitude: 0.85, claimed: false }
];

const normalizeStars = (data) => {
  if (!Array.isArray(data)) return [];
  return data.filter(Boolean).map((star, index) => {
    // Resolve registry attributes through StarAssetManager
    const asset = StarAssetManager.getStarAsset(star);
    return {
      star_id: asset.starId || `star-${index}`,
      code: asset.code || `SC-${index + 1}`,
      name: asset.name,
      constellation: asset.constellation,
      tier: asset.tier,
      price: asset.price,
      spectralType: asset.spectralType,
      distance: asset.distance,
      magnitude: asset.magnitude,
      claimed: asset.isClaimed,
      owner_name: asset.ownerName,
      ...star
    };
  });
};

const POPULAR_SEARCHES = ["Sirius", "Vega", "Betelgeuse", "Polaris", "Rigel", "Procyon"];

export default function StarPicker({ onClaim }) {
  const { lang } = useT();
  const isTR = lang === "TR";

  // Data Loading States
  const [stars, setStars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Advanced Filter Parameters
  const [filters, setFilters] = useState({
    constellation: "all",
    magnitudeMin: 0.0,
    magnitudeMax: 10.0,
    distanceMin: 0,
    distanceMax: 10000,
    spectralType: "all",
    starType: "all",
    ownership: "all",
    hasStories: false,
    sortBy: "recommended"
  });

  // Structural Navigation & Page Size Settings
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selectedStar, setSelectedStar] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Load Stars from API / Cache Fallbacks
  const loadStars = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/stars", { params: { limit: 500 } });
      const normalized = normalizeStars(response.data);
      
      if (normalized.length > 0) {
        setStars(normalized);
        // Preload preview assets in background
        StarAssetManager.preloadStarAssets(normalized, ["preview"]);
      } else {
        setStars(normalizeStars(FALLBACK_STARS));
      }
    } catch (err) {
      console.error("Star Catalog API failed. Using local dataset:", err);
      setStars(normalizeStars(FALLBACK_STARS));
      setError(
        isTR 
          ? "Yıldız kataloğu çevrimdışı yerel yedek modda yüklendi." 
          : "Star catalog loaded in offline fallback mode."
      );
    } finally {
      setLoading(false);
    }
  }, [isTR]);

  useEffect(() => {
    loadStars();
  }, [loadStars]);

  // Dynamically resolve filters from catalog cache
  const filterOptions = useMemo(() => {
    const constellationsSet = new Set();
    const spectralLettersSet = new Set();

    stars.forEach((s) => {
      if (s.constellation && s.constellation !== "Bilinmiyor") {
        constellationsSet.add(s.constellation);
      }
      if (s.spectralType) {
        const primaryLetter = s.spectralType.charAt(0).toUpperCase();
        if (["O", "B", "A", "F", "G", "K", "M"].includes(primaryLetter)) {
          spectralLettersSet.add(primaryLetter);
        }
      }
    });

    return {
      constellations: Array.from(constellationsSet).sort(),
      spectralTypes: Array.from(spectralLettersSet).sort()
    };
  }, [stars]);

  // Stats Dashboard aggregates
  const statsCounters = useMemo(() => {
    const totalCount = stars.length;
    const claimedCount = stars.filter(s => s.claimed).length;
    const legendCount = stars.filter(s => s.tier === "legendary").length;
    const storyCount = stars.filter(s => s.stories_count).length;

    return {
      total: totalCount > 0 ? `${totalCount}+` : "10.000+",
      claimed: claimedCount > 0 ? claimedCount.toString() : "548",
      available: totalCount > 0 ? (totalCount - claimedCount).toString() : "9.452",
      stories: storyCount > 0 ? storyCount.toString() : "124",
      legendary: legendCount > 0 ? legendCount.toString() : "27"
    };
  }, [stars]);

  // Client-side Query filters
  const filteredStars = useMemo(() => {
    return stars.filter((star) => {
      // Search Box Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = star.name?.toLowerCase().includes(query);
        const matchesCode = star.code?.toLowerCase().includes(query);
        const matchesConstellation = star.constellation?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesCode && !matchesConstellation) {
          return false;
        }
      }

      // Sidebar Filters
      if (filters.constellation !== "all" && star.constellation !== filters.constellation) return false;
      if (star.magnitude < filters.magnitudeMin || star.magnitude > filters.magnitudeMax) return false;
      if (star.distance < filters.distanceMin || star.distance > filters.distanceMax) return false;

      if (filters.spectralType !== "all") {
        const primaryLetter = star.spectralType?.charAt(0).toUpperCase();
        if (primaryLetter !== filters.spectralType) return false;
      }

      if (filters.starType !== "all" && star.tier?.toLowerCase() !== filters.starType) return false;
      if (filters.ownership === "available" && star.claimed) return false;
      if (filters.ownership === "claimed" && !star.claimed) return false;
      if (filters.hasStories && !star.stories_count) return false;

      return true;
    });
  }, [stars, searchQuery, filters]);

  // Sorting
  const sortedStars = useMemo(() => {
    const list = [...filteredStars];
    list.sort((a, b) => {
      switch (filters.sortBy) {
        case "brightest":
          return (a.magnitude || 0) - (b.magnitude || 0);
        case "nearest":
          return (a.distance || 0) - (b.distance || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "recommended":
        default:
          if (a.tier === "legendary" && b.tier !== "legendary") return -1;
          if (b.tier === "legendary" && a.tier !== "legendary") return 1;
          return (a.magnitude || 0) - (b.magnitude || 0);
      }
    });
    return list;
  }, [filteredStars, filters.sortBy]);

  // Pagination slicing
  const paginatedStars = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedStars.slice(startIndex, startIndex + pageSize);
  }, [sortedStars, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedStars.length / pageSize) || 1;

  // Event Handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handlePopularSearch = (term) => {
    setSearchQuery(term);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      constellation: "all",
      magnitudeMin: 0.0,
      magnitudeMax: 10.0,
      distanceMin: 0,
      distanceMax: 10000,
      spectralType: "all",
      starType: "all",
      ownership: "all",
      hasStories: false,
      sortBy: "recommended"
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Component Composition for Layout
  const heroComponent = (
    <CatalogHero
      searchQuery={searchQuery}
      setSearchQuery={(q) => { setSearchQuery(q); setCurrentPage(1); }}
      stats={statsCounters}
      popularSearches={POPULAR_SEARCHES}
      onPopularSearchClick={handlePopularSearch}
    />
  );

  const sidebarComponent = (
    <FilterSidebar
      filters={filters}
      setFilters={(f) => { setFilters(f); setCurrentPage(1); }}
      constellations={filterOptions.constellations}
      spectralTypes={filterOptions.spectralTypes}
      isMobileOpen={isMobileFilterOpen}
      onCloseMobile={() => setIsMobileFilterOpen(false)}
      totalCount={sortedStars.length}
    />
  );

  const toolbarComponent = (
    <CatalogToolbar
      activeFilter={filters.starType}
      onFilterChange={(type) => setFilters(prev => ({ ...prev, starType: type }))}
      sortBy={filters.sortBy}
      onSortChange={(sort) => setFilters(prev => ({ ...prev, sortBy: sort }))}
      totalCount={sortedStars.length}
      onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
      isTR={isTR}
    />
  );

  const gridComponent = (
    <CatalogGrid
      items={paginatedStars}
      loading={loading}
      onClaim={onClaim}
      onSelect={(star) => setSelectedStar(star)}
      emptyState={
        error && stars.length === 0 ? (
          <ErrorState message={error} onRetry={loadStars} />
        ) : (
          <NoResultsState onReset={handleResetFilters} />
        )
      }
    />
  );

  const paginationComponent = !loading && sortedStars.length > 0 ? (
    <CatalogPagination
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={pageSize}
      setPageSize={handlePageSizeChange}
      onPageChange={handlePageChange}
      totalItems={sortedStars.length}
    />
  ) : null;

  const drawerComponent = selectedStar ? (
    <DetailDrawer
      star={selectedStar}
      onClose={() => setSelectedStar(null)}
      onClaim={onClaim}
      onReadStory={(s) => alert(isTR ? `${s.name} hikayesi yakında!` : `${s.name} story soon!`)}
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
