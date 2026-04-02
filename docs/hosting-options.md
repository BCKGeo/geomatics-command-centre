# BCKGeo Command Centre - Hosting & Platform Options

> Evaluating hosting platforms for a geomatics SaaS with auth, payments, and real-time data feeds.

## Current Stack

| Component | Platform | Cost |
|-----------|----------|------|
| Frontend (React SPA) | GitHub Pages | Free |
| API Proxies (Celestrak) | Cloudflare Workers | Free |
| DNS | Cloudflare (bckgeo.ca) | Free |
| Domain | Porkbun | ~$12/yr |

## Future Requirements

- User authentication (email/password, OAuth)
- $5/mo subscription tier (Stripe)
- Protected routes (free vs paid content)
- Database (user prefs, saved locations, subscription records)
- PDF export (Mission Brief generator)
- Email alerts (Kp storm notifications)
- EN/FR bilingual toggle
- Low latency for Canadian users

---

## Option 1: Cloudflare Pages + Workers + D1

**Stay fully in the Cloudflare ecosystem.**

| Resource | Free Tier | Paid ($5/mo Workers) |
|----------|-----------|---------------------|
| Pages bandwidth | Unlimited | Unlimited |
| Pages builds | 500/mo | 500/mo |
| Worker requests | 100k/day | 10M/mo |
| Worker CPU time | 10ms/invocation | 50ms/invocation |
| D1 (SQLite DB) | 5M reads/day, 100k writes/day, 5 GB | Higher limits |
| KV storage | 100k reads/day, 1 GB | Higher limits |
| R2 (object storage) | 10 GB, 10M ops/mo | Pay-per-use |

**Auth:** No built-in solution. Use [Clerk](https://clerk.com) (free to 10k MAU) or [Lucia Auth](https://lucia-auth.com) (open-source, runs in Workers + D1). You build the login UI yourself.

**Database:** D1 is SQLite at the edge. Good for user profiles, saved locations, subscription status. Migrations are manual SQL files via wrangler.

**Payments:** Stripe Checkout sessions created in a Worker. Stripe webhooks hit a Worker endpoint to update D1.

**PDF Export:** Workers can't run Puppeteer/Chromium. Use client-side `@react-pdf/renderer` or call a PDF API service.

**Email:** Worker cron trigger checks Kp data, queries D1 for subscribed users, sends via [Resend](https://resend.com) (100 emails/day free).

**Canadian Latency:** Excellent. Edge nodes in Vancouver, Toronto, Montreal. D1 reads are edge-cached.

### Pros
- Everything in one platform (wrangler CLI for everything)
- You already know Workers and wrangler
- Edge-first = fast in Canada
- D1 free tier is generous for small SaaS

### Cons
- Auth is DIY or requires third-party (Clerk)
- D1 is relatively new, limited tooling compared to Postgres
- Workers V8 runtime isn't Node.js (some npm packages won't work)
- No WebSocket support on free tier (needs Durable Objects)

### Monthly Cost
- Start: **$0** (with Clerk free tier for auth)
- At scale: **$5-10/mo** (Workers paid + Resend)

---

## Option 2: Cloudflare Pages + Supabase (Recommended)

**Keep Cloudflare for frontend/Workers, add Supabase for auth + database.**

| Resource | Supabase Free | Supabase Pro ($25/mo) |
|----------|--------------|----------------------|
| Database (Postgres) | 500 MB | 8 GB |
| Auth users | 50k MAU | 100k MAU |
| File storage | 1 GB | 100 GB |
| Edge functions | 500k/mo | 2M/mo |
| Realtime connections | 200 concurrent | 500 concurrent |

**Auth:** Built-in. Email/password, magic link, Google/GitHub OAuth. Password reset, email verification, session management all handled. React client library drops in with `@supabase/supabase-js`. Row-Level Security (RLS) gates data by user/subscription tier in the database itself.

**Database:** Full Postgres. 500 MB free. Supports PostGIS for spatial queries on saved locations if you ever want that. Real SQL, real migrations via Supabase CLI.

**Payments:** Stripe Checkout -> webhook hits Cloudflare Worker or Supabase Edge Function -> updates `subscriptions` table. Well-documented pattern.

**PDF Export:** Same as Option 1 (client-side). Edge functions are Deno-based, can't run Puppeteer.

**Email:** Worker cron checks Kp data -> queries Supabase for subscribed users -> sends via Resend. Or use Supabase Database Webhooks to trigger on insert.

**Canadian Latency:** Static assets served from Cloudflare Canadian edge. DB queries hit us-east-1 (~70-90ms from BC). Acceptable for user prefs and auth. Not an issue for the use case.

### Architecture

```
bckgeo.ca (Cloudflare Pages)
  |-> React SPA (code-split, lazy-loaded tabs)
  |
  |-> Cloudflare Workers
  |     |-> celestrak-proxy (satellite TLE data)
  |     |-> stripe-webhook (payment events)
  |     |-> kp-alert-cron (scheduled email alerts)
  |
  |-> Supabase
        |-> Auth (login, signup, sessions)
        |-> Postgres (users, prefs, saved locations, subscriptions)
        |-> Storage (generated PDFs, user uploads)
```

### Pros
- Auth is solved out of the box (weeks of work saved)
- Full Postgres with RLS (free/paid tier logic in the DB, not code)
- 50k MAU on free tier (irrelevant limit for your scale)
- Supabase client library is excellent in React
- PostGIS available if you want spatial features later
- Keeps your existing Cloudflare setup untouched

### Cons
- **Free tier pauses after 7 days of inactivity** (non-issue once Kp cron pings it regularly)
- DB is in US (no Canadian region on free tier)
- Edge Functions are Deno, not Node (minor learning curve)
- Two platforms to manage (Cloudflare + Supabase)
- Vendor lock-in on auth (migrating GoTrue users is painful)
- 2 projects max on free tier (no staging environment)

### Monthly Cost
- Start: **$0**
- At scale: **$25/mo** (Supabase Pro) + **$5/mo** (Workers paid) = **$30/mo** (covered by 6 subscribers)

---

## Option 3: Vercel

| Resource | Hobby (Free) | Pro ($20/mo) |
|----------|-------------|--------------|
| Bandwidth | 100 GB/mo | 1 TB/mo |
| Serverless functions | 100 GB-hours | 1000 GB-hours |
| Edge functions | 500k invocations | 1M invocations |
| Builds | 6000 min/mo | 24000 min/mo |
| Postgres | 256 MB | 256 MB (same) |

**Auth:** No built-in solution. Use NextAuth.js (requires Next.js migration), Clerk, or Auth0.

**DEAL-BREAKER: Free Hobby plan prohibits commercial use.** A SaaS with paid subscriptions requires Pro at $20/mo from day one.

### Pros
- Excellent DX if you use Next.js
- Good edge network (Canadian PoPs)
- Vercel Postgres (Neon-backed) included

### Cons
- **$20/mo minimum for commercial use**
- Requires migrating from Vite to Next.js to get full benefit
- Loses your Workers/wrangler knowledge investment
- Vercel Postgres is only 256 MB (smaller than Supabase free)
- Fragmenting your stack (Cloudflare for DNS + Vercel for hosting)

### Monthly Cost
- Start: **$20/mo** (Pro required for commercial)

---

## Option 4: Netlify

| Resource | Free | Pro ($19/mo) |
|----------|------|-------------|
| Bandwidth | 100 GB/mo | 1 TB/mo |
| Build minutes | 300/mo | 25000/mo |
| Functions | 125k invocations | 2M invocations |
| Identity (auth) | 1,000 users | 1,000 users |

**Auth:** Netlify Identity is built-in with email/password and OAuth. 1,000 users on free tier.

**HIDDEN COST: Identity Level 1 (>1,000 users) is $99/mo.** This pricing cliff makes it unsuitable for a growing SaaS.

### Pros
- Built-in auth (Netlify Identity)
- Commercial use allowed on free tier
- Edge Functions are unlimited

### Cons
- **$99/mo auth pricing cliff at 1,000 users**
- No built-in database (pair with Supabase anyway)
- 300 build minutes/mo runs out during active development
- Identity widget is dated, custom UI requires GoTrue API work

### Monthly Cost
- Start: **$0**
- At 1,000+ users: **$99/mo** (Identity) + **$19/mo** (Pro) = **$118+/mo**

---

## Option 5: Self-Hosted on NAS (Docker + Cloudflare Tunnel)

**Run everything on your ASUSTOR Lockerstor 4 Gen3 behind Cloudflare Tunnel.**

**Auth:** Run Postgres + Node.js API with Passport.js. Or self-host Supabase (full Docker Compose). Full control.

**Database:** Postgres in Docker. Unlimited storage (NAS disks). Full PostGIS.

**PDF Export:** Run Puppeteer + Chromium in Docker. **This is the only option where server-side PDF is trivially solved.**

**Email:** Docker cron container checks Kp data, sends via Resend API.

**Canadian Latency:** NAS is in Prince George. Tunnel routes through Cloudflare Vancouver. BC users get ~30ms total. Excellent.

### Pros
- $0 monthly cost
- Full control, no vendor limits
- Server-side PDF generation works
- You already run Docker containers on this NAS

### Cons
- **Single point of failure** (NAS down = SaaS offline = angry paying customers)
- **No redundancy** (power outage, hardware failure, ISP outage)
- Residential ISP ToS may prohibit running servers
- You maintain everything (security patches, backups, uptime)
- Stripe requires reliable availability for payment processing
- Doesn't scale if the product grows

### Monthly Cost
- **$0** (hardware/power/internet already paid)
- Hidden cost: your time maintaining infrastructure

### Best Role for NAS
Use it as a **secondary service**, not the primary backend:
- Heavy PDF generation behind Cloudflare Tunnel
- Staging/dev environment
- Backup/data processing jobs
- Not the production auth/payment server for paying customers

---

## Option 6: Railway / Render

**Managed container hosting for a backend API.**

| | Railway | Render |
|---|---------|--------|
| Free tier | $5 credit trial | 750 hrs/mo (spins down after 15 min) |
| Minimum paid | $5/mo (Hobby) | $7/mo (Starter) |
| Postgres | Included (usage-based) | $7/mo minimum |
| Regions | US-West, US-East | Oregon, Ohio |
| Commercial use | Yes | Yes |

**Auth:** Full Node.js environment. Use Passport.js, Lucia, or any auth library.

### Pros
- Full server environment (PDF, cron, WebSockets, anything)
- Simple deployment (Dockerfile or `railway up`)
- Postgres included

### Cons
- **Render free tier spins down after 15 min inactivity** (30-60s cold start)
- **Render deletes free Postgres after 90 days**
- Railway has no real free tier ($5/mo minimum)
- US-only regions (no Canadian data residency)
- Another platform to manage alongside Cloudflare

### Monthly Cost
- Railway: **$5-10/mo**
- Render: **$7-14/mo**

---

## Comparison Matrix

| Factor | CF+Workers | CF+Supabase | Vercel | Netlify | NAS | Railway/Render |
|--------|-----------|-------------|--------|---------|-----|---------------|
| **Cost to start** | $0 | $0 | $20/mo | $0 | $0 | $5-7/mo |
| **Cost at 100 users** | $5/mo | $0-25/mo | $20/mo | $19-99/mo | $0 | $10-15/mo |
| **Auth built-in** | No | Yes | No | Yes (limited) | DIY | No |
| **Database included** | D1 (5 GB) | Postgres (500 MB) | Postgres (256 MB) | No | Unlimited | Yes |
| **Server-side PDF** | No | No | Limited | Limited | Yes | Yes |
| **Canadian latency** | Excellent | Good | Good | Good | Excellent | Good |
| **Stays in CF ecosystem** | Yes | Mostly | No | No | Partially | Partially |
| **Solo dev complexity** | Medium | Low | Medium | Medium | High | Low-Medium |
| **Uptime guarantee** | 99.9%+ | 99.9%+ | 99.9%+ | 99.9%+ | You | 99.9%+ |
| **Commercial on free** | Yes | Yes | No | Yes | Yes | Railway $5 |
| **Scales to 10k users** | Yes | Yes | Yes | Expensive | No | Yes |

---

## Recommendation

### Primary: Cloudflare Pages + Supabase (Option 2)

This is the best fit because:

1. **Zero migration cost.** Your Cloudflare Pages, Workers, DNS, and domain all stay put.
2. **Auth is solved.** Supabase auth handles signup, login, password reset, OAuth, sessions. You write React hooks, not auth middleware. This saves weeks.
3. **Free/paid tier gating via Row-Level Security.** A Postgres policy like `subscription_status = 'active'` gates paid content at the database level. No fragile middleware.
4. **Free tier covers you through launch and early growth.** 50k auth users, 500 MB database, 500k edge function calls.
5. **Upgrade path is clear.** Supabase Pro ($25/mo) + Workers Paid ($5/mo) = $30/mo, covered by 6 paying subscribers at $5/mo.
6. **The inactivity pause gotcha is a non-issue.** Your Kp cron Worker pings Supabase regularly, keeping it alive.

### Hybrid: NAS for Heavy Lifting

Use your ASUSTOR NAS behind Cloudflare Tunnel for:
- Server-side PDF generation (Puppeteer in Docker)
- Development/staging environment
- Data processing jobs (point cloud, LiDAR workflows)
- **Not** the primary auth/payment backend

### What to Avoid

- **Vercel:** $20/mo for commercial use, no benefit over Cloudflare for your stack
- **Netlify:** $99/mo auth cliff at 1,000 users
- **NAS-only:** Single point of failure, unacceptable for paying customers
- **Render free tier:** Spins down, deletes DB after 90 days

---

## Next Steps

1. Keep building on Cloudflare Pages + GitHub Pages (current setup works for development)
2. When ready for auth: create a Supabase project, add `@supabase/supabase-js` to the dashboard
3. When ready for payments: set up Stripe account, create a webhook Worker
4. Migrate from GitHub Pages to Cloudflare Pages when you want custom domain + faster deploys
5. The `feature/auth-payments` branch is ready for this work when you are
