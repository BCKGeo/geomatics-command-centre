# Direction: what the Command Centre is for

Date: 2026-10-31
Status: agreed by Ben on 2026-10-31. Anything built for the dashboard from here follows this record until he revises it.
Tier: 1 (decision record)

## Purpose

A free, fast, national reference and field tool for Canadian geomatics: the one place a surveyor, RPAS pilot, GIS tech or student goes to find a condition, a portal, a rule or a number in under a minute. No one else does this for Canada. It is also the public face of BCKGeo and the base that any paid product grows from.

## Audience

In order of who the free core serves first:

1. Working surveyors and survey technologists across Canada (the current audience).
2. RPAS pilots of all kinds. Flight Ops is their front door.
3. GIS and municipal staff who need portals, standards and news, not field conditions.
4. Students and the public, served mainly by the learning surface, not by the field tabs.

"Nationally" means equal depth for all 13 jurisdictions plus federal, reached in phases (see Curation), and reputation across the country, not just BC.

## What Ben wants from it

All four, in this order of what decisions should favour today: reputation, a tool he uses and enjoys building, a BCKGeo marketing surface, income. Income matters, and the long idea is a BCKGeo product business that could one day replace the city job, but Ben has not set that goal yet and does not want decisions forced by it now.

## Privacy stance

Was absolute (no tracking, no cookies, no analytics, no accounts, client-side only). Decision: the free core keeps that in full. Anything paid may require an account. Any change to the free core's stance (for example cookieless visitor counts) waits for the market research and gets an honest sentence in the Mission Brief and Terms when it happens.

## Money: deferred, with a starter

Decision: no ads of any kind now. Add a donation link (GitHub Sponsors or similar) as the only immediate step. Sponsorship by vendors, dealers and associations, and a paid product beside the free core, are both live options that Ben is willing to do the work for. Both wait on market research: audience size from Tier A sources, comparable sites, and what reach can be proven without tracking.

Options considered and their cost to the stance:

| Option | Needs | Cost to the stance | Verdict |
|---|---|---|---|
| Display ads | third-party ad script | breaks it; those networks profile visitors | no |
| Privacy-respecting ads | one contextual script | mostly keeps it; acceptance for this niche unverified | not now |
| Sponsorship | a static sponsor block and disclosure | keeps it | pursue after research |
| Donations | a link | keeps it | do now |
| Paid product or pro tier | accounts, payments, backend, support | breaks "no accounts" for paying users only | pursue after research |
| Free as BCKGeo marketing | nothing | keeps it | already true, stays true |

Unverified: every number about audience size, ad rates, sponsorship rates and analytics vendor terms. None are stated here on purpose.

## Ranked ideas

1. Quick lookup. One search box across jurisdictions, codex, tools and feeds, keyboard first, two taps on mobile. Fits every audience, displaces nothing, makes everything else findable. Build first.
2. Field Safety (was "health"). UV, Air Quality Health Index and smoke, heat and cold, daylight, working alone, WorkSafe links per province. Extends the Command Centre weather. Open-Meteo already serves UV and air quality (their docs, Tier B). Build second. Personal health tracking is rejected: off-audience, conflicts with no data collection.
3. Career area (was "self-improvement"). CPD hour log kept in the browser with export, certification pathways (AScT, BCLS, CLS, RPAS Advanced), reading list, News Wire. Fits the core audience. Ben also means something broader than professional development that he cannot yet name; that part stays open. Build third.
4. Learning surface, RPAS exam prep first (was "game"). Its own route or subdomain sharing the dashboard data, not a tenth tab. Transport Canada Basic and Advanced exams exist (Transport Canada, Tier A); the size of the market for prep is unverified. Strongest paid-product candidate. "Addictive" is read as sticky and well designed, never dark patterns, which would break the brand. Build after 1 to 3, or earlier if the market research says the market is there.
5. Donation link. Do now, trivial.
6. Curation to equal depth. Not a feature. Phased: national and federal content excellent first; Ben curates the provinces he knows himself; a public contribution path (issue and PR templates, one data file per province, which already exists in src/data/jurisdictions) and outreach to each provincial association for the rest. The outreach doubles as the sponsorship conversation.

## Rejected

- Ads with tracking.
- Personal health tracking.
- Generic self-help content.
- A paywall on anything that is free today.
- Solo hand-curation of all 13 provinces as the only route.

## Open questions

1. Market research before any money decision (audience size, comparables, cookieless analytics terms). Separate task.
2. Whether to add cookieless visitor counts to the free core. Decide with the research.
3. What the broader "self-improvement" idea is beyond professional development.
4. Who builds and maintains the exam prep content, and how often Transport Canada changes the exams.
5. Whether the learning surface is a subdomain (learn.bckgeo.ca) or a route, which decides the hosting and code split.
