import { useState, useMemo, useCallback, useRef, useEffect, memo } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useLocation } from "../../context/LocationContext.jsx";
import MapGL, { Source, Layer, Popup, NavigationControl } from "react-map-gl/maplibre";
import { LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getShapeCategory, getCoverageScore, getCoverageColor, getSpriteId } from "../../data/entityCategories.js";
import { registerSprites } from "../../data/markerSprites.js";
import { MunicipalTable } from "./MunicipalTable.jsx";
import { MunicipalMapPopup } from "./MunicipalMapPopup.jsx";
import { MunicipalMapLegend } from "./MunicipalMapLegend.jsx";
import { MobileBottomSheet } from "./MobileBottomSheet.jsx";

const CANADA_CENTER = { longitude: -96, latitude: 56 };
const CANADA_ZOOM = 3;
const STYLE_DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const STYLE_LIGHT = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const COVERAGE_COLORS = { green: "#4caf50", amber: "#e6a817", grey: "#555555" };
const CLUSTER_COLORS = { small: "#6c8cff", medium: "#e6a817", large: "#e05252" };

// Sparse regions: always show individual markers, never cluster
const SPARSE_PROVINCES = new Set(["YT", "NT", "NU"]);
const isSparse = (m) => SPARSE_PROVINCES.has(m.province) || (m.province === "QC" && m.lat > 50);

// Build GeoJSON feature from a municipality entry
function buildFeature(m, indexOffset) {
  const coverageScore = getCoverageScore(m);
  const shapeCategory = getShapeCategory(m.entityType);
  const coverageColor = getCoverageColor(coverageScore);
  const hasStandards = Boolean(m.surveyStandards);
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [m.lon, m.lat] },
    properties: {
      name: m.name,
      province: m.province,
      population: m.population || 0,
      entityType: m.entityType,
      tier: m.tier,
      portalUrl: m.portalUrl || "",
      councilUrl: m.councilUrl || "",
      surveyStandards: m.surveyStandards || "",
      coverageScore,
      shapeCategory,
      coverageColor,
      hasStandards,
      spriteId: getSpriteId(shapeCategory, coverageColor, hasStandards),
      hasRelated: m.related ? m.related.length : 0,
      _sourceIndex: indexOffset,
    },
  };
}

// Province bounding boxes (approximate)
const PROVINCE_BOUNDS = {
  AB: [[-120.0, 49.0], [-110.0, 60.0]],
  BC: [[-139.1, 48.3], [-114.0, 60.0]],
  MB: [[-102.0, 49.0], [-88.9, 60.0]],
  NB: [[-69.1, 44.6], [-63.8, 48.1]],
  NL: [[-67.8, 46.6], [-52.6, 60.4]],
  NS: [[-66.4, 43.4], [-59.7, 47.1]],
  NT: [[-136.5, 60.0], [-102.0, 78.8]],
  NU: [[-120.0, 51.7], [-61.2, 83.1]],
  ON: [[-95.2, 41.7], [-74.3, 56.9]],
  PE: [[-64.5, 45.9], [-62.0, 47.1]],
  QC: [[-79.8, 45.0], [-57.1, 62.6]],
  SK: [[-110.0, 49.0], [-101.4, 60.0]],
  YT: [[-141.0, 60.0], [-124.0, 69.6]],
};

// Layer styles
const clusterCircleLayer = {
  id: "clusters",
  type: "circle",
  source: "municipalities",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": ["step", ["get", "point_count"], CLUSTER_COLORS.small, 20, CLUSTER_COLORS.medium, 100, CLUSTER_COLORS.large],
    "circle-radius": ["step", ["get", "point_count"], 14, 20, 17, 100, 21],
    "circle-stroke-width": 2,
    "circle-stroke-color": "rgba(255,255,255,0.3)",
  },
};

const clusterCountLayer = {
  id: "cluster-count",
  type: "symbol",
  source: "municipalities",
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-size": 12,
    "text-font": ["Noto Sans Bold"],
  },
  paint: { "text-color": "#ffffff" },
};

// Circle fallback for unclustered points -- always visible even if sprites fail
const unclusteredCircleLayer = {
  id: "unclustered-circle",
  type: "circle",
  source: "municipalities",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-radius": 8,
    "circle-color": ["match", ["get", "coverageColor"], "green", "#4caf50", "amber", "#e6a817", "#555555"],
    "circle-stroke-width": ["case", ["get", "hasStandards"], 2.5, 0.5],
    "circle-stroke-color": ["case", ["get", "hasStandards"], "#ffffff", "rgba(255,255,255,0.3)"],
    "circle-opacity": 0.85,
  },
};

// Symbol layer with shaped sprites -- renders on top of circles when sprites are loaded
const unclusteredIconLayer = {
  id: "unclustered-point",
  type: "symbol",
  source: "municipalities",
  filter: ["!", ["has", "point_count"]],
  layout: {
    "icon-image": ["get", "spriteId"],
    "icon-size": 1,
    "icon-allow-overlap": true,
    "icon-ignore-placement": true,
  },
  paint: {
    "icon-opacity": 1,
  },
};

// Heatmap layer definitions -- use separate unclustered source so they render at all zoom levels
const coverageHeatLayer = {
  id: "coverage-heat",
  type: "heatmap",
  source: "municipalities-heat",
  maxzoom: 14,
  paint: {
    "heatmap-weight": ["interpolate", ["linear"], ["get", "coverageScore"], 0, 0.1, 3, 1],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 8, 2, 14, 3],
    "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,0,0)", 0.15, "#1a0533", 0.3, "#7e03a8", 0.5, "#cc4778", 0.7, "#f89441", 0.9, "#4caf50"],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 15, 5, 25, 10, 40, 14, 20],
    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.7, 10, 0.5, 14, 0.2],
  },
};

const standardsHeatLayer = {
  id: "standards-heat",
  type: "heatmap",
  source: "municipalities-heat",
  filter: ["==", ["get", "hasStandards"], true],
  maxzoom: 14,
  paint: {
    "heatmap-weight": 1,
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 8, 2.5, 14, 3],
    "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,0,0)", 0.2, "rgba(76,175,80,0.15)", 0.4, "rgba(76,175,80,0.35)", 0.7, "rgba(76,175,80,0.55)", 1, "rgba(76,175,80,0.8)"],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 18, 5, 30, 10, 50, 14, 25],
    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.7, 10, 0.5, 14, 0.2],
  },
};

const populationHeatLayer = {
  id: "population-heat",
  type: "heatmap",
  source: "municipalities-heat",
  maxzoom: 14,
  paint: {
    "heatmap-weight": ["interpolate", ["linear"], ["get", "population"], 0, 0, 50000, 0.3, 500000, 0.7, 3000000, 1],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 8, 2, 14, 3],
    "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,0,0)", 0.15, "#1a0533", 0.3, "#7e03a8", 0.5, "#cc4778", 0.7, "#f89441", 0.9, "#f0f921"],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 15, 5, 25, 10, 40, 14, 20],
    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.7, 10, 0.5, 14, 0.2],
  },
};

export const MunicipalMap = memo(function MunicipalMap() {
  const { B, theme } = useTheme();
  const { lat: userLat, lon: userLon, locSource } = useLocation();
  const mapRef = useRef(null);
  const [municipalities, setMunicipalities] = useState(null);
  const [dataError, setDataError] = useState(null);
  const [province, setProvince] = useState("All");
  const [search, setSearch] = useState("");
  const [popupInfo, setPopupInfo] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  const [overlays, setOverlays] = useState({ coverage: false, standards: false, population: false });
  const searchTimeout = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewportBounds, setViewportBounds] = useState(null);
  const [isMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [webglSupported] = useState(() => {
    try {
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl") || canvas.getContext("webgl2") || canvas.getContext("experimental-webgl"));
    } catch { return false; }
  });

  // Fetch municipality dataset on mount (not bundled into JS chunk)
  useEffect(() => {
    let cancelled = false;
    fetch("/municipalities.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setMunicipalities(data);
      })
      .catch((err) => {
        if (!cancelled) setDataError(err.message);
      });
    return () => { cancelled = true; };
  }, []);

  // Derived data -- built only after municipalities loads
  const { geojsonData, sparseGeojsonData, allGeojsonData, municipalityByKey } = useMemo(() => {
    if (!municipalities) {
      return {
        geojsonData: { type: "FeatureCollection", features: [] },
        sparseGeojsonData: { type: "FeatureCollection", features: [] },
        allGeojsonData: { type: "FeatureCollection", features: [] },
        municipalityByKey: new Map(),
      };
    }
    const denseFeatures = [];
    const sparseFeatures = [];
    const byKey = new Map();
    for (const m of municipalities) {
      if (m.lat == null || m.lon == null) continue;
      const feature = buildFeature(m, denseFeatures.length + sparseFeatures.length);
      if (isSparse(m)) sparseFeatures.push(feature);
      else denseFeatures.push(feature);
      byKey.set(`${m.lat},${m.lon}-${m.name}`, m);
    }
    return {
      geojsonData: { type: "FeatureCollection", features: denseFeatures },
      sparseGeojsonData: { type: "FeatureCollection", features: sparseFeatures },
      allGeojsonData: { type: "FeatureCollection", features: [...denseFeatures, ...sparseFeatures] },
      municipalityByKey: byKey,
    };
  }, [municipalities]);

  const provinces = useMemo(() => {
    if (!municipalities) return [];
    const set = new Set(municipalities.map((m) => m.province));
    return [...set].sort();
  }, [municipalities]);

  // Debounced search
  const handleSearch = useCallback((value) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(value), 250);
  }, []);

  // Track map viewport bounds for table filtering
  const onMoveEnd = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const b = map.getBounds();
    setViewportBounds({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() });
  }, []);

  // Filtered data for table -- province, search, then viewport bounds
  const filtered = useMemo(() => {
    if (!municipalities) return [];
    return municipalities.filter((m) => {
      if (m.lat == null || m.lon == null) return false;
      if (province !== "All" && m.province !== province) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const nameMatch = m.name.toLowerCase().includes(q);
        const relatedMatch = m.related && m.related.some((r) => r.name.toLowerCase().includes(q));
        if (!nameMatch && !relatedMatch) return false;
      }
      if (viewportBounds) {
        if (m.lat < viewportBounds.south || m.lat > viewportBounds.north ||
            m.lon < viewportBounds.west || m.lon > viewportBounds.east) return false;
      }
      return true;
    });
  }, [municipalities, province, debouncedSearch, viewportBounds]);

  // Flatten for table
  const tableRows = useMemo(() => {
    const rows = [];
    for (const m of filtered) {
      rows.push(m);
      if (m.related) {
        for (const r of m.related) {
          rows.push({ ...r, province: m.province, lat: m.lat, lon: m.lon });
        }
      }
    }
    return rows;
  }, [filtered]);

  // Map source filter expression (province + search)
  const sourceFilter = useMemo(() => {
    const conditions = [];
    if (province !== "All") {
      conditions.push(["==", ["get", "province"], province]);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      conditions.push(["in", q, ["downcase", ["get", "name"]]]);
    }
    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return ["all", ...conditions];
  }, [province, debouncedSearch]);

  // Opacity for markers based on search (dim non-matching)
  const markerOpacity = useMemo(() => {
    if (!debouncedSearch) return 1;
    return ["case",
      ["in", debouncedSearch.toLowerCase(), ["downcase", ["get", "name"]]],
      1, 0.15
    ];
  }, [debouncedSearch]);

  // Fly to province on change
  const handleProvinceChange = useCallback((e) => {
    const prov = e.target.value;
    setProvince(prov);
    setSearch("");
    setDebouncedSearch("");
    setPopupInfo(null);

    const map = mapRef.current?.getMap();
    if (!map) return;

    if (prov === "All") {
      map.flyTo({ center: [CANADA_CENTER.longitude, CANADA_CENTER.latitude], zoom: CANADA_ZOOM, duration: 1000 });
    } else if (PROVINCE_BOUNDS[prov]) {
      const [[w, s], [ea, n]] = PROVINCE_BOUNDS[prov];
      map.fitBounds([[w, s], [ea, n]], { padding: 30, maxZoom: 10, duration: 1000 });
    }
  }, []);

  // Map load: register sprites + re-register on style changes
  const onMapLoad = useCallback((e) => {
    const map = e.target;
    registerSprites(map);
    setSpritesLoaded(true);
    // Re-register sprites when style reloads (MapLibre clears custom images)
    map.on("style.load", () => {
      registerSprites(map);
    });
  }, []);

  // Click handler for clusters and points
  const onClick = useCallback((e) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Check clusters first
    const clusterFeatures = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
    if (clusterFeatures.length > 0) {
      const feature = clusterFeatures[0];
      const clusterId = feature.properties.cluster_id;
      const source = map.getSource("municipalities");
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.flyTo({ center: feature.geometry.coordinates, zoom: Math.min(zoom, 14), duration: 500 });
      });
      return;
    }

    // Check unclustered points (all marker layers)
    const pointFeatures = map.queryRenderedFeatures(e.point, { layers: ["unclustered-point", "unclustered-circle", "sparse-point", "sparse-circle"] });
    if (pointFeatures.length > 0) {
      const feature = pointFeatures[0];
      const props = feature.properties;
      const coords = feature.geometry.coordinates;
      const key = `${coords[1]},${coords[0]}-${props.name}`;
      const m = municipalityByKey.get(key);
      if (m) {
        setPopupInfo({ longitude: coords[0], latitude: coords[1], municipality: m });
        setSelectedId(`${m.lat},${m.lon}-${m.name}`);
      }
    } else {
      setPopupInfo(null);
      setSelectedId(null);
    }
  }, [municipalityByKey]);

  // Hover cursor
  const onMouseEnter = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = "pointer";
  }, []);
  const onMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = "";
  }, []);

  // Set up hover listeners
  const onMapStyleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    for (const layerId of ["clusters", "unclustered-point", "unclustered-circle", "sparse-point", "sparse-circle"]) {
      map.on("mouseenter", layerId, onMouseEnter);
      map.on("mouseleave", layerId, onMouseLeave);
    }
  }, [onMouseEnter, onMouseLeave]);

  // Table row click -> fly to marker
  const onRowClick = useCallback((row) => {
    if (!row.lat || !row.lon) return;
    const map = mapRef.current?.getMap();
    if (map) {
      map.flyTo({ center: [row.lon, row.lat], zoom: 12, duration: 800 });
    }
    const m = municipalityByKey.get(`${row.lat},${row.lon}-${row.name}`) || row;
    setPopupInfo({ longitude: row.lon, latitude: row.lat, municipality: m });
    setSelectedId(`${row.lat},${row.lon}-${row.name}`);
  }, [municipalityByKey]);

  // Fit to search results
  useEffect(() => {
    if (!debouncedSearch || !filtered.length) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (filtered.length === 1) {
      map.flyTo({ center: [filtered[0].lon, filtered[0].lat], zoom: 10, duration: 800 });
    } else {
      const bounds = new LngLatBounds();
      for (const m of filtered) bounds.extend([m.lon, m.lat]);
      map.fitBounds(bounds, { padding: 40, maxZoom: 10, duration: 800 });
    }
  }, [debouncedSearch, filtered]);

  const toggleOverlay = useCallback((key) => {
    setOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const inputStyle = {
    background: B.bg,
    border: `1px solid ${B.borderHi}`,
    borderRadius: 4,
    padding: "4px 8px",
    color: B.text,
    fontSize: 12,
    outline: "none",
    fontFamily: B.font,
  };

  const checkboxStyle = {
    background: B.bg,
    border: `1px solid ${B.borderHi}`,
    borderRadius: 4,
    padding: "3px 8px",
    fontSize: 10,
    fontFamily: B.font,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 4,
  };

  if (dataError) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#e05252", fontFamily: B.font, border: `1px solid ${B.border}`, borderRadius: 4 }}>
        Failed to load municipalities: {dataError}
      </div>
    );
  }

  if (!municipalities) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: B.textDim, fontFamily: B.font, border: `1px solid ${B.border}`, borderRadius: 4 }}>
        Loading municipalities...
      </div>
    );
  }

  if (!webglSupported) {
    return (
      <div>
        <div style={{ padding: 20, textAlign: "center", color: B.textDim, fontFamily: B.font, border: `1px solid ${B.border}`, borderRadius: 4 }}>
          Your browser does not support WebGL maps. Browse the table below instead.
        </div>
        <MunicipalTable rows={tableRows} B={B} selectedId={null} onRowClick={null} userLat={locSource !== "default" ? userLat : null} userLon={locSource !== "default" ? userLon : null} />
      </div>
    );
  }

  const mapElement = (
    <MapGL
      ref={mapRef}
      initialViewState={{ ...CANADA_CENTER, zoom: CANADA_ZOOM }}
      mapStyle={theme === "dark" ? STYLE_DARK : STYLE_LIGHT}
      onClick={onClick}
      onLoad={onMapLoad}
      onMoveEnd={onMoveEnd}
      onStyleData={onMapStyleLoad}
      interactiveLayerIds={["clusters", "unclustered-circle", "sparse-circle", ...(spritesLoaded ? ["unclustered-point", "sparse-point"] : [])]}
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />

      {/* Heatmap source -- all points unclustered for full coverage at every zoom */}
      <Source id="municipalities-heat" type="geojson" data={allGeojsonData}>
        {overlays.coverage && <Layer {...coverageHeatLayer} />}
        {overlays.standards && <Layer {...standardsHeatLayer} />}
        {overlays.population && <Layer {...populationHeatLayer} />}
      </Source>

      {/* Sparse regions (territories, northern QC) -- always individual markers, never clustered */}
      <Source id="municipalities-sparse" type="geojson" data={sparseGeojsonData}>
        <Layer {...unclusteredCircleLayer} id="sparse-circle" source="municipalities-sparse"
          paint={{ ...unclusteredCircleLayer.paint, "circle-opacity": typeof markerOpacity === "number" ? markerOpacity * 0.85 : 0.85 }} />
        {spritesLoaded && (
          <Layer {...unclusteredIconLayer} id="sparse-point" source="municipalities-sparse"
            paint={{ ...unclusteredIconLayer.paint, "icon-opacity": markerOpacity }} />
        )}
      </Source>

      {/* Dense regions -- clustered source */}
      <Source
        id="municipalities"
        type="geojson"
        data={geojsonData}
        cluster={true}
        clusterRadius={35}
        clusterMaxZoom={9}
      >
        <Layer {...clusterCircleLayer} />
        <Layer {...clusterCountLayer} />
        <Layer {...unclusteredCircleLayer} paint={{ ...unclusteredCircleLayer.paint, "circle-opacity": typeof markerOpacity === "number" ? markerOpacity * 0.85 : 0.85 }} />
        {spritesLoaded && (
          <Layer {...unclusteredIconLayer} paint={{ ...unclusteredIconLayer.paint, "icon-opacity": markerOpacity }} />
        )}
      </Source>

      {popupInfo && (
        <Popup
          longitude={popupInfo.longitude}
          latitude={popupInfo.latitude}
          onClose={() => { setPopupInfo(null); setSelectedId(null); }}
          maxWidth="300px"
          anchor="bottom"
          offset={12}
        >
          <MunicipalMapPopup municipality={popupInfo.municipality} B={B} />
        </Popup>
      )}
    </MapGL>
  );

  const filterBar = (
    <div style={{ display: "flex", gap: 6, marginBottom: isMobile ? 0 : 6, alignItems: "center", flexWrap: "wrap" }}>
      {isMobile ? (
        // Horizontal scrollable province chips
        <div style={{ display: "flex", gap: 3, overflowX: "auto", flex: 1, paddingBottom: 2 }}>
          {["All", ...provinces].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleProvinceChange({ target: { value: p } })}
              style={{
                background: province === p ? B.pri : `${B.bg}cc`,
                color: province === p ? "#fff" : B.textDim,
                border: "none",
                borderRadius: 12,
                padding: "3px 10px",
                fontSize: 10,
                fontFamily: B.font,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {p === "All" ? "All" : p}
            </button>
          ))}
        </div>
      ) : (
        <select value={province} onChange={handleProvinceChange} aria-label="Province filter" style={inputStyle}>
          <option value="All">All Provinces</option>
          {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      )}
      <input
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search by name..."
        aria-label="Search municipalities"
        style={{ ...inputStyle, flex: 1, minWidth: isMobile ? 80 : 120 }}
      />
      {debouncedSearch && (
        <span style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, background: `${B.border}66`, padding: "2px 6px", borderRadius: 3 }}>
          {filtered.length} match{filtered.length !== 1 ? "es" : ""}
        </span>
      )}
    </div>
  );

  const overlayToggles = (
    <div style={{ display: "flex", gap: 4, marginBottom: isMobile ? 4 : 6, flexWrap: "wrap" }} role="group" aria-label="Map overlay layers">
      {[
        { key: "coverage", label: "Coverage heat" },
        { key: "standards", label: "Standards glow" },
        { key: "population", label: "Population heat" },
      ].map(({ key, label }) => (
        <label key={key} style={{ ...checkboxStyle, color: overlays[key] ? B.text : B.textDim, borderColor: overlays[key] ? B.pri : B.borderHi }}>
          <input
            type="checkbox"
            checked={overlays[key]}
            onChange={() => toggleOverlay(key)}
            style={{ width: 12, height: 12, accentColor: B.pri }}
          />
          {label}
        </label>
      ))}
    </div>
  );

  // Mobile layout: full-screen map + bottom sheet
  if (isMobile) {
    return (
      <div style={{ position: "relative" }}>
        {/* Floating search bar on map */}
        <div style={{ position: "relative", zIndex: 3, padding: "0 0 4px" }}>
          {filterBar}
          {overlayToggles}
        </div>

        {/* Map fills available space */}
        <div style={{ height: "calc(100vh - 200px)", minHeight: 300, position: "relative" }}
          aria-label="Canadian municipal jurisdictions map"
        >
          {mapElement}
          <MunicipalMapLegend B={B} isMobile={true} />
        </div>

        {/* Bottom sheet with table */}
        <MobileBottomSheet B={B} resultCount={tableRows.length}>
          <MunicipalTable rows={tableRows} B={B} selectedId={selectedId} onRowClick={onRowClick} userLat={locSource !== "default" ? userLat : null} userLon={locSource !== "default" ? userLon : null} />
        </MobileBottomSheet>
      </div>
    );
  }

  // Desktop layout: filters, map, table stacked
  return (
    <div>
      {/* Skip nav for accessibility */}
      <a href="#municipal-table" style={{ position: "absolute", left: -9999, top: "auto", width: 1, height: 1, overflow: "hidden", zIndex: 100 }}
        onFocus={(e) => { e.target.style.position = "static"; e.target.style.width = "auto"; e.target.style.height = "auto"; e.target.style.overflow = "visible"; }}
        onBlur={(e) => { e.target.style.position = "absolute"; e.target.style.left = "-9999px"; e.target.style.width = "1px"; e.target.style.height = "1px"; e.target.style.overflow = "hidden"; }}
      >Skip to results table</a>

      {filterBar}
      {overlayToggles}

      {/* Count */}
      <div style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, marginBottom: 4 }}>
        {filtered.length} pin{filtered.length === 1 ? "" : "s"} | {tableRows.length} total entit{tableRows.length === 1 ? "y" : "ies"}
      </div>

      {/* Map */}
      <div style={{ height: 400, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL, position: "relative" }}
        aria-label="Canadian municipal jurisdictions map"
      >
        {mapElement}
        <MunicipalMapLegend B={B} isMobile={false} />
      </div>

      {/* Table */}
      <div id="municipal-table">
        <MunicipalTable rows={tableRows} B={B} selectedId={selectedId} onRowClick={onRowClick} userLat={locSource !== "default" ? userLat : null} userLon={locSource !== "default" ? userLon : null} />
      </div>
    </div>
  );
});
