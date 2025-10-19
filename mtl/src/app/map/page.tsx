import { notFound } from "next/navigation";
import type { FeatureCollection, Geometry } from "geojson";
import districtsData from "@/data/districts-electoraux-2021.json" assert { type: "json" };
import candidatesData from "@/data/candidatures-2025.json" assert { type: "json" };
import postsData from "@/data/postes-electifs-2025.json" assert { type: "json" };
import {
  getAllDistrictSelections,
  type DistrictProperties,
  type SelectedDistrict,
} from "@/lib/districts";
import MapPageClient, { type CandidateRecord, type PostRecord } from "./MapPageClient";

const districtCollection = districtsData as FeatureCollection<Geometry, DistrictProperties>;
const selections = getAllDistrictSelections(districtCollection);

if (selections.length === 0) {
  notFound();
}

const initialSelected: SelectedDistrict = selections[0];
const candidates = candidatesData as CandidateRecord[];
const posts = postsData as PostRecord[];

export default function MapPage() {
  return (
    <MapPageClient initialSelected={initialSelected} candidates={candidates} posts={posts} />
  );
}
