import { useState, useMemo } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MUNICIPALITIES } from "../../data/municipalities.js";

export function MunicipalMap() {
  const { B, theme } = useTheme();
  const [province, setProvince] = useState("All");
  const [search, setSearch] = useState("");

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

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
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
          style={{ ...inputStyle, flex: 1, minWidth: 120 }}
        />
      </div>

      {/* Count */}
      <div style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, marginBottom: 4 }}>
        {filtered.length} municipalit{filtered.length === 1 ? "y" : "ies"}
      </div>

      {/* Map */}
      <div style={{ height: 400, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL }}>
        <MapContainer center={[56, -96]} zoom={4} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
          <TileLayer url={tileUrl} />
          {filtered.map((m, i) => (
            <CircleMarker
              key={`${m.name}-${m.province}-${i}`}
              center={[m.lat, m.lon]}
              radius={6}
              color={B.pri}
              fillColor={B.pri}
              fillOpacity={0.7}
            >
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
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
