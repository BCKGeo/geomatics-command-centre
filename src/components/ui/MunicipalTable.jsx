import { useState, useMemo, useEffect, useRef } from "react";
import { getShapeCategory, getCoverageScore, getCoverageColor } from "../../data/entityCategories.js";

const PAGE_SIZE = 50;
const COVERAGE_HEX = { green: "#4caf50", amber: "#e6a817", grey: "#555" };
const COVERAGE_LABELS = { green: "Full", amber: "Partial", grey: "None" };

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function LinkIcon({ url, label }) {
  if (!url) return <span style={{ color: "#555" }}>-</span>;
  return <a href={url} target="_blank" rel="noopener noreferrer" title={label} style={{ textDecoration: "none" }}>&#x2197;</a>;
}

function ShapeIcon({ shape, color, hasStandards, size = 10 }) {
  const ring = hasStandards ? { border: `2px solid #fff`, boxShadow: "0 0 3px rgba(255,255,255,0.4)" } : {};
  if (shape === "city") return <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, ...ring }} />;
  if (shape === "town") return (
    <span style={{ display: "inline-block", width: 0, height: 0, borderLeft: `${size/2}px solid transparent`, borderRight: `${size/2}px solid transparent`, borderBottom: `${size}px solid ${color}`, filter: hasStandards ? "drop-shadow(0 0 2px #fff)" : "none" }} />
  );
  if (shape === "diamond") return <span style={{ display: "inline-block", width: size, height: size, transform: "rotate(45deg)", borderRadius: 1, background: color, ...ring }} />;
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: 1, background: color, ...ring }} />;
}

function enrichRow(r) {
  if (r._enriched) return r;
  const coverageScore = getCoverageScore(r);
  const coverageColor = getCoverageColor(coverageScore);
  const shapeCategory = getShapeCategory(r.entityType);
  return { ...r, coverageScore, coverageColor, shapeCategory, _enriched: true };
}

export function MunicipalTable({ rows, B, selectedId, onRowClick, userLat, userLon }) {
  const hasLocation = userLat != null && userLon != null;
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState({ col: hasLocation ? "distanceKm" : "population", dir: hasLocation ? "asc" : "desc" });
  const [userChangedSort, setUserChangedSort] = useState(false);
  const selectedRef = useRef(null);

  const enriched = useMemo(() => rows.map((r) => {
    const base = enrichRow(r);
    if (hasLocation && r.lat != null && r.lon != null) {
      return { ...base, distanceKm: haversineKm(userLat, userLon, r.lat, r.lon) };
    }
    return base;
  }), [rows, hasLocation, userLat, userLon]);

  // Switch to distance sort when location becomes available (unless user manually changed sort)
  useEffect(() => {
    if (hasLocation && !userChangedSort) {
      setSort({ col: "distanceKm", dir: "asc" });
    } else if (!hasLocation && !userChangedSort) {
      setSort({ col: "population", dir: "desc" });
    }
  }, [hasLocation, userChangedSort]);

  useEffect(() => { setPage(0); }, [rows]);

  useEffect(() => {
    if (selectedId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedId]);

  const sorted = useMemo(() => {
    const s = [...enriched];
    s.sort((a, b) => {
      let av = a[sort.col], bv = b[sort.col];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av == null) av = sort.col === "population" || sort.col === "coverageScore" ? 0 : "";
      if (bv == null) bv = sort.col === "population" || sort.col === "coverageScore" ? 0 : "";
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return s;
  }, [enriched, sort]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (col) => {
    setUserChangedSort(true);
    setSort((prev) => prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: col === "distanceKm" ? "asc" : "desc" });
  };

  useEffect(() => {
    if (!selectedId) return;
    const idx = sorted.findIndex((r) => `${r.lat},${r.lon}-${r.name}` === selectedId);
    if (idx >= 0) {
      const targetPage = Math.floor(idx / PAGE_SIZE);
      if (targetPage !== page) setPage(targetPage);
    }
  }, [selectedId, sorted, page]);

  const th = (label, col, extra) => (
    <th
      onClick={() => toggleSort(col)}
      style={{ cursor: "pointer", padding: "4px 6px", textAlign: "left", borderBottom: `1px solid ${B.border}`, fontSize: 10, color: B.textDim, userSelect: "none", whiteSpace: "nowrap", ...extra }}
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
              <th style={{ padding: "4px 6px", borderBottom: `1px solid ${B.border}`, fontSize: 10, color: B.textDim, width: 20 }}></th>
              {th("Name", "name")}
              {th("Prov", "province")}
              {th("Type", "shapeCategory")}
              {th("Coverage", "coverageScore")}
              {th("Pop", "population")}
              {hasLocation && th("Dist", "distanceKm", { textAlign: "right" })}
              <th style={{ padding: "4px 6px", borderBottom: `1px solid ${B.border}`, fontSize: 10, color: B.textDim }}>Links</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => {
              const rowId = `${r.lat},${r.lon}-${r.name}`;
              const isSelected = rowId === selectedId;
              const hex = COVERAGE_HEX[r.coverageColor] || "#555";
              return (
                <tr
                  key={`${r.name}-${r.province}-${i}`}
                  ref={isSelected ? selectedRef : null}
                  onClick={() => onRowClick?.(r)}
                  style={{
                    background: isSelected ? `${B.pri}22` : i % 2 === 0 ? "transparent" : `${B.border}33`,
                    borderLeft: isSelected ? `3px solid ${B.pri}` : "3px solid transparent",
                    cursor: onRowClick ? "pointer" : "default",
                  }}
                >
                  <td style={{ ...cellStyle, textAlign: "center", width: 20, padding: "3px 4px" }}>
                    <ShapeIcon shape={r.shapeCategory} color={hex} hasStandards={Boolean(r.surveyStandards)} />
                  </td>
                  <td style={cellStyle}>{r.name}</td>
                  <td style={cellStyle}>{r.province}</td>
                  <td style={{ ...cellStyle, fontSize: 10, color: B.textDim, textTransform: "capitalize" }}>{r.shapeCategory}</td>
                  <td style={{ ...cellStyle, fontSize: 10 }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: hex, marginRight: 4, verticalAlign: "middle" }} />
                    <span style={{ color: B.textDim, verticalAlign: "middle" }}>{COVERAGE_LABELS[r.coverageColor]}</span>
                    {r.surveyStandards && <span style={{ marginLeft: 3, fontSize: 9, color: "#4caf50", verticalAlign: "middle" }} title="Has survey standards">S</span>}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>{r.population > 0 ? r.population.toLocaleString() : "-"}</td>
                  {hasLocation && (
                    <td style={{ ...cellStyle, textAlign: "right", fontSize: 10, color: B.textDim }}>
                      {r.distanceKm != null ? `${Math.round(r.distanceKm).toLocaleString()} km` : "-"}
                    </td>
                  )}
                  <td style={{ ...cellStyle, textAlign: "center", fontSize: 10 }}>
                    {r.portalUrl || r.municipalUrl || r.surveyStandards ? (<>
                      {r.portalUrl && <a href={r.portalUrl} target="_blank" rel="noopener noreferrer" title="Open Data / GIS Portal" style={{ color: "#e6a817", textDecoration: "none", marginRight: 4 }}>GIS</a>}
                      {r.municipalUrl && <a href={r.municipalUrl} target="_blank" rel="noopener noreferrer" title="Municipal Website" style={{ color: B.pri, textDecoration: "none", marginRight: 4 }}>Municipal</a>}
                      {r.surveyStandards && <a href={r.surveyStandards} target="_blank" rel="noopener noreferrer" title="Survey Standards" style={{ color: "#4caf50", textDecoration: "none" }}>Standards</a>}
                    </>) : <span style={{ color: "#555" }}>--</span>}
                  </td>
                </tr>
              );
            })}
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
