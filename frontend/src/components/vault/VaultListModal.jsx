import React, { useState, useEffect } from "react";
import { toast } from "sonner";

export default function VaultListModal({ open, onClose, star, onConfirm }) {
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (open) setPrice(star?.price ? String(star.price) : "");
  }, [open, star]);

  if (!open) return null;

  const handleConfirm = () => {
    const normalized = String(price).trim().replace(/,/g, ".");
    const p = Number(normalized);
    if (!normalized || Number.isNaN(p) || p <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    onConfirm && onConfirm(p);
    onClose && onClose();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-[#061026] p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-white">List {star?.name} for sale</h3>
        <p className="mt-2 text-sm text-slate-300">Set the asking price in USD for this star.</p>

        <div className="mt-4">
          <label className="text-xs text-slate-400">Price (USD)</label>
          <input
            autoFocus
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={handleKeyDown}
            inputMode="decimal"
            pattern="[0-9]*([.,][0-9]+)?"
            placeholder="e.g. 199.99"
            className="mt-2 w-full rounded-md border border-white/8 bg-transparent px-3 py-2 text-white outline-none focus:border-sc-gold"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/2">Cancel</button>
          <button onClick={handleConfirm} className="rounded-md bg-sc-gold px-4 py-2 text-sm font-semibold text-black">List</button>
        </div>
      </div>
    </div>
  );
}
