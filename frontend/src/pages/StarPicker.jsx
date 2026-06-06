import React from "react";
import GalaxyScene from "../components/GalaxyScene/GalaxyScene";

export default function StarPicker({ onClaim }) {
  return (
    <main className="min-h-screen bg-black text-white">
      <GalaxyScene onStarClick={onClaim} />
    </main>
  );
}
