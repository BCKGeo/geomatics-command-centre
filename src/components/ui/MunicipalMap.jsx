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
const PAGE_SIZE = 50;

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

function EntityLinks({ entity, B }) {
  return (
    <span style={{ fontSize: 11 }}>
      {entity.portalUrl && <><a href={entity.portalUrl} target="_blank" rel="noopener noreferrer" style={{ color: B.pri }}>Data</a>{" "}</>}
      {entity.councilUrl && <><a href={entity.councilUrl} target="_blank" rel="noopener noreferrer" style={{ color: B.pri }}>Council</a>{" "}</>}
      {entity.surveyStandards && <a href={entity.surveyStandards} target="_blank" rel="noopener noreferrer" style={{ color: B.pri }}>Standards</a>}
    </span>
  );
}

function MunicipalPopup({ m, B }) {
  return (
    <Popup maxWidth={280}>
      <div style={{ fontFamily: B.font, fontSize: 12, color: "#222", lineHeight: 1.6 }}>
        <strong>{m.name}</strong><br />
        <span style={{ fontSize: 10, color: "#666" }}>{m.entityType} | {m.province}</span><br />
        {m.population > 0 && <>Pop. {m.population.toLocaleString()}<br /></>}
        <EntityLinks entity={m} B={B} />

        {m.related && m.related.length > 0 && (
          <div style={{ borderTop: "1px solid #ccc", marginTop: 5, paddingTop: 4 }}>
            <div style={{ fontSize: 9, color: "#999", marginBottom: 2 }}>ALSO AT THIS LOCATION</div>
            {m.related.map((r, i) => (
              <div key={i} style={{ marginBottom: 3 }}>
                <strong style={{ fontSize: 11 }}>{r.name}</strong><br />
                <span style={{ fontSize: 10, color: "#666" }}>{r.entityType}</span>
                {r.population > 0 && <span style={{ fontSize: 10, color: "#666" }}> | Pop. {r.population.toLocaleString()}</span>}
                <br />
                <EntityLinks entity={r} B={B} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Popup>
  );
}

function LinkIcon({ url, label }) {
  if (!url) return <span style={{ color: "#555" }}>-</span>;
  return <a href={url} target="_blank" rel="noopener noreferrer" title={label} style={{ textDecoration: "none" }}>&#x2197;</a>;
}

function MunicipalTable({ rows, B }) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState({ col: "population", dir: "desc" });

  useEffect(() => { setPage(0); }, [rows]);

  const sorted = useMemo(() => {
    const s = [...rows];
    s.sort((a, b) => {
      let av = a[sort.col], bv = b[sort.col];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av == null) av = sort.col === "population" ? 0 : "";
      if (bv == null) bv = sort.col === "population" ? 0 : "";
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return s;
  }, [rows, sort]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (col) => {
    setSort((prev) => prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: "desc" });
  };

  const th = (label, col) => (
    <th
      onClick={() => toggleSort(col)}
      style={{ cursor: "pointer", padding: "4px 6px", textAlign: "left", borderBottom: `1px solid ${B.border}`, fontSize: 10, color: B.textDim, userSelect: "none", whiteSpace: "nowrap" }}
    >
      {label} {sort.col === col ? (sort.dir === "asc" ? "\u25B2" : "\u25BC") : ""}
    </th>
  );

  const cellStyle = { padding: "3px 6px", borderBottom: `1px solid ${B.border}`, fontSize: 11, whiteSpace: "nowrap" };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, marginBottom: 3 }}>
        {sorted.length} results {totalPages > 1 && `| Page ${page + 1} of ${totalPages}`}
      </div>
      <div style={{ maxHeight: 300, overflow: "auto", border: `1px solid ${B.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: B.font, color: B.text }}>
          <thead style={{ position: "sticky", top: 0, background: B.bg, zIndex: 1 }}>
            <tr>
              {th("Name", "name")}
              {th("Prov", "province")}
              {th("Type", "entityType")}
              {th("Pop", "population")}
              <th style={{ padding: "4px 6px", borderBottom: `1px solid ${B.border}`, fontSize: 10, color: B.textDim }}>Links</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={`${r.name}-${r.province}-${i}`} style={{ background: i % 2 === 0 ? "transparent" : `${B.border}33` }}>
                <td style={cellStyle}>{r.name}</td>
                <td style={cellStyle}>{r.province}</td>
                <td style={{ ...cellStyle, fontSize: 10, color: B.textDim }}>{r.entityType}</td>
                <td style={{ ...cellStyle, textAlign: "right" }}>{r.population > 0 ? r.population.toLocaleString() : "-"}</td>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  <LinkIcon url={r.portalUrl} label="Open Data" />{" "}
                  <LinkIcon url={r.councilUrl} label="Council" />{" "}
                  <LinkIcon url={r.surveyStandards} label="Standards" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 4, marginTop: 4, justifyContent: "center", fontFamily: B.font }}>
          <button type="button" disabled={page === 0} onClick={() => setPage(0)} style={{ fontSize: 10, background: "none", border: "none", color: page === 0 ? B.textDim : B.pri, cursor: page === 0 ? "default" : "pointer" }}>&laquo;</button>
          <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} style={{ fontSize: 10, background: "none", border: "none", color: page === 0 ? B.textDim : B.pri, cursor: page === 0 ? "default" : "pointer" }}>&lsaquo; Prev</button>
          <span style={{ fontSize: 10, color: B.textDim, padding: "0 8px" }}>{page + 1} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} style={{ fontSize: 10, background: "none", border: "none", color: page >= totalPages - 1 ? B.textDim : B.pri, cursor: page >= totalPages - 1 ? "default" : "pointer" }}>Next &rsaquo;</button>
          <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)} style={{ fontSize: 10, background: "none", border: "none", color: page >= totalPages - 1 ? B.textDim : B.pri, cursor: page >= totalPages - 1 ? "default" : "pointer" }}>&raquo;</button>
        </div>
      )}
    </div>
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
      if (search) {
        const q = search.toLowerCase();
        const nameMatch = m.name.toLowerCase().includes(q);
        const relatedMatch = m.related && m.related.some((r) => r.name.toLowerCase().includes(q));
        if (!nameMatch && !relatedMatch) return false;
      }
      return true;
    });
  }, [province, search]);

  // Flatten for table: primary + related entities
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
        {filtered.length} pin{filtered.length === 1 ? "" : "s"} | {tableRows.length} total entit{tableRows.length === 1 ? "y" : "ies"}
      </div>

      {/* Map */}
      <div style={{ height: 400, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL }}>
        <MapContainer center={CANADA_CENTER} zoom={CANADA_ZOOM} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
          <TileLayer url={tileUrl} />
          <ZoomControl position="topright" />
          <FitBounds filtered={filtered} province={province} />

          {mode === "cluster" && (
            <MarkerClusterGroup
              key={`cluster-${province}`}
              iconCreateFunction={clusterIcon}
              chunkedLoading
              maxClusterRadius={60}
              spiderfyOnMaxZoom
              showCoverageOnHover={false}
              disableClusteringAtZoom={12}
              zoomToBoundsOnClick
              animateAddingMarkers={false}
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

      {/* Searchable table */}
      <MunicipalTable rows={tableRows} B={B} />
    </div>
  );
}
