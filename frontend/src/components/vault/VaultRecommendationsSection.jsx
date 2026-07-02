import React from "react";
import { SurfacePanel, SectionHeader } from "../shell";

export default function VaultRecommendationsSection({ recommendations }) {
  return (
    <SurfacePanel>
      <SectionHeader
        title="Recommendations"
        description="Suggested stars, stories and collections for your expanding universe."
        action="Explore Suggestions"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {recommendations.map((item) => (
          <div key={item.title} className="rounded-[2rem] border border-white/10 bg-[#050814]/90 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.14)] transition hover:-translate-y-0.5">
            <div className="text-sm uppercase tracking-[0.24em] text-sc-gold/70 mb-2">{item.type}</div>
            <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
            <p className="text-sm leading-7 text-slate-400">{item.description}</p>
          </div>
        ))}
      </div>
    </SurfacePanel>
  );
}
