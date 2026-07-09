import React, { useState } from "react";
import { ListFilter } from "lucide-react";
import QuickFilters from "./QuickFilters";
import SortBar from "./SortBar";

const OBSERVER_PRESETS = [
  { key: "vega", label: "Vega (Hipparcos)", ra: 279.2347, dec: 38.7837, source: "Hipparcos" },
  { key: "polaris", label: "Polaris (Hipparcos)", ra: 37.9546, dec: 89.2641, source: "Hipparcos" },
  { key: "m42", label: "Orion Nebula (NASA)", ra: 83.821, dec: -5.3911, source: "NASA" },
];

export default function CatalogToolbar({
  activeFilter = "all",
  onFilterChange = () => {},
  sortBy = "recommended",
  onSortChange = () => {},
  totalCount = 0,
  onOpenMobileFilters = () => {},
  observerCoords = null,
  onObserverCoordsChange = () => {},
  isTR = true
}) {
  const [selectedPreset, setSelectedPreset] = useState("");

  const handlePresetChange = (value) => {
    setSelectedPreset(value);
    const preset = OBSERVER_PRESETS.find((item) => item.key === value);
    if (preset) {
      onObserverCoordsChange({ ra: preset.ra, dec: preset.dec });
    }
  };

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
      {sortBy === "nearest" && (
        <div className="mt-4 grid gap-3 rounded-3xl border border-white/10 bg-[#050814]/90 p-4 text-[11px] text-white/80 md:grid-cols-[1fr_1fr]">
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.24em] text-sc-gold font-bold">
              {isTR ? "Gözlemci Koordinatları" : "Observer Coordinates"}
            </div>
            <div className="grid gap-2 text-sm font-mono text-white/90">
              <div>RA: {observerCoords?.ra?.toFixed(4) ?? "—"}°</div>
              <div>DEC: {observerCoords?.dec?.toFixed(4) ?? "—"}°</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/50">
              {isTR ? "Ön ayar" : "Preset"}
            </div>
            <select
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#071021] px-3 py-2 text-sm text-white outline-none"
            >
              <option value="">{isTR ? "Bir koordinat seç" : "Select coordinates"}</option>
              {OBSERVER_PRESETS.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </select>
            <div className="text-[10px] text-white/40">
              {isTR
                ? "NASA ve Hipparcos koordinatları ile en yakın yıldızları gerçekçi şekilde bulabilirsiniz."
                : "Use NASA and Hipparcos coordinates to calculate nearest stars accurately."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
