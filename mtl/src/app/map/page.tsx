"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { NavBar } from "@/components/NavBar";
import { SectionTitle } from "@/components/SectionTitle";
import type { Language } from "@/lib/content";
import districtsData from "@/data/districts-electoraux-2021.json" assert { type: "json" };
import {
  filterMontrealDistricts,
  toSelectedDistrict,
  type DistrictFeature,
  type DistrictProperties,
  type SelectedDistrict,
} from "@/lib/districts";

const VotingDistrictMap = dynamic(() => import("@/components/VotingDistrictMap"), {
  ssr: false,
  loading: () => <div className="h-[32rem] w-full border border-[#111111]" />,
});

const districtCollection = districtsData as FeatureCollection<Geometry, DistrictProperties>;
const DISTRICT_FEATURES: DistrictFeature[] = filterMontrealDistricts(districtCollection);
const INITIAL_DISTRICT: SelectedDistrict = toSelectedDistrict(DISTRICT_FEATURES[0]);

export default function MapPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [selectedDistrict, setSelectedDistrict] = useState<SelectedDistrict>(INITIAL_DISTRICT);

  const districtLabel = useMemo(() => {
    if (selectedDistrict.name) {
      return selectedDistrict.name;
    }
    return language === "fr" ? "Sélectionnez un district" : "Select a district";
  }, [selectedDistrict, language]);

  return (
    <div className="min-h-screen text-[#111111]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10">
        <NavBar language={language} onLanguageChange={setLanguage} />

        <section className="space-y-4">
          <VotingDistrictMap selected={selectedDistrict} onDistrictSelect={setSelectedDistrict} />

          <div className="pt-2">
            <SectionTitle className="text-2xl">{districtLabel ?? ""}</SectionTitle>
          </div>
        </section>
      </div>
    </div>
  );
}
