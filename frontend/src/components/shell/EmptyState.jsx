import React from "react";
import { AlertCircle } from "lucide-react";
import { cx } from "./utils";

export default function EmptyState({
  icon: Icon = AlertCircle,
  title,
  message,
  action,
  onAction,
  className = "",
}) {
  return (
    <div
      className={cx(
        "flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#070b18]/70 px-6 py-10 text-center backdrop-blur-xl",
        className
      )}
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-sc-gold/20 bg-sc-gold/10 text-sc-gold">
        <Icon className="h-7 w-7" />
      </div>
      {title ? <h3 className="font-serif text-2xl text-white">{title}</h3> : null}
      {message ? <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{message}</p> : null}
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-full bg-sc-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-black shadow-[0_0_28px_rgba(212,175,55,0.18)] transition hover:-translate-y-0.5 hover:bg-sc-goldLight"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}
