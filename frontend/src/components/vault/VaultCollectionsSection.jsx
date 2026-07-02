import React from "react";
import { SurfacePanel, SectionHeader } from "../shell";

export default function VaultCollectionsSection({ collections }) {
  return (
    <SurfacePanel>
      <SectionHeader
        title="Collections"
        description="Curated categories of stars and rare discoveries."
        action="Browse Collections"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {collections.map((collection) => (
          <div key={collection.title} className="rounded-[2rem] border border-white/10 bg-[#050814]/90 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.16)] hover:-translate-y-0.5 transition">
            <div className="mb-4 text-sm uppercase tracking-[0.24em] text-sc-gold/70">{collection.subtitle}</div>
            <h3 className="text-xl font-semibold text-white mb-3">{collection.title}</h3>
            <p className="text-sm leading-7 text-slate-400">{collection.description}</p>
          </div>
        ))}
      </div>
    </SurfacePanel>
  );
}
