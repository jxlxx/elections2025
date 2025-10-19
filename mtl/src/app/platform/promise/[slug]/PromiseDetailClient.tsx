"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { getSource, getText, Language } from "@/lib/content";

export type PromiseEntry = {
  id: string;
  party: string;
  category: string[];
  demographic: string[];
  land?: string[];
  details: string[];
  sources: string[];
};

type PromiseDetailClientProps = {
  promise: PromiseEntry;
};

export function PromiseDetailClient({ promise }: PromiseDetailClientProps) {
  const [language, setLanguage] = useState<Language>("en");

  const titleKey = `promise__${promise.id}__title`;
  const title = getText(titleKey, language);
  const partyLabel = getText(promise.party, language);

  const categoryLabels = useMemo(
    () => promise.category.map((category) => getText(category, language)),
    [promise.category, language]
  );

  const demographicLabels = useMemo(
    () => promise.demographic.map((demographic) => getText(demographic, language)),
    [promise.demographic, language]
  );

  const details = useMemo(
    () => promise.details.map((detailKey) => getText(detailKey, language)),
    [promise.details, language]
  );

  const sources = useMemo(
    () => promise.sources.map((sourceKey) => getSource(sourceKey, language)),
    [promise.sources, language]
  );

  return (
    <div className="min-h-screen text-[#111111]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10">
        <NavBar language={language} onLanguageChange={setLanguage} />

        <section className="space-y-4">
          <div className="flex items-end gap-6 border-b border-[#111111]">
            <div className="flex flex-1 items-center gap-4">
              <span className="relative -mb-[1px] inline-flex border border-[#111111] border-b-[#ffffff] bg-[#ffffff] px-2 py-2 uppercase font-semibold text-[#111111]">
                {partyLabel}
              </span>
            </div>
          </div>
        </section>

        <article className="space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold uppercase text-[#111111]">{title}</h1>
          </header>

          <section className="space-y-3">
            <div className="flex flex-wrap gap-2 text-sm font-medium text-[#5a5a5a]">
              {categoryLabels.map((label) => (
                <span key={label} className="rounded-full bg-[#dedede] px-3 py-1 text-[#1f1f1f]">
                  {label}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap gap-2 text-sm font-medium text-[#1f1f1f]">
              {demographicLabels.map((label) => (
                <span key={label} className="rounded border border-[#d4d4d4] px-3 py-1">
                  {label}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <ul className="list-disc space-y-2 pl-6 text-base font-medium leading-relaxed">
              {details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold uppercase text-[#4c4c4c]">Sources</h2>
            {sources.length === 0 ? (
              <p className="text-sm text-[#9b9b9b]">No source listed for this promise.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {sources.map((source) => (
                  <li key={`${promise.id}-${source.label}`}>
                    Found in {" "}
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[#111111] underline decoration-dotted underline-offset-4 hover:opacity-80"
                    >
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>

        <div className="pt-4">
          <Link
            href="/platforms"
            className="mx-auto flex w-fit items-center gap-2 border border-[#111111] bg-white px-6 py-2 text-lg font-semibold uppercase text-[#111111] hover:bg-[#f5f5f5]"
          >
            <span aria-hidden>←</span>
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}
