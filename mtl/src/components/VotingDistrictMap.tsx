"use client";

import "leaflet/dist/leaflet.css";

import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Map as LeafletMap } from "leaflet";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import electoralDistricts from "@/data/districts-electoraux-2021.json" assert { type: "json" };

const DEFAULT_CENTER: [number, number] = [45.50884, -73.56168];

type BoundsTuple = [[number, number], [number, number]];

const districts = electoralDistricts as FeatureCollection<Geometry>;

function computeBounds(collection: FeatureCollection<Geometry>): BoundsTuple | null {
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;

  function inspectCoords(coords: unknown): void {
    if (Array.isArray(coords) && coords.length > 0) {
      if (typeof coords[0] === "number" && typeof coords[1] === "number") {
        const [lng, lat] = coords as [number, number];
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return;
        }
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      } else {
        (coords as unknown[]).forEach(inspectCoords);
      }
    }
  }

  collection.features.forEach((feature: Feature<Geometry>) => {
    if (feature.geometry) {
      inspectCoords(feature.geometry.coordinates);
    }
  });

  if (
    minLat === Number.POSITIVE_INFINITY ||
    maxLat === Number.NEGATIVE_INFINITY ||
    minLng === Number.POSITIVE_INFINITY ||
    maxLng === Number.NEGATIVE_INFINITY
  ) {
    return null;
  }

  return [[minLat, minLng], [maxLat, maxLng]];
}

export function VotingDistrictMap() {
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const bounds = useMemo(() => computeBounds(districts), []);

  useEffect(() => {
    if (mapInstance && bounds) {
      mapInstance.fitBounds(bounds, { padding: [16, 16] });
    }
  }, [mapInstance, bounds]);

  return (
    <div className="h-[32rem] w-full border border-[#111111]">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={11}
        scrollWheelZoom={false}
        className="h-full w-full"
        whenCreated={setMapInstance}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          data={districts}
          style={() => ({
            color: "#0c4a3f",
            weight: 1,
            fillColor: "#24a393",
            fillOpacity: 0.35,
          })}
        />
      </MapContainer>
    </div>
  );
}

export default VotingDistrictMap;
