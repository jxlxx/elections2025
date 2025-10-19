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
  candidates: CandidateRecord[];
  posts: PostRecord[];
};

export type CandidateRecord = {
  first_name: string;
  last_name: string;
  party: string;
  post_no: string;
};

export type PostRecord = {
  no: string;
  type_en: string;
  poste_en: string;
};

type PartyTab = {
  id: string;
  label: string;
  source: string;
};

const PARTY_TABS: PartyTab[] = [
  {
    id: "projet-montreal",
    label: "Projet Montréal",
    source: "Projet Montréal - Équipe Luc Rabouin",
  },
  {
    id: "ensemble-montreal",
    label: "Ensemble Montréal",
    source: "Ensemble Montréal - Équipe Soraya",
  },
  {
    id: "transition-montreal",
    label: "Transition Montréal",
    source: "Transition Montréal - Équipe Craig Sauvé",
  },
];

export function MapPageClient({ initialSelected, candidates, posts }: MapPageClientProps) {
  const [language, setLanguage] = useState<Language>("en");
  const [selectedDistrict, setSelectedDistrict] = useState<SelectedDistrict>(initialSelected);
  const [activeParty, setActiveParty] = useState<string>(PARTY_TABS[0]?.id ?? "");

  useEffect(() => {
    setSelectedDistrict(initialSelected);
  }, [initialSelected.slug]);

  const postsByNo = useMemo(() => new Map(posts.map((post) => [post.no, post])), [posts]);

  const districtLabel = useMemo(() => {
    if (selectedDistrict.name) {
      return selectedDistrict.name;
    }
    return language === "fr" ? "Sélectionnez un district" : "Select a district";
  }, [selectedDistrict, language]);

  const handleSelect = (district: SelectedDistrict) => {
    setSelectedDistrict(district);
  };

  const districtPartyCandidates = useMemo(() => {
    const prefix = districtPostPrefix(selectedDistrict.num);
    if (!prefix) {
      const empty: Record<string, Array<{ name: string; post: string; postType: string }>> = {};
      for (const party of PARTY_TABS) {
        empty[party.id] = [];
      }
      return empty;
    }

    const relevantPostNos = posts
      .filter((post) => post.no.startsWith(prefix))
      .map((post) => post.no);
    const relevantPostSet = new Set(relevantPostNos);

    const result: Record<string, Array<{ name: string; post: string; postType: string }>> = {};

    const sortKey = new Map(relevantPostNos.map((no, index) => [no, index]));

    for (const party of PARTY_TABS) {
      const partyCandidates = candidates
        .filter(
          (candidate) =>
            candidate.party === party.source && relevantPostSet.has(candidate.post_no)
        )
        .map((candidate) => {
          const post = postsByNo.get(candidate.post_no);
          const name = `${candidate.first_name} ${candidate.last_name}`.replace(/\s+/g, " ").trim();
          return {
            name,
            post: post?.poste_en ?? candidate.post_no,
            postType: post?.type_en ?? "",
            postKey: sortKey.get(candidate.post_no) ?? Number.MAX_SAFE_INTEGER,
          };
        })
        .sort((a, b) => a.postKey - b.postKey || a.name.localeCompare(b.name))
        .map(({ name, post, postType }) => ({ name, post, postType }));

      result[party.id] = partyCandidates;
    }

    return result;
  }, [candidates, posts, postsByNo, selectedDistrict.num]);

  useEffect(() => {
    if (!PARTY_TABS.find((party) => party.id === activeParty)) {
      setActiveParty(PARTY_TABS[0]?.id ?? "");
    }
  }, [activeParty]);

  return (
    <div className="min-h-screen text-[#111111]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10">
        <NavBar language={language} onLanguageChange={setLanguage} />

        <section className="space-y-4">
          <VotingDistrictMap
            selected={selectedDistrict}
            onDistrictSelect={handleSelect}
            refreshToken={activeParty}
          />

          <div className="pt-2">
            <SectionTitle className="text-2xl">{districtLabel ?? ""}</SectionTitle>
          </div>

          <div className="space-y-4">
            <div className="relative flex flex-wrap items-end gap-3 border-b border-[#111111]">
              {PARTY_TABS.map((party) => {
                const isActive = party.id === activeParty;
                return (
                  <button
                    key={party.id}
                    type="button"
                    onClick={() => setActiveParty(party.id)}
                    className={`uppercase font-semibold px-3 py-2 leading-tight transition-colors ${
                      isActive
                        ? "relative z-10 -mb-px border border-[#111111] border-b-[#ffffff] bg-[#ffffff] text-[#111111]"
                        : "border border-transparent text-[#6d6d6d] hover:text-[#111111]"
                    }`}
                  >
                    {party.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              {districtPartyCandidates[activeParty]?.length ? (
                <ul className="space-y-2">
                  {districtPartyCandidates[activeParty].map((candidate) => (
                    <li key={`${activeParty}-${candidate.name}-${candidate.post}`} className="flex flex-col">
                      <span className="text-lg font-semibold uppercase">{candidate.name}</span>
                      <span className="text-sm text-[#5a5a5a]">{candidate.postType}</span>
                      <span className="text-sm text-[#5a5a5a]">{candidate.post}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#5a5a5a]">
                  {language === "fr"
                    ? "Aucun candidat de ce parti dans ce district."
                    : "No candidates from this party in this district."}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function districtPostPrefix(num: number): string {
  if (typeof num !== "number" || num < 0) {
    return "";
  }
  const arr = Math.floor(num / 10);
  const seat = num % 10;
  return `${arr}.${seat}`;
}

export default MapPageClient;
