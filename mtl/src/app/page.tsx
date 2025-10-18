"use client";

import { useMemo, useState } from "react";
import promisesData from "@/data/promises.json";
import contentEn from "@/data/content_en.json";
import contentFr from "@/data/content_fr.json";

type PromiseRecord = typeof promisesData[number];
type Language = "en" | "fr";
type ContentValue = string | { label: string; url: string };

type SourceLink = { label: string; url: string };

type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

const CONTENT_BY_LANG: Record<Language, Record<string, ContentValue>> = {
  en: contentEn as Record<string, ContentValue>,
  fr: contentFr as Record<string, ContentValue>,
};

const ALL_PARTIES = Array.from(new Set(promisesData.map((promise) => promise.party)));
const ALL_CATEGORIES = Array.from(
  new Set(promisesData.flatMap((promise) => promise.category))
);
const ALL_DEMOGRAPHICS = Array.from(
  new Set(promisesData.flatMap((promise) => promise.demographic))
);

function getText(key: string, language: Language): string {
  const value = CONTENT_BY_LANG[language][key];
  if (!value) {
    return key;
  }

  return typeof value === "string" ? value : value.label;
}

function getSource(key: string, language: Language): SourceLink {
  const value = CONTENT_BY_LANG[language][key];

  if (value && typeof value === "object" && "label" in value && "url" in value) {
    return value as SourceLink;
  }

  const fallbackLabel = typeof value === "string" ? value : key;

  return {
    label: fallbackLabel,
    url: "#",
  };
}

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

  const categoriesForDisplay =
    selectedCategories.length > 0 ? selectedCategories : ALL_CATEGORIES;

  const categorySections = categoriesForDisplay.map((categoryKey) => {
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
            <p className="text-xs uppercase tracking-[0.35em] text-[#636363]">
              Election Day: November 1st
            </p>
            <h1 className="text-3xl font-semibold text-[#111111]">
              {partyLabel || "Montreal Platforms"}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#636363]">
            <button
              type="button"
              onClick={() => setLanguage("fr")}
              className={`rounded px-2 py-1 transition-colors ${
                language === "fr" ? "bg-[#111111] text-[#f5f5f5]" : "hover:bg-[#e1e1e1]"
              }`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`rounded px-2 py-1 transition-colors ${
                language === "en" ? "bg-[#111111] text-[#f5f5f5]" : "hover:bg-[#e1e1e1]"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-[0.3em] text-[#8a8a8a]">Parties</span>
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
            <span className="text-xs uppercase tracking-[0.3em] text-[#8a8a8a]">
              Categories
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {ALL_CATEGORIES.map((category) => (
                <FilterChip
                  key={category}
                  label={getText(category, language)}
                  active={selectedCategories.includes(category)}
                  onClick={() => toggleCategory(category)}
                />
              ))}
            </div>
            <span className="text-xs text-[#8a8a8a]">… see all</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-[0.3em] text-[#8a8a8a]">
              People
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {ALL_DEMOGRAPHICS.map((demographic) => (
                <FilterChip
                  key={demographic}
                  label={getText(demographic, language)}
                  active={selectedDemographics.includes(demographic)}
                  onClick={() => toggleDemographic(demographic)}
                />
              ))}
            </div>
            <span className="text-xs text-[#8a8a8a]">… see all</span>
          </div>
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
                <p className="text-sm text-[#9b9b9b]">{emptyMessage}</p>
              ) : (
                <div className="space-y-6 border-l border-[#d0d0d0] pl-4">
                  {promises.map((promise) => {
                    const titleKey = `promise__${promise.id}__title`;
                    const title = getText(titleKey, language);

                    return (
                      <article key={`${categoryKey}-${promise.id}`} className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.25em] text-[#747474]">
                          {title}
                        </p>
                        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
                          {promise.details.map((detailKey) => (
                            <li key={detailKey}>{getText(detailKey, language)}</li>
                          ))}
                        </ul>
                        {promise.sources.length > 0 && (
                          <div className="flex flex-wrap gap-3 text-xs text-[#6e6e6e]">
                            {promise.sources.map((sourceKey) => {
                              const source = getSource(sourceKey, language);
                              return (
                                <a
                                  key={sourceKey}
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline decoration-dotted underline-offset-4 hover:text-[#111111]"
                                >
                                  {source.label}
                                </a>
                              );
                            })}
                          </div>
                        )}
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
