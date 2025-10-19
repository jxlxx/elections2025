import type { Feature, FeatureCollection, Geometry } from "geojson";

export type DistrictProperties = {
  arrondissement?: string;
  nom?: string;
  id?: number;
  municipalite?: number;
  [key: string]: unknown;
};

export type DistrictFeature = Feature<Geometry, DistrictProperties>;

export type SelectedDistrict = {
  id: number;
  name: string | null;
  slug: string;
  num: number;
};

export const MONTREAL_MUNICIPALITY_ID = 66023;

export function filterMontrealDistricts(collection: FeatureCollection<Geometry, DistrictProperties>): DistrictFeature[] {
  return collection.features.filter(
    (feature) => feature.properties?.municipalite === MONTREAL_MUNICIPALITY_ID
  );
}

export function formatDistrictName(properties?: DistrictProperties | null): string | null {
  if (!properties) {
    return null;
  }

  const arrondissement = properties.arrondissement?.trim();
  const nom = properties.nom?.trim();

  if (arrondissement && nom && arrondissement !== nom) {
    return `${arrondissement} (${nom})`;
  }

  return arrondissement ?? nom ?? null;
}

function slugify(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : "district";
}

export function getDistrictSlug(properties?: DistrictProperties | null, fallbackId?: number): string {
  if (!properties) {
    return fallbackId !== undefined ? `district-${fallbackId}` : "district";
  }

  const parts = [properties.arrondissement, properties.nom]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (parts.length === 0) {
    return fallbackId !== undefined ? `district-${fallbackId}` : "district";
  }

  return slugify(parts.join("-"));
}

export function toSelectedDistrict(feature: DistrictFeature | undefined): SelectedDistrict {
  if (!feature) {
    return { id: -1, name: null, slug: "district", num: -1 };
  }

  const idValue = typeof feature.properties?.id === "number" ? feature.properties.id : -1;
  const numValue = typeof feature.properties?.num === "number" ? feature.properties.num : -1;

  return {
    id: idValue,
    name: formatDistrictName(feature.properties),
    slug: getDistrictSlug(feature.properties, idValue),
    num: numValue,
  };
}

export function findDistrictBySlug(
  collection: FeatureCollection<Geometry, DistrictProperties>,
  slug: string
): DistrictFeature | undefined {
  const normalized = slug.trim().toLowerCase();
  return filterMontrealDistricts(collection).find((feature) => {
    const featureSlug = getDistrictSlug(feature.properties, feature.properties?.id as number | undefined);
    return featureSlug === normalized;
  });
}

export function getAllDistrictSelections(
  collection: FeatureCollection<Geometry, DistrictProperties>
): SelectedDistrict[] {
  return filterMontrealDistricts(collection).map((feature) => toSelectedDistrict(feature));
}
