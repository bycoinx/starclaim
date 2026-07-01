import React from "react";
import { cx } from "./utils";

export default function SurfacePanel({
  as: Component = "section",
  children,
  className = "",
  variant = "default",
}) {
  const variants = {
    default: "rounded-2xl border border-white/10 bg-[#070b18]/78 p-5 shadow-xl backdrop-blur-xl",
    subtle: "rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl",
    strong: "rounded-2xl border border-sc-gold/20 bg-[#070b18]/88 p-5 shadow-[0_0_45px_rgba(212,175,55,0.08)] backdrop-blur-xl",
  };

  return <Component className={cx(variants[variant] || variants.default, className)}>{children}</Component>;
}
