import React from "react";
import StarCard from "./StarCard";
import CatalogSkeletons from "./CatalogSkeletons";

export default function CatalogGrid({
  items = [],
  loading = false,
  onClaim = () => {},
  onSelect = () => {},
  emptyState = null,
  renderItem = null
}) {
  if (loading) {
    return <CatalogSkeletons limit={12} />;
  }

  if (items.length === 0) {
    return <div className="w-full">{emptyState}</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
      {items.map((item, index) => {
        if (renderItem) {
          return renderItem(item, index);
        }
        
        return (
          <StarCard
            key={item.star_id || item.code || index}
            star={item}
            onClaim={onClaim}
            onSelect={() => onSelect(item)}
          />
        );
      })}
    </div>
  );
}
