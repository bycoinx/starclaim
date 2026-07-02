import React from "react";
import { SurfacePanel, SectionHeader } from "../shell";

export default function VaultStoriesSection({ stories }) {
  return (
    <SurfacePanel>
      <SectionHeader
        title="Stories"
        description="Recent narratives and the next stories waiting to be continued."
        action="Continue Reading"
      />
      <div className="grid gap-6 xl:grid-cols-3">
        {stories.map((story) => (
          <article key={story.title} className="rounded-[2rem] border border-white/10 bg-[#050814]/90 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5">
            <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-[0.26em]">{story.category}</span>
              <span>{story.reading}</span>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">{story.title}</h3>
            <p className="text-sm leading-7 text-slate-400 mb-6">{story.excerpt}</p>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>{story.star}</span>
              <span>{story.created}</span>
            </div>
          </article>
        ))}
      </div>
    </SurfacePanel>
  );
}
