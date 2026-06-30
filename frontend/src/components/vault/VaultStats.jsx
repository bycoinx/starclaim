import React from "react";
import { Award, BookOpen, Flame, Shield, Star } from "lucide-react";

export default function VaultStats({ stats = {} }) {
  const statItems = [
    {
      label: "SAHIP OLDUGUN YILDIZ",
      value: stats.ownedStars || "12",
      desc: "Tum koleksiyon",
      Icon: Star,
      color: "text-sc-gold",
    },
    {
      label: "SERTIFIKALAR",
      value: stats.certificates || "9",
      desc: "Dogrulanmis",
      Icon: Shield,
      color: "text-blue-400",
    },
    {
      label: "HIKAYELER",
      value: stats.stories || "6",
      desc: "Yazilmis",
      Icon: BookOpen,
      color: "text-purple-400",
    },
    {
      label: "GALAKSI RANKIN",
      value: stats.rank || "Explorer",
      desc: "Seviye 3",
      Icon: Award,
      color: "text-emerald-400",
    },
    {
      label: "TOPLAM DEGER",
      value: stats.totalValue || "12,450 XCX",
      desc: "Tahmini koleksiyon",
      Icon: Flame,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
      {statItems.map((item) => {
        const Icon = item.Icon;
        return (
          <div
            key={item.label}
            className="relative flex min-h-[110px] flex-col justify-between rounded-xl border border-white/10 bg-[#0b1026]/70 p-4 transition-all duration-300 hover:border-sc-gold/30"
          >
            <Icon className={`absolute right-4 top-4 h-5 w-5 ${item.color}`} strokeWidth={1.5} />
            <div>
              <div className="mb-2 max-w-[80%] text-[9px] font-bold uppercase tracking-[0.22em] text-[#8fa0c4]">
                {item.label}
              </div>
              <div className="font-display text-xl font-semibold tracking-tight text-white md:text-2xl">
                {item.value}
              </div>
            </div>
            <div className="text-[10px] text-white/45">{item.desc}</div>
          </div>
        );
      })}
    </div>
  );
}
