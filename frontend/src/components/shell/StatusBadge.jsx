import React from "react";
import { cx } from "./utils";

const toneClasses = {
  amber: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  blue: "border-sc-blue/20 bg-sc-blue/10 text-sc-blue",
  emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  gold: "border-sc-gold/20 bg-sc-gold/10 text-sc-gold",
  purple: "border-purple-400/20 bg-purple-400/10 text-purple-300",
  red: "border-red-400/20 bg-red-400/10 text-red-300",
};

export default function StatusBadge({ children, className = "", tone = "gold" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
        toneClasses[tone] || toneClasses.gold,
        className
      )}
    >
      {children}
    </span>
  );
}
