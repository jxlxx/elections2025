"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { SectionTitle } from "@/components/SectionTitle";
import type { SelectedDistrict } from "@/lib/districts";
import type { Language } from "@/lib/content";

const VotingDistrictMap = dynamic(() => import("@/components/VotingDistrictMap"), {
  ssr: false,
  loading: () => <div className="h-[32rem] w-full border border-[#111111]" />,
});

type MapPageClientProps = {
  initialSelected: SelectedDistrict;
};

export function MapPageClient({ initialSelected }: MapPageClientProps) {
  const [language, setLanguage] = useState<Language>("en");
  const [selectedDistrict, setSelectedDistrict] = useState<SelectedDistrict>(initialSelected);

  useEffect(() => {
    setSelectedDistrict(initialSelected);
  }, [initialSelected.slug]);

  const districtLabel = useMemo(() => {
    if (selectedDistrict.name) {
      return selectedDistrict.name;
    }
    return language === "fr" ? "Sélectionnez un district" : "Select a district";
  }, [selectedDistrict, language]);

  const handleSelect = (district: SelectedDistrict) => {
    setSelectedDistrict(district);
    if (typeof window !== "undefined") {
      const nextUrl = `/map/${district.slug}`;
      if (window.location.pathname !== nextUrl) {
        window.history.replaceState(null, "", nextUrl);
      }
    }
  };

  return (
    <div className="min-h-screen text-[#111111]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10">
        <NavBar language={language} onLanguageChange={setLanguage} />

        <section className="space-y-4">
          <VotingDistrictMap selected={selectedDistrict} onDistrictSelect={handleSelect} />

          <div className="pt-2">
            <SectionTitle className="text-2xl">{districtLabel ?? ""}</SectionTitle>
          </div>
        </section>
      </div>
    </div>
  );
}

export default MapPageClient;
