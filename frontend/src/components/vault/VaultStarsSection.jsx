import React from "react";
import { SurfacePanel, SectionHeader } from "../shell";
import VaultStarCard from "./VaultStarCard";

export default function VaultStarsSection({ stars, selectedStar, onSelectStar }) {
  return (
    <SurfacePanel>
      <SectionHeader
        title="My Constellation"
        description="Browse the curated stars that define your premium collection."
        action="View all stars"
      />
      <div className="grid gap-6 xl:grid-cols-2">
        {stars.map((star) => (
          <VaultStarCard
            key={star.starId || star.id}
            star={star}
            selected={selectedStar?.starId === star.starId}
            onSelect={() => onSelectStar(star)}
          />
        ))}
      </div>
    </SurfacePanel>
  );
}
