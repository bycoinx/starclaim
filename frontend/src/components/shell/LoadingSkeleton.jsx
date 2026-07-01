import React from "react";
import { cx } from "./utils";

export default function LoadingSkeleton({ className = "", lines = 3 }) {
  return (
    <div className={cx("animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] p-5", className)}>
      <div className="h-32 rounded-xl bg-white/[0.07]" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cx(
              "h-3 rounded-full bg-white/[0.08]",
              index === lines - 1 ? "w-2/3" : "w-full"
            )}
          />
        ))}
      </div>
    </div>
  );
}
