import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";
import StarCard from "../components/StarCard";
import SkySphere from "../components/SkySphere";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { Input } from "../components/ui/input";
import { Telescope, Loader2, Search, Orbit, LayoutGrid, Satellite, Radio, ShieldCheck } from "lucide-react";
import ErrorBoundary from "../components/ui/ErrorBoundary";

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
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("catalog");
  const [mapConnected, setMapConnected] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);

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
  };

  useEffect(() => {
    api.get("/stars/constellations")
      .then(({ data }) => setConstellations(Array.isArray(data) ? data : []))
      .catch(() => setConstellations([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = { tier, constellation, sort, min_price: priceMin, max_price: priceMax };
    if (onlyAvailable) query.available = true;
    api.get("/stars", { params: query })
      .then(({ data }) => setStars(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Fetch stars error:", err);
        setStars([]);
      })
      .finally(() => setLoading(false));
  }, [tier, constellation, sort, onlyAvailable, priceMin, priceMax]);

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

  const connectMap = () => {
    setActiveSection("sky");
    setMapLoading(true);
    window.setTimeout(() => {
      setMapConnected(true);
      setMapLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-sc-deep pt-28 pb-24 relative">
      <div className="absolute inset-0 nebula-bg opacity-60 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sc-gold/30 text-[10px] uppercase tracking-[0.3em] text-sc-gold mb-5">
            <Telescope className="w-3 h-3" /> StarClaim Catalog
          </div>
          <h1 className="font-display text-4xl md:text-5xl mb-3">{t("picker_title")}</h1>
          <p className="text-sc-text-muted">{t("picker_sub")}</p>
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
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-sc-text-muted">
              {lang === "TR" ? "Bu filtreyle yıldız bulunamadı." : "No stars match these filters."}
            </div>
          ) : activeSection === "sky" ? (
            mapConnected ? (
              <SkySphere stars={filtered} onClaim={onClaim} />
            ) : (
              <div className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-black min-h-[560px] flex items-center justify-center">
                <div className="absolute inset-0 nebula-bg opacity-50 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_55%)]" />
                <div className="relative max-w-2xl text-center px-6">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_50px_rgba(56,189,248,0.18)]">
                    {mapLoading ? <Loader2 className="h-8 w-8 animate-spin text-cyan-200" /> : <Satellite className="h-8 w-8 text-cyan-200" />}
                  </div>
                  <div className="mb-3 text-[10px] uppercase tracking-[0.42em] text-cyan-200">
                    {mapLoading ? "Aegis Link Initializing" : "NASA Deep Space HUD"}
                  </div>
                  <h2 className="font-display text-4xl md:text-5xl mb-4">
                    {lang === "TR" ? "Canlı uzay haritasına bağlan" : "Connect to the live star map"}
                  </h2>
                  <p className="text-sc-text-muted leading-relaxed mb-8">
                    {lang === "TR"
                      ? "3D harita ayrı yüklenir; katalog hızlı kalır, haritaya geçtiğinde Gözlemci ve Sistem bakışları tek motor içinde açılır."
                      : "The 3D map loads only when requested, keeping the catalog fast while Observatory and System views share one engine."}
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3 mb-8 text-left">
                    {[
                      [Radio, "RA/Dec", "J2000"],
                      [ShieldCheck, "Aegis", "HUD"],
                      [Orbit, "Dual View", "Observer/System"],
                    ].map(([Icon, title, body]) => (
                      <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <Icon className="w-4 h-4 text-cyan-200 mb-3" />
                        <div className="font-display text-sm text-white">{title}</div>
                        <div className="text-[10px] uppercase tracking-widest text-sc-text-muted">{body}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={connectMap}
                    disabled={mapLoading}
                    className="btn-gold min-w-[220px] justify-center disabled:opacity-60"
                    data-testid="connect-sky-map"
                  >
                    <span className="inline-flex items-center gap-2">
                      {mapLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {lang === "TR" ? "3D Haritaya Bağlan" : "Connect 3D Map"}
                    </span>
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="star-grid">
              {filtered.map((star) => (
                <StarCard key={star.star_id} star={star} onClaim={onClaim} />
              ))}
            </div>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}
