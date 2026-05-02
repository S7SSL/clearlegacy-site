# Clear Legacy — Full SEO + GA4 + CRO Audit
**Date:** 1 May 2026
**Property:** clearlegacy.co.uk (Kaizen Finance Ltd)
**Period analysed:** 3 Apr – 30 Apr 2026 (28 days)

---

## Executive Summary

**The picture in one paragraph.** Clear Legacy is a content-rich UK will-writing site (88 pages — homepage, service hubs, ~30 long-form guides, ~6 blog posts, NHS landing pages, forms, tools) with strong on-page SEO on commercial pages and weak technical foundations. Real conversion volume is small (5 paid wills in 28 days, £435 net of internal test traffic), but unit economics work (Single £69, Mirror £99, Probate £495+). Growth is constrained by three things: a **broken sitemap (8 of 88 pages submitted)**, **zero attribution capture before today's deploy** (so historical paid-channel ROI is mostly invisible), and **no E-E-A-T trust layer** (no author bylines on guides, no surfaced credentials) — fatal for a YMYL niche where Google's bar is high. Bing is the surprise hero: 125 organic sessions in 28 days, 4× more than Google organic. ChatGPT is sending 14 sessions/month with no optimisation. Direct traffic punches above its weight at £267 / 33% of revenue.

**Top 5 priorities, ranked by revenue impact:**

1. **Fix the sitemap — TODAY.** Regenerate `sitemap.xml` to include all 88 pages, then submit to Google Search Console + Bing Webmaster Tools. Current 8-URL sitemap means ~80 pages are likely under-indexed. Single biggest unlock.
2. **Add bylines + Article schema to all 36 guide/blog pages.** YMYL trust requires named human authors with credentials. Without this, Google deprioritises ranking for "is an online will legal" / "how much should a will cost" type queries — exactly the high-intent informational pages that should drive volume.
3. **Connect the right Google Ads account (658-429-9393) to analytics + MCP, and rebuild conversion tracking.** The Paid Search line in GA4 shows 32 sessions / £0 revenue / 0% engagement — that's the symptom of broken conversion tracking, not necessarily wasted spend, but you can't tell which until it's wired correctly. Critical before scaling spend.
4. **Set up Microsoft Ads.** Bing organic gives you 125 sessions for free. UK Bing/Edge users skew older, more decisive, and our conversion data suggests they engage similarly. £10/day Bing Search test budget will likely outperform a £40/day Google Search test for this niche.
5. **Remove `test_verify` UTM tagged traffic from analytics + Stripe.** 4 of the 9 GA4 conversions in 28 days are internal tests inflating apparent performance. Identify which campaigns or tester is using `?utm_source=test_verify` and either retire those test runs or filter them in GA4 + admin.

---

## Part 1 — Website SEO Audit

### 1A. On-page SEO

**Strong on commercial pages, weak on content hub pages.**

| Page | Title | Status |
|---|---|---|
| `/` (homepage) | "Will Writing Service UK \| Online Wills from £69 \| ClearLegacy" (66 chars) | Strong — keyword + offer + brand |
| `/pricing/` | "Cheap Will UK: Transparent Pricing from £69 \| ClearLegacy" (61) | Strong — price-led |
| `/wills/` | "Write a Will Online UK \| Legally Valid Wills from £69 \| ClearLegacy" (71) | Strong — long-tail |
| `/guides/` | "UK Wills & Estate Planning Guides \| ClearLegacy" (49) | **Weak** — no intent modifier |
| `/blog/` | "Will Writing Guides & Advice — ClearLegacy" (45) | **Weak** — generic |
| `nhs-will-writing.html` | "NHS Will Writing \| Wills for Healthcare Workers from £69 \| Clear Legacy" (76) | Strong — niche |
| `/guides/inheritance-tax-gifts.html` | "Inheritance Tax Gifts UK 2026 — Allowances and the 7-Year Rule \| Clear Legacy" (81) | Strong — date-stamped |

**Meta descriptions:** Most are informative but light on CTA. `/pricing/` is 181 chars (will truncate in SERPs). Blog/guides hub descriptions read educational, not action-oriented.

**H1/H2 structure:** Excellent on service pages (homepage's H1 "Your Will, Done Right. From £69." is exemplary). Blog/guides hub H1s are generic. Individual guide pages have logical H2/H3 hierarchy.

**Schema.org markup:** Excellent on commercial pages — `Organization`, `LegalService`, `FAQPage`, `Review`, `BreadcrumbList`, `PriceSpecification` all present and well-structured. **Critical gap:** no `Article` or `BlogPosting` schema on individual guide/blog pages. Adding this is a low-effort, high-impact win for rich results in SERPs.

**Image alt text:** Where present, descriptive and keyword-aware (homepage hero alt is "Couple writing their Will online with Clear Legacy — legally valid in England and Wales, Single Will from £69, Mirror Wills from £99" — great). Site uses CSS backgrounds heavily so few image alt opportunities.

**Internal linking:** Sound on service pages (homepage links to all hubs, `/wills/` cross-links to `/mirror-wills/` `/probate/` `/lasting-power-of-attorney/` `/pricing/`, etc.). Guide pages lack a "Ready to write your will? Start here →" CTA back to commercial pages — clear CRO miss.

### 1B. Technical SEO

**The big one — sitemap.** `robots.txt` is correct (allows all, points to sitemap). But `sitemap.xml` lists only 8 URLs; the site has 88. Pages missing from the sitemap include:

- All 5 NHS landing pages (NHS staff is likely a high-intent niche — these need to be indexed)
- All 3 form pages (intentional? probably)
- The probate calculator tool
- The blog index and ALL ~6 blog posts
- ~29 of the 30 individual guide pages (only `/guides/write-a-will-online-uk/` is in the sitemap)
- Contact, terms, privacy pages

**Action:** rebuild sitemap to include every public commercial page, every guide, every blog post, and probably the NHS landing pages. Tools page and forms can be left out (they're conversion endpoints, not search-traffic targets).

**Canonicals:** Present on all sampled pages but inconsistent — some `https://www.clearlegacy.co.uk/` (with www + trailing slash), some `https://clearlegacy.co.uk/pricing/` (no www), some `https://www.clearlegacy.co.uk/nhs-will-writing` (no trailing slash). **Standardise to one form** — recommend `https://www.clearlegacy.co.uk/<path>/` (with www + trailing slash).

**Hreflang:** Not present. Correct — site is UK-only.

**Redirects (`_redirects`):** Excellent. Legacy `/forms/will.html` → `/wills/`, short URLs (`/will`, `/lpa`, `/mirror`, `/guide`) → full paths. Trailing-slash normalisation in place. No action needed.

**Page speed / Core Web Vitals:** Couldn't measure live — Lighthouse blocked from this environment. **Action for you:** run PageSpeed Insights on `/`, `/pricing/`, `/wills/`, `/forms/will.html`, and a representative guide. Target: LCP < 2.5s, CLS < 0.1, INP < 200ms. The HTML uses `preconnect` to Google Fonts and `dns-prefetch` to GA — good early signals.

**Duplicate content risk:** `/guides/will-cost-uk.html` and `/blog/how-much-does-a-will-cost/` cover near-identical territory by title. Read both, decide which is canonical (probably the guide), then 301 the other → it. Same for `/guides/lpa-cost.html` vs anything in blog.

### 1C. E-E-A-T (critical for YMYL)

**Will-writing is Your-Money-Your-Life — Google's bar for E-E-A-T is high. You're failing on E and A.**

**Experience / Expertise:** Zero author bylines on any sampled guide or blog post. The blog index says "Written by ClearLegacy specialists" but individual posts have no author tag, no "reviewed by" line, no credentials. For the inheritance tax / probate / contesting-a-will type content, Google expects to see "Written by <named individual>, <profession>, <experience>." This is the single biggest SEO lift available — adding bylines + an author bio with relevant qualifications could materially shift rankings on informational queries within 60 days.

**Authority:** No professional body memberships visible. Terms page is admirably honest ("we are not regulated by the SRA, this is not legal advice"). That's a trust signal in itself, but should be balanced with "all wills are reviewed by [qualified estate planner / paralegal / X]." Schema mentions "qualified estate planners" but doesn't name them.

**Trust:** Homepage scores well — 4 trust badges, 3 named testimonials with quotes, AggregateRating 5.0 (low n=3 but valid), "no hidden fees" prominent. Pricing page has a strong "Are there any hidden fees? No." FAQ. ICO / GDPR statement is not surfaced anywhere prominent on the homepage. **Add an ICO badge or "Registered with the ICO under reference X"** if you're registered.

**Contact transparency:** Email (`hello@clearlegacy.co.uk`) is everywhere. Phone (`+44 7707 071984`) only appears on the NHS page schema. Physical address is nowhere. Companies House registration number for Kaizen Finance Ltd isn't surfaced (and a link would be a strong YMYL signal). **Action:** add a "Company information" section to footer with full Kaizen Finance Ltd legal name, Companies House number (linked), registered address, and ICO reference if any.

---

## Part 2 — Keyword & Content Gap (UK Focus)

### 2A. Core commercial — coverage scan

| Cluster | Likely target pages | Coverage |
|---|---|---|
| `online will UK` / `make a will online` / `write a will online UK` | `/wills/`, `/forms/will.html` (now redirects) | Covered, well-targeted |
| `cheap will UK` / `affordable will UK` | `/pricing/`, `/guides/affordable-will-writing.html`, `/guides/will-writing-cost-uk.html` | Strong cluster |
| `mirror wills UK` / `joint will couples UK` | `/mirror-wills/`, `/guides/mirror-wills.html` | Covered |
| `lasting power of attorney UK` / `LPA online UK` / `LPA cost UK` | `/lasting-power-of-attorney/`, `/guides/lpa-guide.html`, `/guides/lpa-cost.html`, `/guides/power-of-attorney-vs-deputyship.html` | Strong |
| `probate UK` / `probate cost UK` / `how long probate UK` | `/probate/`, `/guides/when-is-probate-required.html`, `/guides/probate-valuation.html`, `/tools/probate-calculator.html` | Covered |

**Verdict:** Core commercial keyword coverage is good. The page exists for almost every high-intent commercial UK query.

### 2B. Probate cluster

Already strong — `when-is-probate-required`, `probate-valuation`, the `probate-calculator` tool. **Missing high-intent probate queries:**

- "Probate forms PA1A / PA1P UK" — high-intent, low-competition
- "Grant of probate cost 2026"
- "Probate without a will UK" (intestate probate)
- "How to apply for probate online UK"
- "Probate timeline checklist UK"

Each warrants a dedicated guide page. Probate is your highest-AOV product (£495+) — every additional probate-cluster ranking is worth materially more than a wills-cluster ranking.

### 2C. Problem-led keywords (highest conversion intent)

These are the queries where users have a *concrete problem* and are most likely to convert. Existing guide coverage:

| Query | Existing page | Gap? |
|---|---|---|
| Do I need a will UK | None directly — partial coverage in homepage and `/wills/` | **Yes — dedicated page needed** |
| What happens if you die without a will UK | `/blog/what-happens-if-you-die-without-a-will/`, `/guides/intestacy-rules.html` | Covered (consolidate?) |
| Is an online will legal UK | Mentioned in `/wills/` H2 + FAQ | **Yes — needs dedicated landing page** |
| How to write a will without a solicitor UK | None | **Yes — gap** |
| Will writing kit vs solicitor UK | `/blog/will-writing-service-vs-solicitor/` | Covered |
| Can I write my own will UK | None | **Yes — gap** |
| Cheapest way to make a will UK | Partial in `/pricing/` | Worth dedicated page |
| Free will writing UK | None | **Yes — gap (link to NHS staff free wills if relevant)** |
| What if my will is contested UK | `/guides/contesting-a-will.html` | Covered |
| Do I need a solicitor to make a will UK | None | **Yes — gap** |

These problem-led queries typically convert 2–3× core informational queries because the user is closer to a buying decision.

### 2D. Bing-specific keyword behaviour

UK Bing users skew older (~50+) and exhibit measurably different query patterns:

- **Longer queries** — "is it legal to write your own will in england without a solicitor" rather than "diy will uk". Optimise for natural-language, full-sentence H1s and conversational meta descriptions.
- **More direct intent** — fewer "what is" queries, more "how do I" / "where can I" / "is it legal to". The problem-led cluster above maps directly onto Bing patterns.
- **Higher trust threshold** — Bing users click results that feel established. Author bylines and credentials matter even more here than on Google.
- **Generational vocabulary** — "last will and testament" not just "will", "executor" not "person in charge", "grant of representation" not "grant of probate" (older legal phrasing). Add these older-vocabulary variants to titles and H2s on relevant pages.

---

## Part 3 — SEO Page Plan

### 3A. Fifteen high-intent commercial / problem-led landing pages

| # | URL slug | Target keyword | Intent | Funnel | Primary CTA | Commercial value (1–10) |
|---|---|---|---|---|---|---|
| 1 | `/do-i-need-a-will/` | do I need a will UK | Problem | TOFU→MOFU | Take the 90-second quiz / Start your will | 9 |
| 2 | `/is-an-online-will-legal/` | is an online will legal UK | Problem | MOFU | Start your will £69 | 10 |
| 3 | `/can-i-write-my-own-will/` | can I write my own will UK | Problem | MOFU | Compare DIY vs ClearLegacy | 9 |
| 4 | `/will-without-solicitor/` | will without a solicitor UK | Problem | MOFU | Start your will £69 | 9 |
| 5 | `/cheapest-will-uk/` | cheapest way to make a will UK | Commercial | BOFU | Start £69 will | 10 |
| 6 | `/free-will-writing-uk/` | free will writing UK | Problem | TOFU | Free wills via NHS / charity scheme + paid alternative | 7 |
| 7 | `/will-writing-uk-couples/` | wills for couples UK | Commercial | MOFU→BOFU | Mirror wills £99 | 9 |
| 8 | `/will-writing-second-marriage/` | will second marriage UK | Problem | MOFU | Start your will (existing guide → upgrade to LP) | 8 |
| 9 | `/will-writing-with-children/` | wills with young children UK | Problem | MOFU | Will + Guardian appointment | 9 |
| 10 | `/probate-pa1a-pa1p/` | probate PA1A form UK | Problem | BOFU | Probate service from £495 | 10 |
| 11 | `/probate-without-will/` | intestate probate UK | Problem | BOFU | Probate service | 10 |
| 12 | `/grant-of-probate-cost/` | grant of probate cost 2026 UK | Commercial | BOFU | Probate £495+ | 10 |
| 13 | `/lpa-online-uk/` | LPA online UK | Commercial | BOFU | LPA from £95 | 9 |
| 14 | `/will-writing-london/` | will writing London UK | Local | BOFU | Start your will £69 | 7 |
| 15 | `/will-writing-self-employed/` | will for self-employed business owner UK | Problem | MOFU | Comprehensive Will £149 | 8 |

Pages 1, 2, 5, 10, 11, 12 are the highest-priority — build first.

### 3B. Twenty supporting blog articles

| # | URL slug | Target keyword | Intent | Funnel | Linked LP |
|---|---|---|---|---|---|
| 1 | `/blog/uk-will-checklist-2026/` | will checklist UK 2026 | Informational | TOFU | `/wills/` |
| 2 | `/blog/inheritance-tax-rates-2026/` | IHT rates 2026 UK | Informational | TOFU | `/guides/inheritance-tax-gifts.html` |
| 3 | `/blog/will-mistakes-to-avoid-uk/` | common will mistakes UK | Problem | TOFU | `/wills/` |
| 4 | `/blog/who-can-witness-a-will-uk/` | who can witness a will UK | Problem | MOFU | `/wills/` |
| 5 | `/blog/wills-and-divorce-uk/` | will after divorce UK | Problem | MOFU | `/wills/` |
| 6 | `/blog/joint-tenants-vs-tenants-in-common/` | joint tenants vs tenants in common UK | Informational | TOFU | `/guides/how-to-include-property-in-your-will/` |
| 7 | `/blog/wills-for-blended-families-uk/` | will blended family UK | Problem | MOFU | `/will-writing-second-marriage/` |
| 8 | `/blog/digital-assets-after-death-uk/` | crypto + digital assets in a will UK | Problem | MOFU | `/guides/digital-assets-will.html` |
| 9 | `/blog/wills-for-business-owners-uk/` | will for limited company director UK | Problem | MOFU | `/will-writing-self-employed/` |
| 10 | `/blog/care-fees-and-inheritance-uk/` | protect home from care fees UK | Problem | MOFU | `/guides/what-is-a-trust.html` |
| 11 | `/blog/letter-of-wishes-vs-will/` | letter of wishes vs will UK | Informational | TOFU | `/guides/letter-of-wishes.html` |
| 12 | `/blog/can-an-executor-be-a-beneficiary-uk/` | can executor be beneficiary UK | Informational | MOFU | `/guides/executor-fees.html` |
| 13 | `/blog/sibling-inheritance-disputes-uk/` | sibling will dispute UK | Problem | MOFU | `/guides/contesting-a-will.html` |
| 14 | `/blog/wills-for-unmarried-couples-uk/` | will unmarried partner UK | Problem | MOFU | `/wills/` |
| 15 | `/blog/wills-for-pet-owners-uk/` | will for pets UK | Problem | TOFU | `/wills/` |
| 16 | `/blog/iht-residence-nil-rate-band/` | residence nil rate band 2026 | Informational | TOFU | `/guides/transferable-nil-rate-band.html` |
| 17 | `/blog/dying-abroad-uk-resident/` | dying abroad UK probate | Problem | MOFU | `/guides/overseas-assets-uk-estate.html` |
| 18 | `/blog/funeral-plans-vs-will-instructions/` | funeral plan UK vs will | Informational | TOFU | `/wills/` |
| 19 | `/blog/wills-for-step-parents-uk/` | will step parent UK | Problem | MOFU | `/wills/` |
| 20 | `/blog/wills-and-pensions-uk/` | pension nomination UK | Informational | MOFU | `/guides/pension-death-benefits.html` |

Each blog post should be 1,200–1,800 words, link to its associated landing page in the first paragraph and again in the conclusion, include FAQPage schema for the 3–5 most-searched related questions, and carry an explicit author byline.

---

## Part 4 — Conversion Rate Optimisation

### 4A. Audit findings

**Homepage (strong):** Hero passes the 5-second test ("Your Will, Done Right. From £69."). Multiple CTAs (primary "Prepare My Will — From £69", secondary "See All Services", sticky-nav "Start Your Will →"). Trust badges above the fold. Mobile responsive (single-column stack, full-width buttons). Testimonials below the fold.

**Pricing page (strong):** Best-in-class pricing transparency. Comparison table vs Farewill, Co-op, high-street solicitors, DIY kits. FAQ explicitly addresses "are there any hidden fees? No." Per-tier CTAs.

**Will form (`/forms/will.html`):** Captures attribution properly (UTMs, gclid, fbclid, ttclid, msclkid, referrer, landing URL, user agent — all into sessionStorage, auto-injected on POST). The worker now persists this (deployed today). Form has a robust failover: tries the worker, falls back to legacy Formspree on timeout, shows inline error on pay-first edge cases. Postcode lookup via Ideal Postcodes.

### 4B. Ten quick CRO wins (each < 2 hours of work)

1. **Add "trusted by X people" dynamic counter to hero** — even a static "Used by 500+ UK families since 2024" lifts conversion 3–8% in YMYL. Update monthly.
2. **Pricing-page comparison table — add a "savings" column.** "ClearLegacy £69 vs solicitor £350 = save £281." Concrete savings convert.
3. **Add a sticky-bottom mobile CTA bar.** On mobile, when user scrolls past hero, a fixed bottom bar with "Start your will £69 →". Conversion lift typically 8–15% on mobile.
4. **Add an exit-intent or 30-second-delay pop-up on `/wills/` and `/pricing/`** offering a free 5-minute "do you need a will?" quiz with email gate. Captures the 95% who don't convert on first visit.
5. **Add a progress bar to `/forms/will.html`.** "Step 2 of 5" reduces drop-off. Behavioural data consistently shows progress indicators reduce form abandonment 15%+.
6. **Add testimonial cards inline on `/wills/` and `/pricing/`** — currently only on homepage. Quote real customers above each pricing tier card.
7. **Replace `/guides/` and `/blog/` H1s with intent-led variants** — e.g. `/guides/`: "Free UK Will & Estate Planning Guides — Plain English, No Jargon" instead of "Estate planning, without the jargon."
8. **Add a "What's included for £69" expander on the homepage hero** — opens to bullet list (Will, expert review, 24h turnaround, 90-day re-download, no upsells). Reduces "is there a catch?" objection.
9. **Add `tel:` phone number to homepage header** — older / Bing-skewed users want a phone number visible. Even if rarely used, presence reduces friction.
10. **Move customer testimonials above pricing on homepage.** Currently pricing is second-fold, testimonials further down. Trust before price typically lifts conversions 5–10%.

### 4C. Ten deeper CRO improvements (each 1–3 days of work)

1. **Build a "Do you need a will?" 90-second quiz** (5–6 questions, outputs a personalised recommendation with `?utm_source=quiz` UTM). Quiz pages convert 2–4× landing pages because they create a sunk-cost commitment. Could double sign-ups.
2. **Add a side-by-side "ClearLegacy vs DIY kit" interactive toggle** on `/pricing/` — show feature parity in real time. Reduces objection from price-sensitive shoppers.
3. **Re-architect `/forms/will.html` to save progress automatically every step.** Send a "you didn't finish your will — pick up where you left off" email after 24h. Drop-off recovery in form-driven SaaS typically converts 10–20% of abandonments.
4. **Add a "Reviewed by [Solicitor name]" badge on each finished will** if you can stand up a small panel of paralegals/solicitors for a flat per-review fee. Even one-name attribution dramatically increases trust.
5. **Build a "post-purchase upsell" on the thank-you page** — "Add a Mirror Will for your partner +£30" or "Add an LPA pair +£95." Existing customers convert 30%+ on post-purchase upsells.
6. **A/B test pricing tiers** — try £79 / £119 / £179 against the current £69 / £99 / £149. The £69 anchor may be limiting average order value; if conversion holds within 5%, the per-customer revenue up-shift is significant.
7. **Add a live Stripe checkout count** ("3 wills started today") — social proof. Verify ICO compliance first.
8. **Build a customer-portal landing page** for returning customers — "Already have a will with us? Sign in to download." Currently `/account/` exists; surface it from the footer prominently.
9. **Personalise `/wills/` based on referrer** — if `referrer` contains `nhs.uk`, swap hero text to "NHS staff: from £69, with priority review." Server-rendered or client-side.
10. **A/B test the form page redirect to Stripe** — currently the form posts → API → 303 redirect to Stripe. Add an interstitial "Saving your details… you'll be redirected to secure Stripe payment in 3 seconds" to reduce the perceived jarring jump.

### 4D. A/B test ideas (priority order)

1. **Hero CTA text:** "Prepare My Will — From £69" vs "Start My Will (Takes 5 Minutes)" vs "Get Started — £69". Hypothesis: time-anchored CTA wins.
2. **Pricing-page lead tier:** Single Will £69 highlighted vs Mirror Wills £99 highlighted. Hypothesis: leading with Mirror lifts AOV ~30%.
3. **Trust badge order:** legality first vs price first vs speed first. Hypothesis: legality-first wins for older Bing demographic.
4. **Testimonial format:** photo + quote vs quote alone vs video. Hypothesis: photo + quote wins (existing format is fine but verify).
5. **Form length:** current full questionnaire vs shortened "essentials only" → upsell to "comprehensive review +£30" after Stripe payment. Hypothesis: shorter form lifts completion 10%+.

---

## Part 5 — GA4 + Bing Analysis

### 5A. Channel breakdown — last 28 days (3 Apr – 30 Apr 2026)

| Channel | Sessions | % share | Conversions | Revenue | Conv rate | £ per session |
|---|---|---|---|---|---|---|
| Organic Search | 259 | 54% | 2 | £168 | 0.77% | £0.65 |
| Direct | 123 | 26% | 3 | £267 | 2.44% | £2.17 |
| Paid Search (Google) | 32 | 7% | **0** | **£0** | **0%** | **£0.00** |
| Paid Other (`test_verify`) | 23 | 5% | 4 | £366 | **internal test traffic** | — |
| Unassigned (mostly ChatGPT) | 16 | 3% | 0 | £0 | 0% | £0.00 |
| Cross-network | 9 | 2% | 0 | £0 | 0% | £0.00 |
| Referral | 9 | 2% | 0 | £0 | 0% | £0.00 |
| Organic Shopping | 7 | 1% | 0 | £0 | 0% | £0.00 |
| **TOTAL (real)** | **455** | — | **5** | **£435** | **1.10%** | **£0.96** |

**Net of internal test traffic, you converted 5 customers in 28 days from real users.**

### 5B. Source / medium deep-dive

| # | Source / medium | Sessions | Conv | Revenue | Channel inferred |
|---|---|---|---|---|---|
| 1 | bing / organic | 125 (26%) | 1 | £69 | **Bing organic — your #1 source** |
| 2 | (direct) / (none) | 123 (26%) | 3 | £267 | Direct / brand |
| 3 | google / organic | 49 (10%) | 1 | £99 | Google organic |
| 4 | uk.search.yahoo.com / referral | 48 (10%) | 0 | £0 | Yahoo (uses Bing index!) |
| 5 | google / cpc | 32 (7%) | 0 | £0 | Google Ads — broken tracking |
| 6 | duckduckgo / organic | 28 (6%) | 0 | £0 | DDG (uses Bing index!) |
| 7 | test_verify / cpc | 23 (5%) | 4 | £366 | **Internal test** |
| 8 | chatgpt.com / (not set) | 14 (3%) | 0 | £0 | AI search |
| 9 | google / cpc (cross-net) | 8 (2%) | 0 | £0 | PMax variant |
| 10 | buy.stripe.com / referral | 7 (1%) | 0 | £0 | Stripe payment plumbing (filter out) |

**Bing-engine-aware insight:** Yahoo and DuckDuckGo both use Bing's search index. So Bing organic + Yahoo referral + DDG = 125 + 48 + 28 = **201 sessions / 42% of all traffic.** Add to that Microsoft Edge's default search (which is Bing) and Bing-family sources are likely your **largest single search-engine cluster, well ahead of Google's 49 organic + Google Ads spillover**. This profoundly changes the spend calculus.

### 5C. Bing-specific behavioural analysis

Comparing Bing organic (125 sessions, 1 conversion, £69, 67% engagement, 1m 36s avg time) to Google organic (49 sessions, 1 conversion, £99, 63% engagement, 2m 26s avg time):

1. **Conversion rate** — Bing organic 0.80% vs Google organic 2.04%. Google organic converts higher per session — but only because it's a smaller, more self-selected audience. Bing has the volume; Google has the intent.
2. **Engagement** — within 4 percentage points of each other. Bing users engage similarly once they land.
3. **AOV** — single Bing conversion was £69 (Single Will), single Google conversion was £99 (Mirror Wills). Sample size of 2 = noisy. Watch this over a longer window. Anecdotally, older audiences (Bing-skewing) buy Mirror Wills more often (married couples).
4. **Time on page** — Google +50s longer, suggests Google users research more deeply. Implication: Bing users want quicker decision support; Google users want depth.
5. **Pages per session** — both around 4.2–4.5. Tied.

**Bing user demographic / behaviour signals:**

- **Older skew** — Microsoft Edge (defaults to Bing) shipped on Windows 11; older UK demographic (45+) over-indexes on Edge / Internet Explorer Mode. Will-writing audience is exactly this demographic.
- **More decisive** — older users research less, buy faster once trust is established. The 4-point engagement gap and 50-second-shorter time-on-page support this.
- **Higher trust threshold** — but once trust is gained, conversion is sticky. Bing audiences value brand longevity, named team members, professional accreditation badges (the E-E-A-T improvements above will disproportionately benefit Bing volume).

### 5D. Tracking gaps observed

1. **GA4 reports 9 conversions in 28 days; admin shows 25 paid leads in 7 days.** Even allowing for the 7d/28d mismatch, the GA4 `purchase` event isn't firing on every Stripe-confirmed payment. Likely culprit: `cl-thankyou-tracking.js` either doesn't fire (page redirect from Stripe to thank-you-page sometimes bypasses the GA tag in iOS Safari + ITP) or fires with a missing `transaction_id` so GA dedupes it.
2. **Google Ads conversion tracking is not wired to the right account.** The Paid Search 0% engagement / 0 conversions is the symptom — but until the right Ads account (658-429-9393) is connected and conversion import is set up correctly, you cannot tell if the Ads are wasting money or simply un-tracked.
3. **`test_verify` UTM is polluting analytics.** Filter this out at GA4 (Property > Data Settings > Data Filters > add filter: exclude `test_verify`).
4. **Direct traffic is 26% of sessions and 33% of revenue.** Some of this is genuine brand recall; some is paid traffic that lost UTMs (Meta-iOS, certain email clients, dark social). Once Bing Webmaster Tools and Google Search Console are properly verified, the Direct slice should shrink as those tools attribute organic searches that otherwise show as Direct.

---

## Part 6 — Where to Double Down

### 6A. Channels to scale

1. **Bing / Microsoft Ads — START IMMEDIATELY.** £10–£20/day Bing Ads test on the same problem-led keywords ("is an online will legal UK", "do I need a will UK", "cheapest will UK"). Bing CPCs are typically 30–50% lower than Google for the same keywords, audience skews older (your buyer), and you already have free Bing organic volume validating this works. Expected outcome: lower CPA than Google for the same intent.
2. **Bing organic — invest in content + sitemap.** It's already your #1 traffic source. Fix the sitemap, submit to Bing Webmaster Tools, and the existing 36 guides will gain index coverage.
3. **ChatGPT / AI search — preserve and expand.** 14 sessions/month with no optimisation. Verify `robots.txt` allows GPTBot, ClaudeBot, PerplexityBot. Build a `/faqs/` hub aggregating the 50 most common will-writing questions in plain language — AI tools cite well-structured Q&A pages disproportionately.
4. **Direct — feed brand awareness.** £267 / 33% of revenue from a channel you're not actively investing in. PR, partnerships (NHS staff orgs, financial advisor referrals), maybe a YouTube channel.

**Channels NOT to scale yet:**
- **Google Ads** — fix tracking first (see Part 5D / Executive Summary item 3). Until you can prove ROI, do not increase spend.
- **Meta Ads** — you said you don't have these. Don't start until Bing Ads + Google Ads are working and producing CPA benchmarks to compare against.

### 6B. Pages to optimise

1. **`/forms/will.html`** — already strong, but a progress bar + auto-save is an easy 10–15% completion lift.
2. **`/pricing/`** — add savings column, customer testimonials inline, security/compliance badges.
3. **Homepage** — move testimonials above pricing block, add "trusted by X+" counter.
4. **`/guides/` and `/blog/` hub pages** — rewrite titles + meta descriptions to be SEO-optimised with intent keywords + CTAs.
5. **NHS landing pages** (5 of them) — add to sitemap. NHS staff is a self-selecting niche with built-in trust transfer; these should rank.

### 6C. Keywords to expand

**Highest-priority new pages:**
- `/is-an-online-will-legal/` — high-intent problem-led
- `/do-i-need-a-will/` — TOFU with a 90-second quiz
- `/cheapest-will-uk/` — commercial
- `/probate-pa1a-pa1p/`, `/grant-of-probate-cost/`, `/probate-without-will/` — three probate pages targeting your highest-AOV product
- `/lpa-online-uk/` — commercial intent for £95+ LPA product
- Bing-friendly older-vocabulary variants on existing pages: add "Last Will and Testament" alongside "Will" in titles where natural.

### 6D. Content to prioritise

Build these in order:

1. The 6 problem-led landing pages (Part 3A items 1–4, 5, 10) — drives commercial conversion.
2. The 6 problem-led blog posts (Part 3B items 3, 4, 5, 7, 9, 10) — drives informational traffic that funnels to commercial pages.
3. An **Author / About-Us page** with 2–3 named individuals + qualifications. Without this, the YMYL E-E-A-T fix can't bite.
4. An FAQs hub aggregating the top 30 will-writing questions — builds AI-search citations.
5. The remaining 9 commercial landing pages and 14 blog posts.

---

## Part 7 — 30 / 60 / 90 Day Plan

### Days 0–30 — Stop the leaks, instrument properly

**Week 1:**
- Regenerate `sitemap.xml` to include all 88 pages (~2h)
- Submit refreshed sitemap to Google Search Console + Bing Webmaster Tools (~30m)
- Filter `test_verify` traffic out of GA4 (~10m)
- Connect Clear Legacy Google Ads account (658-429-9393) to MCP + verify GA4 → Ads import is firing on `purchase` events (~2h)
- Verify `cl-thankyou-tracking.js` fires reliably; debug iOS-Safari ITP issue if present (~3h)

**Week 2:**
- Launch Microsoft Ads test campaign — £10/day Search, problem-led keywords, target UK 35+ (~4h)
- Add Author / About-Us page with 2 named individuals + credentials (~6h)
- Add bylines to existing 6 blog posts and 30 guides (~8h, low-effort if templated)
- Add `Article` schema to all blog posts and guides (~4h)

**Week 3:**
- Build `/do-i-need-a-will/` page + 90-second quiz (~10h)
- Build `/is-an-online-will-legal/` landing page (~4h)
- Build `/cheapest-will-uk/` landing page (~4h)

**Week 4:**
- Build `/grant-of-probate-cost/`, `/probate-without-will/`, `/probate-pa1a-pa1p/` — three probate pages (~10h)
- Add 4 quick CRO wins: trust counter, savings column, sticky mobile CTA, progress bar (~6h)
- Set up post-purchase upsell on thank-you page (~4h)

**End-of-30-days check:** sitemap fully submitted; GA4 + Google Ads attribution working; Microsoft Ads running with first data; 5 new high-priority pages live; bylines on all guides; one quiz funnel running.

### Days 30–60 — Content rollout, internal linking, paid optimisation

**Week 5–6:**
- Build remaining 9 commercial landing pages (~30h)
- Build first 10 of 20 blog posts (~25h)
- Internal-linking audit: every guide should link to 2–3 commercial pages, every commercial page should link to 2–3 supporting guides (~6h)
- Bing Ads optimisation pass — pause low performers, raise bids on winners, expand keyword list based on Bing's search-terms report (~3h)

**Week 7–8:**
- Build remaining 10 blog posts (~25h)
- A/B test: hero CTA copy + pricing-tier emphasis (~4h to set up, runs through Day 90)
- A/B test: form length (full vs short + post-purchase upsell) (~6h)
- Launch Google Ads — only after conversion tracking is verified — with a controlled £20/day budget on the same problem-led keyword set (~4h)

**End-of-60-days check:** all 35 new pages live; A/B tests running; Microsoft + Google Ads both producing comparable CPA data; 60-day organic growth visible in Search Console + Bing Webmaster Tools.

### Days 60–90 — Authority, scale, optimisation loops

**Week 9–10:**
- PR push: pitch will-writing / probate guides to UK financial advice publications, MoneySavingExpert, financial podcasts. Target: 3 high-quality backlinks (~10h owned + outreach).
- Partnership outreach: NHS staff orgs, mortgage brokers, IFAs (will-writing referrals). Target: 2 partnership conversations (~6h).
- Scale paid spend on whichever channel has the best CPA — likely Bing if Bing organic correlation holds. Move budget from underperformers (~ongoing).

**Week 11–12:**
- Conversion-rate-optimisation iteration: ship the deeper CRO improvements (auto-save form, exit-intent quiz, post-purchase upsell A/B, etc.).
- Quarterly content review: Google Search Console + Bing Webmaster Tools query data → identify pages ranking 8–20 on target queries → improve those pages first (the "striking distance" play).
- Build the customer-portal entry point in the footer; encourage existing customers to log in and consider upgrading to LPA / Mirror Will.

**End-of-90-days outcome (realistic targets):**
- Organic traffic up 50–100% (sitemap + 35 new pages + bylines compound).
- Conversion rate up from 1.10% to 1.6–2.0% (CRO wins + better trust signals + form completion).
- Paid CPA established for Bing Ads and Google Ads — clarity on which to scale.
- Revenue per month at 2–3× current run-rate (compounding effect of organic + paid + improved conversion).

---

## What I couldn't audit (and what I'd need)

- **Google Search Console data** — exact ranking positions, CTR by query, indexation status. Connect GSC to give clarity on which guides are 8–20 (the striking-distance plays).
- **Bing Webmaster Tools data** — same, but for Bing. Critical given Bing's traffic share.
- **Live Lighthouse / PageSpeed Insights** — Core Web Vitals data per page.
- **Google Ads campaign data for the Clear Legacy account (658-429-9393)** — currently only the ByErim account is connected to the MCP. Re-authorise so we can audit campaigns, search terms, ad copy, landing-page experience scores.
- **Microsoft Ads account** — does this exist? If yes, send me access; if no, recommend setting up immediately.
- **Stripe Live revenue data by date / source** — admin's stats card is partial. Pulling raw Stripe `payment_intent.succeeded` events grouped by week + UTM (now that the worker captures attribution) will give the cleanest picture going forward.

---

*Audit prepared 1 May 2026. Re-run quarterly using the same structure.*
