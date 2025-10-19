"use client";

import "leaflet/dist/leaflet.css";

import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Layer, Map as LeafletMap, Path, PathOptions } from "leaflet";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import electoralDistricts from "@/data/districts-electoraux-2021.json" assert { type: "json" };
import {
  filterMontrealDistricts,
  formatDistrictName,
  type DistrictFeature,
  type DistrictProperties,
  type SelectedDistrict,
} from "@/lib/districts";

const DEFAULT_CENTER: [number, number] = [45.50884, -73.56168];

const BASE_STYLE: PathOptions = {
  color: "#0c4a3f",
  weight: 1,
  fillColor: "#24a393",
  fillOpacity: 0.25,
};

const HOVER_STYLE: PathOptions = {
  ...BASE_STYLE,
  fillOpacity: 0.4,
  weight: 2,
};

const SELECTED_STYLE: PathOptions = {
  ...BASE_STYLE,
  fillColor: "#125d53",
  fillOpacity: 0.75,
  weight: 3,
  color: "#063c32",
};

const SELECTED_HOVER_STYLE: PathOptions = {
  ...SELECTED_STYLE,
  fillOpacity: 0.85,
};

const districtCollection = electoralDistricts as FeatureCollection<Geometry, DistrictProperties>;
const FILTERED_FEATURES: DistrictFeature[] = filterMontrealDistricts(districtCollection);

function computeBounds(features: DistrictFeature[]) {
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;

  const inspect = (coords: unknown) => {
    if (Array.isArray(coords)) {
      if (typeof coords[0] === "number" && typeof coords[1] === "number") {
        const [lng, lat] = coords as [number, number];
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        }
      } else {
        (coords as unknown[]).forEach(inspect);
      }
    }
  };

  features.forEach((feature) => {
    if (feature.geometry) {
      inspect(feature.geometry.coordinates);
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

  return [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]];
}

export type VotingDistrictMapProps = {
  selected: SelectedDistrict;
  onDistrictSelect?: (district: SelectedDistrict) => void;
};

export function VotingDistrictMap({ selected, onDistrictSelect }: VotingDistrictMapProps) {
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const bounds = useMemo(() => computeBounds(FILTERED_FEATURES), []);
  const layerByIdRef = useRef(new Map<number, Path>());
  const selectedIdRef = useRef(selected.id);

  useEffect(() => {
    selectedIdRef.current = selected.id;
    layerByIdRef.current.forEach((layer, id) => {
      applyStyleForLayer(id, layer, false, selectedIdRef.current);
      if (id === selectedIdRef.current) {
        layer.bringToFront();
      }
    });
  }, [selected.id]);

  useEffect(() => {
    if (mapInstance && bounds) {
      mapInstance.fitBounds(bounds, { padding: [16, 16] });
    }
  }, [mapInstance, bounds]);

  const onEachFeature = (feature: DistrictFeature, layer: Layer) => {
    const districtId = typeof feature.properties?.id === "number" ? feature.properties.id : null;
    const label = formatDistrictName(feature.properties);
    const pathLayer = layer as Path;

    if (districtId !== null) {
      layerByIdRef.current.set(districtId, pathLayer);
      layer.on("remove", () => {
        layerByIdRef.current.delete(districtId);
      });
    }

    applyStyleForLayer(districtId, pathLayer, false, selectedIdRef.current);

    pathLayer.on({
      mouseover: () => {
        applyStyleForLayer(districtId, pathLayer, true, selectedIdRef.current);
      },
      mouseout: () => {
        applyStyleForLayer(districtId, pathLayer, false, selectedIdRef.current);
      },
      click: () => {
        if (districtId !== null) {
          selectedIdRef.current = districtId;
          layerByIdRef.current.forEach((storedLayer, storedId) => {
            applyStyleForLayer(storedId, storedLayer, false, selectedIdRef.current);
          });
          applyStyleForLayer(districtId, pathLayer, false, selectedIdRef.current);
          onDistrictSelect?.({ id: districtId, name: label });
        }
      },
    });
  };

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
          attribution='&copy; <a href="https://cartodb.com/basemaps/">Carto</a> contributors, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <GeoJSON
          data={{ ...districtCollection, features: FILTERED_FEATURES }}
          onEachFeature={onEachFeature}
          style={() => BASE_STYLE}
        />
      </MapContainer>
    </div>
  );
}

function applyStyleForLayer(
  districtId: number | null,
  layer: Path,
  isHovering: boolean,
  selectedId: number
) {
  const isSelected = districtId !== null && districtId === selectedId;
  if (isSelected) {
    layer.setStyle(isHovering ? SELECTED_HOVER_STYLE : SELECTED_STYLE);
  } else {
    layer.setStyle(isHovering ? HOVER_STYLE : BASE_STYLE);
  }
  if (isSelected) {
    layer.bringToFront();
  }
}

export default VotingDistrictMap;
