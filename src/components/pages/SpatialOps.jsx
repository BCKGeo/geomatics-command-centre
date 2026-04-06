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
  { epsg: "2955", name: "NAD83(CSRS) / UTM 11N", use: "Alberta, eastern BC", type: "proj" },
  { epsg: "2956", name: "NAD83(CSRS) / UTM 13N", use: "Saskatchewan, Manitoba", type: "proj" },
  { epsg: "2958", name: "NAD83(CSRS) / UTM 17N", use: "Ontario (southern)", type: "proj" },
  { epsg: "2960", name: "NAD83(CSRS) / UTM 19N", use: "Quebec, New Brunswick", type: "proj" },
  { epsg: "2953", name: "NAD83(CSRS) / NB Stereo", use: "New Brunswick provincial", type: "proj" },
  { epsg: "2952", name: "NAD83(CSRS) / PEI Stereo", use: "Prince Edward Island", type: "proj" },
  { epsg: "32610", name: "WGS84 / UTM 10N", use: "BC coast, Vancouver", type: "proj" },
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

const UTM_ZONES = [
  { zone: 7, cm: "-141\u00b0", provinces: "YT (west)" },
  { zone: 8, cm: "-135\u00b0", provinces: "YT, BC (northwest)" },
  { zone: 9, cm: "-129\u00b0", provinces: "BC (north coast), YT" },
  { zone: 10, cm: "-123\u00b0", provinces: "BC (coast, Vancouver, Prince George)" },
  { zone: 11, cm: "-117\u00b0", provinces: "BC (east), AB (west)" },
  { zone: 12, cm: "-111\u00b0", provinces: "AB (east), SK (west), NT" },
  { zone: 13, cm: "-105\u00b0", provinces: "SK, MB (west), NT, NU" },
  { zone: 14, cm: "-99\u00b0", provinces: "MB, NU" },
  { zone: 15, cm: "-93\u00b0", provinces: "MB (east), ON (west), NU" },
  { zone: 16, cm: "-87\u00b0", provinces: "ON (Thunder Bay)" },
  { zone: 17, cm: "-81\u00b0", provinces: "ON (south, Toronto, Ottawa)" },
  { zone: 18, cm: "-75\u00b0", provinces: "ON (east), QC (west, Montreal)" },
  { zone: 19, cm: "-69\u00b0", provinces: "QC (east, Quebec City), NB" },
  { zone: 20, cm: "-63\u00b0", provinces: "NB, NS, PE" },
  { zone: 21, cm: "-57\u00b0", provinces: "NS (east), NL (Labrador)" },
  { zone: 22, cm: "-51\u00b0", provinces: "NL (island)" },
];

const GDAL_CMDS = [
  { cmd: "ogr2ogr -f GPKG out.gpkg in.shp", desc: "Shapefile to GeoPackage" },
  { cmd: "ogr2ogr -f GeoJSON out.geojson in.gpkg", desc: "GeoPackage to GeoJSON" },
  { cmd: "ogr2ogr -t_srs EPSG:3005 out.gpkg in.gpkg", desc: "Reproject to BC Albers" },
  { cmd: "ogr2ogr -f GPKG out.gpkg in.gdb", desc: "File GDB to GeoPackage" },
  { cmd: "ogr2ogr -clipdst clip.gpkg in.gpkg out.gpkg", desc: "Clip by polygon" },
  { cmd: "ogrinfo -al -so in.gpkg", desc: "List layers + schema (summary)" },
  { cmd: "gdalwarp -t_srs EPSG:3005 in.tif out.tif", desc: "Reproject raster" },
  { cmd: "gdal_translate -of COG in.tif out.tif", desc: "Convert to Cloud-Optimized GeoTIFF" },
  { cmd: "gdalinfo in.tif", desc: "Raster metadata (CRS, extent, bands)" },
  { cmd: "gdal_merge.py -o out.tif in1.tif in2.tif", desc: "Merge raster tiles" },
  { cmd: "gdaltindex index.gpkg *.tif", desc: "Build raster tile index" },
];

const ANALYSIS_OPS = [
  { op: "Buffer", desc: "Create polygon at fixed distance around feature", use: "Setbacks, proximity zones, road corridors", tool: "ST_Buffer / QGIS Buffer" },
  { op: "Clip", desc: "Cut features to boundary of another layer", use: "Extract data within study area", tool: "ogr2ogr -clipdst / QGIS Clip" },
  { op: "Intersect", desc: "Output features where two layers overlap", use: "Find parcels within flood zone", tool: "ST_Intersection / QGIS Intersection" },
  { op: "Union", desc: "Combine all features from both layers", use: "Merge administrative boundaries", tool: "ST_Union / QGIS Union" },
  { op: "Dissolve", desc: "Merge features sharing an attribute value", use: "Aggregate parcels by owner", tool: "ST_Union GROUP BY / QGIS Dissolve" },
  { op: "Difference", desc: "Features in layer A not in layer B", use: "Exclude protected areas from analysis", tool: "ST_Difference / QGIS Difference" },
  { op: "Spatial Join", desc: "Transfer attributes based on location", use: "Assign zone to each point", tool: "ST_Join / QGIS Join by Location" },
  { op: "Voronoi", desc: "Divide area into nearest-point regions", use: "Service area assignment", tool: "ST_VoronoiPolygons / QGIS Voronoi" },
];

const TABS = [
  ["crs", "CRS Reference"],
  ["fmt", "Format Guide"],
  ["utm", "UTM Zones"],
  ["gdal", "GDAL Quick Ref"],
  ["analysis", "Analysis Ops"],
  ["links", "Resources"],
];

export function SpatialOps() {
  const { B } = useTheme();
  const [tab, setTab] = useState("crs");
  const [copied, setCopied] = useState(null);
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  const insetStyle = { background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL };

  const copyCmd = (cmd, i) => {
    navigator.clipboard.writeText(cmd).then(() => { setCopied(i); setTimeout(() => setCopied(null), 1500); });
  };

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
      <div className="spatial-tabs" style={{ display: "flex", gap: 4, marginBottom: 12, overflowX: "auto" }}>
        {TABS.map(([k, label]) => (
          <button key={k} onClick={(e) => { setTab(k); e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }); }} style={{ background: tab === k ? B.pri : "transparent", color: tab === k ? B.bg : B.textMid, border: `1px solid ${tab === k ? B.pri : B.border}`, padding: "6px 14px", fontSize: 11, fontFamily: B.font, cursor: "pointer", fontWeight: tab === k ? 700 : 400, letterSpacing: ".04em", whiteSpace: "nowrap" }}>{label}</button>
        ))}
      </div>

      {/* CRS Tab */}
      {tab === "crs" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: B.text }}>Common CRS Codes</h3>
          <div style={{ fontSize: 10, color: B.textDim, marginBottom: 10 }}>
            Geographic CRS in <span style={{ color: B.gold, fontWeight: 600 }}>gold</span>, projected in <span style={{ color: B.priBr, fontWeight: 600 }}>blue</span>. See UTM Zones tab for province lookup.
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

      {/* UTM Zones Tab */}
      {tab === "utm" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: B.text }}>Canadian UTM Zones</h3>
          <div style={{ fontSize: 10, color: B.textDim, marginBottom: 10 }}>
            NAD83(CSRS) EPSG codes: 269XX (NAD83) or 326XX (WGS84), where XX = zone number.
          </div>
          <div style={{ display: "grid", gap: 2 }}>
            <div style={{ display: "grid", gridTemplateColumns: "50px 60px 1fr", gap: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: B.textDim }}>
              <div>Zone</div><div>CM</div><div>Provinces / Territories</div>
            </div>
            {UTM_ZONES.map(z => (
              <div key={z.zone} style={{ ...insetStyle, padding: "5px 10px", display: "grid", gridTemplateColumns: "50px 60px 1fr", gap: 8, alignItems: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: B.priBr, fontFamily: B.font }}>{z.zone}</div>
                <div style={{ fontSize: 10, color: B.accent, fontFamily: B.font }}>{z.cm}</div>
                <div style={{ fontSize: 10, color: B.textMid }}>{z.provinces}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GDAL Quick Ref Tab */}
      {tab === "gdal" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: B.text }}>GDAL/OGR Quick Reference</h3>
          <div style={{ fontSize: 10, color: B.textDim, marginBottom: 10 }}>
            Click any command to copy. Requires <a href="https://gdal.org/" target="_blank" rel="noopener noreferrer" style={{ color: B.pri, textDecoration: "underline" }}>GDAL</a> installed.
          </div>
          <div style={{ display: "grid", gap: 3 }}>
            {GDAL_CMDS.map((g, i) => (
              <div key={i} onClick={() => copyCmd(g.cmd, i)} style={{ ...insetStyle, padding: "8px 10px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: B.priBr, wordBreak: "break-all" }}>{g.cmd}</div>
                  <div style={{ fontSize: 10, color: B.textDim, marginTop: 2 }}>{g.desc}</div>
                </div>
                <div style={{ fontSize: 9, color: copied === i ? "#22c55e" : B.textDim, fontFamily: B.font, flexShrink: 0, width: 40, textAlign: "right" }}>
                  {copied === i ? "Copied" : "Copy"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Ops Tab */}
      {tab === "analysis" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: B.text }}>Common Spatial Analysis Operations</h3>
          <div style={{ fontSize: 10, color: B.textDim, marginBottom: 10 }}>
            Standard vector geoprocessing operations. PostGIS (SQL) and QGIS equivalents shown.
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            {ANALYSIS_OPS.map(a => (
              <div key={a.op} style={{ ...insetStyle, padding: "8px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: B.priBr, fontFamily: B.font }}>{a.op}</div>
                  <div style={{ fontSize: 9, color: B.textDim, fontFamily: "monospace" }}>{a.tool}</div>
                </div>
                <div style={{ fontSize: 10, color: B.textMid }}>{a.desc}</div>
                <div style={{ fontSize: 9, color: B.gold, marginTop: 2 }}>{a.use}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {tab === "links" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          {SECTIONS.filter(s => s.title === "GIS").map(s => (
            <LinkCard key={s.title} section={s} />
          ))}
        </div>
      )}
    </div>
  );
}
