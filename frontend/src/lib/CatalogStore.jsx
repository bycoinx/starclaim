import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { StarRepository } from "./StarRepository";
import { StarRegistry } from "./StarRegistry";
import { useT } from "./i18n";
import { useCelestialStore } from "../stores/celestialStore";
import { webDiagnostics } from "../engine/diagnostics/webDiagnostics";
import { buildCatalogCollections } from "./catalogCollections";

const CatalogContext = createContext(null);

export function CatalogProvider({ children, onClaim, starLoader, catalogSource = "commercial" }) {
  const { lang } = useT();
  const isTR = lang === "TR";

  const store = useCelestialStore(useShallow((state) => ({
    catalog: state.catalog,
    view: state.view,
    selection: state.selection,
    favorites: state.favorites,
    setCatalogField: state.setCatalogField,
    setSearchQueryState: state.setSearchQuery,
    updateFiltersState: state.updateFilters,
    resetFiltersState: state.resetFilters,
    setSortByState: state.setSortBy,
    setCurrentPage: state.setCurrentPage,
    setPageSizeState: state.setPageSize,
    setSelectedStarId: state.setSelectedStarId,
    selectStar: state.selectStar,
    setCatalogViewMode: state.setCatalogViewMode,
    updateObserverCoordsState: state.updateObserverCoords,
    setFavorites: state.setFavorites,
  })));
  const {
    loading,
    error,
    stars,
    searchQuery,
    filters,
    sortBy,
    currentPage,
    pageSize,
    serverTotalCount,
    serverConstellations,
  } = store.catalog;
  const { catalogMode: viewMode, observerCoords } = store.view;
  const { starId: selectedStarId } = store.selection;
  const { favorites } = store;
  const setCatalogField = store.setCatalogField;
  const setLoading = useCallback((value) => setCatalogField("loading", value), [setCatalogField]);
  const setError = useCallback((value) => setCatalogField("error", value), [setCatalogField]);
  const setStars = useCallback((value) => setCatalogField("stars", value), [setCatalogField]);
  const setServerTotalCount = useCallback(
    (value) => setCatalogField("serverTotalCount", value),
    [setCatalogField]
  );
  const setServerConstellations = useCallback(
    (value) => setCatalogField("serverConstellations", value),
    [setCatalogField]
  );
  const [debouncedObserverCoords, setDebouncedObserverCoords] = useState(observerCoords);
  const loadRequestRef = useRef(0);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedObserverCoords(observerCoords);
    }, 300);

    return () => clearTimeout(timeout);
  }, [observerCoords]);

  // Persist favorites to local storage
  useEffect(() => {
    try {
      localStorage.setItem("starclaim_favorites", JSON.stringify(favorites));
    } catch (e) {
      console.warn("CatalogStore: Failed to save favorites to localStorage", e);
    }
  }, [favorites]);

  // Load Stars Repository cache
  const buildServerQuery = (filters, sortBy, currentPage, pageSize, searchQuery) => {
    const query = {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    };

    if (filters.starType && filters.starType !== "all") {
      query.tier = filters.starType;
    }

    if (filters.constellation && filters.constellation !== "all") {
      query.constellation = filters.constellation;
    }

    if (filters.ownership === "available") {
      query.available = true;
    } else if (filters.ownership === "claimed") {
      query.available = false;
    }

    if (filters.spectralType && filters.spectralType !== "all") {
      query.spectral_type = filters.spectralType;
    }

    if (filters.magnitudeMin !== undefined) {
      query.magnitude_min = filters.magnitudeMin;
    }
    if (filters.magnitudeMax !== undefined) {
      query.magnitude_max = filters.magnitudeMax;
    }

    if (filters.distanceMin !== undefined) {
      query.distance_min = filters.distanceMin;
    }
    if (filters.distanceMax !== undefined) {
      query.distance_max = filters.distanceMax;
    }

    if (filters.hasStories) {
      query.has_stories = true;
    }

    if (searchQuery) {
      query.search = searchQuery;
    }

    switch (sortBy) {
      case "price-high":
        query.sort = "price_desc";
        break;
      case "price-low":
        query.sort = "price_asc";
        break;
      case "name":
        query.sort = "name";
        break;
      case "nearest":
        query.sort = "nearest";
        break;
      case "recommended":
        query.sort = "tier";
        break;
      default:
        break;
    }

    return query;
  };

  const loadConstellations = useCallback(async () => {
    try {
      const options = await StarRegistry.fetchConstellations();
      if (Array.isArray(options)) {
        setServerConstellations(options);
      }
    } catch {
      // fallback if constellation endpoint not available
    }
  }, [setServerConstellations]);

  const loadCatalog = useCallback(async (forceReload = false) => {
    const requestId = ++loadRequestRef.current;
    const isCurrentRequest = () => requestId === loadRequestRef.current;
    setLoading(true);
    setError("");
    webDiagnostics.recordCatalog({ stage: "fetching" }, starLoader ? "custom-catalog" : "commercial-catalog");
    try {
      if (starLoader) {
        const list = await starLoader(forceReload);
        if (!isCurrentRequest()) return;
        setStars(list);
        setServerTotalCount(null);
        webDiagnostics.recordCatalog({ stage: "ready", count: list.length }, "custom-catalog");
      } else if (catalogSource === "curated") {
        const list = await StarRepository.loadCuratedPilot(forceReload);
        if (!isCurrentRequest()) return;
        setStars(list);
        setServerTotalCount(null);
        setServerConstellations(Array.from(new Set(list.map((star) => star.constellation).filter(Boolean))).sort());
        webDiagnostics.recordCatalog({ stage: "ready", count: list.length }, "curated-pilot");
      } else {
        const query = buildServerQuery(filters, sortBy, currentPage, pageSize, searchQuery);
        const pageQuery = { ...query };
        if (sortBy === "nearest" && debouncedObserverCoords?.ra != null && debouncedObserverCoords?.dec != null) {
          pageQuery.viewer_ra = debouncedObserverCoords.ra;
          pageQuery.viewer_dec = debouncedObserverCoords.dec;
        }
        const countQuery = { ...query };
        if (sortBy === "nearest" && debouncedObserverCoords?.ra != null && debouncedObserverCoords?.dec != null) {
          countQuery.viewer_ra = debouncedObserverCoords.ra;
          countQuery.viewer_dec = debouncedObserverCoords.dec;
        }
        delete countQuery.limit;
        delete countQuery.offset;
        delete countQuery.sort;
        const count = await StarRegistry.countStars(countQuery);
        if (!isCurrentRequest()) return;
        if (Number.isFinite(count)) {
          const list = await StarRepository.loadPage(pageQuery);
          if (!isCurrentRequest()) return;
          setStars(list);
          setServerTotalCount(count);
          webDiagnostics.recordCatalog({ stage: "ready", count }, "commercial-catalog");
        } else {
          const list = await StarRepository.loadAll(true);
          if (!isCurrentRequest()) return;
          setStars(list);
          setServerTotalCount(null);
          webDiagnostics.recordCatalog({ stage: "ready", count: list.length }, "commercial-catalog");
        }
      }
    } catch (err) {
      if (!isCurrentRequest()) return;
      webDiagnostics.recordCatalog({ stage: "error", error: err }, starLoader ? "custom-catalog" : "commercial-catalog");
      setError(
        isTR 
          ? "Katalog verileri yüklenirken hata oluştu." 
          : "Failed to load catalog data from repository."
      );
    } finally {
      if (isCurrentRequest()) setLoading(false);
    }
  }, [
    filters,
    sortBy,
    currentPage,
    pageSize,
    searchQuery,
    starLoader,
    catalogSource,
    isTR,
    debouncedObserverCoords,
    setError,
    setLoading,
    setServerTotalCount,
    setStars,
  ]);

  useEffect(() => {
    loadCatalog();
    return () => {
      loadRequestRef.current += 1;
    };
  }, [loadCatalog]);

  useEffect(() => {
    if (!starLoader && catalogSource === "commercial") {
      loadConstellations();
    }
  }, [catalogSource, loadConstellations, starLoader]);

  // Action methods
  const toggleFavorite = useCallback((starId) => {
    store.setFavorites((prev) =>
      prev.includes(starId) ? prev.filter((id) => id !== starId) : [...prev, starId]
    );
  }, [store]);

  const isFavorite = useCallback((starId) => {
    return favorites.includes(starId);
  }, [favorites]);

  const updateObserverCoords = useCallback((coords) => {
    store.updateObserverCoordsState(coords);
  }, [store]);

  const updateFilters = useCallback((updater) => {
    store.updateFiltersState(updater);
  }, [store]);

  const resetFilters = useCallback(() => {
    store.resetFiltersState();
  }, [store]);

  // Memoized query selections
  const filteredStars = useMemo(() => {
    if (serverTotalCount !== null) {
      return stars;
    }

    return stars.filter((star) => {
      // 1. Search Query Match
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = star.name?.toLowerCase().includes(query);
        const matchesCode = star.code?.toLowerCase().includes(query);
        const matchesConstellation = star.constellation?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesCode && !matchesConstellation) {
          return false;
        }
      }

      // 2. Constellation Match
      if (filters.constellation !== "all" && star.constellation !== filters.constellation) {
        return false;
      }

      // 3. Magnitude Match
      if (star.magnitude < filters.magnitudeMin || star.magnitude > filters.magnitudeMax) {
        return false;
      }

      // 4. Distance Match
      if (star.distance < filters.distanceMin || star.distance > filters.distanceMax) {
        return false;
      }

      // 5. Spectral Type Match
      if (filters.spectralType !== "all") {
        const primaryLetter = star.spectralType?.charAt(0).toUpperCase();
        if (primaryLetter !== filters.spectralType) {
          return false;
        }
      }

      // 6. Star Type (Tier) Match
      if (filters.starType !== "all" && star.tier?.toLowerCase() !== filters.starType) {
        return false;
      }

      // 7. Ownership Match
      if (filters.ownership === "available" && star.isClaimed) return false;
      if (filters.ownership === "claimed" && !star.isClaimed) return false;

      // 8. Story Match
      if (filters.hasStories && !star.storyCount) return false;

      return true;
    });
  }, [stars, searchQuery, filters, serverTotalCount]);

  // Sorting
  const sortedStars = useMemo(() => {
    if (serverTotalCount !== null) {
      return filteredStars;
    }

    const list = [...filteredStars];
    
    list.sort((a, b) => {
      switch (sortBy) {
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
  }, [filteredStars, sortBy, serverTotalCount]);

  // Pagination
  const paginatedStars = useMemo(() => {
    if (serverTotalCount !== null) {
      return sortedStars;
    }
    const startIndex = (currentPage - 1) * pageSize;
    return sortedStars.slice(startIndex, startIndex + pageSize);
  }, [sortedStars, currentPage, pageSize, serverTotalCount]);

  const totalPages = useMemo(() => {
    const totalCount = serverTotalCount !== null ? serverTotalCount : sortedStars.length;
    return Math.max(1, Math.ceil(totalCount / pageSize));
  }, [sortedStars, pageSize, serverTotalCount]);

  // Dynamic filter options aggregated from current dataset
  const filterOptions = useMemo(() => {
    const constellationsSet = new Set(serverConstellations);
    const spectralLettersSet = new Set();

    stars.forEach((s) => {
      if (s.spectralType) {
        const primaryLetter = s.spectralType.charAt(0).toUpperCase();
        if (["O", "B", "A", "F", "G", "K", "M"].includes(primaryLetter)) {
          spectralLettersSet.add(primaryLetter);
        }
      }
    });

    return {
      constellations: constellationsSet.size > 0 ? Array.from(constellationsSet).sort() : [],
      spectralTypes: Array.from(spectralLettersSet).sort()
    };
  }, [stars, serverConstellations]);

  // Aggregated catalog totals
  const statsCounters = useMemo(() => {
    const totalCount = serverTotalCount !== null ? serverTotalCount : stars.length;
    const claimedCount = stars.filter(s => s.isClaimed).length;
    const legendCount = stars.filter(s => s.tier === "legendary").length;
    const storyCount = stars.filter(s => s.storyCount).length;

    return {
      total: totalCount > 0 ? `${totalCount}` : "10.000+",
      claimed: claimedCount > 0 ? claimedCount.toString() : "548",
      available: totalCount > 0 ? (totalCount - claimedCount).toString() : "9.452",
      stories: storyCount > 0 ? storyCount.toString() : "124",
      legendary: legendCount > 0 ? legendCount.toString() : "27"
    };
  }, [stars, serverTotalCount]);

  const collections = useMemo(() => buildCatalogCollections(stars), [stars]);

  const contextValue = {
    // Cache
    stars,
    loading,
    error,
    
    // Derived States
    filteredStars,
    paginatedStars,
    totalPages,
    totalCount: serverTotalCount !== null ? serverTotalCount : filteredStars.length,
    stats: statsCounters,
    filterOptions,
    collections,
    catalogSource,
    
    // Filter State
    searchQuery,
    setSearchQuery: store.setSearchQueryState,
    filters,
    updateFilters,
    resetFilters,
    sortBy,
    setSortBy: store.setSortByState,
    
    // View/Page States
    currentPage,
    setCurrentPage: store.setCurrentPage,
    pageSize,
    setPageSize: store.setPageSizeState,
    selectedStarId,
    selectedStar: store.selection.star,
    setSelectedStarId: store.setSelectedStarId,
    selectStar: store.selectStar,
    viewMode,
    setViewMode: store.setCatalogViewMode,
    observerCoords,
    setObserverCoords: store.updateObserverCoordsState,
    updateObserverCoords,
    
    // Actions & Operations
    favorites,
    toggleFavorite,
    isFavorite,
    loadCatalog,
    onClaim
  };

  return (
    <CatalogContext.Provider value={contextValue}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalogStore() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalogStore must be used within a CatalogProvider");
  }
  return context;
}
