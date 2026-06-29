import React from "react";
import { ListFilter } from "lucide-react";
import QuickFilters from "./QuickFilters";
import SortBar from "./SortBar";

export default function CatalogToolbar({
  activeFilter = "all",
  onFilterChange = () => {},
  sortBy = "recommended",
  onSortChange = () => {},
  totalCount = 0,
  onOpenMobileFilters = () => {},
  isTR = true
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5 w-full">
      {/* Quick filters ribbon */}
      <div className="flex items-center gap-3">
        <QuickFilters
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          isTR={isTR}
        />
      </div>

      {/* Right controls: Total count, Sorting, Mobile toggle */}
      <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
        <div className="text-[11px] text-[#8fa0c4]/70 font-mono select-none">
          <span className="text-white font-bold">{totalCount}</span> {isTR ? "yıldız listeleniyor" : "stars listed"}
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile filters button */}
          <button
            onClick={onOpenMobileFilters}
            className="lg:hidden flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-white/10 text-[10px] font-mono font-bold uppercase tracking-widest text-white bg-[#0a0f24]"
          >
            <ListFilter className="w-3.5 h-3.5 text-sc-gold" />
            Filtreler
          </button>

          <SortBar
            sortBy={sortBy}
            onSortChange={onSortChange}
            isTR={isTR}
          />
        </div>
      </div>
    </div>
  );
}
