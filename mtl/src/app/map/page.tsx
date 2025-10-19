import { notFound, redirect } from "next/navigation";
import type { FeatureCollection, Geometry } from "geojson";
import districtsData from "@/data/districts-electoraux-2021.json" assert { type: "json" };
import { getAllDistrictSelections, type DistrictProperties } from "@/lib/districts";

const districtCollection = districtsData as FeatureCollection<Geometry, DistrictProperties>;

export default function MapRootPage() {
  const selections = getAllDistrictSelections(districtCollection);

  if (selections.length === 0) {
    notFound();
  }

  redirect(`/map/${selections[0].slug}`);
}
