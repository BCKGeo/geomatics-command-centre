// Re-export only the pure-JS parts of satellite.js, skipping WASM modules
// that use top-level await and node:module (breaks Vite iife bundling)
export { jday, invjday } from "../../node_modules/satellite.js/dist/ext.js";
export { twoline2satrec, json2satrec } from "../../node_modules/satellite.js/dist/io.js";
export { propagate, sgp4, gstime } from "../../node_modules/satellite.js/dist/propagation.js";
export { dopplerFactor } from "../../node_modules/satellite.js/dist/dopplerFactor.js";
export {
  radiansToDegrees, degreesToRadians,
  degreesLat, degreesLong,
  radiansLat, radiansLong,
  geodeticToEcf, eciToGeodetic,
  eciToEcf, ecfToEci, ecfToLookAngles,
} from "../../node_modules/satellite.js/dist/transforms.js";
export { sunPos } from "../../node_modules/satellite.js/dist/sun.js";
