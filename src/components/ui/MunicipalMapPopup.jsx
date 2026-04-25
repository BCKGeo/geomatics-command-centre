export function MunicipalMapPopup({ municipality, B }) {
  const m = municipality;
  if (!m) return null;

  const pillStyle = (url) => ({
    display: url ? "inline-block" : "none",
    padding: "2px 8px",
    background: B.pri,
    color: "#fff",
    borderRadius: 3,
    fontSize: 10,
    margin: "2px",
    textDecoration: "none",
    cursor: "pointer",
  });

  return (
    <div style={{ fontFamily: B.font, fontSize: 12, color: "#222", lineHeight: 1.6, minWidth: 200, maxWidth: 280 }}>
      <strong style={{ fontSize: 13 }}>{m.name}</strong><br />
      <span style={{ fontSize: 10, color: "#666" }}>{m.entityType} | {m.province}</span><br />
      {m.population > 0 && <span style={{ fontSize: 11 }}>Pop. {m.population.toLocaleString()}<br /></span>}

      <div style={{ marginTop: 4 }}>
        {m.portalUrl && <a href={m.portalUrl} target="_blank" rel="noopener noreferrer" style={pillStyle(m.portalUrl)}>Data Portal &#x2197;</a>}
        {m.municipalUrl && <a href={m.municipalUrl} target="_blank" rel="noopener noreferrer" style={pillStyle(m.municipalUrl)}>Municipal &#x2197;</a>}
        {m.surveyStandards && <a href={m.surveyStandards} target="_blank" rel="noopener noreferrer" style={pillStyle(m.surveyStandards)}>Standards &#x2197;</a>}
      </div>

      {m.related && m.related.length > 0 && (
        <RelatedEntities related={m.related} B={B} />
      )}
    </div>
  );
}

function RelatedEntities({ related, B }) {
  const pillStyle = (url) => ({
    display: url ? "inline-block" : "none",
    padding: "1px 6px",
    background: B.pri,
    color: "#fff",
    borderRadius: 3,
    fontSize: 9,
    margin: "1px",
    textDecoration: "none",
  });

  return (
    <div style={{ borderTop: "1px solid #ccc", marginTop: 6, paddingTop: 4 }}>
      <div style={{ fontSize: 9, color: "#999", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}>Also at this location</div>
      {related.map((r, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          <strong style={{ fontSize: 11 }}>{r.name}</strong><br />
          <span style={{ fontSize: 10, color: "#666" }}>{r.entityType}</span>
          {r.population > 0 && <span style={{ fontSize: 10, color: "#666" }}> | Pop. {r.population.toLocaleString()}</span>}
          <br />
          {r.portalUrl && <a href={r.portalUrl} target="_blank" rel="noopener noreferrer" style={pillStyle(r.portalUrl)}>Data &#x2197;</a>}
          {r.municipalUrl && <a href={r.municipalUrl} target="_blank" rel="noopener noreferrer" style={pillStyle(r.municipalUrl)}>Municipal &#x2197;</a>}
          {r.surveyStandards && <a href={r.surveyStandards} target="_blank" rel="noopener noreferrer" style={pillStyle(r.surveyStandards)}>Standards &#x2197;</a>}
        </div>
      ))}
    </div>
  );
}
