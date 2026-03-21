import { useState, useEffect, useCallback } from "react";
import { ddToDms, dmsToDd, getUtmZone, utmCM, getMtmZone, mtmCM, geoToTM, tmToGeo, geoToUtm, geoToMtm, gridScaleFactor, elevFactor, utmEpsgStr, isMtmApplicable } from "./geo.js";

// ── API Endpoints ──
const NOAA_KP = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";
const NOAA_SCALES = "https://services.swpc.noaa.gov/products/noaa-scales.json";
const NOAA_WIND_SPEED = "https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json";
const NOAA_WIND_MAG = "https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json";
const NOAA_XRAY = "https://services.swpc.noaa.gov/products/summary/10cm-flux.json";
const DEFAULT_LAT = 45.4215;
const DEFAULT_LON = -75.6972;
const DEFAULT_CITY = "Ottawa, ON (default)";
const DEFAULT_TZ = "America/Toronto";

function buildWeatherUrl(lat, lon, tz) {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,apparent_temperature,precipitation,cloud_cover,surface_pressure&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,sunrise,sunset,uv_index_max&timezone=${encodeURIComponent(tz)}&forecast_days=7`;
}

const WMO = {
  0:{i:"☀️",d:"Clear"},1:{i:"🌤️",d:"Mainly Clear"},2:{i:"⛅",d:"Partly Cloudy"},3:{i:"☁️",d:"Overcast"},
  45:{i:"🌫️",d:"Fog"},48:{i:"🌫️",d:"Rime Fog"},51:{i:"🌦️",d:"Lt Drizzle"},53:{i:"🌦️",d:"Drizzle"},
  55:{i:"🌧️",d:"Hvy Drizzle"},56:{i:"🌨️",d:"Lt Frzg Drizzle"},57:{i:"🌨️",d:"Frzg Drizzle"},
  61:{i:"🌧️",d:"Lt Rain"},63:{i:"🌧️",d:"Rain"},65:{i:"🌧️",d:"Hvy Rain"},
  66:{i:"🌨️",d:"Freezing Rain"},67:{i:"🌨️",d:"Hvy Frzg Rain"},71:{i:"❄️",d:"Lt Snow"},73:{i:"❄️",d:"Snow"},
  75:{i:"❄️",d:"Heavy Snow"},77:{i:"❄️",d:"Snow Grains"},80:{i:"🌦️",d:"Rain Showers"},81:{i:"🌧️",d:"Mod Showers"},
  82:{i:"⛈️",d:"Heavy Showers"},85:{i:"🌨️",d:"Snow Showers"},86:{i:"🌨️",d:"Hvy Snow Shwr"},
  95:{i:"⛈️",d:"Thunderstorm"},96:{i:"⛈️",d:"T-Storm Hail"},99:{i:"⛈️",d:"T-Storm Hvy Hail"},
};

// ── Sun Position ──
function calcSun(date, lat=DEFAULT_LAT, lon=DEFAULT_LON) {
  const r=Math.PI/180, jd=Math.floor(365.25*(date.getUTCFullYear()+4716))+Math.floor(30.6001*((date.getUTCMonth()+1<3?date.getUTCMonth()+13:date.getUTCMonth()+1)))+date.getUTCDate()+(date.getUTCHours()+date.getUTCMinutes()/60)/24-1524.5;
  const T=(jd-2451545)/36525, L0=(280.46646+T*(36000.76983+.0003032*T))%360, M=(357.52911+T*(35999.05029-.0001537*T))*r;
  const C=(1.914602-T*.004817)*Math.sin(M)+.019993*Math.sin(2*M), sL=(L0+C)*r, ob=(23.439291-.0130042*T)*r;
  const dec=Math.asin(Math.sin(ob)*Math.sin(sL)), eq=(L0-(Math.atan2(Math.cos(ob)*Math.sin(sL),Math.cos(sL))/r))*4;
  const ha=((date.getUTCHours()*60+date.getUTCMinutes()+eq+lon*4)/4-180)*r;
  const alt=Math.asin(Math.sin(lat*r)*Math.sin(dec)+Math.cos(lat*r)*Math.cos(dec)*Math.cos(ha));
  const az=Math.atan2(-Math.sin(ha),Math.tan(dec)*Math.cos(lat*r)-Math.sin(lat*r)*Math.cos(ha));
  return {altitude:alt/r, azimuth:((az/r)+360)%360};
}

// ── Moon Phase ──
function getMoon(date) {
  const y=date.getFullYear(), m=date.getMonth()+1, d=date.getDate();
  let c2,e; if(m<3){c2=y-1;e=m+12;}else{c2=y;e=m;}
  const jd=Math.floor(365.25*(c2+4716))+Math.floor(30.6001*(e+1))+d-1524.5;
  const ds=(jd-2451550.1)%29.530588853, ph=((ds<0?ds+29.530588853:ds)/29.530588853);
  const il=Math.round((1-Math.cos(ph*2*Math.PI))/2*100);
  let nm,ic;
  if(ph<.0625){nm="New Moon";ic="🌑";}else if(ph<.1875){nm="Waxing Crescent";ic="🌒";}
  else if(ph<.3125){nm="First Quarter";ic="🌓";}else if(ph<.4375){nm="Waxing Gibbous";ic="🌔";}
  else if(ph<.5625){nm="Full Moon";ic="🌕";}else if(ph<.6875){nm="Waning Gibbous";ic="🌖";}
  else if(ph<.8125){nm="Last Quarter";ic="🌗";}else if(ph<.9375){nm="Waning Crescent";ic="🌘";}
  else{nm="New Moon";ic="🌑";}
  return {phase:ph,illum:il,name:nm,icon:ic};
}

// ── WMM2025 Magnetic Declination (degree 3) ──
function calcMagDec(lat, lon, altKm=0, date=new Date()) {
  const DEG=Math.PI/180, a=6371.2, NMAX=3;
  const colat=(90-lat)*DEG, lonR=lon*DEG;
  const ct=Math.cos(colat), st=Math.sin(colat);
  const yr=date.getFullYear()+(date.getMonth()+date.getDate()/30)/12, dt=yr-2025.0;
  const gc=[[0],[-29351.8+dt*12,-1410.8+dt*10.4],[-2556.6+dt*-12.2,2951.1+dt*-.8,1649.3+dt*1],[1361+dt*.3,-2404.1+dt*-6.1,1243.8+dt*2.4,453.4+dt*-11.2]];
  const hc=[[0],[0,4545.4+dt*-21.5],[0,-3133.6+dt*-28.8,-815.1+dt*-18.9],[0,-56.2+dt*7.3,222.3+dt*-3.2,-584.2+dt*7.4]];
  const P=Array.from({length:NMAX+1},()=>new Float64Array(NMAX+1));
  const dP=Array.from({length:NMAX+1},()=>new Float64Array(NMAX+1));
  P[0][0]=1; P[1][0]=ct; dP[1][0]=-st; P[1][1]=st; dP[1][1]=ct;
  for(let n=2;n<=NMAX;n++){
    const fn=Math.sqrt((2*n-1)/(2*n));
    P[n][n]=st*fn*P[n-1][n-1]; dP[n][n]=fn*(ct*P[n-1][n-1]+st*dP[n-1][n-1]);
    const fn2=Math.sqrt(2*n-1);
    P[n][n-1]=ct*fn2*P[n-1][n-1]; dP[n][n-1]=fn2*(-st*P[n-1][n-1]+ct*dP[n-1][n-1]);
    for(let m=0;m<=n-2;m++){const d2=n*n-m*m,An=(2*n-1)/Math.sqrt(d2),Bn=Math.sqrt((n-1)*(n-1)-m*m)/Math.sqrt(d2);
      P[n][m]=An*ct*P[n-1][m]-Bn*P[n-2][m]; dP[n][m]=An*(-st*P[n-1][m]+ct*dP[n-1][m])-Bn*dP[n-2][m];}
  }
  let X=0,Y=0,Z=0;
  for(let n=1;n<=NMAX;n++){const rr=Math.pow(a/(a+altKm),n+2);for(let m=0;m<=n;m++){
    const cm=Math.cos(m*lonR),sm=Math.sin(m*lonR),g=gc[n][m]||0,h=hc[n][m]||0;
    X+=rr*(g*cm+h*sm)*dP[n][m]; Y+=rr*m*(g*sm-h*cm)*P[n][m]/(st||1e-10); Z+=-(n+1)*rr*(g*cm+h*sm)*P[n][m];
  }}
  return {declination:Math.atan2(Y,X)/DEG, inclination:Math.atan2(Z,Math.sqrt(X*X+Y*Y))/DEG, totalField:Math.sqrt(X*X+Y*Y+Z*Z)};
}


// ── Brand Colors (Slytherin: green + silver) ──
const DARK = {
  pri:"#00aa55", priBr:"#00dd66", sec:"#a0aec0", acc:"#b8c4d0", gold:"#d4a017",
  bg:"#0a0a0e", surface:"#141418", surfaceHi:"#1c1c24",
  border:"#28282f", borderHi:"#3a3a44",
  bvL:"#48485a", bvD:"#060608",
  text:"#c8ccd4", textMid:"#707888", textDim:"#555d6e",
  inset:"#000", headerGrad:"#16161c",
  font:"'Share Tech Mono','Consolas',monospace",
  display:"'Orbitron',sans-serif",
  sans:"'Inter','Segoe UI',-apple-system,sans-serif",
};

const LIGHT = {
  pri:"#007a3d", priBr:"#009944", sec:"#4a5568", acc:"#64748b", gold:"#b8860b",
  bg:"#f0f2f5", surface:"#ffffff", surfaceHi:"#f7f8fa",
  border:"#d1d5db", borderHi:"#b0b8c4",
  bvL:"#ffffff", bvD:"#c0c4cc",
  text:"#1a202c", textMid:"#4a5568", textDim:"#718096",
  inset:"#e8ecf0", headerGrad:"#e2e6ec",
  font:"'Share Tech Mono','Consolas',monospace",
  display:"'Orbitron',sans-serif",
  sans:"'Inter','Segoe UI',-apple-system,sans-serif",
};

function getTheme() {
  try { return localStorage.getItem("bckgeo-theme") || "dark"; } catch { return "dark"; }
}
function setThemePref(t) {
  try { localStorage.setItem("bckgeo-theme", t); } catch {}
}

// Mutable theme ref so subcomponents pick up the current theme
let B = getTheme() === "dark" ? DARK : LIGHT;

// ── Resources ──
const SECTIONS = [
  { title:"Transport Canada — RPAS", color:"#00dd66", icon:"✈️", links:[
    {n:"CARs Part IX (Full Regulations)",d:"Canadian Aviation Regulations governing RPAS operations",u:"https://laws-lois.justice.gc.ca/eng/regulations/sor-96-433/page-112.html"},
    {n:"Flying Your Drone Safely & Legally",d:"Transport Canada's rules and guidelines for drone pilots",u:"https://tc.canada.ca/en/aviation/drone-safety/learn-rules-you-fly-your-drone/flying-your-drone-safely-legally"},
    {n:"2025 Regulation Changes Summary",d:"Summary of recent changes to Canadian drone regulations",u:"https://tc.canada.ca/en/aviation/drone-safety/2025-summary-changes-canada-drone-regulations"},
    {n:"Drone Management Portal",d:"Register drones, manage pilot certificates, request authorizations",u:"https://tc.canada.ca/en/aviation/drone-safety/drone-management-portal"},
    {n:"RPAS Safety Assurance (Std 922)",d:"Safety assurance standards for RPAS manufacturers and operators",u:"https://tc.canada.ca/en/corporate-services/acts-regulations/list-regulations/canadian-aviation-regulations-sor-96-433/standards/standard-922-rpas-safety-assurance"},
    {n:"SFOC Application Guide",d:"How to apply for Special Flight Operations Certificates",u:"https://tc.canada.ca/en/aviation/drone-safety/drone-pilot-licensing/get-permission-special-drone-operations"},
    {n:"NAV Drone (NAVCANADA)",d:"Request authorization to fly near controlled airspace",u:"https://www.navcanada.ca/en/flight-planning/drone-flight-planning.aspx"},
    {n:"Drone Site Selection Tool",d:"NRC tool for evaluating potential drone operation sites",u:"https://nrc.canada.ca/en/drone-tool/"},
    {n:"AirData (Flight Logging)",d:"Cloud-based drone flight log management and analytics",u:"https://app.airdata.com/"},
  ]},
  { title:"NOTAMs & Airspace", color:"#00dd66", icon:"🚨", links:[
    {n:"CFPS NOTAMs (NAV CANADA)",d:"Canadian Flight Planning System — active NOTAMs search",u:"https://plan.navcanada.ca/wxrecall/"},
    {n:"NAV CANADA Flight Planning",d:"Integrated flight planning and weather briefing portal",u:"https://plan.navcanada.ca/"},
    {n:"Aviation Weather (AWWS)",d:"Aviation weather reports, forecasts, and SIGMETs",u:"https://plan.navcanada.ca/wxrecall/"},
    {n:"Designated Airspace Handbook",d:"Reference guide for Canadian airspace classifications",u:"https://www.navcanada.ca/en/aeronautical-information/operational-guides.aspx"},
    {n:"Canada Flight Supplement",d:"Aerodrome directory and operational reference",u:"https://products.navcanada.ca/shop-vfr/Canada-Flight-Supplement/"},
    {n:"TC Airspace Classifications",d:"Transport Canada Aeronautical Information Manual",u:"https://tc.canada.ca/en/aviation/publications/transport-canada-aeronautical-information-manual-tc-aim-tp-14371"},
    {n:"Aurora Forecast (NOAA)",d:"30-minute aurora borealis forecast and imagery",u:"https://www.swpc.noaa.gov/products/aurora-30-minute-forecast"},
    {n:"NOAA SWPC Dashboard",d:"Real-time space weather monitoring and alerts",u:"https://www.swpc.noaa.gov/"},
  ]},
  { title:"NRCan — Geodetic & Geomatics", color:"#00dd66", icon:"🌍", links:[
    {n:"CSRS-PPP Online Service",d:"Free GNSS post-processing for cm-level positioning",u:"https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/ppp.php"},
    {n:"CSRS-PPP Updates & Info",d:"Release notes and technical documentation for CSRS-PPP",u:"https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/ppp-info.php?locale=en"},
    {n:"About CSRS",d:"Overview of the Canadian Spatial Reference System",u:"https://natural-resources.canada.ca/science-data/science-research/geomatics/geodetic-reference-systems/canadian-spatial-reference-system-csrs"},
    {n:"Geodetic Reference Systems",d:"NRCan geodetic datums, frames, and epoch information",u:"https://natural-resources.canada.ca/science-data/science-research/geomatics/geodetic-reference-systems"},
    {n:"Geodetic Tools & Desktop Apps",d:"Desktop tools for coordinate transformations and geoid models",u:"https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/applications.php"},
    {n:"TRX Coordinate Transform",d:"Online datum and projection transformation tool",u:"https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/trx.php"},
    {n:"NRCan Mag Declination Calc",d:"Calculate magnetic declination for any Canadian location",u:"https://geomag.nrcan.gc.ca/mag_fld/magdec-en.php"},
    {n:"NRCan Geomagnetism",d:"Geomagnetic data, models, and observatory information",u:"https://geomag.nrcan.gc.ca/index-en.php"},
    {n:"Space Weather Canada",d:"Canadian space weather forecasts and geomagnetic monitoring",u:"https://spaceweather.gc.ca/"},
    {n:"CACS Station Map",d:"Canadian Active Control System GNSS station network",u:"https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/data-donnees/cacs-scca.php"},
    {n:"GPS-H (Geoid Height)",d:"Compute geoid undulation using CGG2013 or CGG2023",u:"https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/gpsh.php"},
  ]},
  { title:"GNSS & Coordinate Tools", color:"#00dd66", icon:"📡", links:[
    {n:"GNSS Planning (Trimble)",d:"Satellite visibility and DOP planning for GNSS surveys",u:"https://www.gnssplanning.com/"},
    {n:"IGS Network",d:"International GNSS Service global tracking station network",u:"https://igs.org/network/"},
    {n:"UNAVCO GNSS Data",d:"Geodetic GNSS data archive and research infrastructure",u:"https://www.unavco.org/"},
    {n:"NOAA NCEI Mag Calc",d:"Online magnetic field calculator using WMM and IGRF",u:"https://www.ngdc.noaa.gov/geomag/calculators/magcalc.shtml"},
    {n:"WMM (NOAA/BGS)",d:"World Magnetic Model — global geomagnetic reference",u:"https://www.ncei.noaa.gov/products/world-magnetic-model"},
    {n:"NGS Coord Converter",d:"NOAA coordinate conversion and transformation tool",u:"https://www.ngs.noaa.gov/NCAT/"},
    {n:"SpaceWeatherLive",d:"Real-time aurora, solar activity, and geomagnetic data",u:"https://www.spaceweatherlive.com/"},
  ]},
  { title:"Spatial Ops", color:"#00dd66", icon:"🗺️", links:[
    {n:"EPSG.io (CRS Lookup)",d:"Search and transform coordinate reference systems by EPSG code",u:"https://epsg.io/"},
    {n:"QGIS Downloads",d:"Free and open-source geographic information system",u:"https://qgis.org/download/"},
    {n:"Esri ArcGIS Online",d:"Cloud-based GIS mapping and spatial analysis platform",u:"https://www.arcgis.com/index.html"},
    {n:"Canada Open Data Portal",d:"Government of Canada open datasets",u:"https://open.canada.ca/data/en/dataset"},
    {n:"GEO.ca",d:"Federated search across Canadian geospatial data",u:"https://geo.ca/"},
    {n:"GDAL/OGR",d:"Translator library for raster and vector geospatial formats",u:"https://gdal.org/"},
    {n:"PostGIS",d:"Spatial database extension for PostgreSQL",u:"https://postgis.net/"},
    {n:"PROJ",d:"Cartographic projection and coordinate transformation library",u:"https://proj.org/"},
    {n:"GeoServer",d:"Open-source server for sharing geospatial data via OGC standards",u:"https://geoserver.org/"},
    {n:"MapLibre GL JS",d:"Open-source library for interactive vector tile maps",u:"https://maplibre.org/"},
    {n:"Statistics Canada Boundaries",d:"Census geographic boundary files and cartographic products",u:"https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/index-eng.cfm"},
    {n:"Nominatim (Geocoder)",d:"Open-source geocoding using OpenStreetMap data",u:"https://nominatim.org/"},
  ]},
  { title:"Recon & Sensing", color:"#00dd66", icon:"👁️", links:[
    {n:"Copernicus Data Space",d:"ESA Copernicus satellite data access and processing",u:"https://dataspace.copernicus.eu/"},
    {n:"USGS EarthExplorer",d:"Search and download satellite imagery and aerial photographs",u:"https://earthexplorer.usgs.gov/"},
    {n:"OpenTopography (LiDAR)",d:"Community platform for topographic and point cloud data",u:"https://opentopography.org/"},
    {n:"CloudCompare",d:"3D point cloud and mesh processing software",u:"https://www.danielgm.net/cc/"},
    {n:"PDAL",d:"Point Data Abstraction Library for point cloud pipelines",u:"https://pdal.io/"},
    {n:"EODMS (NRCan Satellite Imagery)",d:"Earth Observation Data Management System",u:"https://www.eodms-sgdot.nrcan-rncan.gc.ca/"},
    {n:"Canada HRDEM (CanElevation)",d:"High-resolution digital elevation model of Canada",u:"https://open.canada.ca/data/en/dataset/957782bf-847c-4644-a757-e383c0057995"},
    {n:"ESA SNAP (SAR Processing)",d:"Sentinel Application Platform for radar data analysis",u:"https://step.esa.int/main/toolboxes/snap/"},
    {n:"Google Earth Engine",d:"Planetary-scale geospatial analysis platform",u:"https://earthengine.google.com/"},
    {n:"Sentinel Hub EO Browser",d:"Browse and compare Sentinel satellite imagery",u:"https://apps.sentinel-hub.com/eo-browser/"},
    {n:"OpenDroneMap / WebODM",d:"Open-source photogrammetry toolkit for drone imagery",u:"https://opendronemap.org/"},
    {n:"LAStools",d:"Fast tools for LiDAR data processing and conversion",u:"https://lastools.github.io/"},
    {n:"Orfeo ToolBox",d:"Open-source remote sensing image processing library",u:"https://www.orfeo-toolbox.org/"},
    {n:"Potree (Point Cloud Viewer)",d:"WebGL-based large point cloud renderer",u:"https://potree.github.io/"},
    {n:"NRCan Air Photo Library",d:"Canada's national collection of aerial photographs",u:"https://natural-resources.canada.ca/maps-tools-publications/satellite-elevation-air-photos/air-photos-library"},
  ]},
  { title:"Regs & Standards", color:"#00dd66", icon:"📜", links:[
    {n:"ASTTBC",d:"Applied Science Technologists and Technicians of BC",u:"https://asttbc.org/"},{n:"ABCLS",d:"Association of British Columbia Land Surveyors",u:"https://www.abcls.ca/"},
    {n:"ACLS",d:"Association of Canada Lands Surveyors",u:"https://www.acls-aatc.ca/"},{n:"GoGeomatics",d:"Canada's geomatics community and career hub",u:"https://gogeomatics.ca/"},
    {n:"CIG",d:"Canadian Institute of Geomatics",u:"https://www.cig-acsg.ca/"},{n:"ASPRS",d:"American Society for Photogrammetry and Remote Sensing",u:"https://www.asprs.org/"},
    {n:"ACEC-BC",d:"Association of Consulting Engineering Companies of BC",u:"https://www.acec-bc.ca/"},{n:"TAC",d:"Transportation Association of Canada",u:"https://www.tac-atc.ca/"},
    {n:"CSA Group",d:"Canadian standards development organization",u:"https://www.csagroup.org/"},
  ]},
];

// ── Provincial Intel Data ──
const PROVINCES = [
  {id:"bc",name:"British Columbia",abbr:"BC",categories:[
    {category:"Open Data Portal",links:[{n:"BC Data Catalogue",d:"Province-wide open geospatial data repository",u:"https://catalogue.data.gov.bc.ca/"}]},
    {category:"Map Viewer",links:[{n:"iMapBC",d:"Interactive web map for exploring BC geographic data",u:"https://maps.gov.bc.ca/ess/hm/imap4m/"}]},
    {category:"Parcel / Cadastral",links:[{n:"ParcelMap BC",d:"Province-wide, survey-quality cadastral fabric",u:"https://ltsa.ca/products-services/parcelmap-bc/"}]},
    {category:"Base Mapping",links:[{n:"TRIM (1:20K Base Maps)",d:"Terrain Resource Information Management base maps",u:"https://www2.gov.bc.ca/gov/content/data/geographic-data-services/topographic-data/trim"}]},
    {category:"Imagery",links:[{n:"BC Air Photos",d:"Historical and current aerial photography archive",u:"https://www2.gov.bc.ca/gov/content/data/geographic-data-services/digital-imagery/air-photos"}]},
    {category:"LiDAR / Elevation",links:[{n:"LidarBC",d:"Provincial LiDAR acquisition and distribution program",u:"https://www2.gov.bc.ca/gov/content/data/geographic-data-services/lidarbc"}]},
    {category:"Geodetic Control",links:[{n:"BC Geodetic Control",d:"Provincial geodetic control monument database",u:"https://apps.gov.bc.ca/pub/geometadata/metadataDetail.do?recordUID=51836&recordSet=ISO19115"}]},
    {category:"Land Registry",links:[{n:"myLTSA",d:"Land Title and Survey Authority — title search and registration",u:"https://www.ltsa.ca/",paid:true}]},
    {category:"Geological Survey",links:[{n:"BC Geological Survey",d:"Geoscience maps, publications, and mineral data",u:"https://www2.gov.bc.ca/gov/content/industry/mineral-exploration-mining/british-columbia-geological-survey"}]},
    {category:"Hydrography",links:[{n:"BC Water Resources Atlas",d:"Surface water, groundwater, and watershed data",u:"https://www2.gov.bc.ca/gov/content/environment/air-land-water/water"}]},
  ]},
  {id:"ab",name:"Alberta",abbr:"AB",categories:[
    {category:"Open Data Portal",links:[{n:"GeoDiscover Alberta",d:"Alberta's geospatial data discovery and access portal",u:"https://geodiscover.alberta.ca/"}]},
    {category:"Map Viewer",links:[{n:"Alberta Map Viewer",d:"Interactive provincial map application",u:"https://maps.alberta.ca/"}]},
    {category:"Parcel / Cadastral",links:[{n:"AltaLIS",d:"Alberta's authoritative cadastral and land-related geospatial data",u:"https://www.altalis.com/",paid:true}]},
    {category:"Base Mapping",links:[{n:"Alberta Base Features",d:"Provincial-scale base mapping and feature data",u:"https://www.altalis.com/products/base-features"}]},
    {category:"Imagery",links:[{n:"SPIN2 / ARLO",d:"Satellite and aerial imagery products for Alberta",u:"https://www.altalis.com/products/satellite-imagery"}]},
    {category:"LiDAR / Elevation",links:[{n:"Alberta LiDAR",d:"Provincial LiDAR elevation datasets",u:"https://geodiscover.alberta.ca/geoportal/rest/find/document?searchText=lidar"}]},
    {category:"Geodetic Control",links:[{n:"Alberta Survey Control",d:"Provincial survey control monument network",u:"https://geodiscover.alberta.ca/geoportal/rest/find/document?searchText=survey+control"}]},
    {category:"Land Registry",links:[{n:"SPIN2 Land Titles",d:"Alberta land titles search and document retrieval",u:"https://www.spin2.ca/",paid:true}]},
    {category:"Geological Survey",links:[{n:"Alberta Geological Survey",d:"Geological mapping and subsurface data for Alberta",u:"https://ags.aer.ca/"}]},
    {category:"Hydrography",links:[{n:"Alberta River Basins",d:"Real-time river conditions and basin data",u:"https://rivers.alberta.ca/"}]},
  ]},
  {id:"sk",name:"Saskatchewan",abbr:"SK",categories:[
    {category:"Open Data Portal",links:[{n:"Saskatchewan GeoHub",d:"Provincial geospatial open data portal",u:"https://geohub.saskatchewan.ca/"}]},
    {category:"Map Viewer",links:[{n:"Saskatchewan Map Viewer",d:"Interactive provincial GIS map viewer",u:"https://gis.saskatchewan.ca/"}]},
    {category:"Parcel / Cadastral",links:[{n:"ISC Land Registry",d:"Information Services Corporation — cadastral and land data",u:"https://www.isc.ca/",paid:true}]},
    {category:"Imagery",links:[{n:"FlySask2",d:"Provincial aerial orthoimagery program",u:"https://flysask2.ca/"}]},
    {category:"Geodetic Control",links:[{n:"CACS (Federal)",d:"Canadian Active Control System — NRCan GNSS reference stations",u:"https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/data-donnees/cacs-scca.php"}]},
    {category:"Land Registry",links:[{n:"ISC",d:"Saskatchewan land registry and title search",u:"https://www.isc.ca/LandRegistry/",paid:true}]},
    {category:"Geological Survey",links:[{n:"Saskatchewan Geological Survey",d:"Provincial geological publications and maps",u:"https://publications.saskatchewan.ca/api/v1/products?subjectId=1108"}]},
  ]},
  {id:"mb",name:"Manitoba",abbr:"MB",categories:[
    {category:"Open Data Portal",links:[{n:"DataMB",d:"Manitoba's geoportal for open geographic data",u:"https://geoportal.gov.mb.ca/"}]},
    {category:"Map Viewer",links:[{n:"Manitoba GIS Map Gallery",d:"Collection of interactive provincial maps",u:"https://www.gov.mb.ca/iem/geo/mapgallery/index.html"}]},
    {category:"Parcel / Cadastral",links:[{n:"Manitoba Land Titles",d:"Provincial land titles and property registration",u:"https://www.tprmb.ca/tpr/"}]},
    {category:"Base Mapping",links:[{n:"Manitoba Topographic Maps",d:"Provincial topographic map series",u:"https://www.gov.mb.ca/iem/geo/topo-maps/index.html"}]},
    {category:"LiDAR / Elevation",links:[{n:"Manitoba LiDAR",d:"Provincial LiDAR elevation data",u:"https://geoportal.gov.mb.ca/search?q=lidar"}]},
    {category:"Land Registry",links:[{n:"Teranet Manitoba",d:"Manitoba property registry services",u:"https://www.tprmb.ca/tpr/",paid:true}]},
    {category:"Geological Survey",links:[{n:"Manitoba Geological Survey",d:"Geological mapping and mineral resource data",u:"https://www.gov.mb.ca/iem/geo/geosurvey/index.html"}]},
  ]},
  {id:"on",name:"Ontario",abbr:"ON",categories:[
    {category:"Open Data Portal",links:[{n:"Ontario GeoHub",d:"Ontario's authoritative open geospatial data",u:"https://geohub.lio.gov.on.ca/"}]},
    {category:"Map Viewer",links:[{n:"Ontario Topographic Map Viewer",d:"Interactive topographic map of Ontario",u:"https://www.ontario.ca/page/topographic-maps"}]},
    {category:"Parcel / Cadastral",links:[{n:"OnLand / Teranet",d:"Ontario's electronic land registration system",u:"https://www.onland.ca/",paid:true}]},
    {category:"Base Mapping",links:[{n:"Ontario Base Map (OBM)",d:"Provincial base mapping at multiple scales",u:"https://geohub.lio.gov.on.ca/"}]},
    {category:"Imagery",links:[{n:"SWOOP / SCOOP",d:"Southwestern/South-Central Ontario Orthophotography",u:"https://geohub.lio.gov.on.ca/documents/southwestern-ontario-orthophotography-project-swoop/about"}]},
    {category:"LiDAR / Elevation",links:[{n:"Ontario LiDAR",d:"Provincial LiDAR point cloud and DEM data",u:"https://geohub.lio.gov.on.ca/datasets?q=lidar"}]},
    {category:"Geodetic Control",links:[{n:"Ontario Geodetic Control",d:"Provincial geodetic control network",u:"https://www.ontario.ca/page/geodetic-control"}]},
    {category:"Land Registry",links:[{n:"Teranet",d:"Ontario's land registry and property data provider",u:"https://www.teranet.ca/",paid:true}]},
    {category:"Geological Survey",links:[{n:"Ontario Geological Survey",d:"Geoscience data, maps, and publications",u:"https://www.geologyontario.mndm.gov.on.ca/"}]},
    {category:"Hydrography",links:[{n:"Ontario Flow Assessment Tool",d:"Surface water monitoring and flow data",u:"https://www.ontario.ca/page/surface-water-monitoring"}]},
  ]},
  {id:"qc",name:"Quebec",abbr:"QC",categories:[
    {category:"Open Data Portal",links:[{n:"Données Québec",d:"Portail de données ouvertes du gouvernement du Québec",u:"https://www.donneesquebec.ca/"}]},
    {category:"Map Viewer",links:[{n:"Géoboutique Québec",d:"Geospatial product catalogue and map viewer",u:"https://geoboutique.mrnf.gouv.qc.ca/"}]},
    {category:"Parcel / Cadastral",links:[{n:"Infolot",d:"Quebec cadastral lot information system",u:"https://infolot.mern.gouv.qc.ca/"}]},
    {category:"Base Mapping",links:[{n:"BDTQ (1:20K)",d:"Base de données topographiques du Québec",u:"https://www.donneesquebec.ca/recherche/dataset/base-de-donnees-topographiques-du-quebec-a-l-echelle-de-1-20-000-bdtq-20k"}]},
    {category:"Imagery",links:[{n:"Géoindex",d:"Aerial and satellite imagery index for Quebec",u:"https://geoindex.mrnf.gouv.qc.ca/"}]},
    {category:"LiDAR / Elevation",links:[{n:"MRNF LiDAR",d:"Forêt numérique — provincial LiDAR coverage",u:"https://foretnumerique.mrnf.gouv.qc.ca/"}]},
    {category:"Geodetic Control",links:[{n:"Géodésie Québec III",d:"Provincial geodetic control network and data",u:"https://geodesie.mrnf.gouv.qc.ca/"}]},
    {category:"Land Registry",links:[{n:"Registre foncier",d:"Quebec official land registry",u:"https://www.registrefoncier.gouv.qc.ca/",paid:true}]},
    {category:"Geological Survey",links:[{n:"SIGÉOM",d:"Système d'information géominière du Québec",u:"https://sigeom.mines.gouv.qc.ca/signet/classes/I1108_index_S_E"}]},
  ]},
  {id:"nb",name:"New Brunswick",abbr:"NB",categories:[
    {category:"Open Data Portal",links:[{n:"GeoNB Data Catalogue",d:"New Brunswick geographic data and services",u:"https://geonb.snb.ca/geonb/"}]},
    {category:"Map Viewer",links:[{n:"GeoNB Map Viewer",d:"Interactive map of New Brunswick spatial data",u:"https://geonb.snb.ca/geonb/"}]},
    {category:"Parcel / Cadastral",links:[{n:"GeoNB Parcels",d:"Provincial property parcel mapping",u:"https://geonb.snb.ca/geonb/"}]},
    {category:"LiDAR / Elevation",links:[{n:"GeoNB LiDAR",d:"Provincial LiDAR point cloud data",u:"https://geonb.snb.ca/li/"}]},
    {category:"Geodetic Control",links:[{n:"GeoNB Survey Control",d:"Provincial survey control monuments",u:"https://geonb.snb.ca/geonb/"}]},
    {category:"Land Registry",links:[{n:"SNB Land Registry",d:"Service New Brunswick land registration",u:"https://www.snb.ca/e/4000/4500/4500e.asp",paid:true}]},
    {category:"Geological Survey",links:[{n:"NB Geological Survey",d:"Geological mapping and mineral resource data",u:"https://www2.gnb.ca/content/gnb/en/departments/erd/energy/content/minerals/content/geological-surveys.html"}]},
  ]},
  {id:"ns",name:"Nova Scotia",abbr:"NS",categories:[
    {category:"Open Data Portal",links:[{n:"GeoNOVA",d:"Nova Scotia's geographic information portal",u:"https://geonova.novascotia.ca/"}]},
    {category:"Map Viewer",links:[{n:"Nova Scotia DataLocator",d:"Interactive map for provincial spatial data",u:"https://nsgi.novascotia.ca/datalocator/"}]},
    {category:"Parcel / Cadastral",links:[{n:"NS Property Records",d:"Property Valuation Services Corporation",u:"https://www.pvsc.ca/"}]},
    {category:"Imagery",links:[{n:"Nova Scotia Ortho Imagery",d:"Provincial orthoimagery and aerial photos",u:"https://nsgi.novascotia.ca/datalocator/"}]},
    {category:"LiDAR / Elevation",links:[{n:"Elevation Explorer",d:"Interactive LiDAR-derived elevation viewer",u:"https://elevationexplorer.novascotia.ca/"}]},
    {category:"Land Registry",links:[{n:"Property Online",d:"Nova Scotia property information and title search",u:"https://www.nsproperty.ca/",paid:true}]},
    {category:"Geological Survey",links:[{n:"NS Geological Survey",d:"Provincial geological mapping and publications",u:"https://novascotia.ca/natr/meb/"}]},
  ]},
  {id:"pe",name:"Prince Edward Island",abbr:"PE",categories:[
    {category:"Open Data Portal",links:[{n:"PEI Open Data",d:"Provincial open data and service catalogue",u:"https://www.princeedwardisland.ca/en/search/site?f%5B0%5D=type%3Aservice"}]},
    {category:"Map Viewer",links:[{n:"PEI GIS Data Layers",d:"Provincial GIS datasets and map layers",u:"https://www.gov.pe.ca/gis/"}]},
    {category:"Parcel / Cadastral",links:[{n:"PEI Land Online",d:"Provincial parcel and property mapping",u:"https://www.gov.pe.ca/gis/"}]},
    {category:"Land Registry",links:[{n:"PEI Land Registration",d:"Provincial land registration office",u:"https://www.gov.pe.ca/land/",paid:true}]},
  ]},
  {id:"nl",name:"Newfoundland & Labrador",abbr:"NL",categories:[
    {category:"Open Data Portal",links:[{n:"Open Data NL",d:"Provincial open data catalogue",u:"https://opendata.gov.nl.ca/"}]},
    {category:"Map Viewer",links:[{n:"GeoHub NL",d:"Provincial ArcGIS geospatial hub",u:"https://geohub-gnl.hub.arcgis.com/"}]},
    {category:"Parcel / Cadastral",links:[{n:"CADO (Crown Lands)",d:"Crown lands maps and cadastral data",u:"https://www.gov.nl.ca/crownlands/maps-and-data/"}]},
    {category:"LiDAR / Elevation",links:[{n:"NL LiDAR",d:"Provincial LiDAR elevation datasets",u:"https://geohub-gnl.hub.arcgis.com/search?q=lidar"}]},
    {category:"Land Registry",links:[{n:"NL Land Use Atlas",d:"Provincial land use planning and registry",u:"https://www.gov.nl.ca/ecc/oea/land-use-atlas/"}]},
    {category:"Geological Survey",links:[{n:"NL Geological Survey",d:"Provincial geoscience data and maps",u:"https://www.gov.nl.ca/iet/mines/geoscience/"}]},
  ]},
  {id:"yt",name:"Yukon",abbr:"YT",categories:[
    {category:"Open Data Portal",links:[{n:"GeoYukon",d:"Yukon's geospatial data discovery portal",u:"https://geoyukon.gov.yk.ca/"}]},
    {category:"Map Viewer",links:[{n:"GeoYukon Map Viewer",d:"Interactive territorial map application",u:"https://mapservices.gov.yk.ca/GeoYukon/"}]},
    {category:"Land Registry",links:[{n:"Yukon Land Titles",d:"Territorial land titles office",u:"https://yukon.ca/en/legal-and-social-services/land-titles-office"}]},
    {category:"Geological Survey",links:[{n:"Yukon Geological Survey",d:"Territorial geoscience data and mapping",u:"https://yukon.ca/en/science-and-natural-resources/geology"}]},
  ]},
  {id:"nt",name:"Northwest Territories",abbr:"NT",categories:[
    {category:"Open Data Portal",links:[{n:"NWT Centre for Geomatics",d:"Territorial geospatial data and mapping services",u:"https://www.maps.gov.nt.ca/"}]},
    {category:"Map Viewer",links:[{n:"ATLAS (NWT)",d:"NWT interactive atlas and map viewer",u:"https://atlas.gov.nt.ca/"}]},
    {category:"Land Registry",links:[{n:"NWT Land Titles",d:"Territorial land titles registration",u:"https://www.justice.gov.nt.ca/en/land-titles/"}]},
    {category:"Geological Survey",links:[{n:"NWT Geological Survey",d:"Territorial geoscience office",u:"https://www.nwtgeoscience.ca/"}]},
  ]},
  {id:"nu",name:"Nunavut",abbr:"NU",categories:[
    {category:"Open Data Portal",links:[{n:"Nunavut Open Data (Federal via CLSS)",d:"Federal open data filtered for Nunavut",u:"https://open.canada.ca/data/en/dataset?q=nunavut"}]},
    {category:"Map Viewer",links:[{n:"Nunavut Planning Commission Maps",d:"Territorial land use planning maps",u:"https://www.nunavut.ca/"}]},
    {category:"Land Registry",links:[{n:"Nunavut Land Titles",d:"Territorial land titles office",u:"https://www.gov.nu.ca/departments/justice/land-titles-office"}]},
    {category:"Geological Survey",links:[{n:"Canada-Nunavut Geoscience Office",d:"Joint federal-territorial geoscience research",u:"https://cngo.ca/"}]},
  ]},
];

// ── Glossary Terms ──
const GLOSSARY = {
  "Command Centre": [
    {dt:"Kp Index",dd:"Planetary geomagnetic activity index (0-9). Kp 5+ is a geomagnetic storm that degrades GNSS."},
    {dt:"Solar Wind",dd:"Stream of charged particles from the sun. High speeds (>500 km/s) can trigger geomagnetic storms."},
    {dt:"Mag BT",dd:"Interplanetary magnetic field total strength in nanotesla. Higher values correlate with storm potential."},
    {dt:"10.7cm Flux",dd:"Solar radio flux at 10.7 cm wavelength (F10.7), measured in solar flux units. Proxy for solar activity."},
    {dt:"G/S/R Scales",dd:"NOAA space weather scales: Geomagnetic (G0-G5), Solar Radiation (S0-S5), Radio Blackout (R0-R5)."},
    {dt:"Declination",dd:"Angle between true north and magnetic north at a given location. Essential for compass/bearing corrections."},
    {dt:"Grid Convergence",dd:"Angle between true north and grid north on a map projection (e.g. UTM). Varies with longitude from central meridian."},
    {dt:"Dip Angle",dd:"Magnetic inclination: angle of the Earth's magnetic field relative to horizontal. ~73° in northern BC."},
    {dt:"Zulu Time",dd:"UTC (Coordinated Universal Time). Standard time reference in aviation and military operations."},
  ],
  "Flight Ops": [
    {dt:"RPAS",dd:"Remotely Piloted Aircraft System. The Canadian regulatory term for drones, including the aircraft, control station, and C2 link."},
    {dt:"CARs Part IX",dd:"Canadian Aviation Regulations Part IX, governing RPAS operations in Canadian airspace."},
    {dt:"NOTAM",dd:"Notice to Airmen. Advisories about hazards, restrictions, or changes to airspace/facilities."},
    {dt:"SFOC",dd:"Special Flight Operations Certificate. Required for RPAS operations beyond standard rules (e.g. BVLOS, over people)."},
    {dt:"BVLOS",dd:"Beyond Visual Line of Sight. Drone operations where the pilot cannot see the aircraft directly."},
    {dt:"Class D Airspace",dd:"Controlled airspace around smaller airports (like CYXS). Requires ATC contact and authorization for RPAS."},
    {dt:"NAV Drone",dd:"NAV CANADA's drone airspace authorization portal for operations near controlled airspace."},
    {dt:"METAR / TAF",dd:"Aviation weather reports (current observations) and Terminal Aerodrome Forecasts (predicted conditions)."},
    {dt:"SIGMET",dd:"Significant Meteorological Information. Warnings for severe weather hazards to aviation."},
    {dt:"CYA / CYR",dd:"Canadian advisory (CYA) and restricted (CYR) airspace designations."},
  ],
  "Geodesy": [
    {dt:"CSRS-PPP",dd:"Canadian Spatial Reference System Precise Point Positioning. NRCan's free GNSS post-processing service."},
    {dt:"PPP-AR",dd:"Precise Point Positioning with Ambiguity Resolution. Resolves carrier phase ambiguities for cm-level accuracy."},
    {dt:"NAD83(CSRS)",dd:"North American Datum 1983, Canadian Spatial Reference System realization. Canada's official geodetic datum."},
    {dt:"ITRF",dd:"International Terrestrial Reference Frame. The global standard geodetic reference frame, updated periodically."},
    {dt:"Epoch",dd:"A specific point in time to which coordinates are referenced. Needed because tectonic plates move ~2 cm/yr."},
    {dt:"TRX",dd:"NRCan's online coordinate transformation tool for converting between datums, epochs, and projections."},
    {dt:"Geoid Height",dd:"Separation between the geoid (mean sea level surface) and the ellipsoid. Needed to convert ellipsoidal to orthometric heights."},
    {dt:"CGG2023",dd:"Canadian Gravimetric Geoid 2023. Latest NRCan geoid model for height conversions in Canada."},
    {dt:"CACS",dd:"Canadian Active Control System. Network of permanent GNSS tracking stations operated by NRCan."},
    {dt:"GNSS",dd:"Global Navigation Satellite Systems. Umbrella term for GPS (US), GLONASS (RU), Galileo (EU), BeiDou (CN)."},
    {dt:"DOP",dd:"Dilution of Precision. Geometric quality metric for satellite constellation. Lower is better (PDOP <3 ideal)."},
    {dt:"RTK",dd:"Real-Time Kinematic. GNSS technique using a base station to achieve cm-level positioning in real time."},
    {dt:"RINEX",dd:"Receiver Independent Exchange Format. Standard file format for GNSS observation and navigation data."},
    {dt:"IGS",dd:"International GNSS Service. Global network providing precise satellite orbits, clocks, and station coordinates."},
  ],
  "Spatial Ops": [
    {dt:"EPSG",dd:"European Petroleum Survey Group codes. Numeric identifiers for coordinate reference systems (e.g. EPSG:26910 = UTM 10N NAD83)."},
    {dt:"WFS / WMS",dd:"Web Feature Service / Web Map Service. OGC standards for serving vector features and rendered map tiles over HTTP."},
    {dt:"BCGW",dd:"BC Geographic Warehouse. Provincial spatial data repository accessible via WFS/WMS and direct download."},
    {dt:"TRIM",dd:"Terrain Resource Information Management. BC's 1:20,000 base mapping program (contours, hydro, roads)."},
    {dt:"PID / PIN",dd:"Parcel Identifier / Parcel Identification Number. Unique identifiers for land parcels in BC's cadastral system."},
  ],
  "Recon & Sensing": [
    {dt:"LiDAR",dd:"Light Detection and Ranging. Laser-based remote sensing for high-density 3D point cloud capture."},
    {dt:"DEM / DSM / DTM",dd:"Digital Elevation/Surface/Terrain Model. Raster representations of ground (DTM), surface (DSM), or general elevation (DEM)."},
    {dt:"PDAL",dd:"Point Data Abstraction Library. Open-source C++ library for point cloud processing pipelines."},
    {dt:"Sentinel-1/2",dd:"ESA Copernicus satellites. S-1 is C-band SAR (all-weather), S-2 is multispectral optical (13 bands, 10m)."},
    {dt:"SAR",dd:"Synthetic Aperture Radar. Active microwave sensor that works through clouds, rain, and at night."},
    {dt:"LTSA",dd:"Land Title and Survey Authority of BC. Manages land title and survey systems for the province."},
  ],
  "Provincial Intel": [
    {dt:"SDI",dd:"Spatial Data Infrastructure. Framework of policies, standards, and technology for sharing geospatial data across jurisdictions."},
    {dt:"Cadastre",dd:"Official register of land parcels. Provincial cadastral systems map parcel boundaries, ownership, and legal descriptions."},
    {dt:"OGL",dd:"Open Government Licence. Licence under which most provincial open data is published. Permits free use with attribution."},
  ],
  "Field Kit": [
    {dt:"WMM2025",dd:"World Magnetic Model 2025. Current-epoch global geomagnetic model, valid 2025-2030. Joint NOAA/BGS product."},
    {dt:"Inclination",dd:"Magnetic dip angle. The angle between the magnetic field vector and the horizontal plane at a location."},
    {dt:"Total Field",dd:"Total intensity of Earth's magnetic field at a location, measured in nanotesla (nT). ~58,000 nT in northern BC."},
    {dt:"UTM",dd:"Universal Transverse Mercator. Global map projection system divided into 60 zones, each 6° wide."},
    {dt:"MTM",dd:"Modified Transverse Mercator. Canadian 3°-wide projection zones used in some provincial systems."},
    {dt:"Grid Scale Factor",dd:"Ratio of distance on the projection grid to distance on the ellipsoid. Varies with distance from central meridian."},
    {dt:"Elevation Factor",dd:"Ratio correcting for height above the ellipsoid. Ground distances are slightly longer than ellipsoid distances."},
    {dt:"CSF",dd:"Combined Scale Factor. Product of grid scale factor and elevation factor. Applied to convert ground to grid distances."},
    {dt:"DD / DMS",dd:"Decimal Degrees / Degrees Minutes Seconds. Two common formats for expressing geographic coordinates."},
  ],
  "Regs & Standards": [
    {dt:"ASTTBC",dd:"Applied Science Technologists and Technicians of BC. Regulatory body for AScT, CTech, and RFT designations."},
    {dt:"AScT",dd:"Applied Science Technologist. Professional designation granted by ASTTBC for engineering/geomatics technologists."},
    {dt:"ABCLS",dd:"Association of British Columbia Land Surveyors. Regulatory body for BCLS (licensed land surveyors) in BC."},
    {dt:"ACLS",dd:"Association of Canada Lands Surveyors. Federal regulatory body for surveys on Canada Lands (Indigenous, federal, offshore)."},
    {dt:"CIG",dd:"Canadian Institute of Geomatics. Professional association for geomatics in Canada, publishes Geomatica journal."},
    {dt:"ASPRS",dd:"American Society for Photogrammetry and Remote Sensing. International professional org, publishes PE&RS journal."},
    {dt:"CSA Group",dd:"Canadian Standards Association. Develops national standards for engineering, construction, and technology."},
    {dt:"TAC",dd:"Transportation Association of Canada. Develops guidelines and standards for road/transportation infrastructure."},
  ],
};

// ── Reusable Components ──
function KpCell({val, time}){const c=val<2?"#22c55e":val<4?"#84cc16":val<5?"#eab308":val<6?"#f97316":val<7?"#ef4444":"#dc2626";
  return(<div style={{flex:1,textAlign:"center",padding:"8px 2px",border:`1px solid ${B.border}`,position:"relative"}}>
    <div style={{fontFamily:B.display,fontSize:18,fontWeight:800,lineHeight:1,color:c}}>{Math.round(val)}</div>
    <div style={{fontFamily:B.font,fontSize:10,color:B.textDim,marginTop:4,letterSpacing:0.5}}>{time}</div></div>);}

function GaugeRing({level, label}){const levelNum=parseInt(level?.replace(/\D/g,""))||0;
  const colors=["#22c55e","#84cc16","#eab308","#f97316","#ef4444","#dc2626"];
  const fills=[60,120,180,240,300,340];
  const color=colors[levelNum]||"#22c55e";
  const fill=fills[levelNum]||0;
  const isExtreme=levelNum===5;
  return(<div style={{textAlign:"center"}}>
    <div style={{width:84,height:84,borderRadius:"50%",margin:"0 auto 6px",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",background:`conic-gradient(${color} 0deg, ${color} ${fill}deg, ${B.surfaceHi} ${fill}deg, ${B.surfaceHi} 360deg)`,boxShadow:`0 0 0 2px ${B.border}${isExtreme?", 0 0 12px "+color:""}`,transition:"box-shadow .2s",animation:isExtreme?"pulse-ring 1.5s ease-in-out infinite":"none"}}>
      <div style={{position:"absolute",inset:8,borderRadius:"50%",background:B.surface,border:`1px solid ${B.border}`}}/>
      <div style={{position:"relative",zIndex:1,fontFamily:B.display,fontSize:22,fontWeight:900,color:color,textShadow:`0 0 8px ${color}`}}>{level}</div></div>
    <div style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:1.5,textTransform:"uppercase"}}>{label}</div></div>);}

function MagPanel({initialLat=DEFAULT_LAT,initialLon=DEFAULT_LON}){
  const [lat,setLat]=useState(String(initialLat)),[lon,setLon]=useState(String(initialLon));
  const [inputMode,setInputMode]=useState("dd");
  const initLatDms2=ddToDms(initialLat),initLonDms2=ddToDms(Math.abs(initialLon));
  const [dmsLatD,setDmsLatD]=useState(String(initLatDms2.d));
  const [dmsLatM,setDmsLatM]=useState(String(initLatDms2.mAdj));
  const [dmsLatS,setDmsLatS]=useState(String(initLatDms2.s));
  const [dmsLatDir,setDmsLatDir]=useState(initialLat>=0?"N":"S");
  const [dmsLonD,setDmsLonD]=useState(String(initLonDms2.d));
  const [dmsLonM,setDmsLonM]=useState(String(initLonDms2.mAdj));
  const [dmsLonS,setDmsLonS]=useState(String(initLonDms2.s));
  const [dmsLonDir,setDmsLonDir]=useState(initialLon>=0?"E":"W");
  const syncDdToDms=()=>{
    const la=ddToDms(parseFloat(lat)||0),lo=ddToDms(Math.abs(parseFloat(lon)||0));
    setDmsLatD(String(la.d));setDmsLatM(String(la.mAdj));setDmsLatS(String(la.s));setDmsLatDir((parseFloat(lat)||0)>=0?"N":"S");
    setDmsLonD(String(lo.d));setDmsLonM(String(lo.mAdj));setDmsLonS(String(lo.s));setDmsLonDir((parseFloat(lon)||0)>=0?"E":"W");
  };
  const syncDmsToDd=()=>{
    const sgnLa=dmsLatDir==="N"?1:-1,sgnLo=dmsLonDir==="E"?1:-1;
    setLat(dmsToDd(parseInt(dmsLatD)||0,parseInt(dmsLatM)||0,parseFloat(dmsLatS)||0,sgnLa).toFixed(6));
    setLon(dmsToDd(parseInt(dmsLonD)||0,parseInt(dmsLonM)||0,parseFloat(dmsLonS)||0,sgnLo).toFixed(6));
  };
  const switchMode=(m2)=>{if(m2===inputMode)return;if(m2==="dms")syncDdToDms();else syncDmsToDd();setInputMode(m2);};
  let magLat,magLon;
  if(inputMode==="dd"){
    magLat=parseFloat(lat)||initialLat; magLon=parseFloat(lon)||initialLon;
  }else{
    const sgnLa=dmsLatDir==="N"?1:-1, sgnLo=dmsLonDir==="E"?1:-1;
    magLat=dmsToDd(parseInt(dmsLatD)||0,parseInt(dmsLatM)||0,parseFloat(dmsLatS)||0,sgnLa);
    magLon=dmsToDd(parseInt(dmsLonD)||0,parseInt(dmsLonM)||0,parseFloat(dmsLonS)||0,sgnLo);
  }
  const m=calcMagDec(magLat,magLon);
  const da=Math.abs(m.declination),dd=Math.floor(da),dm=Math.round((da-dd)*60),dir=m.declination>0?"E":"W";
  const inp={background:B.bg,border:`1px solid ${B.borderHi}`,borderRadius:4,padding:"4px 8px",color:B.text,fontSize:12,width:100,outline:"none",fontFamily:B.font};
  const dmsInp={...inp,width:48,textAlign:"center"};
  const toggleBtn=(active)=>({padding:"4px 10px",fontSize:11,fontWeight:active?700:400,fontFamily:B.font,color:active?B.bg:B.textMid,background:active?B.priBr:"transparent",border:`1px solid ${active?B.priBr:B.border}`,borderRadius:3,cursor:"pointer"});
  return(<div>
    <div style={{display:"flex",gap:4,marginBottom:10}}>
      <button onClick={()=>switchMode("dd")} style={toggleBtn(inputMode==="dd")}>DD</button>
      <button onClick={()=>switchMode("dms")} style={toggleBtn(inputMode==="dms")}>DMS</button>
    </div>
    {inputMode==="dd"?(
    <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
      <label style={{fontSize:11,color:B.textMid}}>Lat</label><input value={lat} onChange={e=>setLat(e.target.value)} style={inp}/>
      <label style={{fontSize:11,color:B.textMid}}>Lon</label><input value={lon} onChange={e=>setLon(e.target.value)} style={inp}/></div>
    ):(
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
        <label style={{fontSize:10,color:B.textDim,width:24}}>Lat</label>
        <input value={dmsLatD} onChange={e=>setDmsLatD(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u00B0"}</span>
        <input value={dmsLatM} onChange={e=>setDmsLatM(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u2032"}</span>
        <input value={dmsLatS} onChange={e=>setDmsLatS(e.target.value)} style={{...dmsInp,width:60}}/><span style={{fontSize:11,color:B.textDim}}>{"\u2033"}</span>
        <button onClick={()=>setDmsLatDir(d=>d==="N"?"S":"N")} style={{...inp,width:28,textAlign:"center",cursor:"pointer",fontWeight:700,color:B.priBr}}>{dmsLatDir}</button></div>
      <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
        <label style={{fontSize:10,color:B.textDim,width:24}}>Lon</label>
        <input value={dmsLonD} onChange={e=>setDmsLonD(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u00B0"}</span>
        <input value={dmsLonM} onChange={e=>setDmsLonM(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u2032"}</span>
        <input value={dmsLonS} onChange={e=>setDmsLonS(e.target.value)} style={{...dmsInp,width:60}}/><span style={{fontSize:11,color:B.textDim}}>{"\u2033"}</span>
        <button onClick={()=>setDmsLonDir(d=>d==="E"?"W":"E")} style={{...inp,width:28,textAlign:"center",cursor:"pointer",fontWeight:700,color:B.priBr}}>{dmsLonDir}</button></div>
    </div>
    )}
    <div style={{display:"flex",gap:16,alignItems:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:30,fontWeight:800,color:"#f59e0b",fontFamily:B.font,lineHeight:1}}>{dd}° {dm}′</div>
        <div style={{fontSize:14,fontWeight:700,color:B.gold}}>{dir}</div></div>
      <div style={{flex:1}}>
        <svg viewBox="0 0 100 100" style={{width:80,height:80,display:"block",margin:"0 auto"}}>
          <circle cx="50" cy="50" r="40" fill="none" stroke={B.border} strokeWidth="2"/>
          {["N","E","S","W"].map((d2,i2)=><text key={d2} x={50+34*Math.sin(i2*Math.PI/2)} y={50-34*Math.cos(i2*Math.PI/2)+3} fill={B.textMid} fontSize="9" textAnchor="middle" fontWeight="600">{d2}</text>)}
          <line x1="50" y1="50" x2="50" y2="15" stroke="#3b82f6" strokeWidth="2"/>
          <line x1="50" y1="50" x2={50+33*Math.sin(m.declination*Math.PI/180)} y2={50-33*Math.cos(m.declination*Math.PI/180)} stroke="#ef4444" strokeWidth="2"/>
          <circle cx="50" cy="50" r="2" fill="#94a3b8"/></svg>
        <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:3}}>
          {[{c:"#3b82f6",l:"True N"},{c:"#ef4444",l:"Mag N"}].map(x=><div key={x.l} style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:B.textMid}}><div style={{width:8,height:3,background:x.c,borderRadius:1}}/>{x.l}</div>)}</div></div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
      <div style={{background:B.bg,borderRadius:6,padding:8,textAlign:"center",border:`1px solid ${B.border}`}}><div style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:1.5,textTransform:"uppercase"}}>Inclination</div><div style={{fontSize:14,fontWeight:700,color:B.textMid,fontFamily:B.font}}>{m.inclination.toFixed(1)}°</div></div>
      <div style={{background:B.bg,borderRadius:6,padding:8,textAlign:"center",border:`1px solid ${B.border}`}}><div style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:1.5,textTransform:"uppercase"}}>Total Field</div><div style={{fontSize:14,fontWeight:700,color:B.textMid,fontFamily:B.font}}>{Math.round(m.totalField)} nT</div></div></div>
    <div style={{background:"#f59e0b10",border:"1px solid #f59e0b20",borderRadius:5,padding:"6px 8px",marginTop:10,fontSize:10,color:"#b45309",lineHeight:1.4}}>Approximate only (WMM2025, n=3). Not for navigation or survey use. Always verify with <a href="https://geomag.nrcan.gc.ca/mag_fld/magdec-en.php" target="_blank" rel="noopener noreferrer" style={{color:"#f59e0b",textDecoration:"underline"}}>NRCan</a> or <a href="https://www.ngdc.noaa.gov/geomag/calculators/magcalc.shtml" target="_blank" rel="noopener noreferrer" style={{color:"#f59e0b",textDecoration:"underline"}}>NOAA NCEI</a> before field use.</div></div>);}

// ── Tooltip helper ──
function Tip({text}){
  const [show,setShow]=useState(false);
  return(<span style={{position:"relative",display:"inline-block",marginLeft:4}}>
    <span onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)} onClick={()=>setShow(s=>!s)}
      style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:14,height:14,borderRadius:"50%",background:B.border,color:B.textMid,fontSize:9,cursor:"help",fontWeight:700}}>?</span>
    {show&&<div style={{position:"absolute",bottom:"120%",left:"50%",transform:"translateX(-50%)",background:B.surface,border:`1px solid ${B.borderHi}`,borderRadius:4,padding:"6px 10px",fontSize:10,color:B.text,lineHeight:1.4,width:220,zIndex:100,boxShadow:"0 4px 12px rgba(0,0,0,0.3)"}}>{text}</div>}
  </span>);
}

// ── Collapsible help panel ──
function HelpPanel({text}){
  const [open,setOpen]=useState(false);
  return(<div style={{marginBottom:10}}>
    <button onClick={()=>setOpen(o=>!o)} style={{background:"none",border:`1px solid ${B.border}`,borderRadius:4,padding:"4px 10px",fontSize:10,color:B.textMid,cursor:"pointer",fontFamily:B.font,display:"flex",alignItems:"center",gap:4}}>
      <span style={{fontSize:8}}>{open?"\u25BC":"\u25B6"}</span> How to use this tool
    </button>
    {open&&<div style={{marginTop:6,padding:"8px 12px",background:B.bg,border:`1px solid ${B.border}`,borderRadius:4,fontSize:10,color:B.textMid,lineHeight:1.6}}>{text}</div>}
  </div>);
}

// ── Coordinate Converter Component ──
function CoordConverter({initialLat=DEFAULT_LAT,initialLon=DEFAULT_LON}){
  const [inputMode,setInputMode]=useState("dd");
  const [ddLat,setDdLat]=useState(String(initialLat));
  const [ddLon,setDdLon]=useState(String(initialLon));
  const initLatDms=ddToDms(initialLat),initLonDms=ddToDms(Math.abs(initialLon));
  const [dLatD,setDLatD]=useState(String(initLatDms.d));
  const [dLatM,setDLatM]=useState(String(initLatDms.mAdj));
  const [dLatS,setDLatS]=useState(String(initLatDms.s));
  const [dLatDir,setDLatDir]=useState(initialLat>=0?"N":"S");
  const [dLonD,setDLonD]=useState(String(initLonDms.d));
  const [dLonM,setDLonM]=useState(String(initLonDms.mAdj));
  const [dLonS,setDLonS]=useState(String(initLonDms.s));
  const [dLonDir,setDLonDir]=useState(initialLon>=0?"E":"W");
  const [copied,setCopied]=useState("");
  // Height fields
  const [hElip,setHElip]=useState("");
  const [nGeoid,setNGeoid]=useState("");
  // Zone override
  const [utmLocked,setUtmLocked]=useState(true);
  const [mtmLocked,setMtmLocked]=useState(true);
  const [utmZoneOverride,setUtmZoneOverride]=useState("");
  const [mtmZoneOverride,setMtmZoneOverride]=useState("");

  // Canonical DD from whichever input mode is active
  let pLat,pLon;
  if(inputMode==="dd"){
    pLat=parseFloat(ddLat)||0; pLon=parseFloat(ddLon)||0;
  }else{
    const sgnLat=dLatDir==="N"?1:-1, sgnLon=dLonDir==="E"?1:-1;
    pLat=dmsToDd(parseInt(dLatD)||0,parseInt(dLatM)||0,parseFloat(dLatS)||0,sgnLat);
    pLon=dmsToDd(parseInt(dLonD)||0,parseInt(dLonM)||0,parseFloat(dLonS)||0,sgnLon);
  }

  // Zone logic
  const autoUtmZone=getUtmZone(pLon);
  const utmZone=utmLocked?autoUtmZone:(parseInt(utmZoneOverride)||autoUtmZone);
  const showMtm=isMtmApplicable(pLon);
  const autoMtmZone=showMtm?getMtmZone(pLon):1;
  const mtmZone=mtmLocked?autoMtmZone:(parseInt(mtmZoneOverride)||autoMtmZone);

  // Compute all outputs
  const latDms=ddToDms(pLat),lonDms=ddToDms(Math.abs(pLon));
  const utmResult=geoToTM(pLat,pLon,utmCM(utmZone),0.9996,500000,pLat>=0?0:1e7);
  const utmHemi=pLat>=0?"N":"S";
  const mtmResult=showMtm?geoToTM(pLat,pLon,mtmCM(mtmZone),0.9999,304800,0):null;

  // Height computation
  const h=parseFloat(hElip), n=parseFloat(nGeoid);
  const hValid=!isNaN(h), nValid=!isNaN(n);
  const orthoH=hValid&&nValid?(h-n):NaN;

  const ddStr=`${pLat.toFixed(6)}, ${pLon.toFixed(6)}`;
  const dmsStr=`${latDms.d}\u00B0 ${latDms.mAdj}' ${latDms.s.toFixed(2)}" ${pLat>=0?"N":"S"}, ${lonDms.d}\u00B0 ${lonDms.mAdj}' ${lonDms.s.toFixed(2)}" ${pLon>=0?"E":"W"}`;
  const utmStr=`${utmZone}${utmHemi}  ${utmResult.easting.toFixed(2)} E  ${utmResult.northing.toFixed(2)} N`;
  const mtmStr=mtmResult?`Zone ${mtmZone}  ${mtmResult.easting.toFixed(2)} E  ${mtmResult.northing.toFixed(2)} N`:"";
  const htStr=hValid?`h: ${h.toFixed(3)} m`+(nValid?` | N: ${n.toFixed(3)} m | H: ${orthoH.toFixed(3)} m (CGVD2013)`:""):"";

  // Sync functions
  const syncDdToDms=()=>{
    const la=ddToDms(parseFloat(ddLat)||0),lo=ddToDms(Math.abs(parseFloat(ddLon)||0));
    setDLatD(String(la.d));setDLatM(String(la.mAdj));setDLatS(String(la.s));setDLatDir((parseFloat(ddLat)||0)>=0?"N":"S");
    setDLonD(String(lo.d));setDLonM(String(lo.mAdj));setDLonS(String(lo.s));setDLonDir((parseFloat(ddLon)||0)>=0?"E":"W");
  };
  const syncDmsToDd=()=>{
    const sgnLa=dLatDir==="N"?1:-1,sgnLo=dLonDir==="E"?1:-1;
    setDdLat(dmsToDd(parseInt(dLatD)||0,parseInt(dLatM)||0,parseFloat(dLatS)||0,sgnLa).toFixed(6));
    setDdLon(dmsToDd(parseInt(dLonD)||0,parseInt(dLonM)||0,parseFloat(dLonS)||0,sgnLo).toFixed(6));
  };

  const switchMode=(m)=>{if(m===inputMode)return;if(m==="dms")syncDdToDms();else syncDmsToDd();setInputMode(m);};
  const copyText=(txt,label)=>{try{navigator.clipboard.writeText(txt);setCopied(label);setTimeout(()=>setCopied(""),1500);}catch{}};

  const inp={background:B.bg,border:`1px solid ${B.borderHi}`,borderRadius:4,padding:"4px 8px",color:B.text,fontSize:12,outline:"none",fontFamily:B.font};
  const dmsInp={...inp,width:48,textAlign:"center"};
  const toggleBtn=(active,label)=>({padding:"4px 10px",fontSize:11,fontWeight:active?700:400,fontFamily:B.font,color:active?B.bg:B.textMid,background:active?B.priBr:"transparent",border:`1px solid ${active?B.priBr:B.border}`,borderRadius:3,cursor:"pointer"});
  const outRow={display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 10px",borderRadius:4,background:B.bg,border:`1px solid ${B.border}`,marginBottom:4};
  const copyBtn=(txt,label)=><button onClick={()=>copyText(txt,label)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:copied===label?B.priBr:B.textDim,fontFamily:B.font,padding:"2px 6px"}}>{copied===label?"\u2713":"📋"}</button>;
  const lockBtn=(locked,onToggle)=><button onClick={onToggle} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,padding:"2px 4px",color:locked?B.textDim:B.priBr}} title={locked?"Auto-detected. Click to override.":"Manual override. Click to auto-detect."}>{locked?"\uD83D\uDD12":"\uD83D\uDD13"}</button>;

  return(<div>
    <HelpPanel text={"Enter geographic coordinates in Decimal Degrees (DD) or Degrees-Minutes-Seconds (DMS). UTM and MTM projections are computed automatically for your location. To override the auto-detected zone, click the lock icon. For heights, enter your ellipsoidal height from GNSS and geoid undulation (N) from NRCan\u2019s GPS\u00B7H tool \u2014 orthometric height is computed as H = h \u2212 N. All coordinates reference NAD83(CSRS) on the GRS80 ellipsoid. Heights reference CGVD2013."}/>
    <div style={{fontSize:11,color:B.textMid,marginBottom:4}}>Convert between geographic coordinates (DD/DMS) and projected coordinates (UTM, MTM).</div>
    <div style={{fontSize:10,color:B.textDim,marginBottom:8}}>NAD83(CSRS) {"\u00B7"} GRS80 {"\u00B7"} CGVD2013</div>
    <div style={{display:"flex",gap:4,marginBottom:10}}>
      <button onClick={()=>switchMode("dd")} style={toggleBtn(inputMode==="dd","DD")}>DD</button>
      <button onClick={()=>switchMode("dms")} style={toggleBtn(inputMode==="dms","DMS")}>DMS</button>
    </div>
    {inputMode==="dd"?(
      <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center",flexWrap:"wrap"}}>
        <label style={{fontSize:11,color:B.textMid}}>Lat</label><input value={ddLat} onChange={e=>setDdLat(e.target.value)} style={{...inp,width:120}}/>
        <label style={{fontSize:11,color:B.textMid}}>Lon</label><input value={ddLon} onChange={e=>setDdLon(e.target.value)} style={{...inp,width:120}}/></div>
    ):(
      <div style={{marginBottom:8}}>
        <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
          <label style={{fontSize:10,color:B.textDim,width:24}}>Lat</label>
          <input value={dLatD} onChange={e=>setDLatD(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u00B0"}</span>
          <input value={dLatM} onChange={e=>setDLatM(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u2032"}</span>
          <input value={dLatS} onChange={e=>setDLatS(e.target.value)} style={{...dmsInp,width:60}}/><span style={{fontSize:11,color:B.textDim}}>{"\u2033"}</span>
          <button onClick={()=>setDLatDir(d=>d==="N"?"S":"N")} style={{...inp,width:28,textAlign:"center",cursor:"pointer",fontWeight:700,color:B.priBr}}>{dLatDir}</button></div>
        <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
          <label style={{fontSize:10,color:B.textDim,width:24}}>Lon</label>
          <input value={dLonD} onChange={e=>setDLonD(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u00B0"}</span>
          <input value={dLonM} onChange={e=>setDLonM(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u2032"}</span>
          <input value={dLonS} onChange={e=>setDLonS(e.target.value)} style={{...dmsInp,width:60}}/><span style={{fontSize:11,color:B.textDim}}>{"\u2033"}</span>
          <button onClick={()=>setDLonDir(d=>d==="E"?"W":"E")} style={{...inp,width:28,textAlign:"center",cursor:"pointer",fontWeight:700,color:B.priBr}}>{dLonDir}</button></div>
      </div>
    )}
    {/* Height inputs */}
    <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
      <label style={{fontSize:11,color:B.textMid}}>h<Tip text={"Ellipsoidal height \u2014 the height above the GRS80 ellipsoid as measured by GNSS. This is NOT the same as elevation above sea level."}/></label>
      <input value={hElip} onChange={e=>setHElip(e.target.value)} placeholder="Ellipsoidal" style={{...inp,width:100}}/>
      <label style={{fontSize:11,color:B.textMid}}>N<Tip text={"Geoid undulation \u2014 the separation between the GRS80 ellipsoid and the geoid at your location. Get this from your GNSS processing software or NRCan\u2019s GPS\u00B7H tool. In most of Canada, N is positive (geoid above ellipsoid)."}/></label>
      <input value={nGeoid} onChange={e=>setNGeoid(e.target.value)} placeholder="Geoid Und." style={{...inp,width:100}}/>
      <span style={{fontSize:11,color:B.textMid}}>H<Tip text={"Orthometric height \u2014 height above mean sea level (CGVD2013). Computed as H = h \u2212 N."}/></span>
      <span style={{fontFamily:B.font,fontSize:12,color:!isNaN(orthoH)?B.priBr:B.textDim,fontWeight:600}}>{!isNaN(orthoH)?orthoH.toFixed(3)+" m":"\u2014"}</span>
      <span style={{fontSize:10,color:B.textDim}}>m</span>
    </div>
    {/* Zone controls */}
    <div style={{display:"flex",gap:12,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <span style={{fontSize:10,color:B.textDim}}>UTM</span>
        {lockBtn(utmLocked,()=>{if(utmLocked)setUtmZoneOverride(String(autoUtmZone));setUtmLocked(l=>!l);})}
        {utmLocked?<span style={{fontFamily:B.font,fontSize:12,color:B.text}}>{autoUtmZone}{utmHemi}</span>
          :<input value={utmZoneOverride} onChange={e=>{const v=parseInt(e.target.value);if(!e.target.value)setUtmZoneOverride("");else if(v>=1&&v<=60)setUtmZoneOverride(String(v));}} style={{...inp,width:48,textAlign:"center"}} min="1" max="60"/>}
        <span style={{fontSize:9,color:utmLocked?B.textDim:B.priBr}}>{utmLocked?"Auto":"Manual"}</span>
      </div>
      {showMtm&&<div style={{display:"flex",alignItems:"center",gap:4}}>
        <span style={{fontSize:10,color:B.textDim}}>MTM</span>
        {lockBtn(mtmLocked,()=>{if(mtmLocked)setMtmZoneOverride(String(autoMtmZone));setMtmLocked(l=>!l);})}
        {mtmLocked?<span style={{fontFamily:B.font,fontSize:12,color:B.text}}>{autoMtmZone}</span>
          :<input value={mtmZoneOverride} onChange={e=>{const v=parseInt(e.target.value);if(!e.target.value)setMtmZoneOverride("");else if(v>=1&&v<=17)setMtmZoneOverride(String(v));}} style={{...inp,width:48,textAlign:"center"}} min="1" max="17"/>}
        <span style={{fontSize:9,color:mtmLocked?B.textDim:B.priBr}}>{mtmLocked?"Auto":"Manual"}</span>
      </div>}
    </div>
    {/* Outputs */}
    <div style={{borderTop:`1px solid ${B.border}`,paddingTop:10}}>
      <div style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>All Formats</div>
      <div style={outRow}><span style={{fontFamily:B.font,fontSize:10,color:B.textDim,width:32}}>DD</span><span style={{fontFamily:B.font,fontSize:12,color:B.text,flex:1}}>{pLat.toFixed(6)}{"\u00B0"}, {pLon.toFixed(6)}{"\u00B0"}</span>{copyBtn(ddStr,"dd")}</div>
      <div style={outRow}><span style={{fontFamily:B.font,fontSize:10,color:B.textDim,width:32}}>DMS</span><span style={{fontFamily:B.font,fontSize:12,color:B.text,flex:1}}>{dmsStr}</span>{copyBtn(dmsStr,"dms")}</div>
      <div style={outRow}><span style={{fontFamily:B.font,fontSize:10,color:B.textDim,width:32}}>UTM</span><span style={{fontFamily:B.font,fontSize:12,color:B.priBr,flex:1}}>{utmStr}</span><span style={{fontFamily:B.font,fontSize:9,color:B.textDim}}>{utmEpsgStr(utmZone,utmHemi)}</span>{copyBtn(utmStr,"utm")}</div>
      {showMtm&&<div style={outRow}><span style={{fontFamily:B.font,fontSize:10,color:B.textDim,width:32}}>MTM</span><span style={{fontFamily:B.font,fontSize:12,color:B.priBr,flex:1}}>{mtmStr}</span>{copyBtn(mtmStr,"mtm")}</div>}
      {htStr&&<div style={outRow}><span style={{fontFamily:B.font,fontSize:10,color:B.textDim,width:32}}>HT</span><span style={{fontFamily:B.font,fontSize:12,color:B.text,flex:1}}>{htStr}</span>{copyBtn(htStr,"ht")}</div>}
    </div>
  </div>);
}

// ── Scale & Distance Component ──
function ScaleCalc({initialLat=DEFAULT_LAT,initialLon=DEFAULT_LON}){
  const [lat,setLat]=useState(String(initialLat));
  const [lon,setLon]=useState(String(initialLon));
  const [elev,setElev]=useState("580");
  const [groundDist,setGroundDist]=useState("");
  const [gridDist,setGridDist]=useState("");
  const [projType,setProjType]=useState("utm");
  const [lastEdited,setLastEdited]=useState("ground");
  // Zone override
  const [zoneLocked,setZoneLocked]=useState(true);
  const [zoneOverride,setZoneOverride]=useState("");
  // DD/DMS toggle
  const [coordMode,setCoordMode]=useState("dd");
  const initLatDms3=ddToDms(initialLat),initLonDms3=ddToDms(Math.abs(initialLon));
  const [scDmsLatD,setScDmsLatD]=useState(String(initLatDms3.d));
  const [scDmsLatM,setScDmsLatM]=useState(String(initLatDms3.mAdj));
  const [scDmsLatS,setScDmsLatS]=useState(String(initLatDms3.s));
  const [scDmsLatDir,setScDmsLatDir]=useState(initialLat>=0?"N":"S");
  const [scDmsLonD,setScDmsLonD]=useState(String(initLonDms3.d));
  const [scDmsLonM,setScDmsLonM]=useState(String(initLonDms3.mAdj));
  const [scDmsLonS,setScDmsLonS]=useState(String(initLonDms3.s));
  const [scDmsLonDir,setScDmsLonDir]=useState(initialLon>=0?"E":"W");
  const scSyncDdToDms=()=>{
    const la=ddToDms(parseFloat(lat)||0),lo=ddToDms(Math.abs(parseFloat(lon)||0));
    setScDmsLatD(String(la.d));setScDmsLatM(String(la.mAdj));setScDmsLatS(String(la.s));setScDmsLatDir((parseFloat(lat)||0)>=0?"N":"S");
    setScDmsLonD(String(lo.d));setScDmsLonM(String(lo.mAdj));setScDmsLonS(String(lo.s));setScDmsLonDir((parseFloat(lon)||0)>=0?"E":"W");
  };
  const scSyncDmsToDd=()=>{
    const sgnLa=scDmsLatDir==="N"?1:-1,sgnLo=scDmsLonDir==="E"?1:-1;
    setLat(dmsToDd(parseInt(scDmsLatD)||0,parseInt(scDmsLatM)||0,parseFloat(scDmsLatS)||0,sgnLa).toFixed(6));
    setLon(dmsToDd(parseInt(scDmsLonD)||0,parseInt(scDmsLonM)||0,parseFloat(scDmsLonS)||0,sgnLo).toFixed(6));
  };
  const switchCoordMode=(m2)=>{if(m2===coordMode)return;if(m2==="dms")scSyncDdToDms();else scSyncDmsToDd();setCoordMode(m2);};

  let pLat,pLon;
  if(coordMode==="dd"){
    pLat=parseFloat(lat)||initialLat; pLon=parseFloat(lon)||initialLon;
  }else{
    const sgnLat=scDmsLatDir==="N"?1:-1, sgnLon=scDmsLonDir==="E"?1:-1;
    pLat=dmsToDd(parseInt(scDmsLatD)||0,parseInt(scDmsLatM)||0,parseFloat(scDmsLatS)||0,sgnLat);
    pLon=dmsToDd(parseInt(scDmsLonD)||0,parseInt(scDmsLonM)||0,parseFloat(scDmsLonS)||0,sgnLon);
  }
  const h=parseFloat(elev)||0;
  const showMtm=isMtmApplicable(pLon);
  // If MTM not applicable and projType is mtm, force to utm
  const effectiveProj=(!showMtm&&projType==="mtm")?"utm":projType;
  const autoZone=effectiveProj==="utm"?getUtmZone(pLon):getMtmZone(pLon);
  const zone=zoneLocked?autoZone:(parseInt(zoneOverride)||autoZone);
  const cm=effectiveProj==="utm"?utmCM(zone):mtmCM(zone);
  const k0=effectiveProj==="utm"?0.9996:0.9999;
  const gsf=gridScaleFactor(pLat,pLon,cm,k0);
  const ef=elevFactor(pLat,h);
  const csf=gsf*ef;

  const gd=parseFloat(groundDist),grd=parseFloat(gridDist);
  const computedGrid=gd&&lastEdited==="ground"?(gd*csf).toFixed(4):"";
  const computedGround=grd&&lastEdited==="grid"?(grd/csf).toFixed(4):"";

  const maxZone=effectiveProj==="utm"?60:17;

  const inp={background:B.bg,border:`1px solid ${B.borderHi}`,borderRadius:4,padding:"4px 8px",color:B.text,fontSize:12,outline:"none",fontFamily:B.font};
  const dmsInpSc={...inp,width:48,textAlign:"center"};
  const coordToggleBtn=(active)=>({padding:"4px 10px",fontSize:11,fontWeight:active?700:400,fontFamily:B.font,color:active?B.bg:B.textMid,background:active?B.priBr:"transparent",border:`1px solid ${active?B.priBr:B.border}`,borderRadius:3,cursor:"pointer"});
  const toggleBtn=(m)=>({padding:"4px 10px",fontSize:11,fontWeight:effectiveProj===m?700:400,fontFamily:B.font,color:effectiveProj===m?B.bg:B.textMid,background:effectiveProj===m?B.priBr:"transparent",border:`1px solid ${effectiveProj===m?B.priBr:B.border}`,borderRadius:3,cursor:"pointer"});
  const insetStyle={background:B.inset,border:`2px solid ${B.border}`,borderTopColor:B.bvD,borderLeftColor:B.bvD,borderBottomColor:B.bvL,borderRightColor:B.bvL};
  const lockBtn=(locked,onToggle)=><button onClick={onToggle} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,padding:"2px 4px",color:locked?B.textDim:B.priBr}} title={locked?"Auto-detected. Click to override.":"Manual override. Click to auto-detect."}>{locked?"\uD83D\uDD12":"\uD83D\uDD13"}</button>;

  return(<div>
    <HelpPanel text={"Enter a position and elevation to compute scale factors for your projection zone. The Combined Scale Factor (CSF) converts between ground-level measurements and grid distances on the projection. Ground Distance \u00D7 CSF = Grid Distance. For precise work, ensure your elevation references CGVD2013."}/>
    <div style={{display:"flex",gap:4,marginBottom:10}}>
      <button onClick={()=>switchCoordMode("dd")} style={coordToggleBtn(coordMode==="dd")}>DD</button>
      <button onClick={()=>switchCoordMode("dms")} style={coordToggleBtn(coordMode==="dms")}>DMS</button>
    </div>
    {coordMode==="dd"?(
    <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
      <label style={{fontSize:11,color:B.textMid}}>Lat</label><input value={lat} onChange={e=>setLat(e.target.value)} style={{...inp,width:100}}/>
      <label style={{fontSize:11,color:B.textMid}}>Lon</label><input value={lon} onChange={e=>setLon(e.target.value)} style={{...inp,width:100}}/>
      <label style={{fontSize:11,color:B.textMid}}>H<Tip text="Orthometric height above mean sea level (CGVD2013). Used to compute the elevation factor. Using orthometric height instead of ellipsoidal height introduces negligible error at 6 decimal places."/></label>
      <input value={elev} onChange={e=>setElev(e.target.value)} style={{...inp,width:60}}/><span style={{fontSize:10,color:B.textDim}}>m (CGVD2013)</span>
    </div>
    ):(
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
        <label style={{fontSize:10,color:B.textDim,width:24}}>Lat</label>
        <input value={scDmsLatD} onChange={e=>setScDmsLatD(e.target.value)} style={dmsInpSc}/><span style={{fontSize:11,color:B.textDim}}>{"\u00B0"}</span>
        <input value={scDmsLatM} onChange={e=>setScDmsLatM(e.target.value)} style={dmsInpSc}/><span style={{fontSize:11,color:B.textDim}}>{"\u2032"}</span>
        <input value={scDmsLatS} onChange={e=>setScDmsLatS(e.target.value)} style={{...dmsInpSc,width:60}}/><span style={{fontSize:11,color:B.textDim}}>{"\u2033"}</span>
        <button onClick={()=>setScDmsLatDir(d=>d==="N"?"S":"N")} style={{...inp,width:28,textAlign:"center",cursor:"pointer",fontWeight:700,color:B.priBr}}>{scDmsLatDir}</button></div>
      <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
        <label style={{fontSize:10,color:B.textDim,width:24}}>Lon</label>
        <input value={scDmsLonD} onChange={e=>setScDmsLonD(e.target.value)} style={dmsInpSc}/><span style={{fontSize:11,color:B.textDim}}>{"\u00B0"}</span>
        <input value={scDmsLonM} onChange={e=>setScDmsLonM(e.target.value)} style={dmsInpSc}/><span style={{fontSize:11,color:B.textDim}}>{"\u2032"}</span>
        <input value={scDmsLonS} onChange={e=>setScDmsLonS(e.target.value)} style={{...dmsInpSc,width:60}}/><span style={{fontSize:11,color:B.textDim}}>{"\u2033"}</span>
        <button onClick={()=>setScDmsLonDir(d=>d==="E"?"W":"E")} style={{...inp,width:28,textAlign:"center",cursor:"pointer",fontWeight:700,color:B.priBr}}>{scDmsLonDir}</button></div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <label style={{fontSize:11,color:B.textMid}}>H<Tip text="Orthometric height above mean sea level (CGVD2013). Used to compute the elevation factor. Using orthometric height instead of ellipsoidal height introduces negligible error at 6 decimal places."/></label>
        <input value={elev} onChange={e=>setElev(e.target.value)} style={{...inp,width:60}}/><span style={{fontSize:10,color:B.textDim}}>m (CGVD2013)</span>
      </div>
    </div>
    )}
    <div style={{display:"flex",gap:4,marginBottom:10,alignItems:"center"}}>
      <button onClick={()=>{setProjType("utm");setZoneLocked(true);}} style={toggleBtn("utm")}>UTM</button>
      {showMtm&&<button onClick={()=>{setProjType("mtm");setZoneLocked(true);}} style={toggleBtn("mtm")}>MTM</button>}
      {lockBtn(zoneLocked,()=>{if(zoneLocked)setZoneOverride(String(autoZone));setZoneLocked(l=>!l);})}
      {zoneLocked?<span style={{fontFamily:B.font,fontSize:12,color:B.text}}>{effectiveProj.toUpperCase()} {zone}{effectiveProj==="utm"?(pLat>=0?"N":"S"):""}</span>
        :<input value={zoneOverride} onChange={e=>{const v=parseInt(e.target.value);if(!e.target.value)setZoneOverride("");else if(v>=1&&v<=maxZone)setZoneOverride(String(v));}} style={{...inp,width:48,textAlign:"center"}}/>}
      <span style={{fontSize:9,color:zoneLocked?B.textDim:B.priBr}}>{zoneLocked?"Auto":"Manual"}</span>
      <span style={{fontSize:10,color:B.textDim,marginLeft:6}}>NAD83(CSRS) {"\u00B7"} GRS80</span>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
      {[
        {label:"Grid Scale",val:gsf.toFixed(6),sub:`${effectiveProj.toUpperCase()} ${zone}${effectiveProj==="utm"?(pLat>=0?"N":"S"):""}`,color:B.sec,tip:"How much the projection distorts distances at this location. Equals k\u2080 at the central meridian; increases with distance from it."},
        {label:"Elev Factor",val:ef.toFixed(6),sub:`${elev||0}m`,color:B.text,tip:"Accounts for the difference between measurements at your elevation and on the ellipsoid surface. Higher elevation = smaller factor."},
        {label:"Combined",val:csf.toFixed(6),sub:"CSF",color:B.priBr,tip:"Grid Scale \u00D7 Elevation Factor. Multiply ground distance by CSF to get grid distance."}
      ].map(x=>(
        <div key={x.label} style={{...insetStyle,padding:10,textAlign:"center"}}>
          <div style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:1.5,textTransform:"uppercase"}}>{x.label}<Tip text={x.tip}/></div>
          <div style={{fontFamily:B.display,fontSize:14,fontWeight:800,color:x.color,margin:"4px 0"}}>{x.val}</div>
          <div style={{fontFamily:B.font,fontSize:10,color:B.textDim}}>{x.sub}</div>
        </div>
      ))}
    </div>
    <div style={{borderTop:`1px solid ${B.border}`,paddingTop:10}}>
      <div style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Distance Conversion</div>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
        <label style={{fontSize:11,color:B.textMid,width:60}}>Ground</label>
        <input value={lastEdited==="ground"?groundDist:computedGround} onChange={e=>{setGroundDist(e.target.value);setLastEdited("ground");}} style={{...inp,width:120}} placeholder="0.0000"/>
        <span style={{fontSize:11,color:B.textDim}}>m</span>
        <span style={{fontSize:11,color:B.textDim}}>{"\u2192"}</span>
        <span style={{fontFamily:B.font,fontSize:12,color:B.priBr}}>{lastEdited==="ground"&&computedGrid?computedGrid+" m":"\u2014"}</span>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <label style={{fontSize:11,color:B.textMid,width:60}}>Grid</label>
        <input value={lastEdited==="grid"?gridDist:computedGrid} onChange={e=>{setGridDist(e.target.value);setLastEdited("grid");}} style={{...inp,width:120}} placeholder="0.0000"/>
        <span style={{fontSize:11,color:B.textDim}}>m</span>
        <span style={{fontSize:11,color:B.textDim}}>{"\u2192"}</span>
        <span style={{fontFamily:B.font,fontSize:12,color:B.priBr}}>{lastEdited==="grid"&&computedGround?computedGround+" m":"\u2014"}</span>
      </div>
    </div>
  </div>);
}

// ── Calculator Component ──
function CalcPanel(){
  const [unitVal,setUnitVal]=useState("1");
  const [unitFrom,setUnitFrom]=useState("m");
  const [speedVal,setSpeedVal]=useState("10");
  const [speedFrom,setSpeedFrom]=useState("ms");
  const [tempC,setTempC]=useState("20");

  const inp={background:B.bg,border:`1px solid ${B.borderHi}`,borderRadius:4,padding:"6px 10px",color:B.text,fontSize:13,width:110,outline:"none",fontFamily:B.font};
  const sel={...inp,width:140,cursor:"pointer",WebkitAppearance:"none",appearance:"none"};
  const cardS={background:`linear-gradient(135deg,${B.surface},${B.surfaceHi})`,border:`2px solid ${B.border}`,borderTopColor:B.bvL,borderLeftColor:B.bvL,borderBottomColor:B.bvD,borderRightColor:B.bvD,borderRadius:0,padding:16};
  const inS={background:B.inset,border:`2px solid ${B.border}`,borderTopColor:B.bvD,borderLeftColor:B.bvD,borderBottomColor:B.bvL,borderRightColor:B.bvL};

  // Distance conversions
  const distUnits={
    m:{name:"Metres",toM:1},ft:{name:"Feet (Int'l)",toM:0.3048},ftUS:{name:"Feet (US Survey)",toM:0.3048006096},
    ch:{name:"Chains (Gunter)",toM:20.1168},link:{name:"Links",toM:0.201168},rod:{name:"Rods / Perches",toM:5.0292},
    km:{name:"Kilometres",toM:1000},mi:{name:"Miles",toM:1609.344},nmi:{name:"Nautical Miles",toM:1852},
    yd:{name:"Yards",toM:0.9144},in:{name:"Inches",toM:0.0254},cm:{name:"Centimetres",toM:0.01},mm:{name:"Millimetres",toM:0.001},
    fathom:{name:"Fathoms",toM:1.8288},
  };
  const v=parseFloat(unitVal)||0;
  const metres=v*distUnits[unitFrom].toM;

  // Speed conversions
  const speedUnits={
    ms:{name:"m/s",toMs:1},kph:{name:"km/h",toMs:1/3.6},mph:{name:"mph",toMs:0.44704},
    kn:{name:"Knots",toMs:0.514444},fts:{name:"ft/s",toMs:0.3048},
  };
  const sv=parseFloat(speedVal)||0;
  const ms=sv*speedUnits[speedFrom].toMs;

  // Area conversions from sq metres
  const areaPairs=[
    {l:"1 acre",v:"4,046.86 m\u00B2",v2:"0.4047 ha"},
    {l:"1 hectare",v:"10,000 m\u00B2",v2:"2.471 ac"},
    {l:"1 sq ft",v:"0.0929 m\u00B2",v2:"929.03 cm\u00B2"},
    {l:"1 sq yd",v:"0.8361 m\u00B2",v2:"9 sq ft"},
    {l:"1 sq mi",v:"2.59 km\u00B2",v2:"640 ac"},
    {l:"1 sq ch",v:"404.686 m\u00B2",v2:"0.1 ac"},
  ];

  // Survey-specific
  const surveyPairs=[
    {l:"Chain (Gunter)",v:"20.1168 m",v2:"66 ft / 100 links"},
    {l:"Link",v:"0.201168 m",v2:"7.92 in"},
    {l:"Rod / Perch",v:"5.0292 m",v2:"16.5 ft / 25 links"},
    {l:"Furlong",v:"201.168 m",v2:"10 chains / 660 ft"},
    {l:"Fathom",v:"1.8288 m",v2:"6 ft"},
    {l:"US Survey Foot",v:"0.3048006 m",v2:"1200/3937 m exactly"},
    {l:"Int'l Foot",v:"0.3048 m",v2:"Adopted by Canada/US"},
    {l:"Vara (Texas)",v:"0.8467 m",v2:"33\u2153 in"},
  ];

  // Temp table
  const tc=parseFloat(tempC)||0;
  const tempTable=[-40,-30,-20,-10,0,5,10,15,20,25,30,35,40].map(c=>({c,f:c*9/5+32}));

  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="cmd-split">

      {/* ── Distance Converter ── */}
      <div style={cardS}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:15}}>{"\uD83D\uDCCF"}</span>
          <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Distance Converter</h2>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
          <input value={unitVal} onChange={e=>setUnitVal(e.target.value)} style={inp} type="number" step="any"/>
          <select value={unitFrom} onChange={e=>setUnitFrom(e.target.value)} style={sel}>
            {Object.entries(distUnits).map(([k,u])=><option key={k} value={k}>{u.name}</option>)}
          </select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
          {Object.entries(distUnits).filter(([k])=>k!==unitFrom).map(([k,u])=>{
            const converted=metres/u.toM;
            const display=converted>=1e6||converted<0.001&&converted!==0?converted.toExponential(4):converted<1?converted.toPrecision(6):converted.toLocaleString("en-CA",{maximumFractionDigits:4});
            return(
              <div key={k} style={{...inS,padding:"8px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:1,textTransform:"uppercase"}}>{u.name}</span>
                <span style={{fontFamily:B.font,fontSize:13,fontWeight:700,color:B.text}}>{display}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Speed Converter ── */}
      <div style={cardS}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:15}}>{"\uD83D\uDCA8"}</span>
          <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Speed Converter</h2>
          <span style={{fontSize:10,color:B.textDim,marginLeft:"auto"}}>RPAS / Aviation</span>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
          <input value={speedVal} onChange={e=>setSpeedVal(e.target.value)} style={inp} type="number" step="any"/>
          <select value={speedFrom} onChange={e=>setSpeedFrom(e.target.value)} style={sel}>
            {Object.entries(speedUnits).map(([k,u])=><option key={k} value={k}>{u.name}</option>)}
          </select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:16}}>
          {Object.entries(speedUnits).filter(([k])=>k!==speedFrom).map(([k,u])=>{
            const converted=ms/u.toMs;
            return(
              <div key={k} style={{...inS,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:1,textTransform:"uppercase"}}>{u.name}</span>
                <span style={{fontFamily:B.display,fontSize:18,fontWeight:800,color:B.text}}>{converted.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
        <div style={{background:B.inset+"80",border:`1px solid ${B.border}`,borderRadius:4,padding:"8px 10px",fontSize:10,color:B.textMid,lineHeight:1.5}}>
          <b style={{color:B.text}}>Quick ref:</b> TC max RPAS speed: 25 kn (46.3 km/h) in controlled airspace {"\u00B7"} Typical mapping flight: 8-15 m/s {"\u00B7"} Max wind for small RPAS: ~35 km/h
        </div>
      </div>

      {/* ── Temperature ── */}
      <div style={cardS}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:15}}>{"\uD83C\uDF21\uFE0F"}</span>
          <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Temperature</h2>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}>
          <input value={tempC} onChange={e=>setTempC(e.target.value)} style={inp} type="number" step="any"/>
          <span style={{fontFamily:B.font,fontSize:12,color:B.textMid}}>{"\u00B0"}C</span>
          <span style={{fontFamily:B.font,fontSize:14,color:B.textDim}}>=</span>
          <div style={{...inS,padding:"6px 12px"}}>
            <span style={{fontFamily:B.display,fontSize:18,fontWeight:800,color:B.gold}}>{(tc*9/5+32).toFixed(1)}</span>
            <span style={{fontFamily:B.font,fontSize:12,color:B.textMid,marginLeft:4}}>{"\u00B0"}F</span>
          </div>
          <span style={{fontFamily:B.font,fontSize:14,color:B.textDim}}>=</span>
          <div style={{...inS,padding:"6px 12px"}}>
            <span style={{fontFamily:B.display,fontSize:18,fontWeight:800,color:B.sec}}>{(tc+273.15).toFixed(1)}</span>
            <span style={{fontFamily:B.font,fontSize:12,color:B.textMid,marginLeft:4}}>K</span>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(70px,1fr))",gap:3}}>
          {tempTable.map(t=>{
            const isClose=Math.abs(t.c-tc)<2.5;
            return(
              <div key={t.c} style={{...inS,padding:"6px 4px",textAlign:"center",borderColor:isClose?B.gold+"60":B.border}}>
                <div style={{fontFamily:B.display,fontSize:13,fontWeight:800,color:t.c<=0?"#60a5fa":t.c>=30?"#ef4444":B.text}}>{t.c}{"\u00B0"}</div>
                <div style={{fontFamily:B.font,fontSize:11,color:B.textDim}}>{t.f}{"\u00B0"}F</div>
              </div>
            );
          })}
        </div>
        <div style={{background:B.inset+"80",border:`1px solid ${B.border}`,borderRadius:4,padding:"8px 10px",marginTop:10,fontSize:10,color:B.textMid,lineHeight:1.5}}>
          <b style={{color:B.text}}>Field notes:</b> LiPo batteries degrade below 10{"\u00B0"}C {"\u00B7"} Most RPAS rated 0-40{"\u00B0"}C {"\u00B7"} Frost point affects scanner optics {"\u00B7"} -32.8{"\u00B0"}F = -36{"\u00B0"}C spray foam threshold
        </div>
      </div>

      {/* ── Survey Conversions ── */}
      <div style={cardS}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:15}}>{"\uD83D\uDCD0"}</span>
          <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Survey Measures</h2>
        </div>
        <div style={{display:"grid",gap:3}}>
          {surveyPairs.map(x=>(
            <div key={x.l} style={{...inS,padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontFamily:B.font,fontSize:11,fontWeight:700,color:B.text,minWidth:120}}>{x.l}</span>
              <span style={{fontFamily:B.font,fontSize:12,color:B.priBr,flex:1}}>{x.v}</span>
              <span style={{fontFamily:B.font,fontSize:10,color:B.textDim}}>{x.v2}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Area Conversions ── */}
      <div style={cardS}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:15}}>{"\u2B1C"}</span>
          <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Area Conversions</h2>
        </div>
        <div style={{display:"grid",gap:3}}>
          {areaPairs.map(x=>(
            <div key={x.l} style={{...inS,padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontFamily:B.font,fontSize:11,fontWeight:700,color:B.text,minWidth:90}}>{x.l}</span>
              <span style={{fontFamily:B.font,fontSize:12,color:B.priBr,flex:1}}>{x.v}</span>
              <span style={{fontFamily:B.font,fontSize:10,color:B.textDim}}>{x.v2}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Volume & Weight ── */}
      <div style={cardS}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:15}}>{"\u2696\uFE0F"}</span>
          <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Volume & Weight</h2>
        </div>
        <div style={{display:"grid",gap:3}}>
          {[
            {l:"1 cubic yard",v:"0.7646 m\u00B3",v2:"27 cu ft"},
            {l:"1 cubic foot",v:"0.02832 m\u00B3",v2:"28.317 L"},
            {l:"1 US gallon",v:"3.7854 L",v2:"0.8327 imp gal"},
            {l:"1 imp gallon",v:"4.5461 L",v2:"1.201 US gal"},
            {l:"1 pound (lb)",v:"0.4536 kg",v2:"453.6 g"},
            {l:"1 short ton",v:"907.185 kg",v2:"2,000 lb"},
            {l:"1 metric tonne",v:"1,000 kg",v2:"2,204.6 lb"},
          ].map(x=>(
            <div key={x.l} style={{...inS,padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontFamily:B.font,fontSize:11,fontWeight:700,color:B.text,minWidth:110}}>{x.l}</span>
              <span style={{fontFamily:B.font,fontSize:12,color:B.priBr,flex:1}}>{x.v}</span>
              <span style={{fontFamily:B.font,fontSize:10,color:B.textDim}}>{x.v2}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Provincial Intel Component ──
function ProvIntel({initialProv="bc"}){
  const [prov,setProv]=useState(initialProv);
  const data=PROVINCES.find(p=>p.id===prov);
  return(
    <div>
      <div className="prov-btns" style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:12}}>
        {PROVINCES.map(p=>(
          <button key={p.id} onClick={()=>setProv(p.id)}
            style={{
              padding:"4px 10px",fontSize:11,fontWeight:prov===p.id?700:400,
              fontFamily:B.font,color:prov===p.id?B.bg:B.textMid,
              background:prov===p.id?B.priBr:"transparent",
              border:`1px solid ${prov===p.id?B.priBr:B.border}`,
              borderRadius:3,cursor:"pointer",whiteSpace:"nowrap"
            }}>
            {p.abbr}
          </button>
        ))}
      </div>
      <h3 style={{fontFamily:B.font,fontSize:13,fontWeight:700,color:B.text,margin:"0 0 10px"}}>{data.name}</h3>
      {data.categories.map(cat=>(
        <div key={cat.category} style={{marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:".08em",color:B.textDim,fontFamily:B.font,padding:"4px 0",borderBottom:`1px solid ${B.border}`,marginBottom:4}}>
            {cat.category.toUpperCase()}
          </div>
          {cat.links.map(l=>(
            <a key={l.u} href={l.u} target="_blank" rel="noopener noreferrer"
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",textDecoration:"none",color:B.text,fontSize:12,background:"transparent",transition:"all .12s",border:"1px solid transparent",borderRadius:4}}
              onMouseEnter={e=>{e.currentTarget.style.background=B.surface;e.currentTarget.style.borderColor=B.borderHi;}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}>
              <div>
                <span>{l.n}</span>
                {l.paid&&<span style={{fontSize:9,color:B.gold,marginLeft:6}}>💲</span>}
                {l.d&&<div style={{fontSize:10,color:B.textDim,marginTop:1}}>{l.d}</div>}
              </div>
              <span style={{color:B.textDim,fontSize:11}}>→</span>
            </a>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ──
export default function App(){
  const [sw,setSw]=useState(null),[wx,setWx]=useState(null);
  const [tab,setTab]=useState("command"),[search,setSearch]=useState("");
  const [sErr,setSErr]=useState(false),[wErr,setWErr]=useState(false);
  const [utc,setUtc]=useState(new Date());
  const [sun,setSun]=useState({altitude:0,azimuth:0});
  const [fieldTz,setFieldTz]=useState("");
  const [typewriterText,setTypewriterText]=useState("");
  const [theme,setThemeState]=useState(getTheme);
  const toggleTheme=()=>{const t=theme==="dark"?"light":"dark";setThemeState(t);setThemePref(t);document.body.style.background=t==="dark"?DARK.bg:LIGHT.bg;};
  B=theme==="dark"?DARK:LIGHT;

  // ── Location (GPS or default) ──
  const [userLat,setUserLat]=useState(null);
  const [userLon,setUserLon]=useState(null);
  const [cityName,setCityName]=useState(DEFAULT_CITY);
  const [locSource,setLocSource]=useState("default");
  const [locLoading,setLocLoading]=useState(false);
  const lat=userLat??DEFAULT_LAT;
  const lon=userLon??DEFAULT_LON;
  const userTz=typeof Intl!=="undefined"?Intl.DateTimeFormat().resolvedOptions().timeZone:DEFAULT_TZ;

  // Check localStorage for saved location on mount
  useEffect(()=>{
    const saved=localStorage.getItem("bckgeo_location");
    if(saved){try{const p=JSON.parse(saved);setUserLat(p.lat);setUserLon(p.lon);setCityName(p.city);if(p.tz)setLocSource("gps");else setLocSource("gps");}catch{}}
  },[]);

  const requestLocation=()=>{
    if(!navigator.geolocation)return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos)=>{
        const{latitude,longitude}=pos.coords;
        setUserLat(latitude);setUserLon(longitude);setLocSource("gps");
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
          .then(r=>r.json()).then(data=>{
            const cityStr=`${data.city||data.locality||"Unknown"}, ${data.principalSubdivisionCode?.replace("CA-","")||data.countryCode}`;
            setCityName(cityStr);
            localStorage.setItem("bckgeo_location",JSON.stringify({lat:latitude,lon:longitude,city:cityStr}));
            setLocLoading(false);
          }).catch(()=>setLocLoading(false));
      },
      ()=>setLocLoading(false),
      {enableHighAccuracy:false,timeout:10000}
    );
  };

  const resetLocation=()=>{
    localStorage.removeItem("bckgeo_location");
    setUserLat(null);setUserLon(null);setCityName(DEFAULT_CITY);setLocSource("default");
  };

  // ── Clock & Typewriter ──
  useEffect(()=>{const t=setInterval(()=>{const n=new Date();setUtc(n);setSun(calcSun(n,lat,lon));},1000);return()=>clearInterval(t);},[lat,lon]);

  useEffect(()=>{
    const words=["GEOMATICS","GEODESY","REMOTE SENSING","GIS","SPATIAL AI","LiDAR","PHOTOGRAMMETRY","RPAS"];
    let wi=0,ci=0,deleting=false,pause=0;
    const t=setInterval(()=>{
      const word=words[wi];
      if(pause>0){pause--;return;}
      if(!deleting){ci++;setTypewriterText(word.substring(0,ci));if(ci===word.length){deleting=true;pause=28;}}
      else{ci--;setTypewriterText(word.substring(0,ci));if(ci===0){deleting=false;wi=(wi+1)%words.length;pause=6;}}
    },65);
    return()=>clearInterval(t);
  },[]);

  // ── Fetch Space Weather & Weather ──
  const fS=useCallback(async()=>{try{const[a,b,c,d,e]=await Promise.allSettled([fetch(NOAA_KP).then(r=>r.json()),fetch(NOAA_SCALES).then(r=>r.json()),fetch(NOAA_WIND_SPEED).then(r=>r.json()),fetch(NOAA_WIND_MAG).then(r=>r.json()),fetch(NOAA_XRAY).then(r=>r.json())]);
    setSw({kp:a.status==="fulfilled"?a.value:[],scales:b.status==="fulfilled"?b.value:{},wind:c.status==="fulfilled"?c.value:{},mag:d.status==="fulfilled"?d.value:{},flux:e.status==="fulfilled"?e.value:{}});setSErr(false);}catch{setSErr(true);}},[]);
  const fW=useCallback(async()=>{try{setWx(await fetch(buildWeatherUrl(lat,lon,userTz)).then(r=>r.json()));setWErr(false);}catch{setWErr(true);}},[lat,lon,userTz]);
  useEffect(()=>{fS();fW();const a=setInterval(fS,12e4),b=setInterval(fW,6e5);return()=>{clearInterval(a);clearInterval(b);};},[fS,fW]);

  // ── Extract Data ──
  const kp=sw?.kp?.slice(-9)||[],sc=sw?.scales||{},gS=sc["0"]?.G?.Scale||"0",sS=sc["0"]?.S?.Scale||"0",rS=sc["0"]?.R?.Scale||"0";
  const cur=wx?.current||{},dy=wx?.daily||{},wc=cur.weather_code??0,wi=WMO[wc]||{i:"❓",d:"Unknown"};
  const moon=getMoon(new Date());

  // ── Get local time label ──
  const getLocalLabel=()=>{const tz=userTz.split('/').pop().replace(/_/g,' ');return"LOCAL ("+tz.substring(0,10).toUpperCase()+")"};

  // ── Get field tz time ──
  const getFieldTzTime=()=>{if(!fieldTz)return"--:--:--";return utc.toLocaleTimeString("en-CA",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false,timeZone:fieldTz});};


  const linkStyle = {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 9px",borderRadius:5,textDecoration:"none",fontSize:12,color:B.text,background:"transparent",transition:"all .12s",border:"1px solid transparent"};
  const cardStyle = {background:`linear-gradient(135deg,${B.surface},${B.surfaceHi})`,border:`2px solid ${B.border}`,borderTopColor:B.bvL,borderLeftColor:B.bvL,borderBottomColor:B.bvD,borderRightColor:B.bvD,borderRadius:0,padding:16};
  const insetStyle = {background:B.inset,border:`2px solid ${B.border}`,borderTopColor:B.bvD,borderLeftColor:B.bvD,borderBottomColor:B.bvL,borderRightColor:B.bvL};

  function LinkCard({section}) {
    return (
      <div style={cardStyle}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <span style={{fontSize:14}}>{section.icon}</span>
          <h3 style={{margin:0,fontSize:13,fontWeight:700,color:section.color}}>{section.title}</h3>
        </div>
        <div style={{display:"grid",gap:2}}>
          {section.links.map(l=>(
            <a key={l.u} href={l.u} target="_blank" rel="noopener noreferrer" style={linkStyle}
              onMouseEnter={e=>{e.currentTarget.style.background=section.color+"10";e.currentTarget.style.borderColor=section.color+"28";e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";e.currentTarget.style.color=B.text;}}>
              <div><span>{l.n}</span>{l.d && <div style={{fontSize:10,color:B.textDim,marginTop:1}}>{l.d}</div>}</div><span style={{color:B.textDim,fontSize:11}}>{"\u2192"}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
  <div style={{minHeight:"100vh",background:B.bg,color:B.text,fontFamily:B.sans}}>
    <style>{`
      @keyframes spin-north {0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)}}
      @keyframes blink-cursor {0%,100%{opacity:1} 50%{opacity:0}}
      @keyframes pulse-ring {0%,100%{box-shadow:0 0 6px currentColor} 50%{box-shadow:0 0 24px currentColor}}
      .scanlines {pointer-events:none;position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(${theme==="dark"?"0,0,0":"100,100,100"},.03) 2px,rgba(${theme==="dark"?"0,0,0":"100,100,100"},.03) 4px);z-index:9999}
      .north-arrow-svg {animation:spin-north 12s linear infinite}
      .north-arrow-svg:hover {animation-duration:1.5s}
      .tagline::after {content:'_';animation:blink-cursor .6s step-end infinite;color:${B.priBr}}
      @media(max-width:768px){.cmd-hero{grid-template-columns:1fr !important}.cmd-split{grid-template-columns:1fr !important}}
      @media(max-width:480px){.header-inner{flex-direction:column;align-items:flex-start}}
      @media(max-width:768px){.cmd-stations{grid-template-columns:1fr 1fr !important;}}
      @media(max-width:480px){.cmd-stations{grid-template-columns:1fr !important;}}
      @media(max-width:768px){.prov-btns{overflow-x:auto;flex-wrap:nowrap !important;-webkit-overflow-scrolling:touch;}}
    `}</style>

    <div className="scanlines"/>
    <div style={{height:4,background:`linear-gradient(90deg,${B.pri},${B.sec},${B.gold},${B.acc},${B.priBr})`}}/>

    {/* ── Header ── */}
    <div style={{background:`linear-gradient(180deg,${B.headerGrad},${B.bg})`,borderBottom:`2px solid ${B.border}`,padding:"12px 24px"}}>
      <div className="header-inner" style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,background:`linear-gradient(135deg,${theme==="dark"?"#182020":B.surfaceHi},${B.surface})`,border:`2px solid ${B.borderHi}`,borderTopColor:B.bvL,borderLeftColor:B.bvL,borderBottomColor:B.bvD,borderRightColor:B.bvD,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="32" height="32" viewBox="0 0 44 44" fill="none" className="north-arrow-svg">
              <polygon points="22,6 28,30 22,25 16,30" fill={B.priBr} opacity="0.9"/>
              <polygon points="22,25 28,30 22,38 16,30" fill={B.sec} opacity="0.4"/>
              <circle cx="22" cy="22" r="2" fill="#fff"/>
            </svg>
          </div>
          <div>
            <h1 style={{margin:0,fontSize:20,fontWeight:900,color:B.text,letterSpacing:".15em",fontFamily:B.display,lineHeight:1}}>BCK<span style={{color:B.priBr}}>Geo</span></h1>
            <div style={{fontSize:10,color:B.textDim,marginTop:4,letterSpacing:".2em",fontFamily:B.font}} className="tagline">{typewriterText}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <button onClick={toggleTheme} title={theme==="dark"?"Switch to light mode":"Switch to dark mode"}
            style={{background:B.surface,border:`2px solid ${B.borderHi}`,borderTopColor:B.bvL,borderLeftColor:B.bvL,borderBottomColor:B.bvD,borderRightColor:B.bvD,width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,padding:0,color:B.text,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=B.pri;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=B.borderHi;e.currentTarget.style.borderTopColor=B.bvL;e.currentTarget.style.borderLeftColor=B.bvL;e.currentTarget.style.borderBottomColor=B.bvD;e.currentTarget.style.borderRightColor=B.bvD;}}>
            {theme==="dark"?"\u2600\uFE0F":"\uD83C\uDF19"}
          </button>
          <div style={{...insetStyle,padding:"4px 12px",textAlign:"center"}}>
            <div style={{fontSize:10,color:B.textDim,letterSpacing:2,fontFamily:B.font}}>ZULU</div>
            <div style={{fontSize:16,fontWeight:700,color:B.gold,fontFamily:B.font,letterSpacing:2,textShadow:`0 0 8px ${B.gold}44`}}>{utc.toISOString().substring(11,19)}Z</div>
          </div>
          <div style={{...insetStyle,padding:"4px 12px",textAlign:"center"}}>
            <div style={{fontSize:10,color:B.textDim,letterSpacing:2,fontFamily:B.font}}>LOCAL</div>
            <div style={{fontSize:16,fontWeight:700,color:B.text,fontFamily:B.font,letterSpacing:2}}>{utc.toLocaleTimeString("en-CA",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false,timeZone:userTz})}</div>
          </div>
          <div style={{...insetStyle,padding:"4px 12px",textAlign:"center",minWidth:120}}>
            <select value={fieldTz} onChange={e=>setFieldTz(e.target.value)} style={{fontFamily:B.font,fontSize:10,color:B.textDim,background:"transparent",border:"none",letterSpacing:1,cursor:"pointer",textAlign:"center",width:"100%",padding:0,outline:"none",WebkitAppearance:"none",appearance:"none"}}>
              <option value="">FIELD TZ</option>
              <option value="Pacific/Honolulu">HST (UTC-10)</option>
              <option value="America/Anchorage">AKST (UTC-9)</option>
              <option value="America/Los_Angeles">PST (UTC-8)</option>
              <option value="America/Denver">MST (UTC-7)</option>
              <option value="America/Chicago">CST (UTC-6)</option>
              <option value="America/New_York">EST (UTC-5)</option>
              <option value="America/Halifax">AST (UTC-4)</option>
              <option value="America/St_Johns">NST (UTC-3:30)</option>
              <option value="Europe/London">GMT (UTC+0)</option>
              <option value="Europe/Paris">CET (UTC+1)</option>
              <option value="Europe/Helsinki">EET (UTC+2)</option>
              <option value="Asia/Dubai">GST (UTC+4)</option>
              <option value="Asia/Kolkata">IST (UTC+5:30)</option>
              <option value="Asia/Tokyo">JST (UTC+9)</option>
              <option value="Australia/Sydney">AEST (UTC+10)</option>
              <option value="Pacific/Auckland">NZST (UTC+12)</option>
            </select>
            <div style={{fontSize:16,fontWeight:700,color:B.sec,fontFamily:B.font,letterSpacing:2}}>{getFieldTzTime()}</div>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:2,marginTop:10,flexWrap:"wrap"}}>
        {[{id:"command",l:"Command Centre",ic:"\uD83D\uDDA5\uFE0F"},{id:"flight",l:"Flight Ops",ic:"\u2708\uFE0F"},{id:"geodesy",l:"Geodesy",ic:"\uD83C\uDF0D"},{id:"spatial",l:"Spatial Ops",ic:"\uD83D\uDDFA\uFE0F"},{id:"recon",l:"Recon & Sensing",ic:"\uD83D\uDC41\uFE0F"},{id:"provincial",l:"Provincial Intel",ic:"\uD83C\uDFDB\uFE0F"},{id:"fieldkit",l:"Field Kit",ic:"\u2699\uFE0F"},{id:"calcs",l:"Quick Calcs",ic:"\u2797"},{id:"regs",l:"Regs & Standards",ic:"\uD83D\uDCDC"},{id:"codex",l:"Codex",ic:"\uD83D\uDD0E"},{id:"brief",l:"Mission Brief",ic:"\uD83D\uDCDD"}].map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);setSearch("");}}
            style={{background:tab===t.id?B.surface:"transparent",border:tab===t.id?`2px solid ${B.borderHi}`:"2px solid transparent",borderTopColor:tab===t.id?B.bvL:undefined,borderLeftColor:tab===t.id?B.bvL:undefined,borderBottomColor:tab===t.id?B.bvD:undefined,borderRightColor:tab===t.id?B.bvD:undefined,padding:"6px 14px",color:tab===t.id?B.text:B.textDim,fontSize:11,fontWeight:tab===t.id?700:500,cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontFamily:B.font,letterSpacing:".08em",transition:"all .1s"}}>
            <span style={{fontSize:12}}>{t.ic}</span>{t.l}
          </button>
        ))}
      </div>
    </div>

    {/* ── Main Content ── */}
    <div style={{padding:"14px 20px",maxWidth:1280,margin:"0 auto"}}>

      {/* COMMAND CENTRE */}
      {tab==="command"&&(
        <div>
          <div style={{background:`linear-gradient(135deg,${B.surface},${theme==="dark"?"#0d1520":"#eef1f5"})`,border:`2px solid ${B.border}`,borderLeft:`3px solid ${B.gold}`,padding:12,marginBottom:12,display:"flex",alignItems:"flex-start",gap:10}}>
            <span style={{fontSize:17,lineHeight:1}}>{"\u26A0\uFE0F"}</span>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:B.gold,marginBottom:3,fontFamily:B.font,letterSpacing:".04em"}}>GNSS & GEOMAGNETIC ADVISORY</div>
              <div style={{fontSize:11,color:B.textMid,lineHeight:1.5}}>Kp 5+ degrades GNSS accuracy, increases cycle slips, and extends PPP convergence. During G2+ events, extend observation sessions, use multi-constellation (GPS+GLONASS+Galileo), and verify ionospheric conditions. CSRS-PPP v5 with Galileo PPP-AR helps mitigate. Sustained southward Bz (&lt; -10 nT) drives the strongest geomagnetic responses.</div>
            </div>
          </div>

          <div className="cmd-hero" style={{display:"grid",gridTemplateColumns:"340px 1fr",gap:12,marginBottom:12,alignItems:"stretch"}}>
            {/* Weather */}
            <div style={{...cardStyle,display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span>{"\uD83C\uDF24\uFE0F"}</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:12,fontWeight:700,color:B.text}}>{locSource==="gps"?"\uD83D\uDCCD ":""}{cityName}</span>
                  <button onClick={requestLocation} style={{background:"none",border:`1px solid ${B.border}`,borderRadius:3,padding:"2px 6px",fontSize:10,color:B.textMid,cursor:"pointer",fontFamily:B.font}} title="Use my location">{locLoading?"\u23F3":"\uD83D\uDCCD"}</button>
                  {cityName!==DEFAULT_CITY&&<button onClick={resetLocation} style={{background:"none",border:"none",padding:0,fontSize:9,color:B.textDim,cursor:"pointer",fontFamily:B.font,textDecoration:"underline"}} title="Reset to default">reset</button>}
                </div>
                <span style={{fontSize:10,color:B.textDim,marginLeft:"auto"}}>Open-Meteo</span>
              </div>
              {wErr ? <div style={{color:"#ef4444",fontSize:12}}>Unable to load</div>
               : !wx ? <div style={{color:B.textMid,fontSize:12}}>Loading...</div>
               : (
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <span style={{fontSize:28}}>{wi.i}</span>
                    <div>
                      <div style={{fontSize:24,fontWeight:800,color:B.text,lineHeight:1}}>{Math.round(cur.temperature_2m)}°C</div>
                      <div style={{fontSize:10,color:B.textMid}}>{wi.d}</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 8px",marginBottom:10,fontSize:10,color:B.textMid}}>
                    <div>Wind <b style={{color:B.text}}>{Math.round(cur.wind_speed_10m)} km/h</b></div>
                    <div>Humidity <b style={{color:B.text}}>{cur.relative_humidity_2m}%</b></div>
                    <div>Pressure <b style={{color:B.text}}>{Math.round(cur.surface_pressure)} hPa</b></div>
                    <div>Precip <b style={{color:B.text}}>{cur.precipitation} mm</b></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3,flex:1}}>
                    {(dy.time||[]).slice(0,7).map((d,i)=>{
                      const dc=dy.weather_code?.[i]??0,di=WMO[dc]||{i:"\u2753",d:"?"};
                      return (
                        <div key={d} style={{...insetStyle,padding:"4px 3px",textAlign:"center"}}>
                          <div style={{fontSize:10,color:B.textDim,textTransform:"uppercase",marginBottom:1}}>{i===0?"Today":new Date(d+"T12:00:00").toLocaleDateString("en-CA",{weekday:"short"})}</div>
                          <div style={{fontSize:12,marginBottom:1}}>{di.i}</div>
                          <div style={{fontFamily:B.display,fontSize:11,color:B.text}}>{Math.round(dy.temperature_2m_max?.[i])}{"\u00B0"}</div>
                          <div style={{fontSize:10,color:B.textDim}}>{Math.round(dy.temperature_2m_min?.[i])}{"\u00B0"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* NOAA */}
            <div style={cardStyle}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span>{"\u2600\uFE0F"}</span>
                <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>NOAA Space Weather</h2>
              </div>
              {sErr ? <div style={{color:"#ef4444",fontSize:12}}>Unable to load</div>
               : !sw ? <div style={{color:B.textMid,fontSize:12}}>Loading...</div>
               : (
                <div>
                  <div style={{display:"flex",gap:24,marginBottom:14,justifyContent:"center"}}>
                    <GaugeRing level={`G${gS}`} label="Geomag"/>
                    <GaugeRing level={`S${sS}`} label="Solar Rad"/>
                    <GaugeRing level={`R${rS}`} label="Radio"/>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    {[{l:"SOLAR WIND",v:sw.wind?.WindSpeed||"--",u:"km/s"},{l:"MAG BT",v:sw.mag?.Bt||"--",u:"nT"},{l:"10.7CM FLUX",v:sw.flux?.Flux||"--",u:"sfu"}].map(x=>(
                      <div key={x.l} style={{flex:1,...insetStyle,padding:6,textAlign:"center"}}>
                        <div style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:2}}>{x.l}</div>
                        <div style={{fontFamily:B.display,fontSize:18,fontWeight:800,color:B.text,margin:"2px 0"}}>{x.v}</div>
                        <div style={{fontFamily:B.font,fontSize:10,color:B.textDim}}>{x.u}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kp Index */}
          <div style={{...cardStyle,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span>{"\uD83D\uDCCA"}</span>
              <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Kp Index</h2>
              <span style={{fontSize:10,color:B.textDim,marginLeft:"auto"}}>24h</span>
            </div>
            {(!sw||kp.length===0) ? <div style={{color:B.textMid,fontSize:12}}>Loading...</div> : (
              <div>
                <div style={{display:"flex",gap:2}}>
                  {kp.map((r,i)=>{
                    if(i===0||!Array.isArray(r))return null;
                    const v=parseFloat(r[1])||0;
                    return <KpCell key={i} val={v} time={r[0]?.substring(11,16)||""}/>;
                  })}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                  <div style={{fontFamily:B.font,fontSize:10,color:B.textDim}}>Kp 5+ degrades GNSS {"\u00B7"} Kp 7+ disrupts RTK</div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    {[{c:"#22c55e",l:"0-3"},{c:"#84cc16",l:"4"},{c:"#d4a017",l:"5-6"},{c:"#ef4444",l:"7+"}].map(x=>(
                      <div key={x.l} style={{display:"flex",alignItems:"center",gap:2}}>
                        <div style={{width:10,height:4,background:x.c,borderRadius:1}}/>
                        <span style={{fontFamily:B.font,fontSize:10,color:B.textDim}}>{x.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mag Dec + Stations */}
          <div className="cmd-split" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12,alignItems:"start"}}>
            <div style={cardStyle}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span>{"\uD83E\uDDED"}</span>
                <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Magnetic Declination</h2>
              </div>
              {(()=>{
                const m=calcMagDec(lat,lon),da=Math.abs(m.declination),dd=Math.floor(da),dm=Math.round((da-dd)*60);
                return (
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:26,fontWeight:800,color:"#f59e0b",fontFamily:B.font}}>{dd}{"\u00B0"} {dm}{"\u2032"} {m.declination>0?"E":"W"}</div>
                    <div style={{fontSize:11,color:B.textMid,marginTop:3}}>{cityName} ({Math.abs(lat).toFixed(2)}{"\u00B0"}{lat>=0?"N":"S"}, {Math.abs(lon).toFixed(2)}{"\u00B0"}{lon>=0?"E":"W"})</div>
                    <div style={{fontSize:10,color:B.textDim,marginTop:2}}>WMM2025 {"\u00B7"} {new Date().toLocaleDateString("en-CA")}</div>
                  </div>
                );
              })()}
            </div>
            <div>
              <div style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:2,marginBottom:8}}>STATIONS</div>
              <div className="cmd-stations" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[
                  {i:"✈️",t:"Flight Ops",d:"RPAS regs, NOTAMs, airspace",g:"flight"},
                  {i:"🌍",t:"Geodesy",d:"NRCan, CSRS-PPP, GNSS",g:"geodesy"},
                  {i:"🗺️",t:"Spatial Ops",d:"GIS tools, databases, CRS",g:"spatial"},
                  {i:"👁️",t:"Recon & Sensing",d:"Imagery, LiDAR, photogrammetry",g:"recon"},
                  {i:"🏛️",t:"Provincial Intel",d:"Open data by province",g:"provincial"},
                  {i:"⚙️",t:"Field Kit",d:"Coordinates, scale factors, mag dec",g:"fieldkit"},
                  {i:"➗",t:"Quick Calcs",d:"Unit, speed & temp conversions",g:"calcs"},
                  {i:"📜",t:"Regs & Standards",d:"Professional orgs, regulations",g:"regs"},
                  {i:"🔎",t:"Codex",d:"Terms & acronyms by domain",g:"codex"},
                ].map(s=>(
                  <div key={s.t} onClick={()=>setTab(s.g)}
                    style={{background:B.surface,border:`2px solid ${B.border}`,borderTopColor:B.bvL,borderLeftColor:B.bvL,borderBottomColor:B.bvD,borderRightColor:B.bvD,padding:"14px 16px",cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:12}}
                    onMouseEnter={e=>{e.currentTarget.style.background=B.surfaceHi;e.currentTarget.style.borderColor=B.pri;}}
                    onMouseLeave={e=>{e.currentTarget.style.background=B.surface;e.currentTarget.style.borderColor=B.border;}}>
                    <div style={{fontSize:22,width:36,textAlign:"center"}}>{s.i}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <h3 style={{fontFamily:B.font,fontSize:12,fontWeight:700,letterSpacing:".06em",margin:0,color:B.priBr}}>{s.t}</h3>
                      <p style={{fontSize:10,color:B.textDim,lineHeight:1.4,margin:"2px 0 0"}}>{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLIGHT OPS */}
      {tab==="flight"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {SECTIONS.filter(s=>s.title.includes("Transport Canada")||s.title.includes("NOTAMs")).map(s=>(
            <LinkCard key={s.title} section={s}/>
          ))}
        </div>
      )}

      {/* GEODESY */}
      {tab==="geodesy"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {SECTIONS.filter(s=>s.title.includes("NRCan")||s.title.includes("GNSS")).map(s=>(
            <LinkCard key={s.title} section={s}/>
          ))}
        </div>
      )}

      {/* SPATIAL OPS */}
      {tab==="spatial"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12}}>
          {SECTIONS.filter(s=>s.title==="Spatial Ops").map(s=>(
            <LinkCard key={s.title} section={s}/>
          ))}
        </div>
      )}

      {/* RECON & SENSING */}
      {tab==="recon"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12}}>
          {SECTIONS.filter(s=>s.title==="Recon & Sensing").map(s=>(
            <LinkCard key={s.title} section={s}/>
          ))}
        </div>
      )}

      {/* PROVINCIAL INTEL */}
      {tab==="provincial"&&(
        <div style={{...cardStyle,maxWidth:720}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:16}}>🏛️</span>
            <h2 style={{margin:0,fontSize:14,fontWeight:700,color:B.priBr}}>Provincial Intel</h2>
          </div>
          <ProvIntel initialProv="bc"/>
        </div>
      )}

      {/* FIELD TOOLS */}
      {tab==="fieldkit"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Full-width Coordinate Converter */}
          <div style={cardStyle}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span>{"\uD83D\uDCE1"}</span>
              <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Coordinate Converter</h2>
            </div>
            <CoordConverter initialLat={lat} initialLon={lon}/>
          </div>
          {/* Scale + MagPanel side by side (cmd-split collapses to 1 column at 768px) */}
          <div className="cmd-split" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={cardStyle}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span>{"\uD83D\uDCCF"}</span>
                <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Scale & Distance</h2>
              </div>
              <ScaleCalc initialLat={lat} initialLon={lon}/>
            </div>
            <div style={cardStyle}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span>{"\uD83E\uDDED"}</span>
                <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Magnetic Declination</h2>
              </div>
              <MagPanel initialLat={lat} initialLon={lon}/>
            </div>
          </div>
          {/* Disclaimer */}
          <div style={{background:"#3b82f610",border:"1px solid #3b82f620",borderRadius:5,padding:"6px 8px",fontSize:10,color:B.textDim,lineHeight:1.5}}>
            Reference tool only {"\u2014"} not for legal survey or navigation use. For official work, use{" "}
            <a href="https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/trx.php" target="_blank" rel="noopener noreferrer" style={{color:"#3b82f6",textDecoration:"underline"}}>NRCan TRX</a>
            {" "}and{" "}
            <a href="https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/gpsh.php" target="_blank" rel="noopener noreferrer" style={{color:"#3b82f6",textDecoration:"underline"}}>GPS{"\u00B7"}H</a>.
            {" "}Projections computed on NAD83(CSRS), GRS80 ellipsoid. Heights reference CGVD2013.
          </div>
        </div>
      )}

      {/* CALCULATOR */}
      {tab==="calcs"&&<CalcPanel/>}

      {/* REGS & STANDARDS */}
      {tab==="regs"&&(
        <div style={{...cardStyle,maxWidth:580}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span>📜</span>
            <h3 style={{margin:0,fontSize:13,fontWeight:700,color:B.sec}}>Regs & Standards</h3>
          </div>
          <div style={{display:"grid",gap:2}}>
            {(SECTIONS.find(s=>s.title==="Regs & Standards")?.links||[]).map(l=>(
              <a key={l.u} href={l.u} target="_blank" rel="noopener noreferrer"
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",textDecoration:"none",color:B.text,fontSize:12,background:"transparent",transition:"all .12s",border:"1px solid transparent",borderRadius:5}}
                onMouseEnter={e=>{e.currentTarget.style.background=B.surface;e.currentTarget.style.borderColor=B.borderHi;e.currentTarget.style.color="#fff";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";e.currentTarget.style.color=B.text;}}>
                <div><span>{l.n}</span>{l.d && <div style={{fontSize:10,color:B.textDim,marginTop:1}}>{l.d}</div>}</div><span style={{color:B.textDim,fontSize:11}}>{"\u2192"}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* GLOSSARY */}
      {tab==="codex"&&(
        <div>
          {Object.entries(GLOSSARY).map(([section,terms])=>(
            <div key={section} style={{marginBottom:18}}>
              <div style={{fontFamily:B.font,fontSize:11,fontWeight:700,letterSpacing:".1em",padding:"6px 12px",marginBottom:8,borderBottom:`2px solid ${B.border}`}}>{section}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))",gap:"4px 16px"}}>
                {terms.map(t=>(
                  <dl key={t.dt} style={{display:"flex",gap:10,padding:"6px 12px",fontSize:11,border:"1px solid transparent",transition:"border-color .12s",borderRadius:4}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=B.border;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="transparent";}}>
                    <dt style={{fontFamily:B.font,fontWeight:700,color:B.text,whiteSpace:"nowrap",minWidth:110,flexShrink:0}}>{t.dt}</dt>
                    <dd style={{color:B.textMid,lineHeight:1.4,margin:0}}>{t.dd}</dd>
                  </dl>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ABOUT */}
      {tab==="brief"&&(
        <div style={{maxWidth:720}}>
          <div style={{...cardStyle,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <span>{"\u24D8"}</span>
              <h2 style={{margin:0,fontSize:14,fontWeight:700,color:B.priBr}}>Mission Brief</h2>
            </div>
            <div style={{fontSize:12,color:B.text,lineHeight:1.7}}>
              <p style={{marginBottom:12}}><b style={{color:B.text}}>BCKGeo</b> is a geomatics operations dashboard built for Canadian survey, mapping, and remote sensing professionals. It consolidates the tools, data feeds, and reference material that a working geomatics technologist needs into a single command centre — covering all 13 provinces and territories.</p>
              <p style={{marginBottom:12}}>The Command Centre aggregates real-time space weather data from <b style={{color:B.text}}>NOAA SWPC</b> (G/S/R scales, Kp index, solar wind) because geomagnetic conditions directly affect GNSS accuracy, RTK reliability, and PPP convergence times. Local weather is pulled from <b style={{color:B.text}}>Open-Meteo</b>. Magnetic declination is computed from the <b style={{color:B.text}}>World Magnetic Model 2025</b> (WMM2025), valid 2025–2030.</p>
              <p style={{marginBottom:12}}>Tabs are organized by operational domain: <b style={{color:B.text}}>Flight Ops</b> (Transport Canada RPAS regulations, NOTAMs, airspace), <b style={{color:B.text}}>Geodesy</b> (NRCan CSRS-PPP, TRX, GNSS tools), <b style={{color:B.text}}>Spatial Ops</b> (GIS platforms, CRS tools, open data), <b style={{color:B.text}}>Recon & Sensing</b> (satellite imagery, LiDAR, photogrammetry), <b style={{color:B.text}}>Provincial Intel</b> (geospatial data portals for every Canadian jurisdiction), <b style={{color:B.text}}>Field Kit</b> (coordinate converter, scale calculator, magnetic declination), and <b style={{color:B.text}}>Quick Calcs</b> (unit conversions). The <b style={{color:B.text}}>Codex</b> provides definitions for 60+ domain-specific terms organized by discipline.</p>
              <p style={{marginBottom:0,color:B.textMid}}>Privacy: no tracking, no analytics, no cookies. Geolocation is opt-in only — your position is never stored server-side. Weather and reverse geocoding requests go directly to Open-Meteo and BigDataCloud from your browser.</p>
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span>{"\uD83D\uDCE1"}</span>
              <h3 style={{margin:0,fontSize:13,fontWeight:700,color:B.sec}}>Data Sources</h3>
            </div>
            <div style={{display:"grid",gap:2}}>
              {[{n:"NOAA SWPC",u:"https://www.swpc.noaa.gov/",d:"Space weather scales, Kp index, solar wind"},{n:"Open-Meteo",u:"https://open-meteo.com/",d:"Local weather forecasts & conditions"},{n:"WMM2025",u:"https://www.ncei.noaa.gov/products/world-magnetic-model",d:"Magnetic declination model (2025–2030)"},{n:"BigDataCloud",u:"https://www.bigdatacloud.com/",d:"Reverse geocoding (browser-side only)"}].map(l=>(
                <a key={l.u} href={l.u} target="_blank" rel="noopener noreferrer"
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",textDecoration:"none",color:B.text,fontSize:12,background:"transparent",transition:"all .12s",border:"1px solid transparent",borderRadius:5}}
                  onMouseEnter={e=>{e.currentTarget.style.background=B.surface;e.currentTarget.style.borderColor=B.borderHi;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}>
                  <div>
                    <div style={{fontWeight:600}}>{l.n}</div>
                    <div style={{fontSize:10,color:B.textMid,marginTop:1}}>{l.d}</div>
                  </div>
                  <span style={{color:B.textDim,fontSize:11}}>{"\u2192"}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>

    {/* Footer */}
    <div style={{borderTop:`2px solid ${B.border}`,padding:"10px 24px",marginTop:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <span style={{fontSize:11,fontWeight:700,color:B.pri,fontFamily:B.display,letterSpacing:".1em"}}>BCKGeo</span>
        <div style={{fontSize:10,color:B.textDim,fontFamily:B.font}}>Weather: Open-Meteo {"\u00B7"} Space Wx: NOAA SWPC {"\u00B7"} Mag Dec: WMM2025</div>
      </div>
      <div style={{height:3,background:`linear-gradient(90deg,${B.pri},${B.sec},${B.gold},${B.acc},${B.priBr})`,marginTop:8}}/>
    </div>

  </div>
  );
}
