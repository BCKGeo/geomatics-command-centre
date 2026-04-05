import { useTheme } from "../../context/ThemeContext.jsx";
import { Link } from "react-router-dom";
import { LinkCard } from "../ui/LinkCard.jsx";
import { SECTIONS } from "../../data/sections.js";

const SENSORS = [
  { name: "Optical (Passive)", bands: "RGB, NIR, SWIR", platforms: "Sentinel-2, Landsat, Drone", res: "0.03 m \u2013 30 m", note: "Clear sky required", bestFor: "Orthophotos, NDVI, change detection" },
  { name: "SAR (Active)", bands: "C-band, L-band", platforms: "Sentinel-1, RADARSAT", res: "5 m \u2013 25 m", note: "Day/night, through cloud", bestFor: "Deformation monitoring, flood mapping" },
  { name: "LiDAR (Active)", bands: "905 nm / 1550 nm", platforms: "Airborne, Terrestrial, Mobile", res: "1 \u2013 100+ pts/m\u00B2", note: "Point cloud + intensity", bestFor: "DTM/DSM, forestry, corridor mapping" },
  { name: "Photogrammetry", bands: "RGB (stereo)", platforms: "Drone, Aerial, Satellite", res: "0.01 m \u2013 1 m", note: "SfM or stereo matching", bestFor: "Stockpile volumes, 3D models, orthos" },
];

const POINT_CLOUD_FORMATS = [
  { fmt: "LAS 1.4", desc: "ASPRS standard, supports classification, GPS time, RGB, NIR" },
  { fmt: "LAZ", desc: "Compressed LAS (Martin Isenburg), 5\u201310x smaller" },
  { fmt: "E57", desc: "ASTM standard for terrestrial laser scanning, stores images" },
  { fmt: "COPC", desc: "Cloud-Optimized Point Cloud, LAZ + spatial index for streaming" },
  { fmt: "PLY/PCD", desc: "Research formats, common in 3D vision / ML pipelines" },
];

const DEM_TYPES = [
  { type: "DSM", full: "Digital Surface Model", what: "Top of canopy/buildings, first-return LiDAR" },
  { type: "DTM", full: "Digital Terrain Model", what: "Bare earth, ground-classified returns" },
  { type: "DEM", full: "Digital Elevation Model", what: "Generic term, usually means DTM" },
  { type: "CHM", full: "Canopy Height Model", what: "DSM minus DTM, vegetation height" },
  { type: "nDSM", full: "Normalized DSM", what: "DSM minus DTM, all above-ground features" },
];

const PIPELINE = [
  { step: "Acquisition", icon: "\uD83D\uDCF7", items: ["Flight planning", "GCP survey", "Sensor calibration", "Data capture"] },
  { step: "Processing", icon: "\u2699\uFE0F", items: ["Alignment / SfM", "Dense matching", "Classification", "QC checks"] },
  { step: "Products", icon: "\uD83D\uDDFA\uFE0F", items: ["Ortho / mosaic", "DSM / DTM", "Point cloud", "3D mesh"] },
  { step: "Delivery", icon: "\uD83D\uDCE6", items: ["Format conversion", "CRS validation", "Metadata", "Archive"] },
];

const LAS_CODES = [
  { code: 1, label: "Unclassified" },
  { code: 2, label: "Ground" },
  { code: 3, label: "Low Vegetation" },
  { code: 4, label: "Medium Vegetation" },
  { code: 5, label: "High Vegetation" },
  { code: 6, label: "Building" },
  { code: 7, label: "Low Point (Noise)" },
  { code: 9, label: "Water" },
  { code: 10, label: "Rail" },
  { code: 11, label: "Road Surface" },
  { code: 13, label: "Wire \u2013 Guard" },
  { code: 14, label: "Wire \u2013 Conductor" },
  { code: 15, label: "Transmission Tower" },
  { code: 17, label: "Bridge Deck" },
  { code: 18, label: "High Noise" },
];

export function Recon() {
  const { B } = useTheme();
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  const insetStyle = { background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL };

  return (
    <div>
      {/* Domain Context */}
      <div style={{ ...cardStyle, marginBottom: 12, borderLeft: `3px solid ${B.acc}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: B.acc, fontFamily: B.font, letterSpacing: ".04em", marginBottom: 4 }}>RECON & SENSING {"\u2014"} IMAGERY, LiDAR, PHOTOGRAMMETRY</div>
        <div style={{ fontSize: 11, color: B.textMid, lineHeight: 1.5 }}>
          Remote sensing and 3D data capture for geomatics. Optical imagery needs clear skies; SAR works through cloud. LiDAR delivers direct 3D point clouds; photogrammetry derives them from overlapping photos. Always check point density specs against your deliverable requirements.
        </div>
      </div>

      {/* Processing Pipeline */}
      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: B.text }}>Processing Pipeline</h3>
        <div className="recon-pipeline" style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
          {PIPELINE.map((p, i) => (
            <div key={p.step} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "flex-start", flex: 1 }}>
                <div style={{ ...insetStyle, padding: "10px 12px", flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 18 }}>{p.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: B.priBr, fontFamily: B.font, marginTop: 4 }}>{p.step}</div>
                  <div style={{ marginTop: 6 }}>
                    {p.items.map(item => (
                      <div key={item} style={{ fontSize: 9, color: B.textDim, lineHeight: 1.6 }}>{item}</div>
                    ))}
                  </div>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className="arrow-h" style={{ display: "flex", alignItems: "center", padding: "24px 6px 0", color: B.textDim, fontSize: 16, flexShrink: 0 }}>{"\u2192"}</div>
                )}
              </div>
              {i < PIPELINE.length - 1 && (
                <div className="arrow-v" style={{ textAlign: "center", color: B.textDim, fontSize: 16, padding: "4px 0" }}>{"\u2193"}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* GSD Shortcut */}
      <div style={{ ...cardStyle, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: B.text }}>Need to calculate Ground Sample Distance?</div>
          <div style={{ fontSize: 10, color: B.textDim }}>GSD = (sensor pixel size {"\u00D7"} flight height) / focal length</div>
        </div>
        <Link to="/survey-tools#photo" style={{ background: B.pri, color: "#fff", padding: "6px 14px", fontSize: 10, fontFamily: B.font, fontWeight: 700, textDecoration: "none", letterSpacing: ".04em" }}>OPEN GSD CALCULATOR {"\u2192"}</Link>
      </div>

      {/* Reference Row */}
      <div className="recon-ref" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12, marginBottom: 12 }}>
        {/* Sensor Types */}
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: B.text }}>Sensor Types</h3>
          <div style={{ display: "grid", gap: 3 }}>
            {SENSORS.map(s => (
              <div key={s.name} style={{ ...insetStyle, padding: "6px 8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: B.priBr, fontFamily: B.font }}>{s.name}</span>
                  <span style={{ fontSize: 9, color: B.gold }}>{s.note}</span>
                </div>
                <div style={{ fontSize: 10, color: B.textMid }}>{s.bands} {"\u00B7"} {s.res}</div>
                <div style={{ fontSize: 9, color: B.textDim, marginTop: 1 }}>{s.platforms}</div>
                <div style={{ fontSize: 9, color: B.sec, marginTop: 2, fontWeight: 600 }}>Best for: {s.bestFor}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Point Cloud Formats + DEM Types */}
        <div style={{ display: "grid", gap: 12 }}>
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: B.text }}>Point Cloud Formats</h3>
            <div style={{ display: "grid", gap: 3 }}>
              {POINT_CLOUD_FORMATS.map(f => (
                <div key={f.fmt} style={{ ...insetStyle, padding: "5px 8px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: B.pri, fontFamily: B.font }}>{f.fmt}</div>
                  <div style={{ fontSize: 10, color: B.textMid }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: B.text }}>Elevation Products</h3>
            <div style={{ display: "grid", gap: 3 }}>
              {DEM_TYPES.map(d => (
                <div key={d.type} style={{ ...insetStyle, padding: "5px 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: B.gold, fontFamily: B.font, width: 36 }}>{d.type}</span>
                    <span style={{ fontSize: 10, color: B.textDim }}>{d.full}</span>
                  </div>
                  <div style={{ fontSize: 10, color: B.textMid, marginTop: 1 }}>{d.what}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LAS Classification Codes */}
      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.text }}>ASPRS LAS Classification Codes</h3>
          <a href="https://www.asprs.org/divisions-committees/lidar-division/laser-las-file-format-exchange-activities" target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: B.textDim, textDecoration: "none", fontFamily: B.font }}>LAS 1.4 R15 (2019) {"\u2192"}</a>
        </div>
        <div className="las-codes" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 3 }}>
          {LAS_CODES.map(c => (
            <div key={c.code} style={{ ...insetStyle, padding: "4px 8px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: B.priBr, fontFamily: B.font, width: 22, textAlign: "right", flexShrink: 0 }}>{c.code}</span>
              <span style={{ fontSize: 10, color: B.textMid }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {SECTIONS.filter(s => s.title === "Remote Sensing").map(s => (
          <LinkCard key={s.title} section={s} />
        ))}
      </div>
    </div>
  );
}
