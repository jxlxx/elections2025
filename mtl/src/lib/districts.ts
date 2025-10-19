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

export function toSelectedDistrict(feature: DistrictFeature | undefined): SelectedDistrict {
  if (!feature) {
    return { id: -1, name: null };
  }

  const idValue = typeof feature.properties?.id === "number" ? feature.properties.id : -1;

  return {
    id: idValue,
    name: formatDistrictName(feature.properties),
  };
}
