import React from "react";
import { ArrowUpDown } from "lucide-react";

export default function SortBar({
  sortBy = "recommended",
  onSortChange = () => {},
  isTR = true
}) {
  return (
    <div className="flex items-center gap-2 bg-[#0a0f24] px-3.5 py-2.5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
      <ArrowUpDown className="w-3.5 h-3.5 text-sc-gold/60" />
      <span className="text-[9px] text-[#8fa0c4]/60 font-bold uppercase font-mono tracking-wider select-none">
        {isTR ? "Sıralama:" : "Sort:"}
      </span>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="bg-transparent text-white text-[11px] font-mono font-medium outline-none cursor-pointer pr-1"
      >
        <option value="recommended" className="bg-[#050814]">{isTR ? "Önerilen" : "Recommended"}</option>
        <option value="brightest" className="bg-[#050814]">{isTR ? "En Parlak" : "Brightest"}</option>
        <option value="nearest" className="bg-[#050814]">{isTR ? "En Yakın" : "Nearest"}</option>
        <option value="price-high" className="bg-[#050814]">{isTR ? "Yüksek Fiyat" : "Price: High"}</option>
        <option value="price-low" className="bg-[#050814]">{isTR ? "Düşük Fiyat" : "Price: Low"}</option>
        <option value="name" className="bg-[#050814]">İsim (A-Z)</option>
      </select>
    </div>
  );
}
