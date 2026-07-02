import React from "react";
import { ChevronRight, Globe2, Sparkles, Star } from "lucide-react";
import { SectionHeader, SurfacePanel, StatusBadge } from "../shell";

const navItems = [
  { label: "Universe Summary", href: "#universe-summary" },
  { label: "Quick Actions", href: "#quick-actions" },
  { label: "My Stars", href: "#my-stars" },
  { label: "Certificates", href: "#certificates" },
  { label: "Stories", href: "#stories" },
  { label: "Collections", href: "#collections" },
  { label: "Achievements", href: "#achievements" },
  { label: "Timeline", href: "#timeline" },
  { label: "Security", href: "#security" },
  { label: "Recommendations", href: "#recommendations" },
];

export default function VaultSidebar({ metrics = [], highlights = [] }) {
  return (
    <aside className="hidden lg:block w-full shrink-0">
      <div className="sticky top-28 space-y-6">
        <SurfacePanel className="space-y-6">
          <SectionHeader
            title="Vault Compass"
            description="Navigate your premium private universe with fast access and key stats."
            action="Open Vault"
          />

          <div className="grid gap-3">
            {metrics.slice(0, 4).map((metric) => (
              <div
                key={metric.label}
                className="rounded-3xl border border-white/10 bg-[#050814]/85 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-white">{metric.value}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-sc-gold">
                    {metric.Icon ? <metric.Icon className="h-5 w-5" /> : <Star className="h-5 w-5" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
