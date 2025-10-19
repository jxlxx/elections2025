"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import promisesData from "@/data/promises.json";
import { getText, Language } from "@/lib/content";

const ALL_PARTIES = Array.from(new Set(promisesData.map((promise) => promise.party)));
const ALL_CATEGORIES = Array.from(
  new Set(promisesData.flatMap((promise) => promise.category))
);
const ALL_DEMOGRAPHICS = Array.from(
  new Set(promisesData.flatMap((promise) => promise.demographic))
);

type PromiseRecord = typeof promisesData[number];

type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1 text-sm transition-colors ${
        active
          ? "border-[#111111] bg-[#111111] text-[#f5f5f5]"
          : "border-transparent bg-[#e7e7e7] text-[#222222] hover:bg-[#dcdcdc]"
      }`}
    >
      {label}
    </button>
  );
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [selectedParty, setSelectedParty] = useState<string>(ALL_PARTIES[0] ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDemographics, setSelectedDemographics] = useState<string[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllDemographics, setShowAllDemographics] = useState(false);

  const partyLabel = selectedParty ? getText(selectedParty, language) : "";

  const filteredPromises = useMemo(() => {
    if (!selectedParty) {
      return [] as PromiseRecord[];
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
    const sorted = [...ALL_CATEGORIES].sort((a, b) => {
      const countA = categoryCounts.get(a) ?? 0;
      const countB = categoryCounts.get(b) ?? 0;

      if (countA === countB) {
        return a.localeCompare(b);
      }

      return countB - countA;
    });

    return sorted;
  }, [categoryCounts]);

  const totalCategoryCount = sortedCategories.length;
  const totalDemographicCount = ALL_DEMOGRAPHICS.length;

  const categoryChipOptions = useMemo(() => {
    const base = showAllCategories ? sortedCategories : sortedCategories.slice(0, 5);
    if (selectedCategories.length === 0) {
      return base;
    }

    const seen = new Set(base);
    const extras = selectedCategories.filter((category) => !seen.has(category));
    return [...extras, ...base];
  }, [showAllCategories, sortedCategories, selectedCategories]);

  const categorySectionOrder = useMemo(() => {
    if (selectedCategories.length > 0) {
      return selectedCategories;
    }

    return sortedCategories;
  }, [selectedCategories, sortedCategories]);

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

  const selectedCategoryCount = selectedCategories.length > 0 ? selectedCategories.length : totalCategoryCount;
  const selectedDemographicCount = selectedDemographics.length > 0 ? selectedDemographics.length : totalDemographicCount;

  const demographicBaseOptions = useMemo(() => {
    const base = showAllDemographics
      ? ALL_DEMOGRAPHICS
      : ALL_DEMOGRAPHICS.slice(0, 5);

    return base;
  }, [showAllDemographics]);

  const demographicChipOptions = useMemo(() => {
    const seen = new Set(demographicBaseOptions);
    const extras = selectedDemographics.filter((demographic) => !seen.has(demographic));
    return [...extras, ...demographicBaseOptions];
  }, [demographicBaseOptions, selectedDemographics]);

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

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10">
      <header className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-base font-semibold text-[#4f4f4f]">
              Election Day: November 1st
            </p>
          </div>
          <div className="flex items-center gap-2 text-base font-semibold text-[#4a4a4a]">
            <button
              type="button"
              onClick={() => setLanguage("fr")}
              className={`rounded px-3 py-1 transition-colors ${
                language === "fr" ? "bg-[#111111] text-[#f5f5f5]" : "hover:bg-[#e1e1e1]"
              }`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`rounded px-3 py-1 transition-colors ${
                language === "en" ? "bg-[#111111] text-[#f5f5f5]" : "hover:bg-[#e1e1e1]"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-base font-semibold text-[#3f3f3f]">Parties</span>
            <div className="flex flex-wrap items-center gap-2">
              {ALL_PARTIES.map((party) => (
                <FilterChip
                  key={party}
                  label={getText(party, language)}
                  active={selectedParty === party}
                  onClick={() => setSelectedParty(party)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-base font-semibold text-[#3f3f3f]">
              Categories ({selectedCategoryCount}/{totalCategoryCount})
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {categoryChipOptions.map((category) => (
                <FilterChip
                  key={category}
                  label={getText(category, language)}
                  active={selectedCategories.includes(category)}
                  onClick={() => toggleCategory(category)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowAllCategories((previous) => !previous)}
              className="text-base text-[#6b6b6b] underline underline-offset-4 hover:text-[#111111]"
            >
              {showAllCategories ? "hide" : "… see all"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-base font-semibold text-[#3f3f3f]">
              People ({selectedDemographicCount}/{totalDemographicCount})
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {demographicChipOptions.map((demographic) => (
                <FilterChip
                  key={demographic}
                  label={getText(demographic, language)}
                  active={selectedDemographics.includes(demographic)}
                  onClick={() => toggleDemographic(demographic)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowAllDemographics((previous) => !previous)}
              className="text-base text-[#6b6b6b] underline underline-offset-4 hover:text-[#111111]"
            >
              {showAllDemographics ? "hide" : "… see all"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-[#dcdcdc] pt-4">
          <h1 className="text-3xl font-semibold text-[#111111]">{partyLabel || "Montreal Platforms"}</h1>
          <span className="text-base text-[#4f4f4f]">
            {totalPromisesSelected === 1 ? "1 promise" : `${totalPromisesSelected} promises`}
          </span>
        </div>
      </header>

      <main className="flex flex-col gap-10">
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
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f62fe] underline underline-offset-4 hover:text-[#083b9b]"
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
  );
}
