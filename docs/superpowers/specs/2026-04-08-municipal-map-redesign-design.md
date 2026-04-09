# Municipal Map Redesign -- MapLibre GL JS

## Context

The jurisdictions map on the dashboard shows ~2,800 Canadian municipalities with their open data portals, council pages, and survey standards links. The current implementation uses Leaflet + react-leaflet-cluster and has several critical issues:

- **Flickering**: react-leaflet-cluster rebuilds the entire DOM cluster tree on state changes. Parent component re-renders (1-second clock tick) leak through despite React.memo. Especially bad on mobile.
- **Unclickable markers**: 10x10px marker icons are too small for touch. Clusters intercept clicks and zoom-bounce endlessly.
- **Clunky interaction**: No hover feedback, weak popups, no connection between map clicks and table, search doesn't highlight on map.

The goal is a national directory for municipal geospatial data where people can discover portals, council pages, and especially survey standards (which are hard to find and often borrowed between municipalities).

## Approach

Replace Leaflet entirely with **MapLibre GL JS** via `react-map-gl`. GPU-rendered map with native clustering, smooth vector zoom, and full control over marker/layer styling.

## Design

### 1. Map Engine Swap

- **Remove**: `leaflet`, `react-leaflet`, `react-leaflet-cluster`, `leaflet.heat`, `leaflet.markercluster`, `@types/leaflet`
- **Add**: `maplibre-gl`, `react-map-gl`
- **CSS**: Remove `leaflet/dist/leaflet.css` and `leaflet.markercluster/dist/MarkerCluster.css` imports. Add `maplibre-gl/dist/maplibre-gl.css` (required for controls, popups, attribution).
- **Import path**: Use `import Map from 'react-map-gl/maplibre'` (not bare `react-map-gl`, which defaults to Mapbox)
- **Base tiles**: CARTO vector tiles (free, no API key)
  - Dark: `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`
  - Light: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Theme switch driven by existing `ThemeContext` (just swap the style URL)
- **WebGL fallback**: If `maplibregl.supported()` returns false, render a static message ("Your browser does not support WebGL maps") with a link to the table-only view below. This is rare (<1% of browsers) but avoids a blank canvas.

### 2. Marker Design: Shape by Entity Category + Coverage Color + Standards Ring

**Entity type grouping** (38 raw types into 4 shapes):

| Shape | Category | Entity Types | Count |
|---|---|---|---|
| Circle | City-tier | City, Ville | ~379 |
| Triangle | Town-tier | Town, Village, Hamlet, Summer Village, Resort Village, Northern Hamlet, Northern Village, Northern Town, Settlement, Resort Municipality, Mountain Resort Municipality | ~1,143 |
| Square | Municipality-tier | Municipality, Rural Municipality, Municipal District, District Municipality, Township, Municipalite, Canton, Canton Uni, Paroisse, Rural Community, Specialized Municipality, Local Government District, Charter Community, Community Government, Inuit Community, Island Municipality, Indian Government District | ~1,135 |
| Diamond | Regional-tier | Regional District, County, MRC, Regional Municipality, County Municipality, Special Area, Improvement District, Equivalent Territory | ~165 |

**Coverage color** (based on simple URL count):

| Color | Meaning | Logic |
|---|---|---|
| Green (#4caf50) | Full coverage | coverageScore = 3 (all three URLs present) |
| Amber (#e6a817) | Partial | coverageScore = 1 or 2 |
| Grey (#555) | No data | coverageScore = 0 (no URLs present) |

Where `coverageScore = [portalUrl, councilUrl, surveyStandards].filter(Boolean).length`

**Standards ring**: White 3px border on markers that have a `surveyStandards` URL. Immediately answers "who has standards?" without clicking.

**Implementation**: Pre-render ~24 icon sprites (4 shapes x 3 colors x 2 ring states: with/without standards ring). The standards ring is baked into the sprite variants because MapLibre's `icon-halo-width` only applies to text labels, not icons. MapLibre data-driven styling maps properties to the correct sprite via a `match` expression combining `shapeCategory`, `coverageColor`, and `hasStandards`.

**Marker sizing**: 18px visible, 44px hit area (via transparent padding in sprite). Meets Apple/Google touch target guidelines.

**Collapsible legend**: Required. Small floating panel on the map showing shape/color/ring meanings. Collapsed by default on mobile.

### 3. Clustering

MapLibre native clustering via GeoJSON source with `cluster: true`:

- `clusterRadius: 60`
- `clusterMaxZoom: 11` (stop clustering at zoom 12+)
- Cluster circle size: 32px (<50), 38px (50-200), 44px (200+)
- Cluster circle color: Blue (<50), amber (50-200), red (200+) -- same ramp as current
- **Click behavior**:
  - Smooth `flyTo` using `getClusterExpansionZoom` to progressively unpack clusters
  - At max cluster zoom (where clusters can no longer expand), show a popup listing all points in the cluster with clickable names. This replaces spiderfy -- MapLibre has no native spiderfy, and a list popup is more usable on mobile than scattered spider legs.
- No animation jank -- MapLibre transitions are GPU-native

### 4. Click Interaction Flow

1. **Hover marker**: Marker scales to 1.3x, cursor changes to pointer, name tooltip appears
2. **Click marker**: MapLibre popup with styled detail card:
   - Name (bold), entity type, province, population
   - Link buttons: Data Portal, Council, Standards (each as styled pill buttons, only shown if URL exists)
   - "Also at this location" expandable section for related entities, each with their own link buttons
3. **Click table row**: Map does `flyTo` that marker, opens its popup
4. **Click map marker**: Table scrolls to and highlights the matching row

### 5. Search + Table + Map Sync

**Search** (debounced 250ms):
- Filters table to matching rows
- Map: non-matching markers dim to 15% opacity via `paint` property update
- Map: `fitBounds` to matching markers
- Result count shown in search bar

**Province filter**:
- Instant (no debounce needed)
- Map: `flyTo` province bounds
- Table: filters to province
- Clears search text

**Table**:
- Flattened rows (primary + related entities)
- Paginated at 50/page
- Sortable columns: name, province, entity type, population
- Link icons column (portal, council, standards)
- Highlighted row syncs with map selection

### 6. Overlay Toggle Layers

Four independent checkbox toggles in the filter bar:

| Toggle | Layer Type | Description |
|---|---|---|
| Coverage heat | Heatmap layer | Density of data availability. Green = covered, dark = gaps. Weight: coverage score (0-3 based on URL count) |
| Standards glow | Heatmap layer | Green glow around municipalities with surveyStandards URL |
| Population density | Heatmap layer | Population-weighted heat. Current gradient preserved |
| Province lines | Line layer | Subtle dashed boundaries at 15% opacity with province labels. Source: CARTO vector styles include a `boundary` source layer with admin levels. Filter to `admin_level=4` for Canadian provinces. |

All GPU-rendered. Zero perf cost. Each toggle independent -- stack any combination.

**Note**: The current cluster/heatmap mode toggle is replaced by these independent overlay checkboxes. Heatmap is no longer a mutually exclusive mode -- it's an overlay that renders under the markers.

### 7. Mobile Layout: Full Map + Bottom Sheet

**Breakpoint**: 768px (tablet/mobile)

**Desktop** (>=768px): Current layout -- filters on top, map, table below.

**Mobile** (<768px):
- Map fills the viewport
- Search bar floats on map (top, semi-transparent backdrop)
- Province filter: horizontal scrollable chips (not dropdown)
- Layer toggles: in bottom sheet header
- **Bottom sheet** (draggable):
  - **Collapsed** (default): Shows drag handle + result count + 2-3 peek rows
  - **Half-expanded**: Shows table with pagination
  - **Full-expanded**: Table fills screen, map hidden behind
- Drag handle: 32px wide, centered, standard mobile pattern
- Sheet snaps to collapsed/half/full positions
- Detail card (from marker click): Appears as temporary sheet content, replaces table

### 8. File Structure

```
src/components/ui/
  MunicipalMap.jsx          -- rewrite (main component, ~200 lines)
  MunicipalMapPopup.jsx     -- new (detail card component, ~80 lines)
  MunicipalMapLegend.jsx    -- new (collapsible legend, ~60 lines)
  MunicipalTable.jsx        -- extract from current file (already exists inline, ~100 lines)
  MobileBottomSheet.jsx     -- new (draggable sheet, ~100 lines)
  HeatmapLayer.jsx          -- delete (replaced by MapLibre native layers)

src/data/
  municipalities.js         -- unchanged (data source)
  entityCategories.js       -- new (entityType -> shape category mapping)

src/assets/
  map-sprites.png           -- new (24 marker icons: 4 shapes x 3 colors x 2 ring states)
  map-sprites.json          -- new (sprite metadata for MapLibre addImage)
```

### 9. Data Transformations

**GeoJSON conversion** (done once at module load, memoized):
```
MUNICIPALITIES array -> FeatureCollection with properties:
  - All existing fields
  - coverageScore: count of [portalUrl, councilUrl, surveyStandards].filter(Boolean)
  - shapeCategory: "city" | "town" | "municipality" | "regional" (from entityCategories.js mapping)
  - hasStandards: Boolean(surveyStandards)
```

### 10. Accessibility

- Carry forward existing ARIA labels: `aria-label="Province filter"`, `aria-label="Search municipalities"`, `role="group"` on toggle groups
- Map container: `aria-label="Canadian municipal jurisdictions map"`
- Overlay toggle checkboxes: proper `<label>` elements, keyboard operable (Tab + Space)
- Bottom sheet: `role="region"` with `aria-label="Results panel"`, drag handle has `role="slider"`
- Legend: keyboard-togglable (Enter/Space), `aria-expanded` state
- Skip-nav link: "Skip to results table" anchor before the map for screen reader users

### 11. Error Handling

- **WebGL unavailable**: `maplibregl.supported()` check before render. Fallback shows message + table-only view.
- **Tile load failure**: MapLibre fires `error` events on style/source errors. Show a subtle toast "Map tiles unavailable" but keep markers/table functional.
- **Malformed data**: GeoJSON conversion skips entries with null/undefined lat or lon. Log count of skipped entries to console for debugging.

### 12. Performance

- **No DOM markers**: Everything rendered as MapLibre symbol/circle layers on GPU
- **Native clustering**: Computed in worker thread, not main thread
- **No React reconciliation on map internals**: react-map-gl manages the GL context, React only manages state/filters
- **Debounced search**: 250ms, prevents rapid re-filter
- **Static data**: municipalities.js loaded once, GeoJSON conversion memoized
- **Code-split**: MunicipalMap chunk stays lazy-loaded via existing route splitting

## Verification

1. **Flickering**: Load the map on mobile, let it sit idle for 30 seconds. No visual flicker.
2. **Zoom/pan**: Zoom in and out rapidly on mobile. Clusters animate smoothly, no DOM flashing.
3. **Click flow**: Click cluster at zoom 6 (should zoom in). Click cluster at max zoom (should show list popup of contained points). Click individual marker (should show detail card with links).
4. **Search sync**: Type "kamloops" -- map should dim non-matches and fly to results. Table should filter. Click a table row -- map should fly there.
5. **Mobile bottom sheet**: On 375px viewport, sheet should be draggable between collapsed/half/full. Map should fill screen behind it.
6. **Overlay toggles**: Enable coverage heat + province lines simultaneously. Both render, markers still clickable on top.
7. **Theme switch**: Toggle dark/light. Map tiles, marker colors, popup styling all update.
8. **Bundle size**: MapLibre adds ~160KB but we remove Leaflet (~40KB) + plugins (~60KB). Net increase ~60KB. Acceptable.

## LocationMap Migration (CommandCentre page)

`LocationMap.jsx` also uses Leaflet. It's a simpler component (single marker, click-to-place, Nominatim geocoding search) used on the Command Centre page. Must be migrated to MapLibre as part of this work since we're removing Leaflet entirely.

**Scope**: Rewrite to use `react-map-gl` Map + Marker. Same functionality:
- Click map to place marker (via `onClick` event)
- Nominatim search with debounced input (unchanged logic)
- GPS button + reset (unchanged logic)
- Recenter on coordinate change (via `viewState` controlled mode)
- Same CARTO tiles, same theme switching

**No design changes needed** -- this is a functional 1:1 port. The component is small (~125 lines) and straightforward.

## Blast Radius Check

| File | Impact | Action |
|---|---|---|
| `MunicipalMap.jsx` | Full rewrite | MapLibre + all new features |
| `HeatmapLayer.jsx` | Deleted | Replaced by MapLibre native heatmap layers |
| `LocationMap.jsx` | Rewrite | 1:1 port to react-map-gl |
| `Provincial.jsx` | No change | Lazy import unchanged, MunicipalMap export name stays the same |
| `CommandCentre.jsx` | No change | Import path and component name unchanged |
| `ThemeContext.jsx` | No change | B object and theme used the same way |
| `LocationContext.jsx` | No change | LocationMap API surface unchanged |
| `vite.config.js` | Update vendor chunks | Replace `leaflet` chunk with `maplibre-gl` |
| `package.json` | Swap deps | Remove leaflet/react-leaflet/cluster/heat, add maplibre-gl/react-map-gl |
| `App.jsx` | No change | No Leaflet imports or references |
| All other pages | No change | No Leaflet dependencies |

**Key guarantee**: Export names (`MunicipalMap`, `LocationMap`) and import paths stay the same. No changes needed in any consumer component.

## Critical Files to Modify

- `src/components/ui/MunicipalMap.jsx` -- full rewrite
- `src/components/ui/MunicipalMapPopup.jsx` -- new (extracted detail card)
- `src/components/ui/MunicipalMapLegend.jsx` -- new (collapsible legend)
- `src/components/ui/MunicipalTable.jsx` -- new (extracted from MunicipalMap)
- `src/components/ui/MobileBottomSheet.jsx` -- new (draggable sheet)
- `src/components/ui/LocationMap.jsx` -- rewrite (1:1 MapLibre port)
- `src/components/ui/HeatmapLayer.jsx` -- delete
- `src/data/entityCategories.js` -- new (type-to-shape mapping)
- `package.json` -- swap dependencies
- `vite.config.js` -- update vendor chunk splitting (leaflet -> maplibre-gl)
