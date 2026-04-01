import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { LinkCard } from "../ui/LinkCard.jsx";
import { SECTIONS } from "../../data/sections.js";

const CRS_CHEAT = [
  { epsg: "4326", name: "WGS84 Geographic", use: "GPS, web maps (lat/lon)", type: "geo" },
  { epsg: "4617", name: "NAD83(CSRS) Geographic", use: "Canada official (lat/lon)", type: "geo" },
  { epsg: "326XX", name: "WGS84 / UTM Zone XX N", use: "Mapping, field survey", type: "proj" },
  { epsg: "2955", name: "NAD83(CSRS) / UTM 11N", use: "BC Peace Region", type: "proj" },
  { epsg: "2956", name: "NAD83(CSRS) / UTM 10N", use: "BC Central/Coast", type: "proj" },
  { epsg: "3005", name: "NAD83 / BC Albers", use: "Province-wide BC analysis", type: "proj" },
  { epsg: "3857", name: "WGS84 / Pseudo-Mercator", use: "Web tiles (Google, OSM)", type: "proj" },
  { epsg: "6661", name: "NAD83(CSRS)v7 / UTM 10N", use: "Modern CSRS epoch-aware", type: "proj" },
];

const FORMAT_REF = [
  { fmt: "Shapefile", ext: ".shp/.dbf/.shx/.prj", note: "Legacy, 2 GB limit, 10-char fields" },
  { fmt: "GeoPackage", ext: ".gpkg", note: "OGC standard, SQLite-based, no limits" },
  { fmt: "GeoJSON", ext: ".geojson", note: "Web-friendly, WGS84 only by spec" },
  { fmt: "KML/KMZ", ext: ".kml/.kmz", note: "Google Earth, WGS84" },
  { fmt: "File GDB", ext: ".gdb/", note: "Esri proprietary, GDAL read support" },
  { fmt: "GeoTIFF", ext: ".tif", note: "Raster + CRS metadata, COG for web" },
  { fmt: "LAS/LAZ", ext: ".las/.laz", note: "Point cloud, LAZ = compressed" },
  { fmt: "FlatGeobuf", ext: ".fgb", note: "Fast binary, HTTP range requests" },
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
        <div style={{ fontSize: 12, fontWeight: 700, color: B.pri, fontFamily: B.font, letterSpacing: ".04em", marginBottom: 4 }}>SPATIAL OPS &mdash; GIS & DATA</div>
        <div style={{ fontSize: 11, color: B.textMid, lineHeight: 1.5 }}>
          GIS tools, coordinate reference systems, data formats, and open data portals for Canadian geospatial work. Always verify CRS before combining datasets. GeoPackage is the recommended exchange format; Shapefile for legacy compatibility only.
        </div>
      </div>

      {/* Reference Panel */}
      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {[["crs", "CRS Cheat Sheet"], ["fmt", "Format Reference"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{ background: tab === k ? B.pri : "transparent", color: tab === k ? B.bg : B.textMid, border: `1px solid ${tab === k ? B.pri : B.border}`, padding: "4px 12px", fontSize: 11, fontFamily: B.font, cursor: "pointer", fontWeight: tab === k ? 700 : 400 }}>{label}</button>
          ))}
        </div>

        {tab === "crs" && (
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
        )}

        {tab === "fmt" && (
          <div style={{ display: "grid", gap: 3 }}>
            {FORMAT_REF.map(f => (
              <div key={f.fmt} style={{ ...insetStyle, padding: "5px 10px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 80, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: B.priBr, fontFamily: B.font }}>{f.fmt}</div>
                  <div style={{ fontSize: 9, color: B.textDim, fontFamily: B.font }}>{f.ext}</div>
                </div>
                <div style={{ fontSize: 10, color: B.textMid }}>{f.note}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {SECTIONS.filter(s => s.title === "GIS").map(s => (
          <LinkCard key={s.title} section={s} />
        ))}
      </div>
    </div>
  );
}
