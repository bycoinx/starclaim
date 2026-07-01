import React from "react";
import { cx } from "./utils";

export default function PageShell({
  children,
  className = "",
  contentClassName = "",
  background = "nebula",
  maxWidth = "max-w-[1500px]",
}) {
  return (
    <div className={cx("relative min-h-screen overflow-hidden bg-[#02040a] px-4 pb-20 pt-28 text-white md:px-8", className)}>
      {background === "nebula" ? (
        <>
          <div className="pointer-events-none absolute inset-0 nebula-bg opacity-25" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(77,124,255,0.12),transparent_32%),radial-gradient(circle_at_90%_30%,rgba(122,92,255,0.12),transparent_28%)]" />
        </>
      ) : null}
      <main className={cx("relative z-10 mx-auto flex flex-col gap-6", maxWidth, contentClassName)}>
        {children}
      </main>
    </div>
  );
}
