import React from "react";
import { SurfacePanel, SectionHeader } from "../shell";

export default function VaultCertificatesSection({ certificates }) {
  return (
    <SurfacePanel>
      <SectionHeader
        title="Certificates"
        description="A polished gallery of ownership and verification artifacts."
        action="Open Gallery"
      />
      <div className="flex gap-4 overflow-x-auto pb-2">
        {certificates.map((cert) => (
          <div key={cert.id} className="min-w-[280px] rounded-[2rem] border border-white/10 bg-[#050814]/90 p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-[0.24em] text-sc-gold/70">{cert.type}</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">{cert.star}</h3>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300 mb-5">Certificate preview placeholder</div>
            <div className="grid gap-3 text-sm text-slate-400">
              <div>
                <span className="block uppercase tracking-[0.28em] text-white/50 text-[10px]">Certificate #</span>
                <p className="mt-2 text-white">{cert.id}</p>
              </div>
              <div>
                <span className="block uppercase tracking-[0.28em] text-white/50 text-[10px]">Issued</span>
                <p className="mt-2 text-white">{cert.issued}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SurfacePanel>
  );
}
