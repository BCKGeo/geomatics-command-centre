import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useLocation } from "../../context/LocationContext.jsx";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon (Leaflet + bundlers lose the path)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

function RecenterMap({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom());
  }, [lat, lon, map]);
  return null;
}

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

export function LocationMap() {
  const { B, theme } = useTheme();
  const { lat, lon, cityName, locSource, locLoading, requestLocation, resetLocation, setManualLocation } = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const handleMapClick = useCallback((latlng) => {
    setManualLocation(latlng.lat, latlng.lng);
    setResults([]);
    setQuery("");
  }, [setManualLocation]);

  const handleSearch = useCallback((q) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 3) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${NOMINATIM}?q=${encodeURIComponent(q)}&countrycodes=ca&format=json&limit=5&addressdetails=1`);
        const data = await res.json();
        setResults(data.map(r => ({
          name: r.display_name,
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
        })));
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 400);
  }, []);

  const selectResult = (r) => {
    setManualLocation(r.lat, r.lon);
    setQuery("");
    setResults([]);
  };

  const tileUrl = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div style={{ position: "relative" }}>
      {/* Search bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 6, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search a location in Canada..."
            style={{ width: "100%", background: B.bg, border: `1px solid ${B.borderHi}`, padding: "5px 8px", color: B.text, fontSize: 10, fontFamily: B.font, outline: "none", boxSizing: "border-box" }}
          />
          {results.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1000, background: B.surface, border: `1px solid ${B.border}`, maxHeight: 160, overflowY: "auto" }}>
              {results.map((r, i) => (
                <div key={i} onClick={() => selectResult(r)}
                  style={{ padding: "5px 8px", fontSize: 10, color: B.text, cursor: "pointer", borderBottom: `1px solid ${B.border}` }}
                  onMouseEnter={(e) => e.currentTarget.style.background = B.inset}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  {r.name.length > 80 ? r.name.substring(0, 80) + "..." : r.name}
                </div>
              ))}
            </div>
          )}
          {searching && <span style={{ position: "absolute", right: 6, top: 5, fontSize: 10, color: B.textDim }}>{"\u23F3"}</span>}
        </div>
        <button onClick={requestLocation} style={{ background: "none", border: `1px solid ${B.border}`, padding: "4px 8px", fontSize: 10, color: B.textMid, cursor: "pointer", fontFamily: B.font, whiteSpace: "nowrap" }} title="Use GPS">{locLoading ? "\u23F3" : "\uD83D\uDCCD"} GPS</button>
        {locSource !== "default" && (
          <button onClick={resetLocation} style={{ background: "none", border: `1px solid ${B.border}`, padding: "4px 8px", fontSize: 9, color: B.textDim, cursor: "pointer", fontFamily: B.font }} title="Reset to default">reset</button>
        )}
      </div>

      {/* Map */}
      <div style={{ height: 200, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL }}>
        <MapContainer center={[lat, lon]} zoom={6} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
          <TileLayer url={tileUrl} />
          <Marker position={[lat, lon]} />
          <ClickHandler onMapClick={handleMapClick} />
          <RecenterMap lat={lat} lon={lon} />
        </MapContainer>
      </div>

      {/* Location label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: B.textMid, fontFamily: B.font }}>{locSource === "gps" ? "\uD83D\uDCCD " : locSource === "manual" ? "\uD83D\uDCCC " : ""}{cityName}</span>
        <span style={{ fontSize: 9, color: B.textDim, fontFamily: B.font }}>{Math.abs(lat).toFixed(4)}{"\u00B0"}{lat >= 0 ? "N" : "S"}, {Math.abs(lon).toFixed(4)}{"\u00B0"}{lon >= 0 ? "E" : "W"}</span>
      </div>
    </div>
  );
}
