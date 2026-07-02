import React from "react";
import { SurfacePanel, SectionHeader, MetricCard } from "../shell";

export default function VaultUniverseSummary({ metrics }) {
  return (
    <SurfacePanel>
      <SectionHeader
        title="Universe Summary"
        description="A premium view of the collection metrics that define your personal universe."
        action="View Vault Metrics"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            caption={metric.caption}
            icon={metric.Icon}
            tone={metric.tone}
            className="min-h-[150px]"
          />
        ))}
      </div>
    </SurfacePanel>
  );
}
