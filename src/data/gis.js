// GIS page reference tables, shared with the quick lookup index.
export const GIS_TABS = [
  ["crs", "CRS Reference"],
  ["fmt", "Format Guide"],
  ["utm", "UTM Zones"],
  ["gdal", "GDAL Quick Ref"],
  ["analysis", "Analysis Ops"],
  ["links", "Resources"],
];

export const CRS_CHEAT = [
  { epsg: "4326", name: "WGS84 Geographic", use: "GPS, web maps (lat/lon)", type: "geo" },
  { epsg: "4617", name: "NAD83(CSRS) Geographic", use: "Canada official (lat/lon)", type: "geo" },
  { epsg: "3005", name: "NAD83 / BC Albers", use: "Province-wide BC analysis", type: "proj" },
  { epsg: "3857", name: "WGS84 / Pseudo-Mercator", use: "Web tiles (Google, OSM)", type: "proj" },
  { epsg: "3978", name: "NAD83 / Canada Atlas LCC", use: "National-scale mapping", type: "proj" },
  { epsg: "3979", name: "NAD83(CSRS) / Canada Atlas LCC", use: "National-scale (CSRS)", type: "proj" },
  { epsg: "2955", name: "NAD83(CSRS) / UTM 11N", use: "Alberta, eastern BC", type: "proj" },
  { epsg: "2956", name: "NAD83(CSRS) / UTM 13N", use: "Saskatchewan, Manitoba", type: "proj" },
  { epsg: "2958", name: "NAD83(CSRS) / UTM 17N", use: "Ontario (southern)", type: "proj" },
  { epsg: "2960", name: "NAD83(CSRS) / UTM 19N", use: "Quebec, New Brunswick", type: "proj" },
  { epsg: "2953", name: "NAD83(CSRS) / NB Stereo", use: "New Brunswick provincial", type: "proj" },
  { epsg: "2952", name: "NAD83(CSRS) / PEI Stereo", use: "Prince Edward Island", type: "proj" },
  { epsg: "32610", name: "WGS84 / UTM 10N", use: "BC coast, Vancouver", type: "proj" },
];

export const GDAL_CMDS = [
  { cmd: "ogr2ogr -f GPKG out.gpkg in.shp", desc: "Shapefile to GeoPackage" },
  { cmd: "ogr2ogr -f GeoJSON out.geojson in.gpkg", desc: "GeoPackage to GeoJSON" },
  { cmd: "ogr2ogr -t_srs EPSG:3005 out.gpkg in.gpkg", desc: "Reproject to BC Albers" },
  { cmd: "ogr2ogr -f GPKG out.gpkg in.gdb", desc: "File GDB to GeoPackage" },
  { cmd: "ogr2ogr -clipdst clip.gpkg in.gpkg out.gpkg", desc: "Clip by polygon" },
  { cmd: "ogrinfo -al -so in.gpkg", desc: "List layers + schema (summary)" },
  { cmd: "gdalwarp -t_srs EPSG:3005 in.tif out.tif", desc: "Reproject raster" },
  { cmd: "gdal_translate -of COG in.tif out.tif", desc: "Convert to Cloud-Optimized GeoTIFF" },
  { cmd: "gdalinfo in.tif", desc: "Raster metadata (CRS, extent, bands)" },
  { cmd: "gdal_merge.py -o out.tif in1.tif in2.tif", desc: "Merge raster tiles" },
  { cmd: "gdaltindex index.gpkg *.tif", desc: "Build raster tile index" },
];
