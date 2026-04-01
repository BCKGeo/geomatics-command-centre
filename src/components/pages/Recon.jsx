import { useTheme } from "../../context/ThemeContext.jsx";
import { LinkCard } from "../ui/LinkCard.jsx";
import { SECTIONS } from "../../data/sections.js";

const SENSORS = [
  { name: "Optical (Passive)", bands: "RGB, NIR, SWIR", platforms: "Sentinel-2, Landsat, Drone", res: "0.03 m \u2013 30 m", note: "Clear sky required" },
  { name: "SAR (Active)", bands: "C-band, L-band", platforms: "Sentinel-1, RADARSAT", res: "5 m \u2013 25 m", note: "Day/night, through cloud" },
  { name: "LiDAR (Active)", bands: "905 nm / 1550 nm", platforms: "Airborne, Terrestrial, Mobile", res: "1 \u2013 100+ pts/m\u00B2", note: "Point cloud + intensity" },
  { name: "Photogrammetry", bands: "RGB (stereo)", platforms: "Drone, Aerial, Satellite", res: "0.01 m \u2013 1 m", note: "SfM or stereo matching" },
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

export function Recon() {
  const { B } = useTheme();
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  const insetStyle = { background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL };

  return (
    <div>
      {/* Domain Context */}
      <div style={{ ...cardStyle, marginBottom: 12, borderLeft: `3px solid ${B.acc}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: B.acc, fontFamily: B.font, letterSpacing: ".04em", marginBottom: 4 }}>RECON & SENSING &mdash; IMAGERY, LiDAR, PHOTOGRAMMETRY</div>
        <div style={{ fontSize: 11, color: B.textMid, lineHeight: 1.5 }}>
          Remote sensing and 3D data capture for geomatics. Optical imagery needs clear skies; SAR works through cloud. LiDAR delivers direct 3D point clouds; photogrammetry derives them from overlapping photos. Always check point density specs against your deliverable requirements.
        </div>
      </div>

      {/* Reference Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        {/* Sensor Types */}
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: B.text }}>Sensor Types</h3>
          <div style={{ display: "grid", gap: 3 }}>
            {SENSORS.map(s => (
              <div key={s.name} style={{ ...insetStyle, padding: "5px 8px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: B.priBr, fontFamily: B.font }}>{s.name}</div>
                <div style={{ fontSize: 10, color: B.textMid }}>{s.bands}</div>
                <div style={{ fontSize: 9, color: B.textDim }}>{s.platforms} &middot; {s.res}</div>
                <div style={{ fontSize: 9, color: B.gold, marginTop: 1 }}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Point Cloud Formats */}
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

        {/* DEM Types */}
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

      {/* Links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {SECTIONS.filter(s => s.title === "Remote Sensing").map(s => (
          <LinkCard key={s.title} section={s} />
        ))}
      </div>
    </div>
  );
}
