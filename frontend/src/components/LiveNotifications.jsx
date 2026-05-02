import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * LiveNotifications —
 * Simulated global live activity ticker.
 */
const MESSAGES_GLOBAL = [
  { name: "Kaan B.", star: "Vega", type: "claim" },
  { name: "Someone from Tokyo", star: "Rigel", type: "claim" },
  { name: "Mert & Ayşe", star: "Neighbor stars", type: "couple" },
  { name: "Elena R.", star: "Polaris", type: "claim" },
  { name: "Liam Smith", star: "Sirius", type: "claim" },
  { name: "Someone from London", star: "Betelgeuse", type: "claim" },
  { name: "Selin M.", star: "Regulus", type: "claim" },
  { name: "Yuki Tanaka", star: "SC-018", type: "claim" },
  { name: "Someone from Berlin", star: "Deneb", type: "claim" },
  { name: "James W.", star: "Altair", type: "claim" },
  { name: "Sofia V.", star: "Antares", type: "claim" },
  { name: "Someone from New York", star: "Spica", type: "claim" },
  { name: "Ahmed Z.", star: "Aldebaran", type: "claim" },
  { name: "Merve S.", star: "Alnilam", type: "listing" },
];

export default function LiveNotifications() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let t1, t2;
    const cycle = () => {
      setVisible(true);
      t1 = setTimeout(() => setVisible(false), 4500);
      t2 = setTimeout(() => {
        setIdx((i) => (i + 1) % MESSAGES_GLOBAL.length);
        cycle();
      }, 7500 + Math.random() * 3000);
    };
    const kickoff = setTimeout(cycle, 2500);
    return () => {
      clearTimeout(kickoff);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const m = MESSAGES_GLOBAL[idx];
  const verb = m.type === "couple"
    ? "sahiplendi"
    : m.type === "dedicate"
      ? "adadı"
      : m.type === "listing"
        ? "koydu"
        : "sahiplendi";

  return (
    <div
      data-testid="live-notification"
      className={ixed bottom-5 left-5 z-40 max-w-xs transition-all duration-500 \}
    >
      <div className="glass rounded-xl px-4 py-3 pl-4 border-l-2 border-l-sc-gold flex items-start gap-3 shadow-2xl">
        <Sparkles className="w-4 h-4 text-sc-gold mt-0.5 shrink-0" />
        <div className="text-sm">
          <span className="text-sc-text font-medium">{m.name}</span>
          <span className="text-sc-text-muted"> az önce </span>
          <span className="gold-gradient-text font-semibold">{m.star}</span>
          <span className="text-sc-text-muted"> {verb}.</span>
        </div>
      </div>
    </div>
  );
}
