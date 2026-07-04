import React, { useMemo, useState } from "react";
import QRCode from "qrcode.react";
import { Copy, ExternalLink, Smartphone } from "lucide-react";
import { buildMobileStarDeepLink, buildMobileVaultDeepLink, copyText } from "../../lib/StarLinks";

export default function MobileDeepLinkPanel({ star, mode = "star" }) {
  const [copied, setCopied] = useState(false);
  const link = useMemo(
    () => (mode === "vault" ? buildMobileVaultDeepLink(star) : buildMobileStarDeepLink(star)),
    [mode, star],
  );

  const handleCopy = async () => {
    const ok = await copyText(link);
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#050814]/75 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-sc-gold/20 bg-sc-gold/10 p-2 text-sc-gold">
          <Smartphone className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sc-gold/80">
            Mobil Devam
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Ayni yildizi mobil uygulamada Sky Live, StarVault ve sertifika akisi ile ac.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[104px_minmax(0,1fr)]">
        <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-white p-2">
          <QRCode value={link} size={78} includeMargin={false} />
        </div>
        <div className="min-w-0 space-y-2">
          <div className="truncate rounded-xl border border-white/10 bg-black/25 px-3 py-2 font-mono text-[10px] text-slate-300">
            {link}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:border-sc-gold/30 hover:bg-white/10"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Kopyalandi" : "Kopyala"}
            </button>
            <a
              href={link}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sc-gold px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#f0cf69]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ac
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
