import React from "react";
import { Award, BookOpen, Flame, Shield, Star } from "lucide-react";
import { MetricCard } from "../shell";

export default function VaultStats({ stats = {} }) {
  const statItems = [
    {
      label: "SAHIP OLDUGUN YILDIZ",
      value: stats.ownedStars ?? "0",
      desc: "Tum koleksiyon",
      Icon: Star,
      tone: "gold",
    },
    {
      label: "SERTIFIKALAR",
      value: stats.certificates ?? "0",
      desc: "Dogrulanmis",
      Icon: Shield,
      tone: "blue",
    },
    {
      label: "HIKAYELER",
      value: stats.stories ?? "0",
      desc: "Yazilmis",
      Icon: BookOpen,
      tone: "purple",
    },
    {
      label: "GALAKSI RANKIN",
      value: stats.rank || "Cadet",
      desc: "Seviye 3",
      Icon: Award,
      tone: "emerald",
    },
    {
      label: "TOPLAM DEGER",
      value: stats.totalValue || "$0 XCX",
      desc: "Tahmini koleksiyon",
      Icon: Flame,
      tone: "amber",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
      {statItems.map((item) => (
        <MetricCard
          key={item.label}
          label={item.label}
          value={item.value}
          caption={item.desc}
          icon={item.Icon}
          tone={item.tone}
          className="min-h-[110px] rounded-xl bg-[#0b1026]/70"
        />
      ))}
    </div>
  );
}
