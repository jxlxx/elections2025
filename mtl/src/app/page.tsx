"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NavBar } from "@/components/NavBar";
import promisesData from "@/data/promises.json";
import { getText, Language } from "@/lib/content";

type FilterModalType = "categories" | "people" | null;

const PARTY_TABS = [
  {
    id: "projet_montreal",
    label: "Projet Montréal",
    short: "PM",
  },
  {
    id: "transition_montreal",
    label: "Transition Montréal",
    short: "TM",
  },
  {
    id: "ensemble_montreal",
    label: "Ensemble Montréal",
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
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [activeFilterModal, setActiveFilterModal] = useState<FilterModalType>(null);

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

  const clearFilters = (type: FilterModalType) => {
    if (type === "categories") {
      setSelectedCategories([]);
    }
    if (type === "people") {
      setSelectedDemographics([]);
    }
  };

  const emptyMessage =
    language === "fr"
      ? "Aucune promesse pour le moment."
      : "No promises listed yet.";

  const partyLabel = selectedParty ? getText(selectedParty, language) : "";
  const filtersActive =
    selectedCategories.length > 0 || selectedDemographics.length > 0;

  const openFilterModal = (type: FilterModalType) => {
    if (!type) return;
    setActiveFilterModal(type);
    setFilterMenuOpen(false);
  };

  const closeModal = () => setActiveFilterModal(null);

  return (
    <div className="min-h-screen  text-[#111111]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10">
        <NavBar language={language} onLanguageChange={setLanguage} />

        <section className="space-y-4">
          <div className="flex items-center gap-6 border-b border-[#111111]">
            <div className="flex flex-1 items-center gap-4">
              {PARTY_TABS.map((tab) => {
                const isActive = tab.id === selectedParty;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedParty(tab.id)}
                    className={`relative -mb-[1px] px-2 py-2 uppercase font-semibold transition-colors ${
                      isActive
                        ? "border border-[#111111] border-b-[#ffffff] bg-[#ffffff] text-[#111111]"
                        : "border border-transparent text-[#6d6d6d] hover:text-[#111111]"
                    }`}
                  >
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.short}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={filterMenuOpen}
                onClick={() => setFilterMenuOpen((prev) => !prev)}
                className="relative flex items-center gap-2 text-lg font-semibold uppercase"
              >
                <span aria-hidden>≡</span>
                <span className="sr-only">Filters</span>
                {filtersActive && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#111111]" aria-hidden />
                )}
              </button>

              {filterMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 border border-[#111111] bg-white">
                  <button
                    type="button"
                    onClick={() => openFilterModal("categories")}
                    className="flex w-full items-center justify-between px-4 py-3 text-lg font-semibold uppercase hover:bg-[#f0f0f0]"
                  >
                    <span>CATEGORIES</span>
                    <span>
                      {selectedCategoryCount}/{totalCategoryCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openFilterModal("people")}
                    className="flex w-full items-center justify-between px-4 py-3 text-lg font-semibold uppercase hover:bg-[#f0f0f0]"
                  >
                    <span>PEOPLE</span>
                    <span>
                      {selectedDemographicCount}/{totalDemographicCount}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="text-base text-[#4f4f4f]">
              {totalPromisesSelected === 1
                ? "1 promise total"
                : `${totalPromisesSelected} promises total`}
            </span>
          </div>
        </section>

        <main className="flex flex-col gap-10 pb-16">
          {categorySections.map(({ categoryKey, promises, detailCount }) => {
            const categoryLabel = getText(categoryKey, language);

            return (
              <section key={categoryKey} className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <h1 className="text-3xl font-semibold text-[#111111] uppercase">{categoryLabel}</h1>
                  <span className="text-2xl font-semibold text-[#111111] uppercase">[{detailCount}]</span>
                </div>

                {promises.length === 0 ? (
                  <p className="text-base font-medium text-[#9b9b9b]">{emptyMessage}</p>
                ) : (
                  <div className="space-y-6 pl-4">
                    {promises.map((promise) => {
                      const titleKey = `promise__${promise.id}__title`;
                      const title = getText(titleKey, language);

                      return (
                        <article key={`${categoryKey}-${promise.id}`}>
                          <Link
                            href={`/promise/${promise.id}`}
                            className="inline-flex uppercase items-center text-lg font-semibold text-[#111111] underline underline-offset-4 hover:opacity-50"
                          >
                            {">"} {title}
                          </Link>
                          <ul className="list-disc space-y-2 pl-12 text-m leading-relaxed ">
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

      {activeFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="max-h-full w-full max-w-4xl overflow-hidden border border-[#111111] bg-white">
            <header className="flex items-center justify-between border-b border-[#111111] px-6 py-4">
              <h2 className="text-lg font-semibold uppercase">
                {activeFilterModal === "categories" ? "Categories" : "People"}
              </h2>
              <div className="flex items-center gap-4 text-lg font-semibold uppercase">
                <button
                  type="button"
                  onClick={() => clearFilters(activeFilterModal)}
                  className="text-[#7a7a7a] hover:text-[#111111]"
                >
                  Clear
                </button>
                <button type="button" onClick={closeModal} className="text-[#111111]">
                  Done
                </button>
              </div>
            </header>
            <div className="max-h-[60vh] overflow-auto border-b border-[#111111] p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {activeFilterModal === "categories"
                  ? sortedCategories.map((category) => (
                      <FilterChip
                        key={category}
                        label={getText(category, language)}
                        active={selectedCategories.includes(category)}
                        onClick={() => toggleCategory(category)}
                      />
                    ))
                  : ALL_DEMOGRAPHICS.map((demographic) => (
                      <FilterChip
                        key={demographic}
                        label={getText(demographic, language)}
                        active={selectedDemographics.includes(demographic)}
                        onClick={() => toggleDemographic(demographic)}
                      />
                    ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
