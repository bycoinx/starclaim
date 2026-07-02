import React from "react";
import { SurfacePanel, SectionHeader } from "../shell";
import StarCard from "../StarCard";

export default function VaultStarsSection({ stars }) {
  return (
    <SurfacePanel>
      <SectionHeader
        title="My Stars"
        description="The heart of StarVault: every owned star belongs to your universe."
        action="View All Stars"
      />
      <div className="grid gap-6 xl:grid-cols-2">
        {stars.map((star) => (
          <StarCard key={star.starId || star.id} star={star} />
        ))}
      </div>
    </SurfacePanel>
  );
}
