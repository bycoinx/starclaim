import React from "react";
import { cx } from "./utils";

export default function SurfacePanel({
  as: Component = "section",
  children,
  className = "",
  variant = "default",
}) {
  const variants = {
    default: "rounded-2xl border border-white/10 bg-[#060712]/82 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl",
    subtle: "rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl",
    strong: "rounded-3xl border border-sc-gold/20 bg-[#070915]/88 p-6 shadow-[0_0_45px_rgba(212,175,55,0.12)] backdrop-blur-xl",
  };

  return <Component className={cx(variants[variant] || variants.default, className)}>{children}</Component>;
}
