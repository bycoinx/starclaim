import React from "react";
import { ChevronRight, Globe2, Sparkles, Star } from "lucide-react";
import { SectionHeader, SurfacePanel, StatusBadge } from "../shell";

const navItems = [
  { label: "My Constellation", href: "#my-constellation" },
  { label: "Memories", href: "#memories" },
  { label: "Certificates", href: "#certificates" },
  { label: "Timeline", href: "#timeline" },
  { label: "Collections", href: "#collections" },
  { label: "Legacy Actions", href: "#legacy-actions" },
];

export default function VaultSidebar({ selectedStar, highlights = [] }) {
  return (
    <aside className="hidden lg:block w-full shrink-0">
      <div className="sticky top-28 space-y-6">
        <SurfacePanel className="space-y-6">
          <SectionHeader
            title="Vault Compass"
            description="Navigate your private collection with context, highlights, and your featured star."
            action="Open Vault"
          />

          {selectedStar ? (
            <div className="rounded-[2rem] border border-white/10 bg-[#050814]/90 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Featured Star</p>
                  <h3 className="mt-3 text-xl font-semibold text-white">{selectedStar.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">{selectedStar.constellation}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-sc-gold">
                  <Star className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-300">
                {[
                  ["Spectral", selectedStar.spectralType],
                  ["Magnitude", selectedStar.magnitude],
                  ["Distance", selectedStar.distance],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-3xl bg-white/5 px-4 py-3">
                    <span>{label}</span>
                    <span className="font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </SurfacePanel>

        <SurfacePanel className="space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-sc-gold">Quick Links</h3>
          <nav className="grid gap-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-3xl border border-white/10 bg-[#050814]/80 px-4 py-3 text-sm text-slate-200 transition hover:border-sc-gold/30 hover:bg-white/5"
              >
                {item.label}
                <ChevronRight className="h-4 w-4 text-sc-gold" />
              </a>
            ))}
          </nav>
        </SurfacePanel>

        <SurfacePanel variant="strong" className="space-y-5">
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.28em] text-sc-gold/80">
            <Sparkles className="h-4 w-4" />
            Premium Pulse
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.description}</p>
                  </div>
                  <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-sc-gold px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#d4aa2a]">
            Vault Overview
            <Globe2 className="h-4 w-4" />
          </button>
        </SurfacePanel>
      </div>
    </aside>
  );
}
