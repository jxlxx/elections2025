"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import promisesData from "@/data/promises.json";
import { getText, Language } from "@/lib/content";

const PARTY_TABS = [
  {
    id: "projet_montreal",
    label: "Projet Montreal",
    short: "PM",
  },
  {
    id: "transition_montreal",
    label: "Transition Montreal",
    short: "TM",
  },
  {
    id: "ensemble_montreal",
    label: "Ensemble Montreal",
    short: "EM",
  },
];

const ALL_CATEGORIES = Array.from(
  new Set(promisesData.flatMap((promise) => promise.category))
);
const ALL_DEMOGRAPHICS = Array.from(
  new Set(promisesData.flatMap((promise) => promise.demographic))
);

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1 text-sm font-medium transition-colors ${
        active
          ? "border-[#111111] bg-[#111111] text-[#f5f5f5]"
          : "border-[#d7d7d7] bg-white text-[#2d2d2d] hover:border-[#111111] hover:text-[#111111]"
      }`}
    >
      {label}
    </button>
  );
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [selectedParty, setSelectedParty] = useState<string>(PARTY_TABS[0]?.id ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDemographics, setSelectedDemographics] = useState<string[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);

  const filteredPromises = useMemo(() => {
    if (!selectedParty) {
      return [] as typeof promisesData;
    }

    return promisesData.filter((promise) => {
      if (promise.party !== selectedParty) {
        return false;
      }

      if (
        selectedCategories.length > 0 &&
        !selectedCategories.some((category) => promise.category.includes(category))
      ) {
        return false;
      }

      if (
        selectedDemographics.length > 0 &&
        !selectedDemographics.some((demo) => promise.demographic.includes(demo))
      ) {
        return false;
      }

      return true;
    });
  }, [selectedParty, selectedCategories, selectedDemographics]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of filteredPromises) {
      for (const category of entry.category) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }
    return counts;
  }, [filteredPromises]);

  const sortedCategories = useMemo(() => {
    return [...ALL_CATEGORIES].sort((a, b) => {
      const countA = categoryCounts.get(a) ?? 0;
      const countB = categoryCounts.get(b) ?? 0;

      if (countA === countB) {
        return a.localeCompare(b);
      }

      return countB - countA;
    });
  }, [categoryCounts]);

  const totalCategoryCount = sortedCategories.length;
  const totalDemographicCount = ALL_DEMOGRAPHICS.length;
  const selectedCategoryCount =
    selectedCategories.length > 0 ? selectedCategories.length : totalCategoryCount;
  const selectedDemographicCount =
    selectedDemographics.length > 0
      ? selectedDemographics.length
      : totalDemographicCount;

  const categorySectionOrder =
    selectedCategories.length > 0 ? selectedCategories : sortedCategories;

  const categorySections = categorySectionOrder.map((categoryKey) => {
    const promisesForCategory = filteredPromises.filter((promise) =>
      promise.category.includes(categoryKey)
    );

    const detailCount = promisesForCategory.reduce((total, promise) => {
      return total + promise.details.length;
    }, 0);

    return {
      categoryKey,
      promises: promisesForCategory,
      detailCount,
    };
  });

  const promisesSelectedSet = useMemo(() => {
    const ids = new Set<string>();

    if (selectedCategories.length > 0) {
      filteredPromises.forEach((promise) => {
        if (promise.category.some((category) => selectedCategories.includes(category))) {
          ids.add(promise.id);
        }
      });
    } else {
      filteredPromises.forEach((promise) => {
        ids.add(promise.id);
      });
    }

    return ids;
  }, [filteredPromises, selectedCategories]);

  const totalPromisesSelected = promisesSelectedSet.size;

  const toggleCategory = (value: string) => {
    setSelectedCategories((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value]
    );
  };

  const toggleDemographic = (value: string) => {
    setSelectedDemographics((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value]
    );
  };

  const emptyMessage =
    language === "fr"
      ? "Aucune promesse pour le moment."
      : "No promises listed yet.";

  const partyLabel = selectedParty ? getText(selectedParty, language) : "";

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111111]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#3f3f3f]">
              Election Day: November 2nd
            </p>
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#3f3f3f]">
              <button
                type="button"
                onClick={() => setLanguage("fr")}
                className={`transition-colors ${
                  language === "fr" ? "text-[#111111]" : "text-[#7a7a7a] hover:text-[#111111]"
                }`}
              >
                FR
              </button>
              <span>|</span>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`transition-colors ${
                  language === "en" ? "text-[#111111]" : "text-[#7a7a7a] hover:text-[#111111]"
                }`}
              >
                EN
              </button>
            </div>
          </div>

          <nav className="flex items-center justify-end gap-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#3f3f3f]">
            <a className="hover:text-[#111111]" href="#">
              Map
            </a>
            <a className="hover:text-[#111111]" href="#">
              Candidates
            </a>
            <a className="hover:text-[#111111]" href="#">
              Quiz
            </a>
            <a className="hover:text-[#111111]" href="#">
              About
            </a>
          </nav>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-[#3f3f3f]">
              <button
                type="button"
                onClick={() => {
                  setCategoriesOpen((prev) => !prev);
                  if (!categoriesOpen && peopleOpen) {
                    setPeopleOpen(false);
                  }
                }}
                className="flex items-center gap-2"
              >
                <span aria-hidden>≡</span>
                <span>
                  Categories ({selectedCategoryCount}/{totalCategoryCount})
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPeopleOpen((prev) => !prev);
                  if (!peopleOpen && categoriesOpen) {
                    setCategoriesOpen(false);
                  }
                }}
                className="flex items-center gap-2"
              >
                <span aria-hidden>≡</span>
                <span>People ({selectedDemographicCount}/{totalDemographicCount})</span>
              </button>
            </div>

            {categoriesOpen && (
              <div className="grid gap-3 rounded border border-[#dcdcdc] bg-white p-4 sm:grid-cols-2">
                {sortedCategories.map((category) => (
                  <FilterChip
                    key={category}
                    label={getText(category, language)}
                    active={selectedCategories.includes(category)}
                    onClick={() => toggleCategory(category)}
                  />
                ))}
              </div>
            )}

            {peopleOpen && (
              <div className="grid gap-3 rounded border border-[#dcdcdc] bg-white p-4 sm:grid-cols-2">
                {ALL_DEMOGRAPHICS.map((demographic) => (
                  <FilterChip
                    key={demographic}
                    label={getText(demographic, language)}
                    active={selectedDemographics.includes(demographic)}
                    onClick={() => toggleDemographic(demographic)}
                  />
                ))}
              </div>
            )}
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex items-center gap-6 border-b border-[#111111]">
            {PARTY_TABS.map((tab) => {
              const isActive = tab.id === selectedParty;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedParty(tab.id)}
                  className={`relative -mb-[1px] px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "border border-[#111111] border-b-[#f5f5f5] bg-[#f5f5f5] text-[#111111]"
                      : "border border-transparent text-[#6d6d6d] hover:text-[#111111]"
                  }`}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.short}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="text-3xl font-semibold text-[#111111]">{partyLabel}</h1>
            <span className="text-base text-[#4f4f4f]">
              {totalPromisesSelected === 1
                ? "1 promise"
                : `${totalPromisesSelected} promises`}
            </span>
          </div>
        </section>

        <main className="flex flex-col gap-10 pb-16">
          {categorySections.map(({ categoryKey, promises, detailCount }) => {
            const categoryLabel = getText(categoryKey, language);

            return (
              <section key={categoryKey} className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-xl font-semibold text-[#111111]">{categoryLabel}</h2>
                  <span className="text-sm text-[#6e6e6e]">[{detailCount}]</span>
                </div>

                {promises.length === 0 ? (
                  <p className="text-base font-medium text-[#9b9b9b]">{emptyMessage}</p>
                ) : (
                  <div className="space-y-6 border-l border-[#d0d0d0] pl-4">
                    {promises.map((promise) => {
                      const titleKey = `promise__${promise.id}__title`;
                      const title = getText(titleKey, language);

                      return (
                        <article key={`${categoryKey}-${promise.id}`} className="space-y-3">
                          <Link
                            href={`/promise/${promise.id}`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#111111] underline underline-offset-4 hover:opacity-80"
                          >
                            {title}
                            <span aria-hidden>↗</span>
                          </Link>
                          <ul className="list-disc space-y-2 pl-5 text-sm font-medium leading-relaxed">
                            {promise.details.map((detailKey) => (
                              <li key={detailKey}>{getText(detailKey, language)}</li>
                            ))}
                          </ul>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
}
