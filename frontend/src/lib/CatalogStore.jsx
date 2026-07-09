import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { StarRepository } from "./StarRepository";
import { StarRegistry } from "./StarRegistry";
import { useT } from "./i18n";

const CatalogContext = createContext(null);

export function CatalogProvider({ children, onClaim, starLoader }) {
  const { lang } = useT();
  const isTR = lang === "TR";

  // Raw states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stars, setStars] = useState([]);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    constellation: "all",
    magnitudeMin: 0.0,
    magnitudeMax: 10.0,
    distanceMin: 0,
    distanceMax: 10000,
    spectralType: "all",
    starType: "all",
    ownership: "all",
    hasStories: false
  });
  
  const [sortBy, setSortBy] = useState("recommended");
  
  // Navigation / View States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [serverTotalCount, setServerTotalCount] = useState(null);
  const [serverConstellations, setServerConstellations] = useState([]);
  const [selectedStarId, setSelectedStarId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [observerCoords, setObserverCoords] = useState({ ra: 279.2347, dec: 38.7837 });
  const [debouncedObserverCoords, setDebouncedObserverCoords] = useState(observerCoords);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedObserverCoords(observerCoords);
    }, 300);

    return () => clearTimeout(timeout);
  }, [observerCoords]);

  // Favorites persistence
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("starclaim_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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
  }, []);

  const loadCatalog = useCallback(async (forceReload = false) => {
    setLoading(true);
    setError("");
    try {
      if (starLoader) {
        const list = await starLoader(forceReload);
        setStars(list);
        setServerTotalCount(null);
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
        if (Number.isFinite(count)) {
          const list = await StarRepository.loadPage(pageQuery);
          setStars(list);
          setServerTotalCount(count);
        } else {
          const list = await StarRepository.loadAll(true);
          setStars(list);
          setServerTotalCount(null);
        }
      }
    } catch (err) {
      setError(
        isTR 
          ? "Katalog verileri yüklenirken hata oluştu." 
          : "Failed to load catalog data from repository."
      );
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, currentPage, pageSize, searchQuery, starLoader, isTR, debouncedObserverCoords]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!starLoader) {
      loadConstellations();
    }
  }, [loadConstellations, starLoader]);

  // Action methods
  const toggleFavorite = useCallback((starId) => {
    setFavorites((prev) => 
      prev.includes(starId) ? prev.filter((id) => id !== starId) : [...prev, starId]
    );
  }, []);

  const isFavorite = useCallback((starId) => {
    return favorites.includes(starId);
  }, [favorites]);

  const updateObserverCoords = useCallback((coords) => {
    setObserverCoords((prev) => ({ ...prev, ...coords }));
    setCurrentPage(1);
  }, []);

  const updateFilters = useCallback((updater) => {
    setFilters((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      return next;
    });
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      constellation: "all",
      magnitudeMin: 0.0,
      magnitudeMax: 10.0,
      distanceMin: 0,
      distanceMax: 10000,
      spectralType: "all",
      starType: "all",
      ownership: "all",
      hasStories: false
    });
    setSearchQuery("");
    setSortBy("recommended");
    setCurrentPage(1);
  }, []);

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
    
    // Filter State
    searchQuery,
    setSearchQuery: (q) => { setSearchQuery(q); setCurrentPage(1); },
    filters,
    updateFilters,
    resetFilters,
    sortBy,
    setSortBy: (s) => { setSortBy(s); setCurrentPage(1); },
    
    // View/Page States
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize: (s) => { setPageSize(s); setCurrentPage(1); },
    selectedStarId,
    setSelectedStarId,
    viewMode,
    setViewMode,
    observerCoords,
    setObserverCoords,
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
