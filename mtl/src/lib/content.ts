import contentEn from "@/data/content_en.json";
import contentFr from "@/data/content_fr.json";

export type Language = "en" | "fr";
export type ContentValue = string | { label: string; url: string };
export type SourceLink = { label: string; url: string };

type ContentDictionary = Record<string, ContentValue>;

export const CONTENT_BY_LANG: Record<Language, ContentDictionary> = {
  en: contentEn as ContentDictionary,
  fr: contentFr as ContentDictionary,
};

export function getText(key: string, language: Language): string {
  const value = CONTENT_BY_LANG[language][key];

  if (!value) {
    return key;
  }

  return typeof value === "string" ? value : value.label;
}

export function getSource(key: string, language: Language): SourceLink {
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
