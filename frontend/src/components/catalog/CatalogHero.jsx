import React from "react";
import { Telescope } from "lucide-react";
import CatalogStats from "./CatalogStats";
import CatalogSearch from "./CatalogSearch";

export default function CatalogHero({ 
  searchQuery, 
  setSearchQuery, 
  stats = {}, 
  popularSearches = [], 
  onPopularSearchClick 
}) {
  return (
    <div className="relative overflow-hidden border-b border-white/5 bg-[#03040a] py-12 px-6 md:px-10">
      {/* Living Cosmic Background */}
      <div className="absolute inset-0 nebula-bg opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent pointer-events-none" />
      
      {/* Slow floating particle background effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-[20%] w-1.5 h-1.5 bg-white rounded-full animate-ping duration-1000" />
        <div className="absolute top-40 right-[15%] w-1 h-1 bg-sc-gold rounded-full animate-pulse" />
        <div className="absolute bottom-10 left-[45%] w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
      </div>

      <div className="relative max-w-7xl mx-auto z-10 flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Header text */}
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-3 font-bold font-mono">
              <Telescope size={12} className="animate-pulse" />
              STARCLAIMX // CATALOG_ENGINE
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight text-white">
              Yıldızını <span className="gold-gradient-text">Seç</span>
            </h1>
            <p className="text-sm font-sans text-[#a9b6d6] mt-3 leading-relaxed max-w-xl">
              Evrenin 10.000 yıldızı arasından kendine en anlamlı olanı seç, sahiplen ve hikayeni başlat.
            </p>
          </div>

          {/* Search container - Decoupled Component */}
          <div className="w-full lg:max-w-md">
            <CatalogSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              popularSearches={popularSearches}
              onPopularSearchClick={onPopularSearchClick}
            />
          </div>
        </div>

        {/* Catalog Counters Grid - Decoupled Component */}
        <CatalogStats stats={stats} />
      </div>
    </div>
  );
}
