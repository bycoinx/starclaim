import React from "react";
import { Search } from "lucide-react";

export default function CatalogSearch({
  searchQuery,
  setSearchQuery,
  popularSearches = [],
  onPopularSearchClick = () => {}
}) {
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sc-gold/60 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Yıldız, takımyıldızı veya katalog adı ile ara..."
          className="w-full bg-[#0a0f24]/80 border border-white/10 hover:border-sc-gold/30 focus:border-sc-gold/60 text-sm text-white placeholder-white/30 pl-11 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-1 focus:ring-sc-gold/40 shadow-inner"
        />
      </div>
      {popularSearches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Popüler:</span>
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => onPopularSearchClick(term)}
              className="px-2.5 py-0.5 rounded bg-[#0f1737] hover:bg-[#16214d] text-[10px] text-sc-gold/80 border border-white/5 hover:border-sc-gold/20 transition-all font-mono"
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
