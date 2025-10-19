"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import type { Language } from "@/lib/content";

export default function MapPage() {
  const [language, setLanguage] = useState<Language>("en");

  return (
    <div className="min-h-screen text-[#111111]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10">
        <NavBar language={language} onLanguageChange={setLanguage} />
      </div>
    </div>
  );
}
