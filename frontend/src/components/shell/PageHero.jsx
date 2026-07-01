import React from "react";
import { cx } from "./utils";

export default function PageHero({
  eyebrow,
  title,
  highlight,
  subtitle,
  actions,
  children,
  className = "",
}) {
  return (
    <section
      className={cx(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-[#060a16]/80 px-6 py-10 shadow-[0_0_60px_rgba(3,8,20,0.4)] backdrop-blur-xl md:px-10 md:py-14",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(77,124,255,0.18),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(122,92,255,0.16),transparent_34%)]" />
      <div className="relative z-10 max-w-4xl">
        {eyebrow ? (
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.38em] text-sc-gold">
            {eyebrow}
          </div>
        ) : null}
        {title ? (
          <h1 className="font-serif text-5xl leading-none text-white md:text-7xl">
            {title} {highlight ? <span className="text-sc-gold">{highlight}</span> : null}
          </h1>
        ) : null}
        {subtitle ? <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">{subtitle}</p> : null}
        {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {children ? <div className="relative z-10 mt-8">{children}</div> : null}
    </section>
  );
}
