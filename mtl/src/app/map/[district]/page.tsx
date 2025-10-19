import { notFound, redirect } from "next/navigation";
import type { FeatureCollection, Geometry } from "geojson";
import districtsData from "@/data/districts-electoraux-2021.json" assert { type: "json" };
import {
  findDistrictBySlug,
  getAllDistrictSelections,
  toSelectedDistrict,
  type DistrictFeature,
  type DistrictProperties,
} from "@/lib/districts";
import MapPageClient from "../MapPageClient";

const districtCollection = districtsData as FeatureCollection<Geometry, DistrictProperties>;

export function generateStaticParams() {
  return getAllDistrictSelections(districtCollection).map((district) => ({ district: district.slug }));
}

export default async function MapDistrictPage({
  params,
}: {
  params: Promise<{ district: string }> | { district: string };
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.district?.toLowerCase() ?? "";
  const feature = findDistrictBySlug(districtCollection, slug);

  if (!feature) {
    const fallback = getAllDistrictSelections(districtCollection)[0];
    if (!fallback) {
      notFound();
    }
    redirect(`/map/${fallback.slug}`);
    return null;
  }

  const selected = toSelectedDistrict(feature as DistrictFeature);

  return <MapPageClient initialSelected={selected} />;
}
