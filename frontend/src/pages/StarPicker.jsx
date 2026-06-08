import React from "react";
import GalaxyScene from "../components/GalaxyScene/GalaxyScene";

export default function StarPicker({ onClaim }) {
  return (
    <main className="w-full h-screen bg-black overflow-hidden relative">
      <GalaxyScene onStarClick={onClaim} />
    </main>
  );
}
