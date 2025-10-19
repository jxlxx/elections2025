"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import type { Language } from "@/lib/content";

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");

  return (
    <div className="min-h-screen text-[#111111]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10">
        <NavBar language={language} onLanguageChange={setLanguage} />
        <section className="space-y-4 text-base leading-relaxed">
          <h1 className="text-3xl font-semibold uppercase text-[#111111]">
            How does Montreal city council work?
          </h1>
          <p>
            City council is Montréal&#39;s primary decision-making body. It adopts municipal budgets,
            by-laws, motions, programs, subsidies and governmental agreements. Learn all about it
            here.
          </p>
          <p>City council is composed of 65 elected officials:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>the mayor of the city, who is also mayor of Ville-Marie</li>
            <li>The city council chair, who is also a city councillor</li>
            <li>18 borough mayors</li>
            <li>45 other city councillors</li>
          </ul>
          <p className="text-sm text-[#5a5a5a]">
            Source (verbatim):{' '}
            <a
              href="https://montreal.ca/en/city-government/city-council"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              montreal.ca/en/city-government/city-council
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
