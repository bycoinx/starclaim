import React from "react";
import { ChevronRight } from "lucide-react";
import { cx } from "./utils";

export default function SectionHeader({
  title,
  action = "Tumunu Gor",
  onAction,
  className = "",
  titleClassName = "",
  actionClassName = "",
}) {
  return (
    <div className={cx("mb-5 flex items-center justify-between gap-4", className)}>
      <h2 className={cx("text-sm font-bold uppercase tracking-[0.18em] text-sc-gold", titleClassName)}>
        {title}
      </h2>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className={cx(
            "inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-sc-gold/80 transition hover:text-sc-gold",
            actionClassName
          )}
        >
          {action}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
