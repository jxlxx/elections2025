"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import type { Language } from "@/lib/content";

export default function QuizPage() {
  const [language, setLanguage] = useState<Language>("en");

  return (
    <div className="min-h-screen text-[#111111]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-12 sm:px-10">
        <NavBar language={language} onLanguageChange={setLanguage} />
        <div className="mt-30 flex flex-1 items-start justify-center">
          <span className="flex items-center gap-3 text-2xl font-semibold uppercase tracking-wide">
            <span aria-hidden>⚠️</span>
            Under construction
            <span aria-hidden>⚠️</span>
          </span>
        </div>
      </div>
    </div>
  );
}
