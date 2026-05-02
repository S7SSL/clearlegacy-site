# Clear Legacy — Bing Growth Plan: Microsoft Ads + Bing SEO
**Date:** 1 May 2026
**Companion to:** `AUDIT-2026-05-01-Clear-Legacy.md` (read that first for site/SEO context)
**Period analysed:** 3 Apr – 30 Apr 2026 (28 days, GA4)

---

## Headline

**Bing-family search engines (Bing + Yahoo + DuckDuckGo, all using the Bing index) are already your largest single search-engine cluster — 201 sessions in 28 days versus Google's 49 organic — yet you spend £0 on Microsoft Ads and have not verified Bing Webmaster Tools.** Closing this gap is the biggest, cheapest growth lever available.

The plan below is the execution layer for that thesis: campaign structure, keyword lists, negatives, ad copy, the seven highest-priority SEO pages to build, and a 30-day rollout schedule.

---

## Part 1 — Bing Opportunity Assessment

### What we know from GA4 (last 28 days)

| Source / medium | Sessions | Engagement rate | Avg time | Events/session | Conv | Revenue |
|---|---|---|---|---|---|---|
| **bing / organic** | **125 (26%)** | 67.2% | 1m 36s | 4.38 | 1 | £69 |
| uk.search.yahoo.com / referral | 48 (10%) | 66.7% | 1m 12s | 4.25 | 0 | £0 |
| duckduckgo / organic | 28 (6%) | 67.9% | 1m 10s | 3.96 | 0 | £0 |
| **Bing-family TOTAL** | **201 (42%)** | **~67%** | — | — | **1** | **£69** |
| google / organic | 49 (10%) | 63.3% | 2m 26s | 5.59 | 1 | £99 |
| google / cpc | 32 (7%) | 3.13% | 0s | 2.88 | 0 | £0 |
| **Google-family TOTAL** | **89 (19%)** | — | — | — | **1** | **£99** |

**Direct answers to your questions:**

1. **How much traffic from Bing?** 201 sessions in 28 days from the Bing index family (Bing + Yahoo + DDG). 42% of all site traffic.
2. **Organic, paid, or both?** 100% organic. Microsoft Ads is not running.
3. **Best Bing landing pages?** Need a `landingPagePath × sessionSourceMedium` GA4 explorer to confirm — request below in "data gaps". Almost certainly the homepage and `/wills/` based on overall page-views distribution.
4. **Best-converting Bing landing page?** With only 1 conversion in 28d for Bing organic, the data is too thin for reliable per-page conv-rate. The single conversion was a Single Will £69 — likely from homepage or `/wills/`.
5. **Bing engagement rate vs Google?** 67.2% (Bing) vs 63.3% (Google organic). Bing engages ~4 percentage points better.
6. **Bing conversion rate vs Google?** Bing organic 0.80%, Google organic 2.04% (1 conv each, sample sizes 125 and 49). Google's conv-rate is higher per session but Bing has 2.5× the volume — Bing brings more total purchases at scale.
7. **Cost per conversion?** Bing: £0 (organic only — free). Google Ads: 32 sessions × £? CPC and 0 conversions = effectively infinite CPA. Microsoft Ads CPA: unknown until launched, but UK Microsoft Ads CPCs in legal/finance niches typically run 30–50% lower than Google for the same keywords.
8. **Devices?** Need GA4 `deviceCategory × sessionSourceMedium` slice. **Hypothesis based on UK demographics:** Bing skews materially desktop (Windows + Edge), 60–70% desktop, while Google skews mobile, 65–75% mobile.
9. **More desktop-heavy?** Yes, almost certainly — see (8). Will writing benefits from desktop completion (form is long-ish), so this is a *positive* for conversion.
10. **Spending longer on site?** Bing 1m 36s vs Google 2m 26s — Google users spend ~50s longer per session. Bing users decide faster (consistent with older, more decisive demographic).

### Bing landing-page action list

Until we slice landing-page-by-source in GA4, the safe bet based on overall traffic distribution + Bing user behaviour:

**Pages to double down on for Bing:**
- `/` (homepage) — top entry point, already has good trust badges + £69 anchor
- `/wills/` — direct intent for "will writing UK" queries
- `/pricing/` — older Bing demographic price-shops; transparent pricing wins
- `/mirror-wills/` — older married couples are core Bing audience

**Pages to fix for Bing:**
- `/guides/` and `/blog/` — currently weak meta titles/descriptions, no Article schema, no author bylines. Bing's algorithm rewards exact-match titles + clear structure more aggressively than Google. Today these pages are leaving impressions on the table.
- `/forms/will.html` — form length might be a friction point for older users; recommend a progress bar (also in main audit).

---

## Part 2 — Microsoft Ads Campaign Structure

Five campaigns, each tightly themed for match-type discipline and clean attribution. Set up under one shared budget, then split as performance data arrives.

### Campaign 1 — Online Wills (commercial intent)

**Daily budget seed:** £15 (rebalance after week 2)
**Bid strategy:** Manual CPC initially → Enhanced CPC after 30 conversions → tCPA after 50.
**Target CPA:** £20 (single will £69 = 71% gross margin = up to £49 CPA breakeven; £20 = cushioned target)
**Landing page:** `/wills/` (or new `/online-will-uk/` once built — see Part 7)

| Match type | Keyword |
|---|---|
| Phrase | "online will UK" |
| Phrase | "make a will online" |
| Phrase | "write a will online" |
| Phrase | "create a will online" |
| Phrase | "online will service" |
| Phrase | "online will writing service" |
| Phrase | "legal will online UK" |
| Phrase | "simple will online" |
| Phrase | "affordable will UK" |
| Phrase | "cheap will UK" |
| Phrase | "will writing service UK" |
| Exact | [online will uk] |
| Exact | [make a will online uk] |
| Exact | [write a will online uk] |
| Exact | [will writing service uk] |

**Ad-group split:** "Online Will" / "Cheap Will" / "Will Writing Service" (3 ad groups, keywords distributed by intent flavour).

### Campaign 2 — Will Cost / Pricing (price-led intent)

**Daily budget seed:** £10
**Landing page:** `/pricing/` or new `/how-much-does-a-will-cost-uk/`

| Match type | Keyword |
|---|---|
| Phrase | "how much does a will cost UK" |
| Phrase | "solicitor will cost UK" |
| Phrase | "online will cost UK" |
| Phrase | "cheap will writing service" |
| Phrase | "affordable will writing service" |
| Phrase | "will writing from £69" |
| Phrase | "fixed price will UK" |
| Phrase | "will writing prices UK" |
| Exact | [how much is a will uk] |
| Exact | [will cost uk] |
| Exact | [will price uk] |

### Campaign 3 — Problem / Urgency (educational intent → conversion)

**Daily budget seed:** £10
**Landing page:** new `/what-happens-if-you-die-without-a-will-uk/` (priority build — see Part 7)

| Match type | Keyword |
|---|---|
| Phrase | "what happens if you die without a will UK" |
| Phrase | "dying without a will UK" |
| Phrase | "no will what happens" |
| Phrase | "intestacy rules UK" |
| Phrase | "what happens without a will" |
| Phrase | "do I need a will UK" |
| Phrase | "why do I need a will" |
| Phrase | "is a will necessary UK" |
| Phrase | "should I have a will UK" |
| Exact | [do i need a will uk] |
| Exact | [intestacy uk] |

### Campaign 4 — Mirror Wills (couples / family)

**Daily budget seed:** £8
**Landing page:** `/mirror-wills/` (or new `/mirror-wills-uk/`)

| Match type | Keyword |
|---|---|
| Phrase | "mirror wills UK" |
| Phrase | "mirror will online" |
| Phrase | "mirror will cost UK" |
| Phrase | "joint wills UK" |
| Phrase | "wills for couples UK" |
| Phrase | "husband and wife wills UK" |
| Phrase | "couples wills UK" |
| Exact | [mirror wills uk] |
| Exact | [wills for couples uk] |

### Campaign 5 — Probate (highest-AOV product)

**Daily budget seed:** £12 (higher because £495+ AOV justifies more)
**Landing page:** `/probate/` (or new `/probate-help-uk/`)

| Match type | Keyword |
|---|---|
| Phrase | "probate help UK" |
| Phrase | "probate application help" |
| Phrase | "probate cost UK" |
| Phrase | "how long does probate take UK" |
| Phrase | "do I need probate" |
| Phrase | "probate service UK" |
| Phrase | "probate support UK" |
| Phrase | "grant of probate UK" |
| Phrase | "PA1A form help" |
| Phrase | "PA1P form help" |
| Exact | [probate help uk] |
| Exact | [probate cost uk] |
| Exact | [probate service uk] |

**Total seed daily budget:** £55/day = ~£1,650/month. Re-balance every 7 days.

---

## Part 3 — Negative Keywords (account-level shared list)

Apply these as account-level negatives so all five campaigns inherit them.

### Always-block negatives (broad match)

```
free
+free
template
templates
pdf
sample
samples
example
examples
download
blank
form
forms
job
jobs
career
careers
salary
salaries
training
course
courses
class
classes
meaning
definition
definitions
tutorial
how to write a will yourself
do it yourself will
diy will
charity
charity will
solicitor jobs
paralegal jobs
will writer jobs
law degree
law student
ireland
scotland
scottish
wales only
republic of ireland
```

**Note:** Welsh Wills are still our market (England & Wales jurisdiction), so don't block "wales" — only block "wales only" or specific Welsh-search exclusions if Welsh language queries appear.

### Conditional negatives — review weekly

If you start seeing wasted spend on:
- "muslim will UK", "islamic will UK", "sharia will" — add as negatives only if you don't serve those (currently you do, via the standard England & Wales template).
- "trust deed", "trust fund", "asset protection trust" — add if traffic is converting at < 0.5% conversion rate (these are higher-net-worth queries that probably need bespoke, not online).
- Any place names outside UK (e.g. "online will USA", "make a will Australia") — add negatives for non-UK geos as they appear.

### Search-term review cadence

Every Monday, pull the previous 7 days of search terms (Microsoft Ads → Reports → Search Terms). For each term:
- < 5 clicks, no conversions: ignore (too thin to action)
- ≥ 5 clicks, no conversions, irrelevant intent: add as negative
- ≥ 5 clicks, no conversions, relevant intent: keep watching, examine landing-page mismatch
- Converting: promote to its own keyword in the matching campaign

---

## Part 4 — Microsoft Ads Ad Copy

Each ad group should run 3–5 Responsive Search Ads (RSAs). Below: starter headlines and descriptions per theme. Microsoft Ads RSAs accept up to 15 headlines and 4 descriptions; the auto-rotation will optimise.

### Ad Set A — Price + Simplicity (Campaigns 1, 2)

**Headlines (15 — Microsoft Ads RSA accepts up to this):**
1. Online Wills From £69
2. Make Your Will Online Today
3. Simple UK Will Service
4. Wills From £69 — Fixed Fees
5. ClearLegacy: Wills From £69
6. Will Writing Service UK £69
7. Online Will In 20 Minutes
8. UK Wills, Done Right
9. Legally Valid UK Wills £69
10. Affordable Will Writing UK
11. No Solicitor Needed — £69
12. Fixed Price Wills From £69
13. Start Your Will Today £69
14. Cheap, Legal Wills UK
15. Wills Without The Solicitor Bill

**Descriptions (4):**
1. Create your will online with ClearLegacy. Simple, clear and affordable from £69. Start today and protect your family's future.
2. Fixed-fee wills from £69. Legally valid in England & Wales. Expert reviewed in 24 hours. No solicitor mark-up. No hidden costs.
3. UK's most affordable will service. From £69 for a single will, £99 for mirror wills. Compliant with the Wills Act 1837.
4. Avoid the £350+ solicitor bill. ClearLegacy wills from £69, ready in under 24 hours, fully legal in England & Wales.

**Final URL paths (Path1/Path2):** `wills` / `from-69`

### Ad Set B — Family Protection (Campaigns 1, 4)

**Headlines:**
1. Protect Your Family Today
2. Don't Leave Things Unclear
3. Make Your Wishes Known
4. Wills That Protect Your Family
5. Create A Will Online — £69
6. ClearLegacy UK Wills
7. UK Wills For Peace Of Mind
8. Make Your Will In 20 Minutes
9. Mirror Wills For Couples £99
10. Husband & Wife Wills £99
11. Wills That Avoid Family Disputes
12. Clear Wills, Clear Wishes
13. Stop Family Inheritance Stress
14. Plan For Your Family's Future
15. Online Wills, Trusted By UK

**Descriptions:**
1. A clear will helps avoid confusion, delays and stress for your family. Start your ClearLegacy will online today.
2. Make your wishes binding and legally valid. Fixed fee from £69. Reviewed within 24 hours. No solicitor needed.
3. Protect those who matter most. Online wills written for UK families. Single £69. Mirror £99. Start in minutes.
4. Don't leave your family guessing. ClearLegacy creates your legally valid will online — fast, fixed-fee, fully UK-compliant.

**Path1/Path2:** `wills` / `protect-family`

### Ad Set C — Urgency / No Will (Campaign 3)

**Headlines:**
1. No Will? Act Today
2. What Happens Without A Will?
3. Avoid Family Confusion
4. Put Your Wishes In Writing
5. Start Your Will Online — £69
6. Don't Leave It To Intestacy Law
7. Without A Will, The State Decides
8. Don't Risk Family Disputes
9. Create A Will Today — £69
10. UK Intestacy Rules Are Strict
11. Protect Your Loved Ones Now
12. Stop Worrying — Make A Will
13. Two-Thirds Of UK Adults Have No Will
14. Don't Be Part Of The 60%
15. Get Your Will Done Today £69

**Descriptions:**
1. Without a will, your estate may not pass how you expect. ClearLegacy helps you put things in place simply, from £69.
2. UK intestacy rules can leave assets to the wrong people. Don't risk it. Create your will online in 20 minutes.
3. 60% of UK adults have no will. Don't be one of them. Make yours from £69, legally valid in England & Wales.
4. Protect your family from probate complications. Get a clear, valid will sorted today. From £69. Reviewed in 24 hours.

**Path1/Path2:** `wills` / `act-today`

### Ad Set D — Mirror Wills / Couples (Campaign 4)

**Headlines:**
1. Mirror Wills For Couples £99
2. Wills For Husband & Wife
3. Create Mirror Wills Online
4. Protect Each Other £99
5. Couples' Wills Made Simple
6. UK Mirror Wills £99
7. Wills For Married Couples
8. Wills For Cohabiting Couples
9. Mirror Wills In 20 Minutes
10. Save £400+ Vs Solicitors
11. Mirror Wills, Done Right
12. Pair Of Wills £99 Total
13. Two Wills, One Price £99
14. Spouses' Wills From £99
15. Joint Will Writing UK

**Descriptions:**
1. Create mirror wills online with ClearLegacy. £99 for both spouses, designed for couples who want clarity.
2. Mirror wills for £99 total — one fixed fee for both partners. Legally valid in England & Wales. Reviewed in 24 hours.
3. Couples save hundreds vs high-street solicitors. Both wills, one £99 fee. Mirror structure, fully customised.
4. Protect each other. ClearLegacy mirror wills £99 for the pair. Legal, fast, UK-specific.

**Path1/Path2:** `mirror-wills` / `couples`

### Ad Set E — Probate (Campaign 5)

**Headlines:**
1. Probate Help UK From £495
2. Probate Made Simple
3. Probate Application Help
4. Grant Of Probate Service
5. UK Probate From £495
6. Need Probate? We Help
7. Probate Without The Solicitor
8. Affordable Probate Help UK
9. PA1A & PA1P Form Help
10. Probate Service From £495
11. Probate Done For You
12. Help With Probate Forms
13. Probate Support UK
14. Probate Without The Stress
15. ClearLegacy Probate Service

**Descriptions:**
1. Probate help when you need it most. ClearLegacy guides you through application, valuation and forms from £495.
2. Avoid £3,000+ solicitor probate fees. ClearLegacy probate from £495. Forms, valuations and step-by-step support.
3. Lost a loved one? We'll help you through probate. Fixed fees from £495. UK-only. Compassionate, clear, professional.
4. Need a Grant of Probate? ClearLegacy handles forms, valuations and HMRC paperwork from £495.

**Path1/Path2:** `probate` / `support`

### Ad Extensions (account-level, applies to all campaigns)

- **Sitelinks (4–6):**
  - "Single Wills £69" → `/wills/`
  - "Mirror Wills £99" → `/mirror-wills/`
  - "LPA From £95" → `/lasting-power-of-attorney/`
  - "Probate £495+" → `/probate/`
  - "Pricing & FAQs" → `/pricing/`
  - "Free Guides" → `/guides/`
- **Callouts:** "Fixed Fees", "No Hidden Costs", "Reviewed In 24 Hours", "Legally Valid UK", "Made For UK Families"
- **Structured snippets:** Service catalog → "Single Wills, Mirror Wills, Lasting Power of Attorney, Probate, Estate Planning"
- **Call extension:** `+44 7707 071984` (already on NHS page schema)
- **Location extension:** Kaizen Finance Ltd registered address (verify and add)

---

## Part 5 — Landing Page Recommendations for Bing Users

(Cross-referenced with the main audit's CRO section — read both.)

**Bing audience signals (older, more desktop, higher trust threshold):**

Audit each landing page against this 12-point checklist. Score 0/1 per item; aim for 11+/12.

1. ☐ Clear headline — what we do, who for, in 6 words
2. ☐ Price visible above the fold (£69 anchor visible without scroll)
3. ☐ Simple "how it works" in 3–4 steps
4. ☐ Trust signals visible above fold (review stars, badges, "since 20XX")
5. ☐ "England & Wales" / "UK" mentioned in hero
6. ☐ Phone number visible in header (Bing audience wants phone option)
7. ☐ FAQs section addressing legality, refunds, hidden fees
8. ☐ At least 2 named testimonials with quote
9. ☐ "What happens after I pay?" reassurance section
10. ☐ Wills Act 1837 / legality reassurance
11. ☐ Stripe / payment-security badges
12. ☐ Body copy ≥ 16px, line-height ≥ 1.5 (older users need readability)

**Headline A/B test ideas (for `/` and `/wills/`):**

A. Your Will, Done Right. From £69. (current)
B. Create Your UK Will Online From £69
C. Protect Your Family With A Clear, Legal Will
D. Simple Online Wills For UK Families
E. Make Your Will Today — Fast, Clear, Affordable

**CTA copy A/B test:**
A. Start Your Will Today (current)
B. Create My Will
C. Protect My Family
D. Get Started From £69
E. Make My Will Online

Run 2-variant tests (A vs winner-of-rest) to limit traffic dilution.

---

## Part 6 — Bing SEO Plan

### 6A. Bing Webmaster Tools

**This week:**
- Verify the site at `bing.com/webmasters` (HTML meta-tag verification — homepage already has `<meta name="msvalidate.01" content="0E5D9741E7AB69619EBD8ADE6BE7B284" />`, so verification token is in place; just confirm in the BWT UI that it's connected to the right account)
- Submit `https://www.clearlegacy.co.uk/sitemap.xml` (after the sitemap rebuild from the main audit's priority #1)
- Connect Microsoft Clarity (free heatmaps + session recording — invaluable for Bing-user behaviour insight) — uses the same MS account
- Import Google Search Console data into BWT (one-click in BWT — saves doing keyword research twice)

**Weekly check (15 min):**
- Crawl errors → fix any 5xx/404s
- Indexing status → confirm new pages indexed
- Backlinks → look for new referring domains
- Top queries → identify rising queries to expand into

### 6B. On-page Bing optimisation

Bing's algorithm rewards exact-match keywords and clear structure more aggressively than Google's. Concrete actions:

1. **Title tags must contain the exact-match keyword.** Your homepage title "Will Writing Service UK | Online Wills from £69 | ClearLegacy" hits "will writing service UK" exactly — good. `/wills/`'s title hits "Write a Will Online UK" — good. Audit `/guides/` and `/blog/` to add their primary keywords.
2. **H1 should match the title's keyword as closely as possible.** Currently `/blog/`'s H1 is "Wills & Estate Planning Guides" — generic. Change to "UK Wills & Estate Planning Guides — Plain English" to hit the exact-match.
3. **Keyword in first 100 words.** On every page, the primary keyword should appear in the opening paragraph naturally.
4. **FAQ schema everywhere.** You already have it on commercial pages — extend to every guide and blog post.
5. **Bing crawls JavaScript poorly.** Confirm that your hero text, CTAs, and key content render server-side (not injected by JS). Looking at the homepage HTML, content is fully server-rendered — good.
6. **Backlinks weight matters more on Bing.** Target backlinks from `.gov.uk`, `.nhs.uk`, `.ac.uk`, professional bodies (STEP — Society of Trust and Estate Practitioners). Even a single high-trust link can move multiple keywords.

### 6C. Bing-specific ranking signals

- **Microsoft ecosystem citations:** Get listed in Bing Places (the Bing equivalent of Google My Business). Currently free. Adds local-business signals.
- **LinkedIn company page:** Bing values LinkedIn signals more than Google. If you don't have a Kaizen Finance Ltd / Clear Legacy company page on LinkedIn, create one.
- **Wikipedia / Wikidata:** A Wikidata entry for "Kaizen Finance Ltd" (notable enough? probably not yet) is a future play. For now, ensure the Companies House page links to clearlegacy.co.uk.
- **Older domain trust:** clearlegacy.co.uk is presumably 1–2 years old. Bing weights domain age. Time helps; don't migrate.

---

## Part 7 — SEO Pages To Build First (7 priority pages)

These map onto the same 7 Sat called out, with execution detail per page.

### 1. `/online-will-uk/`
- **Primary keyword:** online will UK
- **Title (max 60 chars):** Online Will UK | Legally Valid Online Wills From £69
- **H1:** Make Your Online Will In The UK — From £69
- **Meta description (150 chars):** Create your legally valid UK will online from £69. Reviewed within 24 hours. Wills Act 1837 compliant. Single & mirror wills available.
- **Word count:** 1,000–1,500
- **Schema:** `Service` + `FAQPage` (5 FAQs) + `BreadcrumbList`
- **Sections:** Hero (price + CTA + trust badges) → How it works (3 steps) → What's included → Comparison vs solicitors → Reviews → FAQs → Final CTA
- **Internal links:** to `/wills/`, `/mirror-wills/`, `/pricing/`, `/guides/write-a-will-online-uk/`

### 2. `/make-a-will-online/`
- **Primary keyword:** make a will online (UK)
- **Title:** Make A Will Online UK — Simple Wills From £69 | ClearLegacy
- **H1:** Make A Will Online In The UK
- **Meta:** Make your will online in 20 minutes. Fixed fee from £69. Legally valid in England and Wales. No solicitor required.
- Same template as page 1, different keyword angle. Cross-link to page 1.

### 3. `/what-happens-if-you-die-without-a-will-uk/`
- **Primary keyword:** what happens if you die without a will UK
- **Title:** What Happens If You Die Without A Will In The UK? (2026 Guide)
- **H1:** What Happens If You Die Without A Will In The UK?
- **Meta:** UK intestacy rules explained: who inherits, what happens to your home, how to avoid family disputes. Get your will from £69 today.
- **Word count:** 1,800–2,500 (informational depth needed)
- **Schema:** `Article` + `FAQPage` (8 FAQs) + `BreadcrumbList`
- **Sections:** Quick answer → Intestacy table by family situation (married, unmarried, with kids, no kids) → What happens to property/pension/business → Family disputes → How to avoid → CTA "Make your will from £69"
- **Most likely page to rank for "do I need a will UK" too** — secondary keyword optimisation
- **This is the highest-priority informational page** — high search volume, urgent emotion, clear CTA path

### 4. `/mirror-wills-uk/`
- **Primary keyword:** mirror wills UK
- **Title:** Mirror Wills UK — Couples' Wills From £99 | ClearLegacy
- **H1:** Mirror Wills For UK Couples — £99 For Both
- **Meta:** Mirror wills £99 for both spouses. Legally valid in England & Wales. Designed for couples. Reviewed in 24 hours.
- This is a **decision page** — keep concise (700–1,000 words), price-led, with strong CTA
- Link back to `/mirror-wills/` (existing hub) — possibly merge if the existing page underperforms

### 5. `/how-much-does-a-will-cost-uk/`
- **Primary keyword:** how much does a will cost UK
- **Title:** How Much Does A Will Cost In The UK? (2026 Guide)
- **H1:** How Much Does A Will Cost In The UK?
- **Meta:** Will costs in the UK 2026: solicitors £150–£500, online services £40–£100, ClearLegacy from £69. Fixed-fee comparison.
- **Sections:** Average cost table → DIY £0–£20 → Online services £40–£100 → Solicitors £150–£500 → Hidden costs to watch for → ClearLegacy at £69 → "Get yours from £69" CTA
- **Schema:** `Article` + `FAQPage`
- May overlap with existing `/guides/will-cost-uk.html` and `/blog/how-much-does-a-will-cost/` — **decide canonical** before publishing (recommend canonical = this new page; 301 the others)

### 6. `/is-an-online-will-legal-uk/`
- **Primary keyword:** is an online will legal UK
- **Title:** Is An Online Will Legal In The UK? (2026 Answer)
- **H1:** Yes — Online Wills Are Legal In The UK
- **Meta:** Online wills are legally valid in England & Wales when properly signed and witnessed. Wills Act 1837 compliant. From £69 with ClearLegacy.
- **Sections:** Quick answer (yes, with conditions) → Wills Act 1837 explained → Witness requirements → How ClearLegacy ensures legality → Common myths → CTA
- **High-trust page** — must include solicitor/legal-professional byline (E-E-A-T critical)

### 7. `/probate-help-uk/`
- **Primary keyword:** probate help UK
- **Title:** Probate Help UK — Get Probate Support From £495 | ClearLegacy
- **H1:** Need Probate Help In The UK? We Make It Simple.
- **Meta:** UK probate help from £495. PA1A and PA1P forms, valuations, HMRC paperwork. Save £2,000+ vs solicitors. Step-by-step support.
- **Sections:** Hero with empathy ("losing someone is hard — we make probate simple") → What is probate / when is it needed → Our 3-step process → Pricing tiers (£495 forms-only, £1,995 standard, £2,995+ complex) → Reviews → FAQs → CTA
- **Schema:** `Service` + `FAQPage` + `BreadcrumbList`
- **Highest-AOV page** — invest in design and copy. Add a phone number prominently — bereaved families want a human voice option.

**Build order recommendation:**

Week 1: pages 3, 6, 7 (highest impact — informational depth + probate AOV)
Week 2: pages 1, 5 (commercial volume)
Week 3: pages 2, 4 (variants of existing strong pages)

---

## Part 8 — GA4 / Microsoft Ads Decision Framework

Apply this every Monday after week 4 of running Microsoft Ads.

### Double spend if (any 2 of these are true)

- Bing campaign conversion rate > Google campaign conversion rate (within same theme)
- Bing CPA < Google CPA (within same theme)
- Bing engagement rate > 60%
- Avg session duration > 1m 30s on key pages
- Assisted-conversions report shows Bing in 20%+ of multi-touch paths

### Fix before scaling if

- Bounce rate > 60% on landing page
- Bing users land on irrelevant page (search-term mismatch)
- Pricing not visible above the fold
- Mobile conversion rate < 50% of desktop
- Form-page exit rate > 70% on `/forms/will.html`

### Cut or pause if

- Keyword has > £40 spend in 14 days, 0 conversions
- Search-terms report shows > 50% irrelevant queries
- Geo report shows > 30% non-UK clicks
- Device segment converts < 0.3% over 100+ clicks

---

## Part 9 — Weekly Optimisation Routine (90 minutes / Monday)

1. **0:00 — Microsoft Ads Search Terms (15m)** — Reports → Search Terms (last 7 days). Add negatives, promote winners.
2. **0:15 — Negative keyword pass (10m)** — apply new negatives at account level.
3. **0:25 — Budget rebalance (10m)** — increase budget on top-3 by ROAS, decrease on bottom-3 by CPA.
4. **0:35 — Pause poor keywords (5m)** — anything > £30 spent + 0 conversions in 14 days → pause.
5. **0:40 — Bing landing page conv-rate review (10m)** — GA4 → Reports → Engagement → Landing page, filtered to `bing/cpc`.
6. **0:50 — Desktop vs mobile split (5m)** — GA4 → Reports → Tech → Device, filtered to Microsoft Ads source.
7. **0:55 — Assisted conversions (10m)** — GA4 → Advertising → Attribution → Conversion paths. Look for Bing in non-last-touch positions.
8. **1:05 — Ad copy iteration (15m)** — review which RSA assets are "Best" / "Good" / "Low" — pause Lows, write 2 new variants per ad group with winning theme.
9. **1:20 — Document changes (10m)** — log changes in a single Google Sheet ("ClearLegacy Ads Change Log") for hindsight learning.

---

## Part 10 — 30-Day Action Plan

### Week 1 — Foundation

- [ ] Verify Bing Webmaster Tools (token already in homepage HTML — just connect in BWT UI)
- [ ] Submit refreshed sitemap.xml (88 URLs) to BWT and GSC
- [ ] Set up Microsoft Clarity (free heatmaps)
- [ ] Build a "Bing-only" GA4 audience: `Source contains 'bing' OR Source contains 'yahoo' OR Source contains 'duckduckgo'`
- [ ] Open / verify Microsoft Ads account
- [ ] Set up MS Ads → GA4 conversion import (use the existing `purchase` event)
- [ ] Confirm `cl-thankyou-tracking.js` fires with `transaction_id` (debug if not — ITP issue likely)
- [ ] Filter `test_verify` UTM out of GA4

### Week 2 — Launch

- [ ] Launch Campaign 1 (Online Wills) — £15/day
- [ ] Launch Campaign 2 (Will Cost) — £10/day
- [ ] Launch Campaign 3 (No Will / Intestacy) — £10/day
- [ ] Launch Campaign 4 (Mirror Wills) — £8/day
- [ ] Launch Campaign 5 (Probate) — £12/day
- [ ] Apply account-level negative keyword list
- [ ] Set up call tracking on `+44 7707 071984` (Microsoft Ads Call Extension + GA4 phone-call event)
- [ ] Add ICO badge / Companies House number / phone number to homepage header

### Week 3 — Build SEO pages

- [ ] Publish `/online-will-uk/`
- [ ] Publish `/what-happens-if-you-die-without-a-will-uk/`
- [ ] Publish `/mirror-wills-uk/`
- [ ] Add to sitemap, submit to BWT + GSC for fast indexing
- [ ] Cross-link from existing service pages

### Week 4 — Review and iterate

- [ ] First weekly optimisation routine (apply Part 9 fully)
- [ ] Pull MS Ads report → CPA, conversion rate, cost-per-click by campaign
- [ ] Compare to Google Ads benchmark (once Google Ads connection is fixed)
- [ ] Decide: scale Bing budget? Or hold and gather more data?
- [ ] Build next 4 SEO pages: `/make-a-will-online/`, `/how-much-does-a-will-cost-uk/`, `/is-an-online-will-legal-uk/`, `/probate-help-uk/`
- [ ] Run first homepage A/B test (CTA copy)

---

## Part 11 — Output Summary

| # | Item | Status | Owner | Priority |
|---|---|---|---|---|
| 1 | Bing traffic summary | ✓ Done (Part 1) | — | — |
| 2 | Microsoft Ads campaign structure | ✓ Done (Part 2) | Sat | High |
| 3 | Keyword list | ✓ Done (Part 2) | Sat | High |
| 4 | Negative keyword list | ✓ Done (Part 3) | Sat | High |
| 5 | Ad copy variants | ✓ Done (Part 4) | Sat | Medium |
| 6 | Landing page fixes | ✓ Done (Part 5 + main audit) | Dev | Medium |
| 7 | SEO page plan | ✓ Done (Part 7) | Sat / writer | High |
| 8 | Tracking issues | ✓ Documented (main audit Part 5D + Week 1 above) | Dev | Critical |
| 9 | Budget recommendations | £55/day seed = ~£1,650/month, rebalance after week 2 | Sat | — |
| 10 | 30-day execution roadmap | ✓ Done (Part 10) | Sat | Critical |

### Priority order (revenue impact × ease × speed)

🚨 **Do this week (highest leverage, lowest effort):**
1. Verify Bing Webmaster Tools + submit refreshed sitemap (1h)
2. Filter `test_verify` UTM out of GA4 (10m)
3. Open Microsoft Ads account (1h) and set up conversion import (1h)
4. Set up Microsoft Clarity (30m — free Bing-aligned heatmaps)
5. Publish first 3 SEO pages (3 days dev/writer time)

🔥 **Do next week:**
6. Launch all 5 Microsoft Ads campaigns at seed budgets (3h setup)
7. Add ICO badge / Companies House / phone to homepage (2h)

🌱 **Within 30 days:**
8. Publish remaining 4 SEO pages
9. Run homepage CTA A/B test
10. Implement weekly optimisation routine (Part 9)

---

## Data gaps — what I'd still like access to

- **Microsoft Ads account access** — once you've created it, share access so I can pull live performance data
- **Google Ads account 658-429-9393** — re-authorise the MCP connector; current `listConnectedAccounts` still only shows the ByErim account
- **GA4 Admin role** — to set up the `test_verify` filter and the Bing-only audience automatically (or you do it manually following the instructions above)
- **Bing Webmaster Tools access** — to pull keyword impressions and click data
- **Microsoft Clarity** — once installed, share access to look at session recordings of Bing users

---

*Plan dated 1 May 2026. Re-run the data-driven sections (Part 1, Part 8, Part 9) every 4 weeks. Re-run the strategy sections (Part 2, Part 4, Part 7) every quarter.*
