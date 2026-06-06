import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";
import StarCard from "../components/StarCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { Input } from "../components/ui/input";
import { Telescope, Loader2, Search, Orbit, LayoutGrid, Satellite, Radio, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";
import ErrorBoundary from "../components/ui/ErrorBoundary";

const SkySphere = React.lazy(() => import("../components/SkySphere"));
const GalaxyScene = React.lazy(() => import("../components/GalaxyScene/GalaxyScene"));

const TIERS = ["all", "legendary", "zodiac", "named", "constellation", "standard"];
const SORTS = [
  { v: "price_desc", label_tr: "Fiyat azalan", label_en: "Price high to low" },
  { v: "price_asc", label_tr: "Fiyat artan", label_en: "Price low to high" },
  { v: "name", label_tr: "Isim", label_en: "Name" },
  { v: "tier", label_tr: "Kademe", label_en: "Tier" },
];

export default function StarPicker({ onClaim }) {
  const { t, lang } = useT();
  const [params, setParams] = useSearchParams();
  const [stars, setStars] = useState([]);
  const [constellations, setConstellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("catalog");
  const [mapReady, setMapReady] = useState(false);
  const [checkoutBanner, setCheckoutBanner] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const LIMIT = 48; // 3 columns * 16 rows

  const tier = params.get("tier") || "all";
  const constellation = params.get("constellation") || "all";
  const sort = params.get("sort") || "price_desc";
  const onlyAvailable = params.get("available") === "1";
  const priceMin = Number(params.get("min") || 0);
  const priceMax = Number(params.get("max") || 3000);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === null || value === "" || value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
    // Reset pagination when filters change
    setOffset(0);
    setStars([]);
    setFetchError("");
  };

  useEffect(() => {
    api.get("/stars/constellations")
      .then(({ data }) => setConstellations(Array.isArray(data) ? data : []))
      .catch(() => setConstellations([]));
  }, []);

  useEffect(() => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    const query = { tier, constellation, sort, min_price: priceMin, max_price: priceMax, limit: LIMIT, offset };
    if (onlyAvailable) query.available = true;
    setFetchError("");
    
    api.get("/stars", { params: query })
      .then(({ data }) => {
        const newStars = Array.isArray(data) ? data : [];
        if (offset === 0) {
          setStars(newStars);
        } else {
          setStars(prev => [...prev, ...newStars]);
        }
        setHasMore(newStars.length === LIMIT);
      })
      .catch((err) => {
        console.error("Fetch stars error:", err);
        if (offset === 0) setStars([]);
        setHasMore(false);
        setFetchError(
          lang === "TR"
            ? "Yıldız kataloğu sunucusuna ulaşılamadı. Lütfen bağlantıyı tekrar deneyin."
            : "The star catalog server could not be reached. Please retry the connection."
        );
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [tier, constellation, sort, onlyAvailable, priceMin, priceMax, offset, lang]);

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      setOffset(prev => prev + LIMIT);
    }
  };

  const retryCatalog = () => {
    setFetchError("");
    setStars([]);
    setHasMore(true);
    if (offset === 0) {
      setOffset(-1);
      window.setTimeout(() => setOffset(0), 0);
    } else {
      setOffset(0);
    }
  };

  const handleClaim = (star) => {
    if (!star) return;
    const name = star.name || star.proper || star.code || `#${star.id}`;
    setCheckoutBanner(
      lang === "TR"
        ? `"${name}" için ödeme ekranı açılıyor...`
        : `Opening checkout for "${name}"...`
    );
    setTimeout(() => setCheckoutBanner(null), 4200);
    if (typeof onClaim === "function") onClaim(star);
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(stars)) return [];
    if (!search.trim()) return stars;
    const needle = search.toLowerCase();
    return stars.filter((star) =>
      (star.name || "").toLowerCase().includes(needle) ||
      (star.code || "").toLowerCase().includes(needle) ||
      (star.constellation || "").toLowerCase().includes(needle)
    );
  }, [stars, search]);


  return (
    <div className="min-h-screen bg-transparent pt-28 pb-24 relative">
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sc-gold/30 text-[10px] uppercase tracking-[0.3em] text-sc-gold mb-5">
            <Telescope className="w-3 h-3" /> StarClaim Catalog
          </div>
          <h1 className="font-display text-4xl md:text-5xl mb-3">{t("picker_title")}</h1>
          <p className="text-sc-text-muted">{t("picker_sub")}</p>
          {checkoutBanner && (
            <div className="mt-6 inline-flex items-center justify-center rounded-2xl border border-sc-gold/20 bg-sc-gold/10 px-4 py-3 text-sm text-sc-gold max-w-2xl mx-auto">
              {checkoutBanner}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6 mb-8" data-testid="filter-bar">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex rounded-full border border-white/10 bg-sc-mid/40 p-1 w-fit">
              <button
                type="button"
                onClick={() => setActiveSection("catalog")}
                className={`px-4 py-2 rounded-full text-xs transition-colors ${activeSection === "catalog" ? "bg-sc-gold text-sc-deep" : "text-sc-text-muted hover:text-sc-text"}`}
                data-testid="view-grid"
              >
                <span className="inline-flex items-center gap-1.5"><LayoutGrid className="w-3.5 h-3.5" /> {lang === "TR" ? "Yıldız Kataloğu" : "Star Catalog"}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("sky")}
                className={`px-4 py-2 rounded-full text-xs transition-colors ${activeSection === "sky" ? "bg-sc-gold text-sc-deep" : "text-sc-text-muted hover:text-sc-text"}`}
                data-testid="view-sky"
              >
                <span className="inline-flex items-center gap-1.5"><Orbit className="w-3.5 h-3.5" /> {lang === "TR" ? "3D Harita" : "3D Map"}</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-sc-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder={lang === "TR" ? "Yıldız ara..." : "Search star..."}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                data-testid="search-input"
                className="pl-8 bg-sc-mid/50 border-white/10 text-sc-text md:w-72"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-sc-text-muted mb-2">{t("picker_tier")}</div>
              <Select value={tier} onValueChange={(value) => setParam("tier", value)}>
                <SelectTrigger data-testid="filter-tier" className="bg-sc-mid/50 border-white/10 text-sc-text"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-sc-mid border-white/10 text-sc-text">
                  {TIERS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item === "all" ? (lang === "TR" ? "Hepsi" : "All") : t(`tier_${item}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest text-sc-text-muted mb-2">{t("picker_constellation")}</div>
              <Select value={constellation} onValueChange={(value) => setParam("constellation", value)}>
                <SelectTrigger data-testid="filter-constellation" className="bg-sc-mid/50 border-white/10 text-sc-text"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-sc-mid border-white/10 text-sc-text max-h-72">
                  <SelectItem value="all">{lang === "TR" ? "Hepsi" : "All"}</SelectItem>
                  {constellations.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest text-sc-text-muted mb-2">{t("picker_sort")}</div>
              <Select value={sort} onValueChange={(value) => setParam("sort", value)}>
                <SelectTrigger data-testid="filter-sort" className="bg-sc-mid/50 border-white/10 text-sc-text"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-sc-mid border-white/10 text-sc-text">
                  {SORTS.map((item) => (
                    <SelectItem key={item.v} value={item.v}>{lang === "TR" ? item.label_tr : item.label_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <div className="text-[10px] uppercase tracking-widest text-sc-text-muted mb-2">
                {t("picker_price")}: ${priceMin} - ${priceMax}
              </div>
              <Slider
                value={[priceMin, priceMax]}
                max={3000}
                step={10}
                onValueChange={([low, high]) => { setParam("min", low); setParam("max", high); }}
                data-testid="filter-price"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Switch checked={onlyAvailable} onCheckedChange={(value) => setParam("available", value ? "1" : null)} data-testid="filter-available" />
            <span className="text-xs text-sc-text-muted">{t("picker_only_available")}</span>
          </div>
        </div>

        <ErrorBoundary fallback={<div className="text-center py-20 text-sc-red">Bir yükleme hatası oluştu. Lütfen sayfayı yenileyin.</div>}>
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-sc-gold" />
              <div className="text-center">
                <p className="text-sc-gold text-sm animate-pulse mb-1">
                  {lang === "TR" ? "YILDIZLAR YÜKLENİYOR..." : "LOADING STARS..."}
                </p>
                <p className="text-sc-text-muted text-[10px] max-w-xs uppercase tracking-widest">
                  {lang === "TR" ? "Sunucu uykudan uyandırılıyor, ilk yükleme 30 saniye sürebilir." : "Waking up server, initial load may take up to 30 seconds."}
                </p>
              </div>
            </div>
          ) : fetchError ? (
            <div className="terminal-frame border-sc-red/30 p-10 text-center max-w-2xl mx-auto">
              <div className="terminal-scanline" />
              <AlertTriangle className="w-10 h-10 text-sc-red mx-auto mb-5" />
              <h2 className="font-display text-3xl mb-3">
                {lang === "TR" ? "Katalog Bağlantısı Kurulamadı" : "Catalog Connection Failed"}
              </h2>
              <p className="text-sc-text-muted mb-7 font-mono text-xs">{fetchError}</p>
              <button type="button" onClick={retryCatalog} className="btn-gold justify-center text-[10px] font-bold uppercase tracking-widest px-8">
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  {lang === "TR" ? "TEKRAR_DENE" : "RETRY_PROTOCOL"}
                </span>
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-sc-text-muted">
              {lang === "TR" ? "Bu filtreyle yıldız bulunamadı." : "No stars match these filters."}
            </div>
          ) : activeSection === "sky" ? (
            mapReady ? (
              <div style={{ height: '80vh', width: '100%' }}>
                <Suspense fallback={
                  <div className="py-20 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-sc-gold" />
                  </div>
                }>
                  <ErrorBoundary fallback={<div className="text-center py-20 text-sc-red">3D harita yüklenemedi.</div>}>
                    <GalaxyScene ownedStars={[]} onStarClick={handleClaim} />
                  </ErrorBoundary>
                </Suspense>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center gap-5 text-center text-sc-text-muted">
                <div className="max-w-2xl">
                  <p className="font-display text-2xl mb-3 text-white">{lang === "TR" ? "3D Harita Yükle" : "Load 3D Map"}</p>
                  <p className="text-sm leading-6 text-sc-text-muted">
                    {lang === "TR"
                      ? "Uzay simülasyonunu başlatmak için aşağıdaki düğmeye basın. Bu deneyim sadece isteğe bağlı olarak yüklenir."
                      : "Start the space simulation by loading the 3D map. This experience loads only on demand."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMapReady(true)}
                  className="btn-gold justify-center text-[10px] font-bold uppercase tracking-widest px-8"
                >
                  {lang === "TR" ? "HARİTAYI BAŞLAT" : "LAUNCH MAP"}
                </button>
              </div>
            )
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="star-grid">
                {filtered.map((star) => (
                  <StarCard key={star.star_id} star={star} onClaim={handleClaim} />
                ))}
              </div>
              
              {hasMore && (
                <div className="mt-12 flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="group relative px-8 py-3 rounded-full border border-sc-gold/30 bg-sc-gold/5 text-sc-gold hover:bg-sc-gold hover:text-sc-deep transition-all duration-300 disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center gap-2 font-display text-sm tracking-widest uppercase">
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {lang === "TR" ? "YÜKLENİYOR..." : "LOADING..."}
                        </>
                      ) : (
                        <>
                          {lang === "TR" ? "DAHA FAZLA YÜKLE" : "LOAD MORE"}
                        </>
                      )}
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}
