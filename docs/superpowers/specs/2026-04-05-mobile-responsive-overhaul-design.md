# Mobile Responsive Overhaul - BCKGeo Dashboard v3

## Context

The dashboard works well on desktop but has multiple mobile layout issues visible on phones (Samsung S22 Ultra, iPhones) and narrow viewports. The header/clocks are cramped, nav tabs wrap awkwardly, the Remote Sensing pipeline has dead space, Survey Tools tab bars don't auto-center, SVG diagrams are hard to read, input fields overflow, and the footer looks off. The current responsive system is 20+ individual `@media` rules with `!important` overrides scattered in a single `<style>` block in App.jsx. This overhaul fixes all identified issues AND modernizes the responsive foundation so future tabs are responsive by default.

**Target devices:** Phones (375px+), tablets (768px+), laptops (1024px+), desktops (1280px+), ultrawides (2560px+).

---

## 1. Responsive CSS Modernization (App.jsx lines 70-112)

### Current state
- 20+ individual `@media(max-width:768px)` rules, each on its own line
- Most use `grid-template-columns: 1fr !important` to force single-column
- No fluid sizing (all padding/gaps are fixed px values)
- `maxWidth: 1280` on main content with no ultrawide consideration

### Changes

**Replace per-class media queries with auto-fit grids:**

All grid containers that currently have dedicated `@media` rules will switch to intrinsic responsive grids. The media query rules for these classes will be REMOVED from the `<style>` block:

| Class | Current desktop | New pattern | Removes media query? |
|-------|----------------|-------------|---------------------|
| `.cmd-hero` | `340px 1fr` | Keep fixed — this one needs the sidebar width | No, keep @768px rule |
| `.cmd-kp-telem` | `1fr 1fr` | `repeat(auto-fit, minmax(320px, 1fr))` | Yes |
| `.cmd-sw-forecast` | `1fr 1fr` | `repeat(auto-fit, minmax(300px, 1fr))` | Yes |
| `.cmd-ref` | `1fr 1fr` | `repeat(auto-fit, minmax(300px, 1fr))` | Yes |
| `.cmd-stations` | `1fr 1fr 1fr 1fr` | `repeat(auto-fit, minmax(160px, 1fr))` | Yes (both 768 + 480) |
| `.cmd-telemetry` | `1fr 1fr 1fr` | `repeat(auto-fit, minmax(140px, 1fr))` | Yes (both 768 + 480) |
| `.forecast-days` | multi-col | `repeat(auto-fit, minmax(200px, 1fr))` | Yes |
| `.geo-ref` | `1fr 1fr` | `repeat(auto-fit, minmax(300px, 1fr))` | Yes |
| `.geo-links` | `1fr 1fr` | `repeat(auto-fit, minmax(300px, 1fr))` | Yes |
| `.geod-hero` | `1fr 1fr 1fr` | `repeat(auto-fit, minmax(260px, 1fr))` | Yes |
| `.recon-ref` | `1fr 1fr` | `repeat(auto-fit, minmax(300px, 1fr))` | Yes |
| `.regs-cats` | multi-col | `repeat(auto-fit, minmax(280px, 1fr))` | Yes |
| `.codex-grid` | multi-col | `repeat(auto-fit, minmax(280px, 1fr))` | Yes |
| `.fops-grid` | `1fr 1fr` | `repeat(auto-fit, minmax(300px, 1fr))` | Yes |
| `.calc-results` | multi-col | `repeat(auto-fit, minmax(280px, 1fr))` | Yes |

**Fluid spacing:** Replace fixed padding/gap values inline in components:
- Main content padding (line 199): `padding: "14px 20px"` -> `padding: "clamp(10px, 2.5vw, 14px) clamp(10px, 3vw, 20px)"`
- Card padding: `padding: 16` -> `padding: "clamp(10px, 2.5vw, 16px)"`
- Grid gaps: `gap: 12` -> `gap: "clamp(8px, 2vw, 12px)"`

**Ultrawide max-width:** Change line 199 `maxWidth: 1280` to `maxWidth: 1600` so content breathes on wide monitors without stretching absurdly.

**Remaining targeted media queries** (keep these, they handle behavior changes not just grid collapse):
```css
@media(max-width:768px) {
  .cmd-hero { grid-template-columns: 1fr !important }
  .cmd-split { grid-template-columns: 1fr !important }
  .survey-tabs { overflow-x: auto; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch }
  .prov-btns { overflow-x: auto; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch }
  .recon-pipeline { flex-direction: column !important }
  .mission-steps { flex-direction: column !important }
  .spatial-tabs button { font-size: 10px; padding: 4px 8px }
  .nav-strip { overflow-x: auto; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch }
}
@media(max-width:480px) {
  .header-inner { flex-direction: column; align-items: flex-start }
}
@media print { .no-print { display: none !important } }
```

**Files modified:** `src/App.jsx` (style block + inline styles on main content div), and each page component for inline gap/padding values.

---

## 2. Header Fix (App.jsx lines 117-196)

### Problem
At <480px the header stacks vertically but clocks (Zulu + Local + Field TZ) still try to sit in a row, and the nav wraps into 3+ messy rows.

### Changes

**Clock layout:**
- Wrap all 3 clock boxes in a container div
- Add CSS: at <=480px, the clock container becomes `flex-wrap: wrap` and Field TZ moves to its own row below Zulu+Local
- Remove `minWidth: 120` from Field TZ (line 146) — replace with `minWidth: 100`
- Add `fontVariantNumeric: "tabular-nums"` to all clock `<div>` styles (lines 140, 144, 166) to prevent digit jitter

**Nav tabs -> horizontal scroll strip:**
- Add `className="nav-strip"` to the nav container div (line 172)
- At <=768px (via media query above), nav becomes horizontally scrollable
- Add CSS `mask-image` fade on edges:
  ```css
  .nav-strip { mask-image: linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent) }
  ```
  (Only applied at <=768px via the media query)
- Add `scrollbar-width: none` and `::-webkit-scrollbar { display: none }` to hide scrollbar
- Add `scroll-snap-type: x mandatory` on container, `scroll-snap-align: center` on each NavLink

**Nav auto-centering on route change:**
- Add a `useEffect` in Layout that watches `routerLocation.pathname`
- On change, find the active NavLink element via `document.querySelector('.nav-active')`
- Call `element?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })`

**Files modified:** `src/App.jsx`

---

## 3. Tab Auto-Centering (Survey Tools + Provincial Intel + SpatialOps)

### Problem
When you tap a tab that's partially off-screen in a horizontal scroll bar, the bar doesn't center on it. You lose context of what's before/after.

### Changes

**SurveyTools.jsx:**
- On tab change (the hash routing handler), after setting active tab state, call `scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })` on the clicked tab element
- Use a ref on the tab container + individual tab refs, or use `event.currentTarget.scrollIntoView(...)` directly in the click handler
- Add CSS fade mask on `.survey-tabs` container (same pattern as nav strip)

**Provincial.jsx:**
- Same pattern on province button click — auto-center the selected button
- Add CSS fade mask on `.prov-btns`

**SpatialOps.jsx (GIS tab):**
- Same pattern on `.spatial-tabs` if it scrolls at mobile widths

**Shared approach:** Create a small utility function or inline the pattern:
```js
const centerTab = (e) => {
  e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
};
```
Add `onClick` handler that calls this after the existing state change.

**Files modified:** `src/components/pages/SurveyTools.jsx`, `src/components/pages/Provincial.jsx`, `src/components/pages/SpatialOps.jsx`

---

## 4. Input Field Overflow Fix

### Problem
Coordinate inputs in InverseCalc, ForwardCalc, CoordConverter use `width: 120` (fixed px). On 375px phones with padding, they overflow the container.

### Changes

**All coordinate input fields:**
- Replace `width: 120` with `width: "100%", maxWidth: 120`
- Replace DMS inputs `width: 48` with `width: "100%", maxWidth: 48`
- Add `boxSizing: "border-box"` to all inputs (if not already set)
- Add `fontSize: 16` on inputs to prevent iOS Safari auto-zoom on focus
- Add `inputMode: "decimal"` for numeric keyboard on mobile

**Input container layout:**
- Ensure input rows use `display: flex; flexWrap: wrap; gap: 6` so DMS fields can wrap to a second line at very narrow widths

**Files modified:** `src/components/field/InverseCalc.jsx`, `src/components/field/ForwardCalc.jsx`, `src/components/field/CoordConverter.jsx`, and any other field components with coordinate inputs (ScaleCalc, MagPanel)

---

## 5. SVG Diagram Responsiveness (InverseCalc + ForwardCalc)

### Problem
The bearing/distance diagram SVG is hard to read on mobile — labels overlap, text is small, the diagram doesn't scale well when the grid stacks.

### Changes

- Ensure SVG uses `viewBox` (already does) and set container to `width: "100%", maxWidth: 280`
- Remove any hardcoded `width`/`height` attributes on the `<svg>` element
- Increase SVG text label font sizes from ~10px to 12-13px
- Add more spacing between overlapping labels (azimuth value + distance value)
- When grid stacks at <=768px (`.cmd-split` goes to `1fr`), diagram sits below the form at full container width — verify this looks clean

**Files modified:** `src/components/field/InverseCalc.jsx`, `src/components/field/ForwardCalc.jsx`

---

## 6. Remote Sensing Pipeline Fix (Recon.jsx)

### Problem
The Processing Pipeline cards (Acquisition -> Processing -> Products -> Delivery) stack vertically on mobile but the `->` arrows float right with dead space. Cards are narrow and left-aligned.

### Changes

- Cards: set `width: "100%"` when stacked (remove any fixed widths)
- Arrows: detect vertical vs horizontal layout. When `.recon-pipeline` has `flex-direction: column` (mobile), replace `->` with a down arrow/chevron character or hide horizontal arrows and show vertical ones
- Approach: Use a CSS class toggle or a simple media query check:
  ```css
  .recon-pipeline .arrow-h { display: inline }
  .recon-pipeline .arrow-v { display: none }
  @media(max-width:768px) {
    .recon-pipeline .arrow-h { display: none }
    .recon-pipeline .arrow-v { display: block; text-align: center; margin: 4px 0 }
  }
  ```
- Each card in the pipeline should be full-width in vertical mode

**Files modified:** `src/components/pages/Recon.jsx`, `src/App.jsx` (add arrow CSS rules)

---

## 7. Footer Cleanup (App.jsx lines 217-227)

### Problem
Footer attribution text uses monospace font (`B.font`) and runs as one long line on mobile. Looks cramped.

### Changes

- At <=480px, the data source line (line 221) wraps naturally — but add `flexDirection: "column"` on the footer flex container so "BCKGeo" sits above the attribution text instead of beside it
- Add a `footer-wrap` class and media query:
  ```css
  @media(max-width:480px) { .footer-wrap { flex-direction: column; align-items: center; text-align: center } }
  ```
- Add `paddingBottom: "env(safe-area-inset-bottom, 8px)"` to the footer for iPhone safe area
- Reduce disclaimer font from 9px to 8px at <=480px (optional, already small)

**Files modified:** `src/App.jsx`

---

## 8. Device-Specific & Cross-Browser

### Changes

- **Viewport meta** in `index.html`: Verify `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` — add `viewport-fit=cover` if missing (needed for safe-area-inset to work)
- **Touch targets**: Audit all buttons/tabs are at least 44x44px (current nav buttons are `padding: 6px 14px` with 11px font — about 24px tall, needs increase to 36-44px on mobile)
- **Safe area**: Add `padding-bottom: env(safe-area-inset-bottom)` on the outermost container for notch phones
- **Scrollbar hiding**: Add global rule `.nav-strip::-webkit-scrollbar, .survey-tabs::-webkit-scrollbar, .prov-btns::-webkit-scrollbar { display: none }`

**Files modified:** `public/index.html`, `src/App.jsx`

---

## Files Summary

| File | Changes |
|------|---------|
| `src/App.jsx` | Style block overhaul, header layout, nav scroll strip, footer wrap, fluid spacing, safe area |
| `src/components/pages/Recon.jsx` | Pipeline arrow direction swap, card full-width |
| `src/components/pages/SurveyTools.jsx` | Tab auto-centering on click |
| `src/components/pages/Provincial.jsx` | Province button auto-centering on click |
| `src/components/pages/SpatialOps.jsx` | Tab auto-centering on click |
| `src/components/field/InverseCalc.jsx` | Input widths, SVG sizing, label sizes |
| `src/components/field/ForwardCalc.jsx` | Input widths, SVG sizing, label sizes |
| `src/components/field/CoordConverter.jsx` | Input widths |
| `src/components/field/ScaleCalc.jsx` | Input widths (if applicable) |
| `src/components/field/MagPanel.jsx` | Input widths (if applicable) |
| `public/index.html` | viewport-fit=cover |

---

## Verification

1. **Dev server**: `npm run dev` at localhost:5173
2. **Chrome DevTools responsive mode**: Test at 375px (iPhone SE), 390px (iPhone 14), 412px (Samsung S22), 768px (iPad), 1024px (iPad Pro landscape), 1280px (laptop), 1920px (desktop), 2560px (ultrawide)
3. **Per-section checks**:
   - Header: clocks don't overflow, nav scrolls horizontally with fade edges, active tab auto-centers
   - Command Centre: all card grids reflow naturally without !important
   - Survey Tools: tab bar scrolls, auto-centers on selection, inputs don't overflow
   - Remote Sensing: pipeline cards full-width with vertical arrows on mobile
   - Inverse/Forward calc: SVG diagram readable, labels don't overlap
   - Footer: stacks vertically on mobile, safe area padding works
4. **Build**: `npm run build` — verify no regressions, bundle size stays under 300KB
5. **Cross-browser**: Test in Chrome, Safari (iOS), Firefox. Key: iOS Safari auto-zoom (font-size >=16px on inputs), safe area insets
