// Field Safety bands and thresholds. Pure functions, tested in fieldSafety.test.js.
//
// Every band that changes what a field crew does is cited to a Tier A page
// (ECCC, Health Canada, CCME, WorkSafeBC, CCOHS) with the date the page was
// read. The same list is shown under the card as its source line. Anything
// not on a cited page is marked "unverified" here and in the UI.

export const SOURCES = [
  { n: "ECCC UV index", u: "https://www.canada.ca/en/environment-climate-change/services/weather-health/uv-index-sun-safety/about.html", read: "2026-10-31" },
  { n: "ECCC AQHI", u: "https://www.canada.ca/en/environment-climate-change/services/air-quality-health-index/about.html", read: "2026-10-31" },
  { n: "CCME CAAQS PM2.5", u: "https://ccme.ca/en/air-quality-report", read: "2026-10-31" },
  { n: "ECCC humidex", u: "https://www.canada.ca/en/services/environment/weather/severeweather/humidex.html", read: "2026-10-31" },
  { n: "ECCC wind chill", u: "https://www.canada.ca/en/services/environment/weather/severeweather/wind-chill-index.html", read: "2026-10-31" },
  { n: "WorkSafeBC OHSR 4.20.1 to 4.23", u: "https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-04-general-conditions", read: "2026-10-31" },
  { n: "CCOHS working alone", u: "https://www.ccohs.ca/oshanswers/hsprograms/alone/workingalone.html", read: "2026-10-31" },
];

// Band colours shared by every scale: green, yellow, orange, red, dark red.
const C = ["#22c55e", "#eab308", "#f97316", "#ef4444", "#b91c1c"];

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

// UV index bands and advice. ECCC "About the UV index", read 2026-10-31
// (page details 2026-04-20). Ranges: Low 0 to 2, Moderate 3 to 5, High 6 to 7,
// Very High 8 to 10, Extreme 11+. ECCC publishes the index rounded to a whole
// number, so the value is rounded before banding.
export function uvBand(uv) {
  const v = num(uv);
  if (v == null || v < 0) return null;
  const r = Math.round(v);
  if (r <= 2) return { label: "Low", color: C[0], advice: "UV-protective sunglasses. Cover skin and use sunscreen if outside over an hour on bright snowy days." };
  if (r <= 5) return { label: "Moderate", color: C[1], advice: "Hat that shades face and ears, tightly woven clothing, sunscreen on bare skin. Seek shade near midday." };
  if (r <= 7) return { label: "High", color: C[2], advice: "Hat that shades face and ears, tightly woven clothing, sunscreen on bare skin. Seek shade near midday." };
  if (r <= 10) return { label: "Very High", color: C[3], advice: "Limit sun between 11:00 and 15:00. Sunglasses, shade, reapply sunscreen every 2 hours or after heavy sweating." };
  return { label: "Extreme", color: C[4], advice: "Limit sun between 11:00 and 15:00. Sunglasses, shade, reapply sunscreen every 2 hours or after heavy sweating." };
}

// AQHI bands and the general population message. ECCC "About the AQHI",
// read 2026-10-31 (page details 2026-10-14). Low 1 to 3, Moderate 4 to 6,
// High 7 to 10, Very High 10+ (reported as "10+"). Field crews doing
// strenuous work follow the general population line; the at-risk line is
// shown for those who need it. ECCC reports whole numbers, so round first.
export function aqhiBand(aqhi) {
  const v = num(aqhi);
  if (v == null || v < 1) return null;
  const r = Math.round(v);
  if (r <= 3) return { label: "Low Risk", color: C[0], general: "Ideal for usual outdoor activities.", atRisk: "Enjoy usual outdoor activities." };
  if (r <= 6) return { label: "Moderate Risk", color: C[1], general: "Continue usual outdoor activities unless you have symptoms such as coughing or throat irritation.", atRisk: "Consider reducing or rescheduling strenuous outdoor activities if you have symptoms." };
  if (r <= 10) return { label: "High Risk", color: C[3], general: "Consider reducing or rescheduling strenuous outdoor activities if you have symptoms such as coughing or throat irritation.", atRisk: "Reduce or reschedule strenuous outdoor activities." };
  return { label: "Very High Risk", color: C[4], general: "Reduce or reschedule strenuous outdoor activities, especially if you have symptoms.", atRisk: "Avoid strenuous activities outdoors." };
}

// PM2.5 against the Canadian Ambient Air Quality Standards (CCME, 2020
// standard, read 2026-10-31): 24-hour 27 ug/m3, annual 8.8 ug/m3. CAAQS has
// no short-term bands, so this is a single comparison against the 24-hour
// standard, with the annual value shown for context. Open-Meteo PM2.5 is an
// hourly model value, not a 24-hour mean, so the comparison is indicative.
export const PM25_CAAQS_24H = 27;
export const PM25_CAAQS_ANNUAL = 8.8;
export function pm25Band(pm) {
  const v = num(pm);
  if (v == null || v < 0) return null;
  if (v <= PM25_CAAQS_ANNUAL) return { label: "Clear", color: C[0], note: "Below the CAAQS annual standard (8.8)" };
  if (v <= PM25_CAAQS_24H) return { label: "Within standard", color: C[1], note: "Below the CAAQS 24-hour standard (27)" };
  return { label: "Above standard", color: C[3], note: "Above the CAAQS 24-hour standard (27). Smoke likely: check the AQHI line and reduce exertion." };
}

// Humidex. Formula is ECCC's (Masterton and Richardson 1979), standard form:
// H = T + 0.5555 (e - 10), e = 6.11 exp(5417.7530 (1/273.16 - 1/Td)), Td in
// kelvin. The cited humidex page shows only the table, not the formula, so the
// formula itself is unverified against that page; the bands are verbatim.
// ECCC only reports humidex when it is at least 25 and above the air temperature.
export function humidex(tC, dewC) {
  const t = num(tC), d = num(dewC);
  if (t == null || d == null) return null;
  const e = 6.11 * Math.exp(5417.753 * (1 / 273.16 - 1 / (d + 273.15)));
  const h = t + 0.5555 * (e - 10);
  return h > t ? h : t;
}

// Humidex bands, ECCC "Humidity and the humidex", read 2026-10-31 (page
// details 2026-05-13): 20 to 29 little discomfort, 30 to 39 some discomfort,
// 40 to 45 great discomfort avoid exertion, 46 and over dangerous, heat stroke
// possible. Below 20 is not banded by ECCC.
export function humidexBand(h) {
  const v = num(h);
  if (v == null) return null;
  const r = Math.round(v);
  if (r < 20) return { label: "No heat stress", color: C[0], advice: "Humidex below the ECCC comfort scale." };
  if (r <= 29) return { label: "Little discomfort", color: C[0], advice: "Normal work. Keep water on hand." };
  if (r <= 39) return { label: "Some discomfort", color: C[1], advice: "Drink water often, take breaks in shade, watch for heat exhaustion." };
  if (r <= 45) return { label: "Great discomfort", color: C[2], advice: "Avoid exertion. Shorten work periods, rest in shade, watch each other." };
  return { label: "Dangerous", color: C[4], advice: "Heat stroke possible. Stop strenuous outdoor work." };
}

// Wind chill. Formula is the 2001 index Canada and the US adopted (JAG/TI):
// W = 13.12 + 0.6215 T - 11.37 V^0.16 + 0.3965 T V^0.16, T in C, V in km/h
// at 10 m, valid for T <= 10 C and V >= 4.8 km/h. The cited ECCC page shows
// a calculator and a worked example, not the formula, so the formula is
// unverified against that page; the bands are from the page.
export function windChill(tC, windKmh) {
  const t = num(tC), v = num(windKmh);
  if (t == null || v == null) return null;
  if (t > 10 || v < 4.8) return null;
  const p = Math.pow(v, 0.16);
  return 13.12 + 0.6215 * t - 11.37 * p + 0.3965 * t * p;
}

// Wind chill bands, ECCC "Wind chill index", read 2026-10-31 (page details
// 2025-12-16): 0 to -9 low, -10 to -27 moderate, -28 to -39 high (skin freezes
// in 10 to 30 min), -40 to -47 very high (5 to 10 min), -48 to -54 severe
// (2 to 5 min), -55 and colder extreme (under 2 min). ECCC rounds to whole
// numbers, so round before banding. Above 0 there is no wind chill band.
export function windChillBand(w) {
  const v = num(w);
  if (v == null) return null;
  const r = Math.round(v);
  if (r > 0) return null;
  if (r >= -9) return { label: "Low", color: C[0], advice: "Slight increase in discomfort. Dress for the weather." };
  if (r >= -27) return { label: "Moderate", color: C[1], advice: "Frostbite possible with long exposure. Hypothermia risk if outside long without protection." };
  if (r >= -39) return { label: "High", color: C[2], advice: "Exposed skin can freeze in 10 to 30 min. Check face and extremities for numbness or whiteness." };
  if (r >= -47) return { label: "Very High", color: C[3], advice: "Exposed skin can freeze in 5 to 10 min. Check face and extremities for numbness or whiteness." };
  if (r >= -54) return { label: "Severe", color: C[4], advice: "Exposed skin can freeze in 2 to 5 min. Check face and extremities often." };
  return { label: "Extreme", color: C[4], advice: "Exposed skin can freeze in under 2 min. Outdoor conditions are hazardous." };
}

// Working alone checklist. The duties are WorkSafeBC OHS Regulation 4.20.1 to
// 4.23 (BC law, read 2026-10-31); the practical items are CCOHS "Working
// alone" (read 2026-10-31, fact sheet revised 2025-07-31). Other provinces
// have their own rule; the WORKSAFE list below links each one. Nothing here is
// stored or timed: the check-in interval is the crew's own plan.
export const WORKING_ALONE = [
  { t: "Written check-in procedure", d: "Interval between checks, who makes them, and what happens if the worker cannot be reached (OHSR 4.21). Shorter intervals for higher-risk work, and a check at the end of the shift." },
  { t: "Daily work plan with the contact", d: "Where you will be and when, route, vehicle, expected return, and an alternate plan for weather." },
  { t: "Communication that works on site", d: "Charged phone. Where cell service is poor: two-way radio, satellite messenger or InReach, with a test before leaving the truck." },
  { t: "Hazards identified before the shift", d: "Traffic, terrain, water, wildlife, remote access, weather (OHSR 4.20.2). Eliminate or minimize before starting." },
  { t: "Emergency plan if a check-in is missed", d: "The contact knows when and how to start it. Agree a code word that means help is needed." },
  { t: "Nearest hospital and access point", d: "Look it up for the site before you go. This dashboard does not look it up for you." },
];

// The regulator links per jurisdiction live in src/data/jurisdictions/<id>.js
// under the "Workplace Safety" category, so the lookup and the Jurisdictions
// page share one copy. workSafeLinks() pulls them for the card.
export function workSafeLinks(provinces) {
  const out = [];
  for (const p of provinces || []) {
    const c = (p.categories || []).find((x) => x.category === "Workplace Safety");
    for (const l of c?.links || []) out.push({ id: p.id, abbr: p.abbr, ...l });
  }
  return out;
}

// Usable field hours: civil dawn to civil dusk. Returns hours or null when
// there is no civil twilight crossing (polar day or night).
export function usableHours(civilDawn, civilDusk) {
  if (!(civilDawn instanceof Date) || !(civilDusk instanceof Date)) return null;
  const h = (civilDusk - civilDawn) / 36e5;
  return h > 0 ? h : null;
}

export function fmtHours(h) {
  if (h == null) return "--";
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return mm === 60 ? `${hh + 1}h 00m` : `${hh}h ${String(mm).padStart(2, "0")}m`;
}
