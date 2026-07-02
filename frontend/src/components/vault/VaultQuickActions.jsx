import React from "react";
import { SurfacePanel, SectionHeader } from "../shell";

export default function VaultQuickActions({ actions }) {
  return (
    <SurfacePanel>
      <SectionHeader
        title="Quick Actions"
        description="Fast entry points into your StarVault universe."
        action="Manage Actions"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <button
            key={action.title}
            type="button"
            className="group rounded-[2rem] border border-white/10 bg-[#050814]/90 p-6 text-left shadow-[0_24px_60px_rgba(0,0,0,0.16)] transition duration-300 hover:-translate-y-1 hover:border-sc-gold/30 hover:bg-white/5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-sc-gold">
              <action.Icon className="h-6 w-6" />
            </div>
            <div className="mt-6 space-y-2">
              <h3 className="text-base font-semibold text-white">{action.title}</h3>
              <p className="text-sm leading-6 text-slate-400">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </SurfacePanel>
  );
}
