import React from "react";
import { cx } from "./utils";

const alignClasses = {
  between: "justify-between",
  end: "justify-end",
  start: "justify-start",
};

export default function PageToolbar({ children, className = "", align = "between" }) {
  return (
    <div
      className={cx(
        "flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#070b18]/70 p-3 backdrop-blur-xl md:flex-row md:items-center",
        alignClasses[align] || align,
        className
      )}
    >
      {children}
    </div>
  );
}
