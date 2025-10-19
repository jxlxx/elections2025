"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import type { Language } from "@/lib/content";

const VotingDistrictMap = dynamic(() => import("@/components/VotingDistrictMap"), {
  ssr: false,
  loading: () => <div className="h-[32rem] w-full border border-[#111111]" />,
});

export default function MapPage() {
  const [language, setLanguage] = useState<Language>("en");

  return (
    <div className="min-h-screen text-[#111111]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10">
        <NavBar language={language} onLanguageChange={setLanguage} />

        <section className="space-y-4">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold uppercase">Montreal Voting Districts</h1>
            <p className="text-sm text-[#5a5a5a]">
              Map powered by OpenStreetMap and Leaflet, showing the 2021 polling districts overlay.
            </p>
          </header>

          <VotingDistrictMap />
        </section>
      </div>
    </div>
  );
}
