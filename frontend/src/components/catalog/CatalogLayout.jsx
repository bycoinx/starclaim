import React from "react";

export default function CatalogLayout({
  hero,
  sidebar,
  toolbar,
  grid,
  drawer,
  pagination
}) {
  return (
    <div className="min-h-screen bg-[#010208] pt-20 pb-24 relative overflow-hidden flex flex-col">
      {/* 1. Hero Region */}
      {hero && <div className="w-full z-10">{hero}</div>}

      {/* 2. Content Region */}
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 z-10 py-10 flex flex-col lg:flex-row gap-8 w-full flex-1">
        {/* Left Column: Sidebar Filters */}
        {sidebar && <div className="w-full lg:w-72 shrink-0">{sidebar}</div>}

        {/* Center Column: Grid / Main Area */}
        <div className="flex-grow flex flex-col gap-6 min-w-0">
          {toolbar && <div className="w-full">{toolbar}</div>}
          
          <div className="w-full flex-grow">{grid}</div>
          
          {pagination && <div className="w-full">{pagination}</div>}
        </div>

        {/* Right Column: Sliding Detail Panel */}
        {drawer && (
          <div className="w-full lg:w-96 shrink-0 lg:sticky lg:top-28 h-fit lg:max-h-[calc(100vh-8.5rem)]">
            {drawer}
          </div>
        )}
      </div>
    </div>
  );
}
