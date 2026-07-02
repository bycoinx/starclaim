import React, { useState } from "react";
import { Filter, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

export default function FilterSidebar({
  filters,
  setFilters,
  constellations = [],
  spectralTypes = [],
  starTypes = [],
  isMobileOpen = false,
  onCloseMobile = () => {},
  totalCount = 0
}) {
  const [collapsedSections, setCollapsedSections] = useState({
    constellation: false,
    magnitude: false,
    distance: false,
    spectral: false,
    starType: false,
    ownership: false,
    stories: false
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleReset = () => {
    setFilters({
      constellation: "all",
      magnitudeMin: 0.0,
      magnitudeMax: 10.0,
      distanceMin: 0,
      distanceMax: 10000,
      spectralType: "all",
      starType: "all",
      ownership: "all", // "all", "available", "claimed", "legendary"
      hasStories: false,
      sortBy: "recommended"
    });
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const sidebarContent = (
    <div className="flex flex-col gap-6 p-5 bg-[#050814]/90 border border-white/5 rounded-2xl h-full overflow-y-auto custom-scrollbar">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2 text-white">
          <Filter className="w-4 h-4 text-sc-gold" />
          <span className="font-display font-medium text-sm tracking-wider uppercase">FİLTRELER</span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[11px] text-[#8fa0c4] hover:text-sc-gold transition-colors font-mono"
        >
          <RotateCcw className="w-3 h-3" />
          Temizle
        </button>
      </div>

      {/* 1. Takımyıldız */}
      <div className="border-b border-white/5 pb-4">
        <button
          onClick={() => toggleSection("constellation")}
          className="w-full flex items-center justify-between text-xs text-white uppercase tracking-wider font-mono font-bold py-1.5"
        >
          <span>✦ Takımyıldız</span>
          {collapsedSections.constellation ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        {!collapsedSections.constellation && (
          <div className="mt-2">
            <select
              value={filters.constellation}
              onChange={(e) => updateFilter("constellation", e.target.value)}
              className="w-full bg-[#0a0f24] border border-white/10 rounded-lg py-2 px-3 text-xs text-white/80 outline-none focus:border-sc-gold/60"
            >
              <option value="all">Tümü</option>
              {constellations.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Parlaklık (Magnitude) */}
      <div className="border-b border-white/5 pb-4">
        <button
          onClick={() => toggleSection("magnitude")}
          className="w-full flex items-center justify-between text-xs text-white uppercase tracking-wider font-mono font-bold py-1.5"
        >
          <span>✦ Parlaklık (Kadir)</span>
          {collapsedSections.magnitude ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        {!collapsedSections.magnitude && (
          <div className="mt-3 px-1 flex flex-col gap-2">
            <div className="flex justify-between text-[11px] text-[#8fa0c4] font-mono">
              <span>{filters.magnitudeMin.toFixed(1)}</span>
              <span>{filters.magnitudeMax.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="10.0"
              step="0.1"
              value={filters.magnitudeMax}
              onChange={(e) => updateFilter("magnitudeMax", parseFloat(e.target.value))}
              className="w-full accent-sc-gold cursor-pointer bg-white/10 h-1 rounded-lg"
            />
            <div className="text-[10px] text-white/40 text-right font-mono">
              En fazla: {filters.magnitudeMax} mag
            </div>
          </div>
        )}
      </div>

      {/* 3. Uzaklık (Işık Yılı) */}
      <div className="border-b border-white/5 pb-4">
        <button
          onClick={() => toggleSection("distance")}
          className="w-full flex items-center justify-between text-xs text-white uppercase tracking-wider font-mono font-bold py-1.5"
        >
          <span>✦ Uzaklık (Işık Yılı)</span>
          {collapsedSections.distance ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        {!collapsedSections.distance && (
          <div className="mt-3 px-1 flex flex-col gap-2">
            <div className="flex justify-between text-[11px] text-[#8fa0c4] font-mono">
              <span>{filters.distanceMin} ly</span>
              <span>{filters.distanceMax} ly</span>
            </div>
            <input
              type="range"
              min="0"
              max="10000"
              step="100"
              value={filters.distanceMax}
              onChange={(e) => updateFilter("distanceMax", parseInt(e.target.value))}
              className="w-full accent-sc-gold cursor-pointer bg-white/10 h-1 rounded-lg"
            />
            <div className="text-[10px] text-white/40 text-right font-mono">
              En fazla: {filters.distanceMax} ly
            </div>
          </div>
        )}
      </div>

      {/* 4. Spektral Tip */}
      <div className="border-b border-white/5 pb-4">
        <button
          onClick={() => toggleSection("spectral")}
          className="w-full flex items-center justify-between text-xs text-white uppercase tracking-wider font-mono font-bold py-1.5"
        >
          <span>✦ Spektral Tip</span>
          {collapsedSections.spectral ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        {!collapsedSections.spectral && (
          <div className="mt-2">
            <select
              value={filters.spectralType}
              onChange={(e) => updateFilter("spectralType", e.target.value)}
              className="w-full bg-[#0a0f24] border border-white/10 rounded-lg py-2 px-3 text-xs text-white/80 outline-none focus:border-sc-gold/60"
            >
              <option value="all">Tümü</option>
              {spectralTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 5. Yıldız Türü (Tiers) */}
      <div className="border-b border-white/5 pb-4">
        <button
          onClick={() => toggleSection("starType")}
          className="w-full flex items-center justify-between text-xs text-white uppercase tracking-wider font-mono font-bold py-1.5"
        >
          <span>✦ Yıldız Türü</span>
          {collapsedSections.starType ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        {!collapsedSections.starType && (
          <div className="mt-2 flex flex-col gap-1.5">
            {["all", "legendary", "zodiac", "supernova", "nova", "standard"].map((type) => (
              <button
                key={type}
                onClick={() => updateFilter("starType", type)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs capitalize transition-all font-mono ${
                  filters.starType === type
                    ? "bg-sc-gold/10 border border-sc-gold/30 text-sc-gold"
                    : "bg-[#0a0f24]/40 border border-transparent text-white/60 hover:text-white hover:bg-[#0a0f24]"
                }`}
              >
                {type === "all" ? "Tümü" : type}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6. Sahiplik Durumu */}
      <div className="border-b border-white/5 pb-4">
        <button
          onClick={() => toggleSection("ownership")}
          className="w-full flex items-center justify-between text-xs text-white uppercase tracking-wider font-mono font-bold py-1.5"
        >
          <span>✦ Sahiplik Durumu</span>
          {collapsedSections.ownership ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        {!collapsedSections.ownership && (
          <div className="mt-2 flex flex-col gap-2">
            {[
              { id: "all", label: "Tümü" },
              { id: "available", label: "Mevcut (Satın Alınabilir)" },
              { id: "claimed", label: "Sahiplenilen" }
            ].map((option) => (
              <label key={option.id} className="flex items-center gap-2.5 text-xs text-white/70 hover:text-white cursor-pointer select-none">
                <input
                  type="radio"
                  name="ownership"
                  checked={filters.ownership === option.id}
                  onChange={() => updateFilter("ownership", option.id)}
                  className="rounded bg-[#0a0f24] border-white/10 accent-sc-gold focus:ring-0 focus:ring-offset-0"
                />
                <span className="font-mono">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 7. Hikayesi Olanlar */}
      <div className="pb-2">
        <button
          onClick={() => toggleSection("stories")}
          className="w-full flex items-center justify-between text-xs text-white uppercase tracking-wider font-mono font-bold py-1.5"
        >
          <span>✦ Diğer Özellikler</span>
          {collapsedSections.stories ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        {!collapsedSections.stories && (
          <div className="mt-2">
            <label className="flex items-center gap-2.5 text-xs text-white/70 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.hasStories}
                onChange={(e) => updateFilter("hasStories", e.target.checked)}
                className="rounded bg-[#0a0f24] border-white/10 accent-sc-gold focus:ring-0 focus:ring-offset-0"
              />
              <span className="font-mono">Sadece Hikayesi Olanlar</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Left) */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-28 h-[calc(100vh-8.5rem)] self-start">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (Drawer Overlay) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-80 max-w-[85vw] bg-[#050814] h-full shadow-2xl animate-slide-in-left">
            {sidebarContent}
            <button
              onClick={onCloseMobile}
              className="absolute top-4 right-4 text-white/60 hover:text-white font-mono text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
