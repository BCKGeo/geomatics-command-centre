# Content pilot: real field footage, AI production, a non-geospatial audience

Date: 2026-10-31
Status: draft for Ben's approval. Nothing is produced or posted until he agrees. Follows `2026-10-31-direction.md` and `2026-11-market-research.md`.
Tier: 2 (deliverable). Every platform rule below is traced to the platform's own page, read on 2026-10-31, or marked unverified. Every piece that is later posted is Tier 3: Ben does the final step himself, nothing is posted by Claude, and no Qwen output goes out unreviewed.

## 1. Question the pilot answers

Can real field material (drone footage, terrestrial scans, open LiDAR) with AI doing the production grind reach people outside geomatics and move some of them to the dashboard or BCKGeo? One month, five pieces, four platforms, one landing page, one counter. Views are not the goal. Arrivals at the landing page and second clicks into the dashboard or BCKGeo are.

Decisions Ben made on 2026-10-31 that this spec rests on:

- Platforms: YouTube Shorts, TikTok, Instagram Reels, LinkedIn. One vertical master per piece, posted to all four, measured per platform.
- Brand and accounts: BCKGeo.
- Landing: a new plain-language `/start` page on dashboard.bckgeo.ca.
- Voice: a mix of Ben's own recorded voice, disclosed text-to-speech, and captions only.
- Cleared sources: NAS scenic and personal flights; property and client jobs, each still needing a per-job yes before its piece is cut; LidarBC open data for the city. The Mr. PG scan was not selected and stays out.
- Counting: posts link to `dashboard.bckgeo.ca/go/<slug>`; a Pages Function counts the click without storing IP, cookie or user agent, then redirects to `/start`. Cross-checked against each platform's own link-click insight.

## 2. Source material, inventoried 2026-10-31

| Location | What is there | Size |
|---|---|---|
| `\\BCKGeo-NAS\BCKGeoUAV` | About 450 drone videos, 2019 to 2025. Largest sets: Carp Lake (63 clips, 102 GB), 2024 (101 clips, 90 GB), 2019 (85 clips, 31 GB), Amanita Lake (12 clips, 24 GB), 2937 Jorgenson Road (18 clips), 8105 Toombs Road (11), 42460 Bednesti Lake S Rd (13), Davinci (4), 1782 Beech Cres (4), Nuecel (1). No point clouds on this share. | about 380 GB |
| `E:\Video-Creations\footage` | DJI clips from 2025-12, 2026-05, 2026-06 and a 360 OSV set (Power-Dave, 2026-07). `output\` already holds finished reels: May long weekend, Farnham Willow claim, Homies winter, 2937 Jorgenson. | 90 GB |
| `D:\terra\16885-Wright-Creek-Rd` | RTC360 "Route Roaming" fly-through mp4 (1.4 GB) and 16 LAS tiles. | 55 GB |
| `D:\_projects\rtc360` | Vancouver, Crowe St, tidal storm chamber: e57, LAS, Register 360 report (job 2024-045 for Apex Surveying Solutions, 21 setups, 2 mm bundle error, certified 2025-12-06). | 12 GB |
| `D:\_projects\m3e` | aurora-surveys 2026-005 job days: GCP, static, PPK and Metashape folders, mapping photos. | 70 GB zipped |
| `D:\gc-data\lidarbc` | 10 public LidarBC LAZ tiles under the BC open licence. | 4.5 GB |
| `S:\My Drive\05_Projects` | Skyland job folders 2023 to 2026, 19 field videos (Bednesti 2025, CHK 2026, Wright Creek 2024, car show 2024). | 10 GB video |

Tooling already on this workstation, to reuse rather than rebuild (`E:\Video-Creations\scripts`): `contact_sheet.py` (HTML review index with thumbnails and tick boxes), `analyze.py` (steadiness and horizon scoring, writes an EDL), `build.py` (NVENC render, grade, titles, music bed), `montage.py`, `beats.py`, `level.py` (horizon levelling), `reframe360/` (360 to flat moves). Installed: ffmpeg 9.0.2, whisper and faster-whisper, laspy, OpenCV. Not installed: any text-to-speech engine.

## 3. Platform rules as read on 2026-10-31

All quotes are from the platform's own page (Tier A). Where a page could not be reached, the line says unverified.

### 3.1 AI disclosure

- YouTube, "Disclosing use of GenAI content", https://support.google.com/youtube/answer/14328491 (no page date shown). Creators must "disclose AI-generated or altered content that seems realistic." Not required: production help such as drafting "a script, outline, title, thumbnail", captions, "cloning your own voice for voiceovers or dubs", colour or lighting edits. The label appears in the expanded description, or on the player for photorealistic content.
- TikTok, "About AI-generated content", https://www.tiktok.com/support/faq_detail?id=7636670084747893268. Label required for content "completely generated or significantly edited by AI", which includes a subject "saying something they didn't say, for example, AI-generated speech", and for "all AI-generated content that contains realistic images, audio, and video." The label is a post setting and "won't affect the distribution." Labelling unaltered content as AI is itself a violation.
- TikTok Community Guidelines, Integrity and Authenticity, https://www.tiktok.com/community-guidelines/en/integrity-authenticity (released 2026-08-25, effective 2026-09-24). Label "AI-generated or significantly edited content that shows realistic-looking scenes or people."
- Meta (Instagram), newsroom post of 2026-02-19 updated 2026-10-27, https://about.fb.com/news/2026/02/meta-prepares-for-2026-us-midterms/: "We require people to use this disclosure and label tool when they post organic content with a photorealistic video or realistic-sounding audio that was digitally created or altered" and "we may apply penalties if they fail to do so." Transparency Center page, https://transparency.meta.com/governance/tracking-impact/labeling-ai-content/ (updated 2025-02-19): "AI info" labels are applied on detection of industry-standard indicators or on self-disclosure. An Instagram Help Center article with the same rule was not found: the rule above rests on the newsroom post.
- LinkedIn, "Best practices for content created with the help of AI", https://www.linkedin.com/help/linkedin/answer/a1481496 (page says last updated 4 days ago). Disclosure recommended "if you've relied heavily on AI to help create or modify the content." "You are ultimately responsible for everything you post on LinkedIn." Names "AI slop" as "low-effort, likely AI-generated content" that "lacks a clear point of view, unique perspective, or substance."

Reading for the pilot: Ben's own voice over real footage with an AI-drafted script needs no label on any of the four. Any text-to-speech narration gets the TikTok label, the Instagram disclosure, the YouTube disclosure and a sentence in the LinkedIn post. Nothing in the pilot depicts a real person saying anything they did not say.

### 3.2 Repetitive and mass-produced content

- YouTube channel monetization policies, https://support.google.com/youtube/answer/1311392, updated 2025-07-15: "repetitious content" renamed "inauthentic content". Content must "be your original creation" and "not be mass-produced, generic, repetitive, or manipulative." Named as not monetizable: "AI-generated content made with generic or unoriginal templates giving the impression of mass production." If tools or templates help, "the final product must still demonstrate your creative vision and provide educational or entertainment value."
- Instagram Content Monetization Policies, https://help.instagram.com/2635536099905516. Prohibited formats include "static videos", "slideshows of images", "looping videos" and "text montages" ("still or moving images with overlaid text"). "Unoriginal content" without "meaningful enhancements (commentary, parody, creative editing, etc.)" cannot be monetized.
- TikTok Creator Rewards eligibility page (below) lists "unoriginal content", "low quality" and "clickbait" as grounds for ineligibility.

Reading: five distinct pieces with Ben's voice, a written point of view and his own footage sit well clear of every one of these. The Instagram "text montage" line is why the captions-only piece (B2) still has Ben's voice on it.

### 3.3 Monetization eligibility

- YouTube Partner Program, https://support.google.com/youtube/answer/72851: 1,000 subscribers plus 4,000 qualified watch hours in 12 months, or 1,000 subscribers plus 10 million qualified Shorts views in 90 days. Acceptance is reviewed, not automatic.
- TikTok Creator Rewards Program, https://www.tiktok.com/creator-academy/article/eligibility (updated 2026-08-18): open to creators "in the United States, the United Kingdom, Germany, Japan, South Korea, France, Mexico, and Brazil". Canada is not listed. Personal accounts only; business accounts "do not qualify". 10,000 followers and 100,000 video views in the last 30 days.
- Instagram: the per-tool eligibility pages (Bonuses, Gifts, Subscriptions) were not read this session. Unverified.
- LinkedIn: no creator payout program was checked. Unverified.

Reading: monetization is unreachable and irrelevant for the pilot on every platform. The pilot is a traffic test. The direction record's "no ads" stance is untouched.

## 4. The five pieces

Two formats. Format A, "What you're looking at": a scan or point cloud explainer, 30 to 45 s, vertical 1080 by 1920. Format B, one-take field stories: drone footage with one voice and one idea, 15 to 35 s. Every piece gets a per-platform caption, an end card with its `/go/` link, and a line in the description pointing at the landing page.

### A1. Every tree in this forest has been measured

- Source: `D:\terra\16885-Wright-Creek-Rd\Video - Route Roaming RTC360.mp4` for the walk-through; one of the 16 LAS tiles rendered top-down for the reveal. Clearance: per-job yes from Ben for Wright Creek before cutting.
- Hook: "This is not a video game. It is a real forest, measured to the centimetre."
- Length: 40 s. Shape: 3 s hook on the walk-through, 15 s of moving through the scan with two captions (what a laser scanner does, how many points), 12 s cut to the top-down tile with the trees as dots, 10 s close ("every one of these is a real tree, and someone needed to know where they are") and end card.
- AI does: picks the steadiest 20 s of the fly-through (Qwen3-VL frame scoring plus `analyze.py`), reads the point count and extent from the LAS header with laspy, drafts three scripts, times captions from Ben's take, cuts and burns in.
- Ben does: clearance, a two-line brief (why the forest was scanned, in words he is allowed to say publicly), picks and edits a script, records the voice, reviews, posts.
- Tier 3 step: Ben checks the point count and the "centimetre" claim against the LAS header and the job's registration report, confirms nothing identifies the property, runs the final-form check on script.md with its sources sidecar, posts himself. No AI label needed (own voice, real footage).

### A2. The room under Vancouver

- Source: `D:\_projects\rtc360\Vancouver - Crowe St - Tidal Storm Chamber.e57` and `.las`; the Register 360 report for the facts (21 setups, 2 mm bundle error, certified 2025-12-06). Clearance: this is job 2024-045 for Apex Surveying Solutions, so Ben needs a yes from Apex, and possibly their client, before this piece exists. If the yes does not come, A2 is replaced by an aurora-surveys Metashape cloud with the same structure, subject to that job's yes.
- Hook: "There is a concrete room under Vancouver that almost nobody will ever stand in."
- What the chamber is for is unverified: the registration report says nothing about function, and the folder name alone does not support "fills with the tide". Ben confirms the function with Apex before any script says it. If it cannot be confirmed, the script says only what the scan shows.
- Length: 45 s. Shape: 3 s hook inside the scan, 20 s moving through the chamber with captions on scale and on how the scanner saw it in the dark, 10 s on why anyone scans it (as confirmed), 10 s close and end card.
- AI does: fly-path frame selection, script variants, caption timing, cut and burn-in. The fly-through itself is recorded by Ben in Cyclone3DR (about 10 min) because no scripted renderer is set up for e57 here.
- Ben does: both clearances, the function check, brief, script edit, Cyclone3DR fly-through recording, voice, review, post.
- Tier 3 step: every claim traced to the report or to Apex's written confirmation in sources.md; final-form PASS; Ben posts. No AI label needed.

### A3. Your city, scanned from a plane

- Source: `D:\gc-data\lidarbc` public LAZ tiles over Prince George, BC open licence. No clearance needed beyond attribution. The tile is chosen so that no single house is the subject: a park, the river confluence, a bridge or the downtown grid.
- Hook: "BC scanned this whole city with a laser from a plane. Here is what it saw."
- Length: 35 s. Shape: 3 s hook on the orbit, 15 s orbit with captions (who flew it, what it is used for, that anyone can download it), 10 s zoom to a recognisable landmark, 7 s close with the landing page.
- Voice: disclosed text-to-speech. This is the label test: the same format as A1 but with the AI label set on all four platforms, so the month shows whether the label changes reach.
- AI does: orbit recording is Ben's (Cyclone3DR or CloudCompare, about 10 min); the rest is AI: script variants, Piper text-to-speech render, caption timing, cut and burn-in.
- Ben does: tile and landmark choice, brief, script edit, one listen to the voice, review, post with the AI label on.
- Tier 3 step: the open-licence attribution line is in the description; the LidarBC programme claims in the script are traced to the LidarBC page in sources.md or left out; final-form PASS; Ben posts and sets the label on TikTok, Instagram and YouTube and writes one sentence on LinkedIn.

### B1. Why I fly a lake at sunrise

- Source: `\\BCKGeo-NAS\BCKGeoUAV\Carp Lake` or `\Amanita Lake`, whichever has the better low-sun clips. Cleared (NAS scenic).
- Hook: "People ask what a surveyor does with a drone. This is the part nobody sees."
- Length: 30 s. Shape: one continuous aerial if a clip supports it, otherwise three shots with soft cuts; Ben's voice on why the light, the calm air and the early start matter for mapping, ending on one line about the dashboard's field weather.
- AI does: Qwen3-VL finds the low-sun, calm-water clips; `analyze.py` rejects busy motion; script variants; captions; cut and grade with `build.py` settings.
- Ben does: clip pick from the contact sheet, brief, script edit, voice, review, post.
- Tier 3 step: no factual claims beyond Ben's own practice; location named only at lake level; final-form PASS; Ben posts. No AI label needed.

### B2. Geospatial tongue twister

- Source: `\\BCKGeo-NAS\BCKGeoUAV\42460 Bednesti Lake S Rd` aerial or the May long weekend clips in `E:\Video-Creations\footage`. Cleared (NAS, personal), with the property yes for Bednesti if that backdrop is used.
- Hook: the twister itself, on screen and in Ben's voice from the first frame. Example to refine: "seven steady survey stakes set straight by the swamp".
- Length: 15 to 20 s. Shape: Ben reads it three times, faster each time, fails once; the captions keep pace; last frame says "the people who say this for a living built dashboard.bckgeo.ca/go/<slug>".
- Voice: Ben, with captions. Ben's voice is kept so the piece is not a "text montage" under the Instagram policy.
- AI does: drafts ten twisters from real survey vocabulary; picks a stable backdrop clip; word-timed captions from the take; cut and burn-in.
- Ben does: picks the twister, records three takes in one go, reviews, posts.
- Tier 3 step: nothing factual to check; final-form PASS on the caption text; Ben posts. No AI label needed.

### Order and cadence

B1 first (fewest dependencies), then A3 (no clearance), then B2, then A1, then A2 if its clearances arrive. One piece a week, five weeks, so the stop rule can fire after piece three. Each is posted to the four platforms on the same day.

## 5. Landing page and counter

### `/start`

A plain-language page inside the existing shell, added the way `/terms` is: a lazy import and a route in `src/App.jsx`, a page at `src/components/pages/Start.jsx`, no entry in the tab bar. Content, in this order:

1. One line on what they just watched, matched to the `from` query value (forest scan, chamber, city LiDAR, lake, twister), with a plain default.
2. Three things to try that already exist: today's field weather for your town, the municipal map, the RPAS rules in Flight Ops.
3. One line for the curious: what the dashboard is, in the words of the direction record's purpose, without the jargon.
4. One line to BCKGeo: "Need a property, a site or a forest measured? That is BCKGeo."

Every outbound link on the page goes through `/go/start-dash` or `/go/start-bckgeo` so the second click is counted. No script, no cookie, no storage. The Mission Brief privacy sentence stays true as written.

### `/go/<slug>`

A Cloudflare Pages Function at `functions/go/[slug].js`:

- Allow-list of slugs: `yt`, `tt`, `ig`, `li`, `start-dash`, `start-bckgeo`. Anything else returns 404.
- Writes one data point (slug, UTC day) to a Workers Analytics Engine dataset bound in the Pages project settings. No IP, user agent, referrer or cookie is read or stored.
- Responds 302 to `/start?from=<slug>` for the platform slugs, to the dashboard home for `start-dash`, to the BCKGeo site for `start-bckgeo`.

Why not a KV counter: Workers KV free plan limits are 1,000 writes per day and 1 write per second to the same key (https://developers.cloudflare.com/kv/platform/limits, read 2026-10-31), so a single burst would drop counts. Analytics Engine is built for append-only counting. Its free-tier limits were not read this session: unverified, and the first build step is to read that page and confirm before writing the function.

Cross-check: YouTube Studio, TikTok, Instagram Insights and LinkedIn each report clicks on the link in their own analytics. Those numbers are recorded weekly beside the `/go/` counts. A large gap between the two is itself a finding.

Both the page and the function are built in a later session after this spec is approved, not in this one.

## 6. Local pipeline

All production runs on this workstation and apex. Nothing leaves the LAN until Ben uploads a finished file.

| Step | Tool | Output | Ben's time |
|---|---|---|---|
| 1. Select | `contact_sheet.py` on the chosen folder; Ben ticks keepers in the browser | selects list | 5 min |
| 2. Classify and caption | ffmpeg samples one frame every 2 s; Qwen3-VL on apex (192.168.0.42:8083) returns scene type, motion, subject and a one-line caption per clip; `analyze.py` steadiness and horizon score beside it | `clips.json` per piece | 0 |
| 3. Brief and script | Ben writes two lines (what it is, what is true about it); Qwen3.8-27B (192.168.0.42:8080) drafts three scripts under 90 words from the brief and `clips.json`; Ben picks and edits one | `script.md` | 8 min |
| 4. Voice | Ben records three takes on phone or headset and drops the file in the piece folder. For A3, Piper (local, offline, to be installed) renders the script; Ben listens once | `voice.wav` | 5 min |
| 5. Captions and cut | whisper (installed) produces word-timed SRT from the take; ffmpeg converts to styled ASS and burns in; reframe to 1080 by 1920; `level.py` horizon levelling; `build.py` NVENC settings; end card with the `/go/` link text | `final.mp4` | 0 |
| 6. Review | `E:\Video-Creations\review\<piece>\` holds `final.mp4`, `script.md`, `sources.md` (one line per factual claim with the job file or page it rests on), `checklist.md` (clearance yes recorded, label decision per platform, final-form PASS). Ben watches, corrects, approves | approved folder | 7 min |
| 7. Post | Ben uploads to the four platforms himself, pastes the per-platform `/go/` link, sets the AI label where section 3.1 says so, records the post URLs in `checklist.md` | four posts | 12 min |

Scan fly-throughs (A1 reuses an existing mp4; A2 and A3 need new ones) are recorded by Ben in Cyclone3DR or CloudCompare, about 10 min each, because no scripted point cloud renderer exists here yet. If the pilot passes, a scripted orbit (CloudCompare command line or a small Open3D script) is the first automation to add.

Text-to-speech choice: Piper, local and offline, MIT licensed, with a single English voice chosen once and kept. It is used only for A3 in the pilot. Hosted voices are not used: the pilot's point is that production stays on the LAN.

Qwen's place: it classifies clips and drafts scripts. Every script is edited by Ben before it is voiced, and every factual line in it is traced in `sources.md` to the job data or a Tier A page. Qwen output never reaches a platform unreviewed.

Ben's time: about 37 min per piece, roughly double for the first one. Five pieces: about 3.5 h in the month, plus the clearance conversations for A1 and A2. Machine time (renders, Qwen passes) does not count against him.

New code this pipeline needs, each a small script in `E:\Video-Creations\scripts`: `classify_vl.py` (frame sampling and the Qwen3-VL call), `draft_script.py` (the Qwen chat call with the brief and captions), `short.py` (whisper to ASS, reframe, burn-in, end card, assembling the review folder). About a day of build, done after this spec is approved and before piece B1.

## 7. Measurement, win line and stop rule

The funnel: view, link click, arrival at `/start`, second click into the dashboard or BCKGeo. Arrivals are counted by the `/go/` function; views and link clicks come from each platform's own analytics; all are recorded weekly in a table at the bottom of this spec.

Win after 30 days from the first post, all three required:

1. 150 or more arrivals at `/start` across the five pieces, with the `/go/` counts and the platform click insights in rough agreement.
2. 30 or more second clicks from `/start` into the dashboard or BCKGeo.
3. At least one piece on at least one platform with arrivals per view of 1% or better, which names the format and platform to keep.

Stop early: seven days after the third piece is posted, if total arrivals are under 20, the pilot stops. The post-mortem is written into this spec and no channel is started.

Pause rule: a takedown, a label dispute or a strike on any platform pauses that platform for the rest of the pilot. The piece stays up elsewhere.

After the month:

- Win: a second month with the winning format and platform only, a channel name and a cadence decision, and the scripted orbit renderer as the first automation.
- Below the win line: no faceless channel. LinkedIn explainers continue only if LinkedIn alone produced 20 or more arrivals, since that audience overlaps BCKGeo's actual clients.
- In either case the `/start` page stays, because it costs nothing and gives every future mention of the dashboard a plain-language door.

What is not measured: followers, likes, comments, watch time. They are recorded if the platform shows them but they do not count toward the win line.

## 8. Unverified and open

- The Crowe St chamber's function. Confirm with Apex before A2 is scripted.
- Workers Analytics Engine free-tier limits. Read before the function is built.
- Instagram per-tool monetization eligibility and any LinkedIn creator payout. Not read, and not needed for the pilot.
- Whether BCKGeo accounts already exist on TikTok and Instagram. Ben creates any missing ones himself; none are created by Claude.
- Music: none in the pilot. Ben's voice and ambient audio only, which also avoids every platform's licensed-audio rules. If a piece needs a bed later, the choice goes through the same review.

## 9. Weekly log

| Week ending | Piece | Platform | Views | Link clicks (platform) | Arrivals (`/go/`) | Second clicks | Notes |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

## Sources

- YouTube, Disclosing use of GenAI content: https://support.google.com/youtube/answer/14328491 (read 2026-10-31)
- YouTube channel monetization policies: https://support.google.com/youtube/answer/1311392 (page dated 2025-07-15, read 2026-10-31)
- YouTube Partner Program overview and eligibility: https://support.google.com/youtube/answer/72851 (read 2026-10-31)
- TikTok, About AI-generated content: https://www.tiktok.com/support/faq_detail?id=7636670084747893268 (read 2026-10-31 in the browser pane; the plain fetch returned an empty shell)
- TikTok Community Guidelines, Integrity and Authenticity: https://www.tiktok.com/community-guidelines/en/integrity-authenticity (effective 2026-09-24, read 2026-10-31)
- TikTok Creator Rewards Program eligibility: https://www.tiktok.com/creator-academy/article/eligibility (page dated 2026-08-18, read 2026-10-31)
- Instagram Content Monetization Policies: https://help.instagram.com/2635536099905516 (read 2026-10-31)
- Instagram, product eligibility requirements for monetization tools: https://help.instagram.com/427415519366046 (index page only, per-tool pages not read)
- Meta newsroom, How Meta Is Preparing for the 2026 US Midterm Elections: https://about.fb.com/news/2026/02/meta-prepares-for-2026-us-midterms/ (2026-02-19, updated 2026-10-27, read 2026-10-31)
- Meta Transparency Center, Labeling AI Content: https://transparency.meta.com/governance/tracking-impact/labeling-ai-content/ (updated 2025-02-19, read 2026-10-31)
- LinkedIn, Best practices for content created with the help of AI: https://www.linkedin.com/help/linkedin/answer/a1481496 (read 2026-10-31)
- LinkedIn Professional Community Policies: https://www.linkedin.com/legal/professional-community-policies (not re-read; cited by the page above)
- Cloudflare Workers KV limits: https://developers.cloudflare.com/kv/platform/limits/ (read 2026-10-31)
- Cloudflare Pages Functions bindings: https://developers.cloudflare.com/pages/functions/bindings/ (read 2026-10-31)
- Crowe St registration report: `D:\_projects\rtc360\Vancouver - Crowe St - Tidal Storm Chamber.pdf` (Cyclone REGISTER 360 PLUS, certified 2025-12-06)
