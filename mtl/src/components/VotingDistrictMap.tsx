"use client";

import "leaflet/dist/leaflet.css";

import type { FeatureCollection, Geometry } from "geojson";
import type { Layer, Map as LeafletMap, Path, PathOptions } from "leaflet";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import electoralDistricts from "@/data/districts-electoraux-2021.json" assert { type: "json" };
import {
  filterMontrealDistricts,
  formatDistrictName,
  getDistrictSlug,
  type DistrictFeature,
  type DistrictProperties,
  type SelectedDistrict,
} from "@/lib/districts";

const DEFAULT_CENTER: [number, number] = [45.50884, -73.56168];

type StyleBundle = {
  base: PathOptions;
  hover: PathOptions;
  selected: PathOptions;
  selectedHover: PathOptions;
};

function createStyleBundle(theme: Theme): StyleBundle {
  if (theme === "dark") {
    const base: PathOptions = {
      color: "#ffb36b",
      weight: 1,
      fillColor: "#f7a55a",
      fillOpacity: 0.35,
    };
    const hover: PathOptions = {
      ...base,
      fillOpacity: 0.5,
      weight: 2,
    };
    const selected: PathOptions = {
      ...base,
      color: "#ffd5a2",
      fillColor: "#ff8f2a",
      fillOpacity: 0.8,
      weight: 3,
    };
    const selectedHover: PathOptions = {
      ...selected,
      fillOpacity: 0.9,
    };
    return { base, hover, selected, selectedHover };
  }

  const base: PathOptions = {
    color: "#a03a30",
    weight: 1,
    fillColor: "#f38a72",
    fillOpacity: 0.25,
  };
  const hover: PathOptions = {
    ...base,
    fillOpacity: 0.4,
    weight: 2,
  };
  const selected: PathOptions = {
    ...base,
    color: "#792a23",
    fillColor: "#e76049",
    fillOpacity: 0.75,
    weight: 3,
  };
  const selectedHover: PathOptions = {
    ...selected,
    fillOpacity: 0.85,
  };

  return { base, hover, selected, selectedHover };
}

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

export type PartyTooltipEntry = {
  id: string;
  label: string;
};

type TooltipCapableLayer = Path & {
  openTooltip?: () => Path;
  closeTooltip?: () => Path;
  isTooltipOpen?: () => boolean;
  unbindTooltip?: () => Path;
};

export type VotingDistrictMapProps = {
  selected: SelectedDistrict;
  onDistrictSelect?: (district: SelectedDistrict) => void;
  refreshToken?: string | number;
  getPartyCounts?: (districtNum: number) => Record<string, number> | null | undefined;
  partyTooltipEntries?: PartyTooltipEntry[];
};

export function VotingDistrictMap({
  selected,
  onDistrictSelect,
  refreshToken,
  getPartyCounts,
  partyTooltipEntries,
}: VotingDistrictMapProps) {
  const { theme } = useTheme();
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const bounds = useMemo(() => computeBounds(FILTERED_FEATURES), []);
  const layerByIdRef = useRef(new Map<number, Path>());
  const selectedIdRef = useRef(selected.id);

  const tileUrl = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const styleBundle = useMemo(() => createStyleBundle(theme), [theme]);

  const styleBundleRef = useRef(styleBundle);
  styleBundleRef.current = styleBundle;

  useEffect(() => {
    styleBundleRef.current = styleBundle;
    layerByIdRef.current.forEach((layer, id) => {
      applyStyleForLayer(id, layer, false, selectedIdRef.current, styleBundle);
      if (id === selectedIdRef.current) {
        layer.bringToFront();
      }
    });
  }, [styleBundle]);

  useLayoutEffect(() => {
    selectedIdRef.current = selected.id;
    const styles = styleBundleRef.current;
    layerByIdRef.current.forEach((layer, id) => {
      applyStyleForLayer(id, layer, false, selectedIdRef.current, styles);
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

  useLayoutEffect(() => {
    const activeId = selectedIdRef.current;
    const styles = styleBundleRef.current;
    layerByIdRef.current.forEach((layer, id) => {
      applyStyleForLayer(id, layer, false, activeId, styles);
      if (id === activeId) {
        layer.bringToFront();
      }
    });
  }, [refreshToken, selected.id]);

  const onEachFeature = (feature: DistrictFeature, layer: Layer) => {
    const districtId = typeof feature.properties?.id === "number" ? feature.properties.id : null;
    const districtNum = typeof feature.properties?.num === "number" ? feature.properties.num : -1;
    const label = formatDistrictName(feature.properties);
    const slug = getDistrictSlug(feature.properties, districtId ?? undefined);
    const districtName = typeof feature.properties?.nom === "string" ? feature.properties.nom.trim() : null;
    const arrondissement =
      typeof feature.properties?.arrondissement === "string"
        ? feature.properties.arrondissement.trim()
        : null;
    const pathLayer = layer as Path;
    const tooltipLayer = pathLayer as TooltipCapableLayer;

    if (districtId !== null) {
      layerByIdRef.current.set(districtId, pathLayer);
      layer.on("remove", () => {
        layerByIdRef.current.delete(districtId);
      });

      const counts = getPartyCounts?.(districtNum) ?? null;
      const tooltipHtml = buildTooltipHtml({
        districtName,
        label,
        arrondissement,
        counts,
        partyEntries: partyTooltipEntries,
        theme,
      });

      if (tooltipHtml) {
        tooltipLayer.unbindTooltip?.();
        tooltipLayer.bindTooltip(tooltipHtml, {
          direction: "center",
          opacity: 0.9,
          sticky: false,
          className: "district-tooltip",
          offset: [-140, -24],
        });
      }
    }

    applyStyleForLayer(districtId, pathLayer, false, selectedIdRef.current, styleBundleRef.current);

    pathLayer.on({
      mouseover: () => {
        applyStyleForLayer(districtId, pathLayer, true, selectedIdRef.current, styleBundleRef.current);
        const isOpen = tooltipLayer.isTooltipOpen?.() ?? false;
        if (!isOpen) {
          tooltipLayer.openTooltip?.();
        }
      },
      mouseout: () => {
        applyStyleForLayer(districtId, pathLayer, false, selectedIdRef.current, styleBundleRef.current);
        const isOpen = tooltipLayer.isTooltipOpen?.() ?? false;
        if (isOpen) {
          tooltipLayer.closeTooltip?.();
        }
      },
      click: () => {
        if (districtId === null) {
          return;
        }

        const previousSelectedId = selectedIdRef.current;
        if (previousSelectedId !== districtId) {
          const previousLayer = layerByIdRef.current.get(previousSelectedId);
          if (previousLayer) {
            applyStyleForLayer(previousSelectedId, previousLayer, false, districtId, styleBundleRef.current);
          }
        }

        selectedIdRef.current = districtId;
        applyStyleForLayer(districtId, pathLayer, false, selectedIdRef.current, styleBundleRef.current);
        pathLayer.bringToFront();

        onDistrictSelect?.({ id: districtId, name: label, slug, num: districtNum });
        const isOpen = tooltipLayer.isTooltipOpen?.() ?? false;
        if (!isOpen) {
          tooltipLayer.openTooltip?.();
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
          key={`carto-${theme}`}
          attribution='&copy; <a href="https://cartodb.com/basemaps/">Carto</a> contributors, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={tileUrl}
        />
        <GeoJSON
          key={`districts-${theme}`}
          data={{ ...districtCollection, features: FILTERED_FEATURES }}
          onEachFeature={onEachFeature}
          style={() => styleBundle.base}
        />
      </MapContainer>
    </div>
  );
}

type TooltipParams = {
  districtName: string | null;
  label: string | null;
  arrondissement: string | null;
  counts: Record<string, number> | null | undefined;
  partyEntries?: PartyTooltipEntry[];
  theme: Theme;
};

function buildTooltipHtml({
  districtName,
  label,
  arrondissement,
  counts,
  partyEntries,
  theme,
}: TooltipParams): string | null {
  const displayName = districtName ?? label ?? "";
  const escapedName = displayName ? escapeHtml(displayName) : "";
  const escapedArrondissement = arrondissement ? escapeHtml(arrondissement) : "";

  const primaryColor = theme === "dark" ? "#ffffff" : "#111111";
  const secondaryColor = theme === "dark" ? "#ffffff" : "#6d6d6d";
  const cardBackground = theme === "dark" ? "#1f1f1f" : "#ffffff";
  const shadow = theme === "dark" ? "0 6px 18px rgba(0,0,0,0.45)" : "0 4px 16px rgba(17,17,17,0.18)";

  const partyRows = partyEntries
    ?.map((party) => {
      const count = counts ? counts[party.id] ?? 0 : 0;
      return `<div style="display:flex;justify-content:space-between;font-size:11px;text-transform:uppercase;color:${primaryColor};"><span>${escapeHtml(
        party.label
      )}</span><span>${count}</span></div>`;
    })
    .join("") ?? "";

  if (!escapedName && !escapedArrondissement && !partyRows) {
    return null;
  }

  const nameMarkup = escapedName
    ? `<div style="font-size:14px;font-weight:600;text-transform:uppercase;color:${primaryColor};">${escapedName}</div>`
    : "";
  const arrondissementMarkup = escapedArrondissement
    ? `<div style="margin-top:4px;font-size:11px;text-transform:uppercase;color:${secondaryColor};">${escapedArrondissement}</div>`
    : "";
  const countsMarkup = partyRows
    ? `<div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;">${partyRows}</div>`
    : "";

  return `<div style="background:${cardBackground};padding:12px;min-width:200px;box-shadow:${shadow};border:none;">${nameMarkup}${arrondissementMarkup}${countsMarkup}</div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function applyStyleForLayer(
  districtId: number | null,
  layer: Path,
  isHovering: boolean,
  selectedId: number,
  styles: StyleBundle
) {
  const isSelected = districtId !== null && districtId === selectedId;
  const style = isSelected
    ? isHovering
      ? styles.selectedHover
      : styles.selected
    : isHovering
      ? styles.hover
      : styles.base;

  layer.setStyle(style);

  if (isSelected) {
    layer.bringToFront();
  }
}

export default VotingDistrictMap;
