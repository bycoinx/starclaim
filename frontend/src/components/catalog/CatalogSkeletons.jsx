import React from "react";

export function StarCardSkeleton() {
  return (
    <div className="bg-[#070b20]/20 border border-white/5 rounded-2xl p-4 flex flex-col gap-4 animate-pulse relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="h-2 w-16 bg-white/10 rounded" />
        <div className="h-2 w-10 bg-white/10 rounded" />
      </div>

      {/* Visual Image container */}
      <div className="aspect-square w-full rounded-xl bg-[#030615] flex items-center justify-center border border-white/5 relative">
        <div className="w-16 h-16 rounded-full bg-white/5" />
      </div>

      {/* Title / meta */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline">
          <div className="h-4 w-28 bg-white/15 rounded" />
          <div className="h-2.5 w-12 bg-white/10 rounded" />
        </div>
        <div className="h-3 w-40 bg-white/10 rounded" />
      </div>

      {/* Metrics list */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
        <div className="flex flex-col gap-1">
          <div className="h-2 w-8 bg-white/5 rounded" />
          <div className="h-3 w-16 bg-white/10 rounded" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-2 w-8 bg-white/5 rounded" />
          <div className="h-3 w-16 bg-white/10 rounded" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5 mt-auto">
        <div className="flex flex-col gap-1">
          <div className="h-2 w-10 bg-white/5 rounded" />
          <div className="h-4 w-14 bg-sc-gold/20 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10" />
          <div className="w-16 h-8 rounded-lg bg-sc-gold/20" />
        </div>
      </div>
    </div>
  );
}

export function DetailDrawerSkeleton() {
  return (
    <div className="w-full lg:w-96 shrink-0 bg-[#050814]/95 border-l border-white/5 h-[calc(100vh-8.5rem)] sticky top-28 overflow-y-auto flex flex-col z-20 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#030612]/60">
        <div className="h-3 w-24 bg-white/10 rounded" />
        <div className="h-4 w-4 bg-white/10 rounded" />
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* Large Visual Render */}
        <div className="aspect-square w-full rounded-2xl bg-[#030615] flex items-center justify-center border border-white/5">
          <div className="w-32 h-32 rounded-full bg-white/5" />
        </div>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <div className="h-6 w-32 bg-white/15 rounded" />
          <div className="h-3 w-40 bg-white/10 rounded" />
        </div>

        {/* Metrics */}
        <div className="flex flex-col gap-3">
          <div className="h-2.5 w-20 bg-white/10 rounded border-b border-white/5 pb-1" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between py-1.5 border-b border-white/[0.03]">
              <div className="h-3 w-24 bg-white/5 rounded" />
              <div className="h-3 w-16 bg-white/10 rounded" />
            </div>
          ))}
        </div>

        {/* About */}
        <div className="flex flex-col gap-2">
          <div className="h-2.5 w-16 bg-white/10 rounded" />
          <div className="h-3 w-full bg-white/5 rounded" />
          <div className="h-3 w-5/6 bg-white/5 rounded" />
          <div className="h-3 w-4/5 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function CatalogSkeletons({ limit = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
      {Array.from({ length: limit }).map((_, idx) => (
        <StarCardSkeleton key={idx} />
      ))}
    </div>
  );
}
