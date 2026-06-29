import React from "react";

export default function CatalogStats({ stats = {} }) {
  const statItems = [
    { label: "TOPLAM YILDIZ", value: stats.total || "10.000+", icon: "✦" },
    { label: "SAHİPLENİLEN", value: stats.claimed || "548", icon: "⚝" },
    { label: "MEVCUT YILDIZLAR", value: stats.available || "9.452", icon: "☼" },
    { label: "HİKAYE YAZILAN", value: stats.stories || "124", icon: "❂" },
    { label: "EFSANEVİ YILDIZLAR", value: stats.legendary || "27", icon: "★" }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
      {statItems.map((stat, idx) => (
        <div 
          key={idx} 
          className="bg-[#0b1026]/60 border border-white/5 rounded-xl p-4 flex flex-col justify-between hover:border-sc-gold/20 transition-all duration-300 relative group"
        >
          <div className="absolute top-2 right-2 text-white/10 group-hover:text-sc-gold/20 text-xs font-mono transition-colors">
            {stat.icon}
          </div>
          <div className="text-[9px] text-[#8fa0c4] tracking-widest font-mono font-bold uppercase mb-1">
            {stat.label}
          </div>
          <div className="font-display text-xl md:text-2xl text-white font-semibold tracking-tight">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
