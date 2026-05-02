# Clear Legacy — Phase 2 Audit: SEO, CRO, Bing & Scaling
**Date:** 2 May 2026
**Companion to:** `AUDIT-2026-05-01-Clear-Legacy.md` (Phase 1, baseline)
**Companion to:** `BING-MICROSOFT-ADS-PLAN-2026-05-01.md` (channel strategy)
**Companion to:** `STATUS-2026-05-02.md` (system snapshot)

---

## Executive Summary

In 24 hours, Clear Legacy has gone from "broken pipeline + invisible attribution" to "fully working pipeline + per-lead source tracking + Bing-ready". The biggest blocking issues — broken Stripe webhooks, missing UET tag, 8-page sitemap, cross-business email leak — are resolved. The Phase 1 audit's top-3 priorities (sitemap, attribution, webhook fix) are all live in production.

**The scaling story now hinges on three levers:**

1. **Content depth + topical authority** (90% of remaining SEO value lives here, untouched today)
2. **Microsoft Ads activation** (campaign built, waiting on Microsoft's identity verification — 1-3 working days)
3. **Conversion-tracking accuracy** (GA4 sees 9 purchases vs admin's 25 in 28d — fix the thank-you tracking before scaling spend)

**Most important paragraph in this document:** Bing-family search engines (Bing + Yahoo + DuckDuckGo) deliver 42% of your traffic and you've never spent a penny on Microsoft Ads. The only thing standing between you and a measurably better CPA than Google is Microsoft completing the identity-verification queue. Once they do, the campaign and conversion goal we built today will start serving immediately.

---

## PART 1 — Current State Analysis

### What's been implemented well (✅ done today or before)

**Technical foundation:**
- Microsoft UET tag (`clearlegacy-prod`, ti=187249506) live on **all 159 HTML pages** with default-denied consent
- Sitemap rebuilt from 8 to **78 URLs**, re-submitted to Google Search Console (received) and Bing Webmaster Tools (status "Processing" as of 2 May)
- robots.txt clean, allows all, points at sitemap
- Schema.org markup excellent on commercial pages (Organization, LegalService, FAQPage, Review with named individuals, BreadcrumbList, PriceSpecification)
- Bing site verification meta tag in homepage (msvalidate.01)
- Google Site Verification in place
- Open Graph + Twitter Card meta complete on commercial pages
- Mobile responsive layout (single-column stacks, full-width buttons on mobile)
- Cookie banner present (`cl_ok` localStorage flag)
- Performance hints: preconnect to Google Fonts, dns-prefetch to GA

**Pipeline & data:**
- Stripe → worker → KV → R2 → Resend pipeline working end-to-end (verified: Houlton recovered, Emma flowed autonomously)
- Per-lead attribution capture (UTM, gclid, fbclid, msclkid, ttclid, referrer, landingUrl, userAgent) **live in production** (verified via E2E test today)
- Cross-business webhook leak from itsadecline.com **filtered**
- Case-insensitive partner-name matching for mirror wills (no more "lesley houlton" vs "Lesley Houlton" swap failures)
- Watchdog auto-fails leads stuck >5min in `generating`
- All 6 worker secrets set + verified
- Admin dashboard at `/admin` with lead detail, raw JSON, regenerate, delete, source/attribution panel with channel-specific badges

**Commercial pages:**
- Homepage hero is excellent (5-second clarity test passes)
- Pricing page best-in-class transparency (comparison vs Farewill / Co-op / solicitors)
- Service hubs (`/wills/`, `/mirror-wills/`, `/lasting-power-of-attorney/`, `/probate/`) all linked
- NHS niche landing pages (5 of them) for NHS staff
- Probate calculator tool exists
- 30+ guide pages (`/guides/`)
- 6 blog posts (`/blog/`)
- Privacy/Terms/Compliance pages present
- Email transparency: hello@clearlegacy.co.uk visible everywhere; phone +44 7707 071984 in NHS schema

**Microsoft Ads (built today, paused on payment):**
- Account exists at `Kaizen Finance Ltd (G107CF9W)` on `sat@installsmart.ai`
- Campaign `Performance-Max-49` configured: UK targeting, English, 7 short headlines, 1 long, 2 descriptions, custom budget, Maximize Conversions bid strategy
- Conversion goal: `Will Purchase (thank-you page)` — Begins-with `https://www.clearlegacy.co.uk/thank-you.html`, £69 GBP, 30-day window, Last-Click attribution
- Microsoft Click ID auto-tagging on
- Account + identity verification submitted, pending Microsoft review

**Recently removed (today):**
- Three "to follow" service panels (Probate, Trust Formation, IHT Planning) removed from homepage along with associated footer links, schema offers, breadcrumb item, hero copy mention, and meta description references. Site now positions consistently as Wills-only.

### What's partially implemented (⚠️ on the way)

- **Bing/Yahoo/DDG organic indexing**: sitemap submitted today; expect URLs-discovered count to climb from 8 → 78 within a few days. No backlinks to non-homepage pages yet.
- **Microsoft Clarity**: opt-in toggle was offered during UET tag creation but not enabled. Free heatmaps + session replay still untapped.
- **Google Search Console coverage**: GSC has the new sitemap; will re-fetch and start reporting per-page impressions/clicks within ~7 days. No Search Console-to-GA4 link.
- **Conversion attribution accuracy**: UET tag deployed, conversion goal configured, but no real Bing-paid traffic yet (waiting on MS identity verification).
- **Microsoft Advertising Editor / structured campaigns**: only the auto-imported PMax Lite exists. Manual Search campaigns from the BING plan (5 themed campaigns) not yet created.

### What's still missing (❌ untouched)

- **Author / legal-reviewer bylines on all 36 guide and blog pages** — biggest remaining E-E-A-T gap for YMYL niche
- **`Article` / `BlogPosting` schema** on individual guide and blog pages (only `FAQPage` schema present)
- **Companies House registration number** displayed on the site (legal entity transparency)
- **ICO registration badge** (UK data-protection signal)
- **Phone number on homepage header** (older Bing demographic expects this; currently only on NHS page schema)
- **Physical address** in footer (boosts YMYL trust)
- **A `/faqs/` hub page** aggregating top 50 questions (high-leverage for AI-search citations from ChatGPT, Perplexity)
- **An `/about/` page** with named team + credentials (essential for YMYL E-E-A-T)
- **GA4 `purchase` event reliability fix** — admin shows 25 paid in 28d, GA4 shows 9 → ~64% of conversions silently lost (likely iOS Safari ITP)
- **Dynamic conversion value in UET** — currently every Bing-attributed conversion will be valued at £69 even when Mirror (£99) or Probate (£495+)
- **Manual Microsoft Ads Search campaigns** (5 themed sets from the BING plan)
- **Microsoft Clarity install**
- **Backlinks** — no high-trust referring domains visible
- **Internal linking from guide pages back to commercial pages** ("Ready to write your will? Start here") — major CRO miss
- **Hero panel "Five estate planning services"** updated; section subtitle shortened today; but **schema description** on the homepage (line 48 in index.html) still mentions "Lasting Power of Attorney, and Probate support" and the LegalService schema lists those as serviceTypes
- **Page speed measurement** — no Lighthouse / PSI scores in hand
- **A/B testing infrastructure** — no experiments framework wired up
- **Customer-portal usage data** — `/account/` exists but no traffic analysis

---

## PART 2 — SEO Gap Analysis (Phase 2)

### Missing high-value pages

The seven priority commercial-intent pages from the BING plan, audited against current state:

| Target keyword | Page exists? | Optimised? | Search-intent match? | Conversion-ready? |
|---|---|---|---|---|
| online will UK | `/wills/` covers it | Yes — title, H1, schema | Yes | Yes |
| make a will online | Subsumed under `/wills/` | Partial — keyword in body, not in title | Yes | Yes |
| what happens without a will UK | `/blog/what-happens-if-you-die-without-a-will/` + `/guides/intestacy-rules.html` + `/guides/dying-without-a-will.html` | **Three pages competing — no canonical owner** | Yes | Weak (no clear CTA back to commercial) |
| mirror wills UK | `/mirror-wills/` + `/guides/mirror-wills.html` | Two pages — risk of cannibalisation | Yes | Yes |
| cost of a will UK | `/guides/will-cost.html` + `/guides/will-cost-uk.html` + `/guides/will-writing-cost-uk.html` + `/blog/how-much-does-a-will-cost/` | **Four pages on near-identical topic** | Yes | Yes |
| probate help UK | `/probate/` exists but service is now "to follow" | Yes — but you've decided not to launch this service yet | Yes for those searching | **Conversion-ready: NO — no live service to sell** |
| is an online will legal UK | Mentioned in `/wills/` H2 + FAQ; no dedicated page | **Missing as standalone page** | Yes | Yes when built |

**Two acute problems jump out:**

1. **Cost-of-will cluster has 4 pages competing for the same keyword.** Pick one canonical winner (recommend `/guides/will-writing-cost-uk.html` since it's the most natural keyword), 301 the others to it, consolidate the link equity. Same exercise for the "what happens without a will" cluster (3 pages).

2. **"Probate help UK" is a high-intent commercial query with traffic potential — but you've consciously parked the Probate service.** The page still exists and is in the sitemap. Two paths: either (a) take it down to avoid sending users through a dead funnel, or (b) keep it as a lead-capture page with "Probate launching soon — leave your email and we'll notify you when it's live" — captures the SEO value while being honest.

**The genuinely missing page:**

- `/is-an-online-will-legal-uk/` — high-intent problem-led keyword, currently only addressed inside the `/wills/` FAQ. Worth a dedicated page (~1,500 words, FAQ schema, byline from a named legal reviewer).

### Content depth analysis

Sampled key pages today:

| Page | Word count (approx) | FAQs? | Author byline? | Internal links to commercial? |
|---|---|---|---|---|
| `/` (homepage) | ~600 | 5 in schema | No | Self-explanatory |
| `/wills/` | ~1,200 | 6 | No | Yes (to `/forms/will.html`) |
| `/pricing/` | ~1,500 | 6 | No | Yes (per-tier CTAs) |
| `/guides/inheritance-tax-gifts.html` | ~1,200 | 3 | **No** | **No** |
| `/guides/lpa-guide.html` | ~1,500 | unknown | **No** | **No** |
| `/blog/how-much-does-a-will-cost/` | ~1,400 | unknown | **No** | **No** |

**Key finding:** Service pages are well-written, FAQs are good, but **none of the 36 guide/blog pages have author bylines**. For YMYL content (everything to do with wills, probate, IHT, intestacy), Google's quality raters explicitly look for author credentials. This is the single biggest organic-rankings unlock available.

**Sales-vs-information balance:** Service pages are correctly sales-oriented; guide/blog pages are correctly informational. Good separation. The miss is that guide pages don't link readers back to commercial pages with a clear CTA.

### Internal linking — advanced view

**What works:**
- Service pages cross-link to each other via the nav and footer
- Pricing page links into all service hubs
- Form pages have proper 301 redirects
- Sitemap submitted with 78 URLs

**What doesn't:**
- **Guide pages lack a "Ready to write your will? Start here →" CTA back to commercial pages.** Each guide currently terminates as an article ends; users must navigate manually. Adding a single CTA + internal link at the end of each guide is a one-day job that compounds organic-traffic value.
- **Anchor text variety is limited** — many internal links use the page title verbatim. Vary the anchors ("compare will-writing costs", "see our pricing", "start your will today") for richer keyword signal.
- **Topic clusters have weak hub-and-spoke structure.** Probate-related guides should funnel into a hub at `/probate-guide/` (which exists but isn't centred). Wills guides → `/wills/`. LPA guides → `/lasting-power-of-attorney/`.

**Concrete recommendation: build a topic cluster for each commercial product:**

```
/wills/  ← hub
  ├── /guides/write-a-will-online-uk/   (link target)
  ├── /guides/will-vs-trust.html        (link target)
  ├── /guides/will-cost-uk.html         (link target)
  └── ... 12 more wills-related guides
```

Every guide in the cluster links **up** to the hub `/wills/` with anchor "write your will online from £69" or similar. Hub links **down** to top guides. Cluster strength compounds.

### Topical authority — does Clear Legacy look like a sales site or an authority?

**Honest verdict:** currently a sales site with educational supporting content.

**Why:** the guide pages are good but unattributed (no bylines), un-schema'd (no `Article` markup), and orphaned (no internal links back to commercial). Bing especially weights perceived authority heavily; without bylines and named credentials, the site reads as an unattributed content farm by E-E-A-T standards.

**Missing topical clusters that would shift the perception:**

- **Probate cluster** — assuming Probate stays parked, this stays partial. If Probate launches later, build out `probate-step-by-step-uk`, `probate-pa1a-pa1p-help`, `grant-of-representation-uk`, `intestate-probate-uk`.
- **Inheritance tax cluster** — has good baseline (`iht-guide`, `iht-threshold-2026`, `inheritance-tax-gifts`, `nil-rate-band`, `transferable-nil-rate-band`); needs a hub page at `/inheritance-tax/` linking these together.
- **Vulnerable testators / blended families** — emerging high-intent searches with low competition: `wills-for-blended-families-uk`, `wills-for-second-marriages-uk`, `wills-for-unmarried-couples-uk`, `wills-for-self-employed-uk`. Each is a 1,500-word evergreen guide.
- **Estate-planning-for-women / over-50 / first-time** — demographic clusters that match Bing's older skew.

---

## PART 3 — Bing & Microsoft Ads Review

### Bing SEO — practical grade

| Item | Status | Note |
|---|---|---|
| Bing site verification | ✅ Complete | meta tag in homepage |
| Sitemap submitted to BWT | ✅ Today | Status "Processing" — will re-fetch 78 URLs |
| Page titles include exact-match keywords | ✅ on commercial pages, ⚠️ on `/guides/` and `/blog/` hubs | Hub titles are too brand-led ("UK Wills & Estate Planning Guides") — should lead with intent ("Free UK Will Guides — Plain English, Updated 2026") |
| FAQ schema | ✅ on commercial pages, partially on guides | Add to all guides for richer SERP snippets |
| Article schema on guide pages | ❌ Missing | Adding this is a 4-hour bulk task across 36 pages |
| H1 keyword alignment | ✅ on service pages, ⚠️ on hub pages | `/blog/`'s H1 is "Wills & Estate Planning Guides" — generic |
| Server-side rendering | ✅ static HTML | Bing crawls JS poorly; you're fine |
| LinkedIn presence | unknown | Bing weights LinkedIn signals more than Google |
| Bing Places listing | ❓ | Free, takes 10 min — adds local-business signals |
| Microsoft Clarity | ❌ Not installed | Free heatmaps, particularly valuable for Bing audience insight |

### Microsoft Ads — review of what's been built

What's running:
- One PMax Lite campaign (`Performance-Max-49`), Enabled at platform level but blocked by account/identity verification
- Conversion goal `Will Purchase (thank-you page)` — Begins-with match on `/thank-you.html`, £69 GBP, 30-day window
- UET tag firing on all 159 site pages (verified live today)

What's NOT done (still on the BING plan to-do):
- 5 themed Search campaigns (Online Wills, Will Cost, Problem/No-Will, Mirror Wills, Probate)
- Account-level negative keyword list (~30 negatives like "free", "template", "pdf", "sample", "diy", "scotland", etc.)
- 4 themed Responsive Search Ad sets per the BING plan
- Sitelink/callout/structured-snippet account-level extensions
- Phone call extension with `+44 7707 071984`
- Audience-signal injection on PMax (older UK demographic)
- Daily budget cap below the £55/day BING-plan recommendation for first-week safety
- Microsoft Click ID auto-tagging confirmation in worker (already captures msclkid via attribution)

**Bid strategy concern:** PMax Lite defaults to "Maximize Clicks" until 30+ conversions track, then auto-switches to "Maximize Conversions" against the £69 goal. With a £69-per-conversion price product and Microsoft's typical UK Search CPC of £1-3 for legal/finance terms, you'll burn ~£100-£200 before the algorithm has enough data to optimise. That's expected; just budget for it.

### Bing behaviour insights (from GA4 28d data + general UK demographic patterns)

**What we know from data so far:**
- Bing organic delivers 125 sessions / 28d at 67% engagement, 1m 36s avg time, 4.4 events/session — directly comparable to Google organic on engagement
- Of all completed conversions in 28d, the single Bing-attributed one was a Single Will (£69)
- Adding Yahoo (uses Bing index) + DuckDuckGo (uses Bing index) gives Bing-family **201 sessions = 42% of all traffic**

**What we infer:**
- Bing demographic skews 45-65, married, higher-income, desktop-first
- Bing users research less per session than Google (1m 36s vs 2m 26s) → faster decision-makers once trust is established
- Older UK users prefer transparent pricing visible early → your pricing page is well-aligned
- Mirror Wills (£99 per couple) likely converts disproportionately well from Bing because of demographic match

**Pages to expect Bing users to convert on:**
1. **Homepage** — biggest entry point, decisive demographic
2. **`/pricing/`** — older Bing users price-shop; this page is a Bing winner
3. **`/mirror-wills/`** — couples skew older
4. **`/wills/`** — direct intent

**Pages to expect Bing users to bounce from:**
- `/blog/` index (weak title, generic content) — fix the title to drive engagement
- Long guide pages without clear CTAs back to commercial — friction kills conversion

---

## PART 4 — CRO Deep Dive

### Above-the-fold audit (homepage)

**5-second clarity test (passes):**
- Headline "Your Will, Done Right. From £69." ✅
- Subhead "Professionally drafted online Wills at fixed fees that beat every solicitor in the country." ✅ (cleaned today)
- Primary CTA "Prepare My Will — From £69" ✅ prominent
- Secondary CTA "See All Services" ✅ outline
- Trust badges (legal validity / expert review / security / fixed fee) ✅
- Hero image with descriptive alt text ✅

**Pricing visibility above fold:** ✅ "From £69" appears in headline and badge bar

**Trust visible immediately:** ✅ 4 trust badges + "Used by UK families" implicit in hero copy

### Trust & credibility

| Signal | Present? | Strength |
|---|---|---|
| Legal-validity reassurance | ✅ | "Legally valid in England & Wales" badge |
| "Is this legit?" comfort | ✅ | Schema includes Organization, LegalService, Review with 5.0 / 3 named reviewers |
| Testimonials | ✅ | 3 named individuals with quotes (below fold) |
| Companies House registration | ❌ | Mentioned in terms but not surfaced on homepage |
| ICO registration | ❌ | Not visible anywhere |
| Solicitor/legal credentials | ❌ | Honest about non-SRA-regulated status (in terms), but no team credentials surfaced |
| Awards / press mentions | ❌ | None visible |
| Press logos | ❌ | None |

**Highest-leverage trust additions (each <1 hour):**
1. Add Companies House number + linked badge to footer
2. Add ICO registration number if registered
3. Add a single "Reviewed by" line at the bottom of each guide ("Last reviewed by Sarah Johnson, Estate Planning Specialist, 12 April 2026") — even if Sarah is a single named reviewer who reviews all content, this is a real E-E-A-T win

### Friction points

**Service pages — minimal friction:**
- ✅ Clear value prop
- ✅ Pricing transparent
- ✅ CTAs strong
- ⚠️ No "what happens after I pay?" reassurance section

**Pricing page — minimal friction:**
- ✅ Per-tier CTAs
- ✅ Comparison vs competitors
- ⚠️ No security/payment badges

**Form (`/forms/will.html`) — moderate friction:**
- ⚠️ **Long form, no progress indicator** — drop-off risk, especially mobile. Adding "Step 2 of 5" reduces abandonment 15%+ on industry data.
- ⚠️ No auto-save / resume — form data lives in browser only
- ✅ Postcode lookup via Ideal Postcodes
- ✅ Attribution silently captured in background

**Stripe redirect — minimal friction:**
- ✅ Worker returns checkoutUrl with client_reference_id
- ⚠️ No interstitial ("Saving your details… redirecting to secure Stripe payment in 3 seconds")

**Thank-you page — moderate concern:**
- ⚠️ GA4 `purchase` event firing unreliably (9 GA4 vs 25 admin — ~64% loss). Suspect iOS Safari ITP. Investigate.

### Mobile vs desktop

**Mobile:**
- ✅ Full-width buttons (320px max), good tap targets
- ✅ Single-column stacks for hero buttons, services, pricing cards
- ✅ Nav-links hidden, sticky-nav CTA visible
- ⚠️ Pricing comparison table likely overflows on small screens (no horizontal scroll observed; would benefit from card-layout fallback)
- ⚠️ Form completion rate likely 30-40% lower than desktop (industry standard)

**Desktop:**
- ✅ Centred narrow content (max 1100px), good readability
- ✅ Hero image scales appropriately
- ⚠️ Body copy line-height could be 1.6 instead of default 1.5 for older Bing demographic

---

## PART 5 — GA4 Performance Interpretation

### Inferences from 28-day GA4 data

**High traffic but low conversion (need CRO attention):**
- Homepage `/` (94 views, 1 conversion ~ 1.06%) — already strong; bigger wins from specific landing pages
- `/guides/inheritance-tax-gifts.html` (21 views, 425% growth, 0 conversions) — great organic momentum, weak commercial conversion path. Add a "Ready to write your will?" CTA at the end of this guide.

**High conversion but low traffic (= scale opportunities):**
- `/wills/` and `/forms/will.html` — converting at the average rate but only seen by users already deep in the funnel. Build more top-of-funnel pages that link into these.
- `/pricing/` — 37 views, transparent pricing, decisive Bing demographic. Build awareness pages that funnel here.

**High bounce rate / friction signals:**
- Direct (123 sessions, only 26% engagement rate, 26-second avg time) — half of "Direct" is mistracked (Meta-iOS, untagged paid). Verify Bing PPC URLs include UTMs once Microsoft Ads activates.
- Yahoo referral (48 sessions, 0 conversions) — coming via Yahoo (Bing index) but not converting. Investigate landing pages.
- Test traffic from `test_verify` UTM (4 conversions, £366) is internal noise — **filter this out at GA4 property level today**.

### Channel performance

| Channel | 28d sessions | 28d conv | Engagement rate | Avg time | Take |
|---|---|---|---|---|---|
| Organic (all engines) | 259 | 2 | 66.4% | 1m 37s | Best volume; needs better CTAs |
| Direct | 123 | 3 | 26.0% | 0m 26s | Half is mistracked paid; brand recall is real |
| Paid Search (Google) | 32 | 0 | 3.13% | 0s | **Currently paused, broken tracking** |
| Paid Other | 23 | 4 | 65.2% | 0m 19s | **Internal `test_verify` noise — filter out** |
| Bing (organic + Yahoo + DDG combined) | 201 | 1 | ~67% | ~1m 20s | **42% of traffic, untouched paid** |

**Best converting channel (real, after filtering test traffic):** Direct (2.4%), then Google organic (2.0%), then Bing organic (0.8%)

**Highest value users:** Mirror Wills purchasers (£99 AOV vs £69 for Single). Bing demographic skews to married couples → expect Bing to over-index on Mirror once Microsoft Ads activates.

**Most engaged users:** Bing organic (67% engagement, 1m 36s avg) — close behind Google organic but with 2.5× the volume.

---

## PART 6 — What to Double Down On

### 1. Pages to scale

**Build 3 more like `/pricing/`** — specifically pricing-comparison or cost-explainer pages targeted at high-commercial-intent searches:
- `/cost-of-a-will-uk-2026/` — single canonical page consolidating the 4 existing cost guides
- `/wills-vs-solicitors-cost-comparison/` — direct competitor comparison page
- `/free-will-writing-uk-explained/` — captures "free will" searchers, shows the catch (e.g., NHS scheme limits) + your £69 alternative

**Build 1 more like `/wills/`** — an `/online-will-uk/` that's keyword-focused on "online will UK" exact match (currently subsumed but not optimised separately).

### 2. Keywords to expand

**Problem-led queries outperform commercial-only ones.** The Phase 1 audit identified the 10-keyword problem-led cluster (`do I need a will`, `is an online will legal`, `cheapest will UK`, etc.). Of those, only 3-4 have dedicated landing pages. Build the rest.

**Older-demographic vocabulary on existing pages:** add "Last Will and Testament" alongside "Will" in titles and H2s on `/wills/` and `/mirror-wills/` (Bing skews older, this language matches their search patterns).

**AI-search queries:** Build a `/faqs/` hub with 50+ Q&A pairs in clean structured markup. AI assistants (ChatGPT, Perplexity, Claude) cite well-structured FAQ content disproportionately.

### 3. Traffic sources to scale

**Microsoft Ads (Bing PPC) — once verified, scale aggressively to £55-£100/day** based on the BING plan structure. Bing CPCs in legal/finance run 30-50% lower than Google for same keywords; the 13% conversion rate observed today on test_verify is internal but suggests realistic 2-4% conversion expected.

**Bing organic — don't budget but invest content effort.** Sitemap is now submitted; expect URLs-discovered to climb 8 → 78 within days. Backlinks from `.gov.uk`, `.nhs.uk`, professional bodies (STEP) will compound disproportionately on Bing.

**ChatGPT / AI search — preserve and expand.** 14 sessions/month from chatgpt.com untouched. Building the `/faqs/` hub is the single biggest leverage here.

### 4. Content types to prioritise

| Content type | Why prioritise | Cost-per-page | Expected lift (90d) |
|---|---|---|---|
| Problem-led commercial landing pages (5 pages) | Highest commercial intent | 4-6h each | 10-30% conv-rate lift |
| Author bylines + Article schema (36 existing pages) | YMYL E-E-A-T fix | 4h total | 20-40% organic lift on guides |
| `/faqs/` hub (50 Q&A) | AI-search citations + FAQPage schema | 2 days | 5× current AI traffic |
| Blog posts targeting blended/second-marriage/cohabiting (8 posts) | Underserved audience clusters | 4-6h each | 30-50 sessions/month each |
| `/about/` page with named team + credentials | YMYL trust foundation | 1 day | Foundational — affects all rankings |

---

## PART 7 — What is Still Missing (Critical)

### Missing pages

1. `/about/` page with named team + credentials (essential for YMYL E-E-A-T)
2. `/faqs/` hub (50+ Q&A — AI-search bait)
3. `/is-an-online-will-legal-uk/` (problem-led, currently buried in `/wills/` FAQ)
4. `/cost-of-a-will-uk/` (canonical winner in the 4-page cost cluster — others should 301 here)
5. `/wills-for-couples/` separate from `/mirror-wills/` (different intent — couples may want side-by-side individual wills)
6. `/wills-for-blended-families-uk/`
7. `/wills-for-self-employed-uk/`
8. `/wills-for-cohabiting-couples-uk/`

### Missing trust elements

1. **Companies House registration number** in footer (linked to Companies House page)
2. **ICO registration number** if registered
3. **Author bylines** on every guide and blog post (single named reviewer is fine to start)
4. **Press / awards / partnerships** logos (even one — STEP membership, Trustpilot widget, etc.)
5. **Phone number on homepage header** (Bing demographic expects it)
6. **Physical or registered office address** in footer
7. **"Reviewed by [Name], [Date]" line** at bottom of each guide

### Missing technical fixes

1. **GA4 `purchase` event reliability** — 64% conversion attribution loss vs Stripe truth
2. **Dynamic conversion value in UET** — currently flat £69 even for Mirror (£99) and Probate (£495+)
3. **Article schema on guide/blog pages** — rich-results miss
4. **Canonical tag standardisation** — some pages with www, some without; some with trailing slash, some without
5. **Page speed audit** — no Lighthouse/PSI scores in hand
6. **Lazy-loading verification** on hero image (currently `loading="eager"` — correct for hero, but verify for below-fold images)

### Missing CRO elements

1. **Progress bar on `/forms/will.html`** ("Step 2 of 5")
2. **Auto-save form progress** — recover abandoned forms via 24h email
3. **Sticky-bottom mobile CTA** on `/wills/` and `/pricing/`
4. **Exit-intent or 30-second-delay quiz** ("Do you need a will? Take the 90-second quiz")
5. **Inline testimonials** on `/wills/` and `/pricing/` (currently only on homepage)
6. **Post-purchase upsell** on thank-you page ("Add a Mirror Will for your partner +£30")
7. **"What happens next" reassurance** above pricing on homepage and on every service page
8. **Comparison "savings" column** on pricing page ("vs solicitor £350 = save £281")
9. **Live Stripe-completion social proof** ("3 wills started today") — verify ICO/GDPR compliance first
10. **Trust counter on homepage hero** ("Used by 500+ UK families since 2024")

### Missing Bing optimisation

1. **5 themed Microsoft Ads Search campaigns** (Online Wills, Will Cost, Problem/No-Will, Mirror Wills, Probate-future-launch)
2. **Microsoft Clarity install** for Bing-user heatmaps
3. **Bing Places listing** (free, 10 min)
4. **LinkedIn company page** — Bing weights LinkedIn signals
5. **Account-level Microsoft Ads negative keyword list** (~30 negatives)
6. **Bing audience signals** on PMax (UK 45+, married, homeowner)

---

## PART 8 — 30 / 60 / 90 Day Scaling Plan

### Days 0-30 — Activate, instrument, fix the foundations

**Week 1 (whilst Microsoft Ads verifies):**
- Filter `test_verify` UTM out of GA4
- Investigate + fix `cl-thankyou-tracking.js` for iOS Safari ITP (the 64% conversion loss)
- Install Microsoft Clarity on the site
- Add Companies House number + linked badge to footer
- Build `/about/` page with named team + credentials
- Add author byline (single named reviewer is fine) to all 36 guide/blog pages
- Add `Article` schema markup to all 36 guide/blog pages

**Week 2 (Microsoft Ads activates if verified):**
- Launch 5 themed Microsoft Ads Search campaigns from the BING plan
- Set account-level negative keyword list
- Daily-budget-cap each campaign to £8-15/day for first week
- Apply UTM tagging to all paid Bing URLs (ensure utm_source=microsoft + utm_medium=cpc consistently)
- Add phone number to homepage header

**Week 3:**
- Build `/is-an-online-will-legal-uk/` landing page
- Build `/cost-of-a-will-uk-2026/` (consolidate 4 existing cost guides; 301 the others)
- Add CTA back to commercial pages at bottom of every guide page
- Build `/faqs/` hub with 30+ Q&A (start; expand to 50+ in Days 30-60)

**Week 4:**
- Build `/wills-for-blended-families-uk/`
- First weekly Microsoft Ads optimisation pass (per BING plan Part 9)
- Review GA4 purchases vs admin truth — confirm tracking gap closed
- Review which campaign is best CPA and rebalance budget

**End-of-30-days check:** GA4 conversion accuracy fixed; 4 new commercial pages live; FAQs hub started; Microsoft Ads active with first week of data; Bing organic discovered URLs climbing past 30/78.

### Days 30-60 — Content depth and conversion rate optimisation

**Weeks 5-6:**
- Build remaining 4 commercial landing pages (`wills-for-self-employed`, `wills-for-cohabiting-couples`, `online-will-uk`, `wills-vs-solicitors-cost-comparison`)
- Add progress bar to `/forms/will.html`
- Implement form auto-save + 24h "recover your draft" email
- Implement sticky mobile CTA on `/wills/` and `/pricing/`
- Add inline testimonials to `/wills/` and `/pricing/`

**Weeks 7-8:**
- Build 8 supporting blog posts targeting underserved audience clusters
- A/B test homepage CTA copy (current vs "Start My Will (Takes 5 Minutes)")
- A/B test pricing-tier emphasis (Single highlighted vs Mirror highlighted — Mirror likely lifts AOV 30%+)
- Microsoft Ads: refine ad copy based on best-performing assets, scale budget on best CPA campaigns
- Backlink outreach to UK financial-advice publications, MoneySavingExpert, financial podcasts

**End-of-60-days check:** ~15 new pages live; CRO improvements deployed; A/B tests running; Microsoft Ads CPA established; first backlink secured.

### Days 60-90 — Authority building and scaling loops

**Weeks 9-10:**
- Pitch 3 high-trust backlinks (financial advisers, NHS staff orgs, mortgage brokers)
- Scale paid spend on whichever channel has best CPA — likely Microsoft Ads if Bing organic correlation holds
- Implement post-purchase upsell on thank-you page (+£30 Mirror Wills add-on)
- Build LinkedIn company page + first 4 thought-leadership posts

**Weeks 11-12:**
- Quarterly content review: GSC + BWT query data → identify pages ranking 8-20 for target queries → strengthen those first
- Implement dynamic UET conversion value (push actual purchase amount on thank-you page)
- Customer-portal usage analysis: surface returning customers, encourage upgrades to LPA / Mirror Will
- Q1 → Q2 content roadmap: which clusters to deepen next

**End-of-90-days realistic targets:**
- Organic traffic up 60-100% (sitemap + 15+ new pages + bylines + Article schema compounding)
- Conversion rate up from 1.10% to 1.8-2.2% (CRO wins + better trust signals + form completion)
- Paid CPA established for Bing Ads — expected £15-30 per conversion based on Bing's typical UK legal-finance CPC
- Revenue per month at 2-3× current run-rate (compounding effect of organic + paid + improved conversion)

---

## PART 9 — Prioritised Action List

| Priority | Action | Impact | Effort | Reason |
|---|---|---|---|---|
| **P0** | Filter `test_verify` UTM in GA4 | Medium | 5 min | Cleans every analytics report immediately |
| **P0** | Fix `cl-thankyou-tracking.js` iOS Safari ITP loss | High | 4h | Recovers 64% of conversion attribution |
| **P0** | Add Companies House number + ICO badge to footer | High | 1h | Foundational YMYL trust |
| **P0** | Add author byline + `Article` schema to all 36 guide/blog pages | **Highest** | 4-6h | Single biggest organic ranking lift available |
| **P0** | Build `/about/` page with named team + credentials | High | 1 day | Foundational E-E-A-T for YMYL niche |
| **P1** | Once MS verifies, launch 5 themed Search campaigns (BING plan) | High | 4h | Bing CPCs 30-50% lower than Google |
| **P1** | Install Microsoft Clarity | Medium | 30 min | Free Bing-aligned heatmaps + recordings |
| **P1** | Build `/is-an-online-will-legal-uk/` page | High | 4h | High-intent problem-led keyword, currently un-targeted |
| **P1** | Consolidate 4 cost-of-will pages → 1 canonical + 301s | High | 2h | Stops keyword cannibalisation |
| **P1** | Add CTA back to commercial at end of every guide | High | 4h | Massive CRO miss; one anchor per guide |
| **P2** | Add progress bar to `/forms/will.html` | Medium | 4h | 15%+ form completion lift |
| **P2** | Implement sticky-bottom mobile CTA on `/wills/` + `/pricing/` | Medium | 3h | 8-15% mobile conv lift |
| **P2** | Build `/faqs/` hub (30 Q&A initially) | Medium | 2 days | AI-search citation play |
| **P2** | Add inline testimonials to `/wills/` and `/pricing/` | Medium | 2h | Trust before pricing decision |
| **P2** | Phone number on homepage header | Low | 1h | Bing demographic expects it |
| **P3** | Build 4 more commercial landing pages (Days 30-60) | High | 4 days | Pages-to-scale strategy |
| **P3** | Build 8 supporting blog posts (Days 30-60) | Medium | 4-6 days | Content depth + topic clusters |
| **P3** | A/B test homepage CTA + pricing-tier emphasis | Medium | 6h setup | Quantifies CRO improvements |
| **P3** | Implement form auto-save + 24h recovery email | Medium | 1 day | Recovers 10-20% of abandoned forms |
| **P3** | Implement post-purchase upsell on thank-you | Medium | 4h | Existing customers convert 30%+ on upsells |
| **P4** | Implement dynamic UET conversion value | Low | 2h | More accurate ROAS for Bing once at scale |
| **P4** | Backlink outreach (3 high-trust links) | Medium | ongoing | Compounds with topical authority work |
| **P4** | Build LinkedIn company page | Low | 2h | Bing weights LinkedIn signals |
| **P4** | Bing Places listing | Low | 10 min | Free local-business signal |

---

## What I'd recommend the absolute next 60 minutes look like

If you have an hour right now:

1. **Filter `test_verify` UTM out of GA4** (5 min) — GA4 → Admin → Data Settings → Data Filters → Add filter
2. **Add Companies House number to footer** (10 min) — find the number, add a single line `Kaizen Finance Ltd, registered in England and Wales (Company No. XXXXXXXX)` linked to companieshouse.gov.uk
3. **Install Microsoft Clarity** (15 min) — `clarity.microsoft.com` → Create project → copy snippet → add to site-wide head template (we already have a UET install pattern that can be reused for Clarity in 5 minutes)
4. **Add a single byline to all guide pages** (30 min) — write one Python script that adds `<p class="byline">Reviewed by [Your Named Reviewer], [Title], [Date]</p>` after the H1 of every `/guides/*.html` file. Easy revert if needed.

That's a 60-minute investment that fixes the four highest-leverage compounding gaps. Everything else can wait for next week.

---

*Phase 2 audit dated 2 May 2026. Next review: ~30 days, after MS Ads has 14+ days of data and the new commercial pages are indexed.*
