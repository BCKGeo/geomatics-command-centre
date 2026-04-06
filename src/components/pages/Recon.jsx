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

const OVERLAP_GUIDE = [
  { deliverable: "Orthophoto / Mosaic", forward: "75%", side: "65%", notes: "Standard mapping. Increase in terrain with large elevation changes." },
  { deliverable: "3D Model / Mesh", forward: "80%", side: "70%", notes: "Higher overlap for SfM reconstruction quality." },
  { deliverable: "Corridor (road/pipeline)", forward: "80%", side: "60%", notes: "Cross-track strips. Add oblique passes for steep terrain." },
  { deliverable: "Stockpile Volume", forward: "80%", side: "75%", notes: "High overlap to resolve steep slopes and shadowed areas." },
  { deliverable: "Facade / Vertical", forward: "80%", side: "80%", notes: "Add oblique imagery at 45 deg for building faces." },
  { deliverable: "Agriculture / NDVI", forward: "75%", side: "65%", notes: "Standard, but fly within 2 hrs of solar noon for consistent lighting." },
];

const SPECTRAL_INDICES = [
  { index: "NDVI", formula: "(NIR - Red) / (NIR + Red)", use: "Vegetation health, biomass estimation", range: "-1 to +1 (>0.3 healthy)" },
  { index: "NDRE", formula: "(NIR - RedEdge) / (NIR + RedEdge)", use: "Crop stress, chlorophyll content (better than NDVI for dense canopy)", range: "-1 to +1" },
  { index: "NDWI", formula: "(Green - NIR) / (Green + NIR)", use: "Water body delineation, moisture content", range: "-1 to +1 (>0 water)" },
  { index: "SAVI", formula: "((NIR - Red) / (NIR + Red + L)) * (1 + L)", use: "Vegetation in sparse canopy (L=0.5 typical)", range: "-1 to +1" },
  { index: "EVI", formula: "2.5 * (NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1)", use: "Enhanced vegetation, reduces atmospheric effects", range: "-1 to +1" },
];

const ACCURACY_SPECS = [
  { method: "RTK Drone (direct georef)", hz: "2-3 cm", vt: "3-5 cm", notes: "No GCPs needed. PPK equivalent accuracy." },
  { method: "PPK Drone (post-processed)", hz: "2-3 cm", vt: "3-5 cm", notes: "Process base+rover GNSS after flight." },
  { method: "GCP-Only Drone", hz: "3-5 cm", vt: "5-10 cm", notes: "Requires 5+ well-distributed GCPs." },
  { method: "No GCPs, no RTK/PPK", hz: "1-3 m", vt: "1-5 m", notes: "On-board GPS only. Not for surveying." },
  { method: "Aerial LiDAR (airborne)", hz: "5-15 cm", vt: "5-10 cm", notes: "Depends on flying height, IMU quality." },
  { method: "Terrestrial Laser Scan", hz: "1-3 mm", vt: "1-3 mm", notes: "At 10 m range. Degrades with distance." },
  { method: "Mobile LiDAR (MLS)", hz: "1-3 cm", vt: "1-3 cm", notes: "Vehicle/backpack-mounted. Needs GNSS+IMU." },
  { method: "Satellite Optical (VHR)", hz: "0.3-2 m", vt: "1-5 m", notes: "WorldView, Pleiades. CE90/LE90." },
];

const PROCESSING_SOFTWARE = [
  { name: "Pix4Dmapper", type: "Commercial", strengths: "Industry standard, excellent reports, agriculture tools", formats: "LAS, LAZ, GeoTIFF, OBJ", cost: "$$$$" },
  { name: "Agisoft Metashape", type: "Commercial", strengths: "Flexible, Python API, strong dense matching", formats: "LAS, LAZ, GeoTIFF, OBJ, PLY", cost: "$$$" },
  { name: "DroneDeploy", type: "SaaS", strengths: "Cloud processing, easy UI, fleet management", formats: "GeoTIFF, OBJ, LAS", cost: "$$$/mo" },
  { name: "OpenDroneMap", type: "Open Source", strengths: "Free, self-hosted, WebODM GUI, active community", formats: "LAS, GeoTIFF, OBJ, GeoPackage", cost: "Free" },
  { name: "3DF Zephyr", type: "Commercial", strengths: "Strong mesh/texture, laser scan alignment", formats: "LAS, PLY, OBJ, E57", cost: "$$$" },
  { name: "RealityCapture", type: "Commercial", strengths: "Fastest processing, laser+photo fusion", formats: "LAS, OBJ, PLY, XYZ", cost: "$$$$" },
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
        <div style={{ fontSize: 12, fontWeight: 700, color: B.acc, fontFamily: B.font, letterSpacing: ".04em", marginBottom: 4 }}>REMOTE SENSING {"\u2014"} IMAGERY, LiDAR, PHOTOGRAMMETRY</div>
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

      {/* Overlap / Sidelap Guide */}
      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: B.text }}>Overlap / Sidelap Guide</h3>
        <div style={{ display: "grid", gap: 3 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 55px 55px 1fr", gap: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: B.textDim }}>
            <div>Deliverable</div><div style={{ textAlign: "center" }}>Fwd</div><div style={{ textAlign: "center" }}>Side</div><div>Notes</div>
          </div>
          {OVERLAP_GUIDE.map(o => (
            <div key={o.deliverable} style={{ ...insetStyle, padding: "6px 10px", display: "grid", gridTemplateColumns: "1fr 55px 55px 1fr", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: B.text }}>{o.deliverable}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: B.priBr, fontFamily: B.font, textAlign: "center" }}>{o.forward}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: B.accent, fontFamily: B.font, textAlign: "center" }}>{o.side}</div>
              <div style={{ fontSize: 10, color: B.textDim }}>{o.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Spectral Indices */}
      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: B.text }}>Spectral Indices Reference</h3>
        <div style={{ display: "grid", gap: 4 }}>
          {SPECTRAL_INDICES.map(s => (
            <div key={s.index} style={{ ...insetStyle, padding: "8px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: B.priBr, fontFamily: B.font }}>{s.index}</span>
                <span style={{ fontSize: 9, color: B.textDim, fontFamily: "monospace" }}>{s.range}</span>
              </div>
              <div style={{ fontSize: 10, fontFamily: "monospace", color: B.accent, marginBottom: 3 }}>{s.formula}</div>
              <div style={{ fontSize: 10, color: B.textMid }}>{s.use}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Accuracy Specifications */}
      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: B.text }}>Accuracy Specifications by Method</h3>
        <div style={{ display: "grid", gap: 3 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 1fr", gap: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: B.textDim }}>
            <div>Method</div><div style={{ textAlign: "center" }}>Hz</div><div style={{ textAlign: "center" }}>Vt</div><div>Notes</div>
          </div>
          {ACCURACY_SPECS.map(a => (
            <div key={a.method} style={{ ...insetStyle, padding: "6px 10px", display: "grid", gridTemplateColumns: "1fr 70px 70px 1fr", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: B.text }}>{a.method}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: B.priBr, fontFamily: B.font, textAlign: "center" }}>{a.hz}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: B.accent, fontFamily: B.font, textAlign: "center" }}>{a.vt}</div>
              <div style={{ fontSize: 9, color: B.textDim }}>{a.notes}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 9, color: B.textDim, lineHeight: 1.4 }}>
          Values are typical ranges for well-controlled projects. Actual accuracy depends on flight parameters, sensor quality, control network, and processing workflow.
        </div>
      </div>

      {/* Processing Software Comparison */}
      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: B.text }}>Processing Software Comparison</h3>
        <div style={{ display: "grid", gap: 4 }}>
          {PROCESSING_SOFTWARE.map(p => (
            <div key={p.name} style={{ ...insetStyle, padding: "8px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: B.priBr, fontFamily: B.font }}>{p.name}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: B.textDim }}>{p.type}</span>
                  <span style={{ fontSize: 9, color: B.gold, fontWeight: 700 }}>{p.cost}</span>
                </div>
              </div>
              <div style={{ fontSize: 10, color: B.textMid }}>{p.strengths}</div>
              <div style={{ fontSize: 9, color: B.textDim, marginTop: 2 }}>Formats: {p.formats}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LAS Classification Codes */}
      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.text }}>ASPRS LAS Classification Codes</h3>
          <a href="https://github.com/ASPRSorg/LAS" target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: B.textDim, textDecoration: "none", fontFamily: B.font }}>LAS 1.4 R15 (2019) {"\u2192"}</a>
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
