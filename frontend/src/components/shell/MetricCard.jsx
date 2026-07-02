import React from "react";
import { cx } from "./utils";

export default function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
  className = "",
  tone = "gold",
}) {
  const toneClasses = {
    amber: "text-amber-500 border-amber-400/20 bg-amber-400/5",
    blue: "text-sc-blue border-sc-blue/20 bg-sc-blue/5",
    emerald: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    gold: "text-sc-gold border-sc-gold/20 bg-sc-gold/5",
    purple: "text-purple-400 border-purple-400/20 bg-purple-400/5",
  };
  const toneClass = toneClasses[tone] || toneClasses.gold;

  return (
    <div className={cx("rounded-3xl border border-white/10 bg-[#050614]/80 p-5 backdrop-blur-xl transition-all duration-300 hover:border-sc-gold/30", className)}>
      <div className="flex items-center gap-4">
        {Icon ? (
          <div className={cx("flex h-12 w-12 items-center justify-center rounded-3xl border border-white/10 bg-white/5", toneClass)}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">{label}</p>
          <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
          {caption ? <p className="mt-2 text-xs text-white/50">{caption}</p> : null}
        </div>
      </div>
    </div>
  );
}
