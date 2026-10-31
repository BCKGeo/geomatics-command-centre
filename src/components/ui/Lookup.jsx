import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import { buildStaticIndex, buildNewsIndex, buildPortalIndex, search, groupResults } from "../../lib/search.js";
import { loadFeeds } from "../../hooks/useFeeds.js";
import { NAV } from "../../data/nav.js";

// Built once per page load. The news wire and the municipal portals arrive
// after the first open (two fetches of files the site already serves) and are cached here.
let STATIC = null;
let EXTRA = null;
let extraPromise = null;

function getStatic() {
  if (!STATIC) STATIC = buildStaticIndex();
  return STATIC;
}

function loadExtra() {
  if (EXTRA) return Promise.resolve(EXTRA);
  if (!extraPromise) {
    extraPromise = Promise.all([
      loadFeeds().catch(() => null),
      fetch(`${import.meta.env.BASE_URL}municipalities.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([feeds, munis]) => {
      EXTRA = [...buildNewsIndex(feeds), ...buildPortalIndex(munis)];
      return EXTRA;
    });
  }
  return extraPromise;
}

const ARROW_EXT = String.fromCodePoint(0x2197);
const ARROW_IN = String.fromCodePoint(0x2192);
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");

export function Lookup({ onClose }) {
  const { B } = useTheme();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [query, setQuery] = useState("");
  const [extra, setExtra] = useState(EXTRA);
  const [active, setActive] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
    let cancelled = false;
    loadExtra().then((x) => { if (!cancelled) setExtra(x); });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { cancelled = true; document.body.style.overflow = prev; };
  }, []);

  const index = useMemo(() => (extra ? [...getStatic(), ...extra] : getStatic()), [extra]);

  // Empty query: the nine pages, so two taps on a phone reach any page.
  const results = useMemo(() => {
    if (!query.trim()) {
      return getStatic().filter((e) => e.kind === "page" && NAV.some((n) => n.path === e.to)).map((e) => ({ ...e, score: 0 }));
    }
    return search(index, query);
  }, [index, query]);
  const groups = useMemo(() => groupResults(results), [results]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    listRef.current?.querySelector(".lookup-active")?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (item) => {
    if (!item) return;
    onClose();
    if (item.href) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    } else {
      navigate(item.to);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (flat.length ? (a + 1) % flat.length : 0)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(Math.max(0, flat.length - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); go(flat[active]); }
  };

  const activeItem = flat[active];
  const activeId = activeItem ? `lookup-opt-${active}` : undefined;
  const loading = !extra;

  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.55)", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "clamp(8px, 8vh, 80px) 12px 12px" }}>
      <div role="dialog" aria-modal="true" aria-label="Site search"
        style={{ width: "100%", maxWidth: 680, maxHeight: "calc(100vh - 24px)", display: "flex", flexDirection: "column", background: B.surface, color: B.text, fontFamily: B.font,
          border: `2px solid ${B.borderHi}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: `2px solid ${B.border}` }}>
          <span style={{ fontSize: 16 }}>{"🔍"}</span>
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown}
            placeholder="Search pages, jurisdictions, portals, terms, tools, CRS, news..."
            role="combobox" aria-expanded="true" aria-controls="lookup-list" aria-activedescendant={activeId} aria-autocomplete="list"
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
            style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: B.text, fontSize: 16, fontFamily: B.font, padding: 0 }} />
          <button onClick={onClose} aria-label="Close search"
            style={{ background: "none", border: `1px solid ${B.border}`, borderRadius: 3, color: B.textDim, fontFamily: B.font, fontSize: 10, padding: "3px 7px", cursor: "pointer" }}>ESC</button>
        </div>

        <div ref={listRef} id="lookup-list" role="listbox" aria-label="Results" style={{ overflowY: "auto", padding: "6px 6px 2px", flex: 1 }}>
          {flat.length === 0 && (
            <div style={{ padding: "22px 12px", textAlign: "center", color: B.textDim, fontSize: 12 }}>
              No matches for {"“"}{query.trim()}{"”"}. Try a page, province, city, term, EPSG code or tool.
            </div>
          )}
          {groups.map((g) => (
            <div key={g.kind} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, letterSpacing: ".12em", color: B.textDim, padding: "6px 8px 3px", textTransform: "uppercase" }}>{g.label}</div>
              {g.items.map((it) => {
                const i = flat.indexOf(it);
                const isActive = i === active;
                const row = (
                  <>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: B.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title}</div>
                      {it.context && <div style={{ fontSize: 10, color: B.textMid, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: B.sans }}>{it.context}</div>}
                    </div>
                    <span style={{ color: isActive ? B.priBr : B.textDim, fontSize: 11, flexShrink: 0, marginLeft: 10 }}>{it.href ? ARROW_EXT : ARROW_IN}</span>
                  </>
                );
                const style = {
                  display: "flex", alignItems: "center", padding: "6px 8px", textDecoration: "none", cursor: "pointer", borderRadius: 3,
                  background: isActive ? B.surfaceHi : "transparent", borderLeft: `3px solid ${isActive ? B.priBr : "transparent"}`,
                };
                return it.href ? (
                  <a key={`${it.kind}:${it.href}:${it.title}`} id={`lookup-opt-${i}`} role="option" aria-selected={isActive} className={isActive ? "lookup-active" : undefined}
                    href={it.href} target="_blank" rel="noopener noreferrer" onClick={onClose} onMouseMove={() => setActive(i)} style={style}>{row}</a>
                ) : (
                  <div key={`${it.kind}:${it.to}:${it.title}`} id={`lookup-opt-${i}`} role="option" aria-selected={isActive} className={isActive ? "lookup-active" : undefined}
                    onClick={() => go(it)} onMouseMove={() => setActive(i)} style={style}>{row}</div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 12px", borderTop: `1px solid ${B.border}`, fontSize: 9, color: B.textDim, letterSpacing: ".04em", flexWrap: "wrap" }}>
          <span>{"↑↓"} move {"·"} Enter open {"·"} Esc close {"·"} {isMac ? "⌘" : "Ctrl+"}K or / from anywhere</span>
          <span>{loading ? "Loading news and portals..." : `${index.length} entries, client side only`}</span>
        </div>
      </div>
    </div>
  );
}
