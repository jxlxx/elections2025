"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import type { Language } from "@/lib/content";

type NavItem = {
  href: string;
  label: ReactNode;
  ariaLabel?: string;
};

type NavBarProps = {
  language: Language;
  onLanguageChange: (language: Language) => void;
};

const NAV_LINKS: NavItem[] = [
  {
    href: "/",
    label: (
      <>
        <span aria-hidden>&#8962;</span>
        <span className="sr-only">Home</span>
      </>
    ),
    ariaLabel: "Home",
  },
  { href: "/platforms", label: "platforms" },
  { href: "/map", label: "Map" },
  { href: "/quiz", label: "Quiz" },
];

export function NavBar({ language, onLanguageChange }: NavBarProps) {
  return (
    <header className="flex w-full items-center justify-between text-lg font-semibold uppercase">
      <nav className="flex items-center gap-1">
        {NAV_LINKS.map((link, index) => (
          <Fragment key={link.href}>
            <Link
              href={link.href}
              aria-label={link.ariaLabel}
              className="hover:text-[#111111]"
            >
              {link.label}
            </Link>
            {index < NAV_LINKS.length - 1 && <span>|</span>}
          </Fragment>
        ))}
      </nav>
      <div className="flex items-center gap-1 text-lg font-semibold uppercase">
        <button
          type="button"
          onClick={() => onLanguageChange("fr")}
          className={`transition-colors ${
            language === "fr" ? "text-[#111111]" : "text-[#7a7a7a] hover:text-[#111111]"
          }`}
        >
          FR
        </button>
        <span>|</span>
        <button
          type="button"
          onClick={() => onLanguageChange("en")}
          className={`transition-colors ${
            language === "en" ? "text-[#111111]" : "text-[#7a7a7a] hover:text-[#111111]"
          }`}
        >
          EN
        </button>
      </div>
    </header>
  );
}
