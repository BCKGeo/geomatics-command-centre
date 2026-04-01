// Satellite propagation, PDOP computation, constellation identification
import {
  twoline2satrec,
  json2satrec,
  propagate,
  gstime,
  eciToEcf,
  ecfToLookAngles,
  degreesToRadians,
  radiansToDegrees,
} from "satellite.js";

export const CONSTELLATION_COLORS = {
  gps: "#3bbffa",
  glonass: "#ff716a",
  galileo: "#22c55e",
  beidou: "#f97316",
  unknown: "#94a3b8",
};

export const PDOP_THRESHOLDS = [
  { max: 2, label: "Excellent", color: "#22c55e" },
  { max: 4, label: "Good", color: "#84cc16" },
  { max: 6, label: "Fair", color: "#eab308" },
  { max: Infinity, label: "Poor", color: "#ef4444" },
];

export function pdopLevel(pdop) {
  return PDOP_THRESHOLDS.find((t) => pdop <= t.max) || PDOP_THRESHOLDS[3];
}

/**
 * Identify GNSS constellation from satellite name (Celestrak OMM JSON format)
 */
export function identifyConstellation(name) {
  const n = (name || "").toUpperCase();
  if (/^(GPS|NAVSTAR|USA\s)/.test(n) || /BIIR|BIIF|BIII/.test(n)) return "gps";
  if (/GLONASS|COSMOS/.test(n)) return "glonass";
  if (/GALILEO|GSAT/.test(n)) return "galileo";
  if (/BEIDOU|CZ-3/.test(n)) return "beidou";
  return "unknown";
}

/**
 * Propagate all TLEs to a given time, return visible satellites (el > 0)
 * @param {Array} tles - Array of { OBJECT_NAME, TLE_LINE1, TLE_LINE2 } (Celestrak OMM JSON)
 * @param {number} lat - Observer latitude (degrees)
 * @param {number} lon - Observer longitude (degrees)
 * @param {Date} date - Propagation time
 * @returns {Array} visible satellites [{ name, az, el, constellation }]
 */
export function propagateAll(entries, lat, lon, date) {
  const observerGd = {
    latitude: degreesToRadians(lat),
    longitude: degreesToRadians(lon),
    height: 0.1, // km above ellipsoid (approx)
  };
  const gmst = gstime(date);
  const visible = [];

  for (const entry of entries) {
    try {
      // OMM JSON (from Celestrak GP API) uses json2satrec; classic TLE uses twoline2satrec
      const satrec = entry.TLE_LINE1
        ? twoline2satrec(entry.TLE_LINE1, entry.TLE_LINE2)
        : json2satrec(entry);
      const posVel = propagate(satrec, date);
      if (!posVel.position || typeof posVel.position === "boolean") continue;

      const ecf = eciToEcf(posVel.position, gmst);
      const look = ecfToLookAngles(observerGd, ecf);
      const elDeg = radiansToDegrees(look.elevation);
      const azDeg = radiansToDegrees(look.azimuth);
      if (!Number.isFinite(elDeg) || !Number.isFinite(azDeg) || elDeg <= 0) continue;
      const name = entry.OBJECT_NAME || "Unknown";
      visible.push({
        name,
        az: azDeg,
        el: elDeg,
        constellation: identifyConstellation(name),
      });
    } catch {
      // Skip malformed entries
    }
  }
  return visible;
}

/**
 * Count satellites by constellation
 */
export function countByConstellation(satellites) {
  const c = { gps: 0, glonass: 0, galileo: 0, beidou: 0, total: 0 };
  for (const s of satellites) {
    if (c[s.constellation] !== undefined) c[s.constellation]++;
    c.total++;
  }
  return c;
}

/**
 * Compute PDOP from satellite geometry (elevation/azimuth)
 * Uses direction cosine matrix method.
 * @param {Array} satellites - [{ az, el }] in degrees
 * @returns {number|null} PDOP value, or null if < 4 satellites
 */
export function computePDOP(satellites) {
  if (satellites.length < 4) return null;

  // Build H matrix rows: [cos(el)*sin(az), cos(el)*cos(az), sin(el), 1]
  const H = satellites.map((s) => {
    const elR = degreesToRadians(s.el);
    const azR = degreesToRadians(s.az);
    return [
      Math.cos(elR) * Math.sin(azR),
      Math.cos(elR) * Math.cos(azR),
      Math.sin(elR),
      1,
    ];
  });

  // Compute H^T * H (4x4)
  const HTH = Array.from({ length: 4 }, () => new Float64Array(4));
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < H.length; k++) sum += H[k][i] * H[k][j];
      HTH[i][j] = sum;
    }
  }

  // Invert 4x4 via Gauss-Jordan
  const n = 4;
  const aug = HTH.map((row, i) => {
    const r = new Float64Array(8);
    for (let j = 0; j < 4; j++) r[j] = row[j];
    r[4 + i] = 1;
    return r;
  });

  for (let col = 0; col < n; col++) {
    // Partial pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) return null; // Singular

    for (let j = 0; j < 8; j++) aug[col][j] /= pivot;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 8; j++) aug[row][j] -= factor * aug[col][j];
    }
  }

  // Extract inverse diagonal: Q[0][0] + Q[1][1] + Q[2][2] + Q[3][3]
  const trace = aug[0][4] + aug[1][5] + aug[2][6] + aug[3][7];
  return trace > 0 ? Math.sqrt(trace) : null;
}
