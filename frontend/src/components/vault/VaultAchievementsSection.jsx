import React from "react";
import { SurfacePanel, SectionHeader, StatusBadge } from "../shell";

export default function VaultAchievementsSection({ achievements }) {
  return (
    <SurfacePanel>
      <SectionHeader
        title="Achievements"
        description="Milestones, explorer levels, and the rewards your universe has earned."
        action="View All Achievements"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {achievements.map((achievement) => (
          <div key={achievement.title} className="rounded-[2rem] border border-white/10 bg-[#050814]/90 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white/5 text-sc-gold">
                <achievement.Icon className="h-6 w-6" />
              </div>
              <StatusBadge tone={achievement.status === "Unlocked" ? achievement.tone : "red"}>
                {achievement.status}
              </StatusBadge>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{achievement.title}</h3>
            <p className="text-sm leading-7 text-slate-400">{achievement.detail}</p>
          </div>
        ))}
      </div>
    </SurfacePanel>
  );
}
