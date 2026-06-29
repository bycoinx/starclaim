import React from "react";

export default function QuickFilters({
  activeFilter = "all",
  onFilterChange = () => {},
  isTR = true
}) {
  const options = [
    { id: "all", label: isTR ? "Tümü" : "All" },
    { id: "legendary", label: "Legendary" },
    { id: "zodiac", label: "Zodiac" },
    { id: "supernova", label: "Supernova" },
    { id: "nova", label: "Nova" }
  ];

  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onFilterChange(opt.id)}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all border ${
            activeFilter === opt.id 
              ? "border-sc-gold bg-sc-gold/10 text-sc-gold shadow-[0_0_12px_rgba(201,168,76,0.15)]"
              : "border-white/5 bg-[#0a0f24]/30 text-white/40 hover:text-white hover:border-white/10"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
