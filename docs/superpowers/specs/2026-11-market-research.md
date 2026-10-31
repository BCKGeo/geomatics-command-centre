# Market research memo: audience, comparables, analytics, ad networks

Date: 2026-10-31
Status: for Ben to read before any sponsorship or paid product decision. Follows `2026-10-31-direction.md`.
Tier: 2 (deliverable). Every number carries its source tier. Anything not traced to a Tier A source is marked unverified.

## 1. Audience size in Canada

| Group | Count | As of | Source, tier |
|---|---|---|---|
| Land surveyors, NOC 21203, employed | 5,600 (33% aged 50+) | 2025 | ESDC COPS [S1], A |
| Geomatics technical occupations, NOC 22214, employed | 5,600 (25% aged 50+) | 2025 | ESDC COPS [S2], A |
| Land surveyors in BC | 1,050 | 2021 Census | WorkBC [S3], A |
| Geomatics technical in BC | 1,740 | 2021 Census | WorkBC [S4], A |
| Basic RPAS pilot certificates issued (cumulative) | 141,956 | 2026-08-13 | Transport Canada [S5], A |
| Advanced RPAS pilot certificates issued (cumulative) | 23,427 | 2026-08-13 | Transport Canada [S5], A |
| Level 1 Complex certificates; active RPOCs | 709; 615 | 2026-08-13 | Transport Canada [S5], A |
| Basic; Advanced certificates (earlier snapshot) | 115,235; 16,338 | 2025-03-06 | Transport Canada [S6], A |
| ACLS members (all classes); licence holders | 595; 286 | 2024 | ACLS AGM report [S7], A |
| ABCLS members; practising; in training | 714; 344; 120 | 2023 | ABCLS regulatory report [S8], A |
| AOLS members | 498 | 2023 | AOLS fair registration report [S9], A |
| ASTTBC registrants (all disciplines) | 5,295 | undated page | ASTTBC [S10], A |

Notes. Both COPS pages print 5,600; each was read twice. No national 2021 Census unit-group count was found in this session, so COPS is the national figure. Transport Canada counts are certificates ever issued, not active pilots. Derived from S5 and S6: about 26,700 Basic and 7,100 Advanced certificates were issued over 17 months, roughly 18,800 and 5,000 a year. Pass rates and exam attempt counts: not published, unverified. ALSA publishes a name register but no total was found; a 248 figure seen in an undated proceedings excerpt is unverified. ASTTBC does not publish a geomatics share. Other provincial associations were not reached in this session.

## 2. Comparable sites and exam prep products

| Product or site | What it carries or charges | Source, tier |
|---|---|---|
| Coastal Drone (Canada) | Basic Online Bundle CAD 99.75; Advanced Online Bundle CAD 397.95 | vendor page [S11], A |
| RPAS Centre (Canada) | Basic and Advanced prep free; Level 1 Complex 99; flight review from 199 | search snippet only, site returned 403, unverified |
| Pilot Institute (US, Part 107) | listed 249, sale 159, lifetime access; claims 158,469+ students | vendor page [S12], A for price, claim self-reported |
| Drone Pilot Ground School (US) | listed 299, sale 159; claims 80,000+ students | vendor page [S13], A for price, claim self-reported |
| GoGeomatics (Canada) | press release CAD 225; event listing CAD 675; banner and job ads unpriced; claims 5,000+ list, 5K+ newsletter | vendor page [S14], A for prices, audience self-reported |
| GoGeomatics Expo sponsorship | Silver CAD 5,500; Gold CAD 10,500 | search snippet of 2025 package, unverified |
| xyHt (US magazine) | contact for pricing; sponsored posts | vendor page via search [S15], B |
| canadiangis.com | no ads or sponsor wording on the home page | fetched 2026-10-31, B |

Reading. Canadian RPAS prep sells at CAD 100 to 400 per certificate level, with a free competitor already in the market. US products anchor at USD 159 on sale. Nobody in the Canadian geomatics reference space publishes a rate card for site sponsorship; the only published prices are event sponsorships and listings.

## 3. Cookieless analytics, vendors' own words

| Vendor | Cookies and storage | Visitor identification | Price |
|---|---|---|---|
| Cloudflare Web Analytics [S16], A | "does not use any client-side state, such as cookies or localStorage" | "we also don't fingerprint individuals via their IP address, User Agent string" | free |
| Plausible [S17], [S18], A | "We do not use cookies, browser cache or local storage" | hash(daily_salt + domain + ip + user_agent); "salt is rotated and deleted every 24 hours"; raw IP and UA never stored | Starter USD 9/month, 10k pageviews, 30-day trial |
| Fathom [S19], [S20], A | no cookies, no consent banner for analytics | SHA-256 of IP, user agent, hostname and a daily salt, rotating at midnight UTC; says it does not rely on fingerprinting | USD 15/month to 100k pageviews, 7-day trial, card required |

Reading. Plausible and Fathom hash IP and user agent transiently, which is a daily-rotating identifier rather than tracking across days. Cloudflare is the only one whose own page denies using IP and user agent at all. All three need one script tag on the free core, so the stance sentence in the Mission Brief would have to change.

## 4. Privacy-respecting ad networks

Neither vendor site could be fetched from this session (DNS blocked for the fetch tool and the browser pane). Quotes below come from the vendors' own FAQ pages as indexed by search, so they are vendor text but not re-read on the live page.

- EthicalAds [S21]: "Your site needs at least 50,000 pageviews per month"; developer-focused sites; about USD 2.50 per 1,000 pageviews; one ad per page, above the fold; monthly payout, USD 50 minimum. A 70% publisher share appears only on third-party pages, unverified.
- Carbon [S22]: by invitation; reviews ad relevance to a design or developer audience, monthly pageviews, active maintenance, network capacity and placement rules. No published traffic minimum; the 10,000 pageview figure on blogs is unverified.

Reading. Both networks sell to developer and design audiences. A geomatics field tool is outside that fit, and the dashboard has no proven traffic figure yet, so acceptance is unlikely and unverified either way.

## Sources

- S1 ESDC COPS, Land surveyors (NOC 21203): https://occupations.esdc.gc.ca/sppc-cops/occupationsummarydetail.jsp?tid=82
- S2 ESDC COPS, Technical occupations in geomatics and meteorology (NOC 22214): https://occupations.esdc.gc.ca/sppc-cops/occupationsummarydetail.jsp?tid=117
- S3 WorkBC, Land surveyors: https://www.workbc.ca/career-profiles/land-surveyors
- S4 WorkBC, Technical occupations in geomatics and meteorology: https://www.workbc.ca/career-profiles/technical-occupations-geomatics-and-meteorology
- S5 Transport Canada, Drone Zone Issue 10, August 2026: https://tc.canada.ca/en/aviation/drone-safety/drone-zone/drone-zone-issue-10-august-2026
- S6 Transport Canada, Drone Zone Issue 1, February 2025: https://tc.canada.ca/en/aviation/drone-safety/drone-zone/drone-zone-issue-1-february-2025
- S7 ACLS AGM report (Registrar report, ACLS Numbers table, 2017 to 2024): https://www.acls-aatc.ca/global/gene/link.php?doc_id=124&edit_lang=en
- S8 ABCLS Annual Regulatory Report 2023 (Membership page): https://drive.tiny.cloud/1/y7w67ppfwagdbcyiynwi83m3c0nky12xlpmpkwbrhv0jeps3/5dd6c430-ce20-4fa6-962a-53145274759a
- S9 AOLS 2023 Fair Registration Practices Report, section 7D: https://www.aols.org/site_files/content/pages/resources/reports/farpa/aols2023frp.pdf
- S10 ASTTBC registrant disciplines page: https://asttbc.org/registrants/registrant-disciplines/
- S11 Coastal Drone course catalogue: https://learn.coastaldrone.co/
- S12 Pilot Institute Part 107 course: https://pilotinstitute.com/course/part-107-remote-pilot/
- S13 Drone Pilot Ground School pricing: https://www.dronepilotgroundschool.com/get-started-pricing/
- S14 GoGeomatics advertising: https://gogeomatics.ca/advertising/
- S15 xyHt advertising: https://xyht.com/?p=4249
- S16 Cloudflare Web Analytics: https://www.cloudflare.com/web-analytics/
- S17 Plausible data policy: https://plausible.io/data-policy
- S18 Plausible pricing: https://plausible.io/#pricing
- S19 Fathom cookieless analytics: https://usefathom.com/why-fathom-analytics/cookieless-analytics
- S20 Fathom pricing: https://usefathom.com/pricing
- S21 EthicalAds publisher FAQ: https://www.ethicalads.io/publishers/faq/
- S22 Carbon FAQ: https://www.carbonads.net/faq
- Transport Canada licensing statistics by province (certificates issued per year, no Basic and Advanced split, 2025 partial year): https://tc.canada.ca/en/aviation/licensing-pilots-personnel/aviation-personnel-licensing-statistics
