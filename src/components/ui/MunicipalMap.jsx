import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { MUNICIPALITIES } from "../../data/municipalities.js";
import { HeatmapLayer } from "./HeatmapLayer.jsx";

const CANADA_CENTER = [56, -96];
const CANADA_ZOOM = 4;
const HEAT_GRADIENT_DARK = { 0.2: "#1a0533", 0.35: "#7e03a8", 0.5: "#cc4778", 0.7: "#f89441", 0.9: "#f0f921" };
const HEAT_GRADIENT_LIGHT = { 0.1: "#ffeda0", 0.3: "#feb24c", 0.5: "#f03b20", 0.7: "#bd0026", 0.9: "#800026" };

function FitBounds({ filtered, province }) {
  const map = useMap();
  const prevProvince = useRef(province);

  useEffect(() => {
    if (province === prevProvince.current) return;
    prevProvince.current = province;

    if (province === "All") {
      map.setView(CANADA_CENTER, CANADA_ZOOM);
      return;
    }
    if (!filtered.length) return;
    const bounds = L.latLngBounds(filtered.map((m) => [m.lat, m.lon]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
  }, [filtered, province, map]);

  return null;
}

function MunicipalPopup({ m, B }) {
  return (
    <Popup>
      <div style={{ fontFamily: B.font, fontSize: 12, color: "#222", lineHeight: 1.5 }}>
        <strong>{m.name}</strong><br />
        {m.province}<br />
        {m.entityType && <span style={{ fontSize: 10, color: "#666" }}>{m.entityType}</span>}{m.entityType && <br />}
        {m.population != null && m.population > 0 && <>Pop. {m.population.toLocaleString()}<br /></>}
        {m.portalUrl && <><a href={m.portalUrl} target="_blank" rel="noopener noreferrer">Open Data</a><br /></>}
        {m.councilUrl && <><a href={m.councilUrl} target="_blank" rel="noopener noreferrer">Council</a><br /></>}
        {m.surveyStandards && <><a href={m.surveyStandards} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11 }}>Standards</a></>}
      </div>
    </Popup>
  );
}

export function MunicipalMap() {
  const { B, theme } = useTheme();
  const [province, setProvince] = useState("All");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("cluster");

  const provinces = useMemo(() => {
    const set = new Set(MUNICIPALITIES.map((m) => m.province));
    return [...set].sort();
  }, []);

  const filtered = useMemo(() => {
    return MUNICIPALITIES.filter((m) => {
      if (province !== "All" && m.province !== province) return false;
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [province, search]);

  const markerIcon = useMemo(() => L.divIcon({
    className: "",
    html: `<div style="width:10px;height:10px;border-radius:50%;background:${B.pri};opacity:0.8;box-shadow:0 0 4px ${B.pri}"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  }), [B.pri]);

  const clusterIcon = useCallback((cluster) => {
    const count = cluster.getChildCount();
    const size = count < 50 ? 32 : count < 200 ? 38 : 44;
    const bg = count < 50 ? B.pri : count < 200 ? B.warn || "#e6a817" : B.err || "#e05252";
    return L.divIcon({
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;font-family:${B.font};box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid rgba(255,255,255,0.3)">${count}</div>`,
      className: "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, [B.pri, B.warn, B.err, B.font]);

  const heatPoints = useMemo(() => {
    if (!filtered.length) return [];
    const maxPop = Math.max(...filtered.map((m) => m.population || 1));
    return filtered.map((m) => [m.lat, m.lon, (m.population || 1) / maxPop]);
  }, [filtered]);

  const tileUrl = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

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

  const modeBtn = (value) => ({
    ...inputStyle,
    cursor: "pointer",
    background: mode === value ? B.pri : B.bg,
    color: mode === value ? "#fff" : B.text,
    padding: "3px 8px",
    fontSize: 11,
    border: `1px solid ${mode === value ? B.pri : B.borderHi}`,
  });

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          aria-label="Province filter"
          style={inputStyle}
        >
          <option value="All">All Provinces</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          aria-label="Search municipalities"
          style={{ ...inputStyle, flex: 1, minWidth: 120 }}
        />
        <div style={{ display: "flex", gap: 2 }} role="group" aria-label="Map display mode">
          <button type="button" onClick={() => setMode("cluster")} style={modeBtn("cluster")}>Clusters</button>
          <button type="button" onClick={() => setMode("heatmap")} style={modeBtn("heatmap")}>Heatmap</button>
        </div>
      </div>

      {/* Count */}
      <div style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, marginBottom: 4 }}>
        {filtered.length} municipalit{filtered.length === 1 ? "y" : "ies"}
      </div>

      {/* Map */}
      <div style={{ height: 400, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL }}>
        <MapContainer center={CANADA_CENTER} zoom={CANADA_ZOOM} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
          <TileLayer url={tileUrl} />
          <ZoomControl position="topright" />
          <FitBounds filtered={filtered} province={province} />

          {mode === "cluster" && (
            <MarkerClusterGroup
              key={`${province}-${search}-${theme}`}
              iconCreateFunction={clusterIcon}
              animate={false}
              maxClusterRadius={60}
              spiderfyOnMaxZoom
              showCoverageOnHover={false}
              disableClusteringAtZoom={12}
            >
              {filtered.map((m) => (
                <Marker
                  key={`${m.lat},${m.lon}-${m.name}`}
                  position={[m.lat, m.lon]}
                  icon={markerIcon}
                >
                  <MunicipalPopup m={m} B={B} />
                </Marker>
              ))}
            </MarkerClusterGroup>
          )}

          {mode === "heatmap" && (
            <HeatmapLayer points={heatPoints} radius={25} blur={18} maxZoom={10} minOpacity={theme === "dark" ? 0.3 : 0.5} gradient={theme === "dark" ? HEAT_GRADIENT_DARK : HEAT_GRADIENT_LIGHT} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
