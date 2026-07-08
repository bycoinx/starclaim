import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CatalogPagination({
  currentPage,
  totalPages,
  pageSize,
  setPageSize,
  onPageChange,
  totalItems = 0
}) {
  const getPageNumbers = () => {
    const pages = [];
    const maxPageButtons = 5;

    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-white/5 mt-8 w-full">
      {/* Total count and page size dropdown */}
      <div className="flex items-center gap-4 text-xs font-mono text-[#8fa0c4]/70">
        <span>Toplam {totalItems.toLocaleString()} yıldız bulundu</span>
        <div className="flex items-center gap-2">
          <span>Sayfa başına:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value))}
            className="bg-[#0a0f24] border border-white/10 rounded-lg py-1 px-2.5 text-white/80 outline-none focus:border-sc-gold/60 cursor-pointer"
          >
            {[24, 48, 72, 120, 240].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Page navigation controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-white/10 hover:border-white/20 text-[#8fa0c4] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, index) => {
          if (page === "...") {
            return (
              <span key={`dots-${index}`} className="px-2 py-1.5 text-white/30 text-xs font-mono select-none">
                ...
              </span>
            );
          }

          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                currentPage === page
                  ? "bg-sc-gold/10 border-sc-gold text-sc-gold shadow-[0_0_10px_rgba(201,168,76,0.1)]"
                  : "border-transparent text-[#8fa0c4] hover:text-white hover:bg-white/5"
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-white/10 hover:border-white/20 text-[#8fa0c4] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
