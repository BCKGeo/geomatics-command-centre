// MapLibre 6 is ESM-only and, under a bundler, can't find its worker via
// import.meta.url. Point it at the Vite-bundled worker once, before any map
// is created. Import this module (side effect only) from every map component.
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

setWorkerUrl(workerUrl);
