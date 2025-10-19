"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { SectionTitle } from "@/components/SectionTitle";
import type { PartyTooltipEntry } from "@/components/VotingDistrictMap";
import type { SelectedDistrict } from "@/lib/districts";
import type { Language } from "@/lib/content";

const VotingDistrictMap = dynamic(() => import("@/components/VotingDistrictMap"), {
  ssr: false,
  loading: () => <div className="h-[32rem] w-full border border-[#cccccc]" />,
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

const PARTY_TOOLTIP_ENTRIES: PartyTooltipEntry[] = PARTY_TABS.map((party) => ({
  id: party.id,
  label: party.label,
}));

const PARTY_SOURCE_LOOKUP = new Map(PARTY_TABS.map((party) => [party.source, party.id] as const));

type CandidateDisplay = {
  name: string;
  post: string;
  postType: string;
  slug: string;
};

type NormalizedCandidate = CandidateDisplay & {
  partyId: string;
  post_no: string;
};

type DistrictPartyData = {
  candidatesByParty: Record<string, CandidateDisplay[]>;
  countsByParty: Record<string, number>;
};

export function MapPageClient({ initialSelected, candidates, posts }: MapPageClientProps) {
  const [language, setLanguage] = useState<Language>("en");
  const [selectedDistrict, setSelectedDistrict] = useState<SelectedDistrict>(initialSelected);
  const [activeParty, setActiveParty] = useState<string>(PARTY_TABS[0]?.id ?? "");

  useEffect(() => {
    setSelectedDistrict(initialSelected);
  }, [initialSelected]);

  const postsByNo = useMemo(() => new Map(posts.map((post) => [post.no, post])), [posts]);

  const normalizedCandidates = useMemo(() => {
    return candidates
      .map((candidate) => {
        const partyId = PARTY_SOURCE_LOOKUP.get(candidate.party);
        if (!partyId) {
          return null;
        }
        const post = postsByNo.get(candidate.post_no);
        const firstName = candidate.first_name.replace(/\s+/g, " ").trim();
        const lastName = candidate.last_name.replace(/\s+/g, " ").trim();
        const name = `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();

        return {
          partyId,
          post_no: candidate.post_no,
          name,
          post: post?.poste_en ?? candidate.post_no,
          postType: post?.type_en ?? "",
          slug: slugifyCandidateName(firstName, lastName),
        } satisfies NormalizedCandidate;
      })
      .filter(Boolean) as NormalizedCandidate[];
  }, [candidates, postsByNo]);

  const deriveDistrictData = useMemo(() => {
    type CandidateWithKey = CandidateDisplay & { postKey: number };
    const cache = new Map<number, DistrictPartyData>();

    const createCandidateBuckets = () =>
      PARTY_TABS.reduce<Record<string, CandidateWithKey[]>>((acc, party) => {
        acc[party.id] = [];
        return acc;
      }, {});

    const createCounts = () =>
      PARTY_TABS.reduce<Record<string, number>>((acc, party) => {
        acc[party.id] = 0;
        return acc;
      }, {});

    return (districtNum: number): DistrictPartyData => {
      if (cache.has(districtNum)) {
        return cache.get(districtNum)!;
      }

      const candidateBuckets = createCandidateBuckets();
      const countsByParty = createCounts();

      const prefix = districtPostPrefix(districtNum);
      const relevantPosts = prefix
        ? posts.filter((post) => post.no.startsWith(prefix))
        : [];
      const relevantPostNos = relevantPosts.map((post) => post.no);
      const relevantSet = new Set(relevantPostNos);
      const sortKey = new Map(relevantPostNos.map((no, index) => [no, index]));

      if (relevantSet.size > 0) {
        normalizedCandidates.forEach((candidate) => {
          if (!relevantSet.has(candidate.post_no)) {
            return;
          }
          const bucket = candidateBuckets[candidate.partyId];
          if (!bucket) {
            return;
          }
          bucket.push({
            name: candidate.name,
            post: candidate.post,
            postType: candidate.postType,
            slug: candidate.slug,
            postKey: sortKey.get(candidate.post_no) ?? Number.MAX_SAFE_INTEGER,
          });
        });
      }

      const candidatesByParty: Record<string, CandidateDisplay[]> = {};

      for (const party of PARTY_TABS) {
        const bucket = candidateBuckets[party.id];
        const ordered = bucket
          .sort((a, b) => a.postKey - b.postKey || a.name.localeCompare(b.name))
          .map((candidate) => ({
            name: candidate.name,
            post: candidate.post,
            postType: candidate.postType,
            slug: candidate.slug,
          }));
        candidatesByParty[party.id] = ordered;
        countsByParty[party.id] = ordered.length;
      }

      const data: DistrictPartyData = { candidatesByParty, countsByParty };
      cache.set(districtNum, data);
      return data;
    };
  }, [normalizedCandidates, posts]);

  const districtLabel = useMemo(() => {
    if (selectedDistrict.name) {
      return selectedDistrict.name;
    }
    return language === "fr" ? "Sélectionnez un district" : "Select a district";
  }, [selectedDistrict, language]);

  const handleSelect = (district: SelectedDistrict) => {
    setSelectedDistrict(district);
  };

  const selectedDistrictData = useMemo(
    () => deriveDistrictData(selectedDistrict.num),
    [deriveDistrictData, selectedDistrict.num]
  );

  const getPartyCounts = useCallback(
    (districtNum: number) => deriveDistrictData(districtNum).countsByParty,
    [deriveDistrictData]
  );

  const districtPartyCandidates = selectedDistrictData.candidatesByParty;

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
            getPartyCounts={getPartyCounts}
            partyTooltipEntries={PARTY_TOOLTIP_ENTRIES}
          />

          <div className="pt-2">
            <SectionTitle className="text-2xl">{districtLabel ?? ""}</SectionTitle>
          </div>

          <div className="space-y-4">
            <div className="relative flex flex-wrap items-end gap-3 border-b border-[#cccccc]">
              {PARTY_TABS.map((party) => {
                const isActive = party.id === activeParty;
                return (
                  <button
                    key={party.id}
                    type="button"
                    onClick={() => setActiveParty(party.id)}
                    className={`uppercase font-semibold px-3 py-2 leading-tight transition-colors ${
                      isActive
                        ? "relative z-10 -mb-px border border-[#cccccc] theme-tab-active"
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
                  <a
                    href={getCandidateProfileUrl(candidate.slug, language)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold uppercase hover:underline"
                  >
                    {candidate.name}
                  </a>
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

function slugifyCandidateName(firstName: string, lastName: string): string {
  const combined = `${firstName} ${lastName}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return combined.length > 0 ? combined : "candidate";
}

function getCandidateProfileUrl(slug: string, language: Language): string {
  const langSegment = language === "fr" ? "fr" : "en";
  return `https://elections.montreal.ca/${langSegment}/candidates/${slug}/`;
}

export default MapPageClient;
