import React from "react";
import { SurfacePanel, SectionHeader, StatusBadge } from "../shell";

export default function VaultSecuritySection({ items }) {
  return (
    <SurfacePanel>
      <SectionHeader
        title="Vault Security"
        description="Premium security features and status checks for your personal universe."
        action="Review Security"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.title} className="rounded-[2rem] border border-white/10 bg-[#050814]/90 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.14)] transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm leading-6 text-slate-400">{item.description}</p>
              </div>
              <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
            </div>
          </div>
        ))}
      </div>
    </SurfacePanel>
  );
}
