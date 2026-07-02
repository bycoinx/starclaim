import React from "react";
import { SurfacePanel, SectionHeader } from "../shell";

export default function VaultTimelineSection({ events }) {
  return (
    <SurfacePanel>
      <SectionHeader
        title="Timeline"
        description="A living feed of vault activity, from claims to stories to security updates."
        action="Review Timeline"
      />
      <div className="space-y-5">
        {events.map((event) => (
          <div key={event.title} className="flex gap-5 rounded-[2rem] border border-white/10 bg-[#050814]/90 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
            <div className="flex flex-col items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sc-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.25)]">
                <event.Icon className="h-5 w-5" />
              </span>
              <span className="h-full w-px bg-white/10" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4 mb-3 text-sm text-slate-400">
                <span>{event.date}</span>
                <span className="uppercase tracking-[0.18em] text-white/50">{event.status}</span>
              </div>
              <h3 className="text-lg font-semibold text-white">{event.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{event.description}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.22em] text-white/40">{event.star}</p>
            </div>
          </div>
        ))}
      </div>
    </SurfacePanel>
  );
}
