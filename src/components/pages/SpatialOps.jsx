import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { LinkCard } from "../ui/LinkCard.jsx";
import { SECTIONS } from "../../data/sections.js";

const CRS_CHEAT = [
  { epsg: "4326", name: "WGS84 Geographic", use: "GPS, web maps (lat/lon)", type: "geo" },
  { epsg: "4617", name: "NAD83(CSRS) Geographic", use: "Canada official (lat/lon)", type: "geo" },
  { epsg: "3005", name: "NAD83 / BC Albers", use: "Province-wide BC analysis", type: "proj" },
  { epsg: "3857", name: "WGS84 / Pseudo-Mercator", use: "Web tiles (Google, OSM)", type: "proj" },
  { epsg: "3978", name: "NAD83 / Canada Atlas LCC", use: "National-scale mapping", type: "proj" },
  { epsg: "3979", name: "NAD83(CSRS) / Canada Atlas LCC", use: "National-scale (CSRS)", type: "proj" },
];

const FORMAT_REF = [
  { fmt: "GeoPackage", ext: ".gpkg", note: "OGC standard, SQLite-based, no limits", when: "New project? Use this." },
  { fmt: "GeoJSON", ext: ".geojson", note: "Web-friendly, WGS84 only by spec", when: "Web maps, APIs, Leaflet/Mapbox" },
  { fmt: "Shapefile", ext: ".shp/.dbf/.shx/.prj", note: "Legacy, 2 GB limit, 10-char fields", when: "Legacy systems, Esri interop" },
  { fmt: "FlatGeobuf", ext: ".fgb", note: "Fast binary, HTTP range requests", when: "Large datasets, web streaming" },
  { fmt: "GeoTIFF", ext: ".tif", note: "Raster + CRS metadata, COG for web", when: "Raster analysis, elevation" },
  { fmt: "KML/KMZ", ext: ".kml/.kmz", note: "Google Earth, WGS84", when: "Client delivery, visualization" },
  { fmt: "File GDB", ext: ".gdb/", note: "Esri proprietary, GDAL read support", when: "ArcGIS workflows only" },
  { fmt: "LAS/LAZ", ext: ".las/.laz", note: "Point cloud, LAZ = compressed", when: "LiDAR data exchange" },
];

export function SpatialOps() {
  const { B } = useTheme();
  const [tab, setTab] = useState("crs");
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  const insetStyle = { background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL };

  return (
    <div>
      {/* Domain Context */}
      <div style={{ ...cardStyle, marginBottom: 12, borderLeft: `3px solid ${B.pri}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: B.pri, fontFamily: B.font, letterSpacing: ".04em", marginBottom: 4 }}>SPATIAL OPS {"\u2014"} GIS & DATA</div>
        <div style={{ fontSize: 11, color: B.textMid, lineHeight: 1.5 }}>
          GIS tools, coordinate reference systems, and data formats for Canadian geospatial work. Always verify CRS before combining datasets. GeoPackage is the recommended exchange format; Shapefile for legacy compatibility only.
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="spatial-tabs" style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {[["crs", "CRS Reference"], ["fmt", "Format Guide"]].map(([k, label]) => (
          <button key={k} onClick={(e) => { setTab(k); e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }} style={{ background: tab === k ? B.pri : "transparent", color: tab === k ? B.bg : B.textMid, border: `1px solid ${tab === k ? B.pri : B.border}`, padding: "6px 14px", fontSize: 11, fontFamily: B.font, cursor: "pointer", fontWeight: tab === k ? 700 : 400, letterSpacing: ".04em", whiteSpace: "nowrap" }}>{label}</button>
        ))}
      </div>

      {/* CRS Tab */}
      {tab === "crs" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: B.text }}>Common CRS Codes</h3>
          <div style={{ fontSize: 10, color: B.textDim, marginBottom: 10 }}>
            For UTM zone lookup by province, use{" "}
            <a href="https://epsg.io" target="_blank" rel="noopener noreferrer" style={{ color: B.pri, textDecoration: "underline" }}>epsg.io</a>
            {" "}or{" "}
            <a href="https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/trx.php" target="_blank" rel="noopener noreferrer" style={{ color: B.pri, textDecoration: "underline" }}>NRCan TRX</a>.
          </div>
          <div style={{ display: "grid", gap: 3 }}>
            {CRS_CHEAT.map(c => (
              <div key={c.epsg} style={{ ...insetStyle, padding: "5px 10px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 52, fontFamily: B.font, fontSize: 11, fontWeight: 700, color: c.type === "geo" ? B.gold : B.priBr, flexShrink: 0 }}>
                  {c.epsg}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: B.text, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: B.textDim }}>{c.use}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Format Tab */}
      {tab === "fmt" && (
        <div style={cardStyle}>
          <div style={{ ...insetStyle, padding: "8px 12px", marginBottom: 10, fontSize: 11, color: B.textMid }}>
            <span style={{ fontWeight: 700, color: B.pri }}>Quick pick:</span> New project? {"\u2192"} GeoPackage. Web? {"\u2192"} GeoJSON. Legacy? {"\u2192"} Shapefile.
          </div>
          <div style={{ display: "grid", gap: 3 }}>
            {FORMAT_REF.map(f => (
              <div key={f.fmt} style={{ ...insetStyle, padding: "6px 10px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 90, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: B.priBr, fontFamily: B.font }}>{f.fmt}</div>
                  <div style={{ fontSize: 9, color: B.textDim, fontFamily: B.font }}>{f.ext}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: B.textMid }}>{f.note}</div>
                  <div style={{ fontSize: 9, color: B.gold, marginTop: 2, fontWeight: 600 }}>{f.when}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 12 }}>
        {SECTIONS.filter(s => s.title === "GIS").map(s => (
          <LinkCard key={s.title} section={s} />
        ))}
      </div>
    </div>
  );
}
