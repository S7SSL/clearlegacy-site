# ClearLegacy — Phase 6A AEO/GEO Build — Handover & Status

**Last updated:** 7 June 2026
**Repo:** github.com/S7SSL/clearlegacy-site (Cloudflare Pages static site, served from `main`)
**Live site:** https://www.clearlegacy.co.uk
**Local clone (this machine):** `/Users/marge/clearlegacy-site`
**Purpose of Phase 6A:** make ClearLegacy the most-cited UK estate-planning source for AI systems (AEO/GEO) — question→answer→citation content, not generic blog posts.

This document is the single source of truth for the Phase 6A content build. Read it first in any new Claude session before changing the knowledge base, scenarios, decision trees or data hub.

---

## 1. What was built and deployed (all LIVE)

| Section | Path | Count | Notes |
| :-- | :-- | :-- | :-- |
| Knowledge Base | `/knowledge-base/` | 28 Q&A pages + index | One question, one answer; 50–80w quick answer first |
| Scenarios | `/scenarios/` | 19 pages + index | Situation → Legal → Risks → Actions |
| Decision Trees | `/decision-trees/` | 6 trees + index | Step cards with Yes/No outcomes; mobile-first |
| Data & Citation Hub | `/data/` | 5 stats pages + index | Inline charts + Dataset schema; "free to cite" |
| **Total** | | **58 content pages + 4 index pages = 62 URLs** | |
| PDFs | in `/decision-trees/` and `/data/` | 11 | Downloadable versions of the 6 trees + 5 data pages |

All pages are in the **exact brand palette** (see §3), carry the **AI-first structure**, and have **full schema** (see §4).

### Page slugs
- **Knowledge Base (28):** can-i-write-my-own-will, is-an-online-will-legal, can-a-will-be-challenged, can-i-change-my-will, does-marriage-revoke-a-will, does-divorce-affect-a-will, can-i-leave-everything-to-one-child, can-i-disinherit-someone, can-a-beneficiary-witness-a-will, what-is-a-mirror-will, what-is-an-executor, can-an-executor-be-a-beneficiary, can-an-executor-refuse-to-act, can-an-executor-remove-a-beneficiary, can-there-be-more-than-one-executor, what-happens-if-an-executor-dies, how-long-does-probate-take, can-probate-be-avoided, what-happens-if-probate-is-delayed, who-pays-probate-fees, what-happens-to-joint-bank-accounts-after-death, who-inherits-if-there-is-no-will, can-stepchildren-inherit, can-unmarried-partners-inherit, who-inherits-a-jointly-owned-property, does-a-pension-form-part-of-an-estate, what-is-intestacy, what-is-a-beneficiary
- **Scenarios (19):** we-own-a-house-together-but-arent-married, my-partner-died-without-a-will, we-have-children-but-are-not-married, second-marriage-with-children, i-have-children-from-two-relationships, i-own-my-house-outright, i-own-property-with-my-partner, i-own-rental-properties, i-have-young-children, i-have-disabled-dependants, i-have-stepchildren, i-have-no-children, my-executor-refuses-to-act, my-executor-lives-abroad, my-executor-died, i-am-an-executor-and-need-help, my-estate-is-worth-500k, my-estate-is-worth-1m, i-want-to-reduce-inheritance-tax
- **Decision Trees (6):** do-i-need-a-will, who-inherits-if-i-die, probate-decision-tree, executor-decision-tree, inheritance-tax-decision-tree, unmarried-partner-rights-decision-tree
- **Data (5):** uk-inheritance-tax-statistics-2026, uk-will-ownership-statistics-2026, uk-cohabitation-statistics-2026, uk-probate-statistics-2026, uk-estate-planning-statistics-2026

URLs are clean/extensionless (Cloudflare Pages serves `foo.html` at `/foo`). Canonicals are extensionless; internal cross-links use `.html` (both resolve).

---

## 2. Reviewer attribution (IMPORTANT — do not reintroduce a fake person)

Originally the brief's example reviewer name **"Michael Smith, Estate Planning Specialist"** was applied site-wide. The site owner did not recognise the name — it was a placeholder, not a real person. A fabricated named "specialist" vouching for legal content is an E-E-A-T / trust risk, so it was removed.

**Current state (correct):** every page's governance block reads **"Reviewed by: ClearLegacy editorial team"**, and the schema `author`/`reviewedBy` is an **Organization** ("ClearLegacy editorial team", url `https://www.clearlegacy.co.uk/`), not a Person. The `/about/michael-smith` profile page was deleted and removed from sitemap/llms.txt.

**Do NOT** create a named individual reviewer unless the owner provides a **real** person with genuine, verifiable credentials (e.g. solicitor / STEP member). If they do, update the governance block + schema across all pages and build a real profile page.

---

## 3. Brand palette (exact, from the live site CSS)

```
--primary / blue   : #2563eb   (links, buttons, labels, brand "Clear")
--primary-dark     : #1d4ed8   (hover)
--blue-mid         : #3b82f6
--navy / black     : #0f172a   (body text, CTA backgrounds, brand "Legacy")
```
Each section has its own `styles.css` using these tokens. Risk callouts = red (#c0564f), caution = amber (#c08a1e) — semantic signals, not brand. CTA blocks use navy background + blue button.

---

## 4. Schema on every page (AEO/GEO requirement)

- **FAQPage** — 2–3 Q&As
- **Article** — with Organization author/reviewedBy/publisher
- **BreadcrumbList**
- **Organization** (standalone) on most pages
- **Dataset** — additionally on the 5 data pages (so AI can lift the stats with attribution)

All JSON-LD validates (last check: 243 blocks across 62 files, 0 invalid).

---

## 5. Hosting, deployment workflow & verification

**Hosting:** Cloudflare Pages builds from the `main` branch on every push. Build lag is ~1–2 minutes — new URLs commonly 404 briefly, then go 200. The only routing file is `/_redirects` (301 normalisations for legacy/flat URLs; it does NOT block new folders).

**Deploy pattern** (run on the Mac; the source files live in the Cowork outputs folder during a session). Copy → stage → commit → push:
```bash
SRC="<Cowork outputs>/<section>"        # e.g. .../outputs/knowledge-base
DEST="/Users/marge/clearlegacy-site/<section>"
cp -f "$SRC"/*.html "$DEST"/            # + *.pdf for trees/data
cd /Users/marge/clearlegacy-site
git add <section> && git commit -m "..." && git push origin main
```
Important: `git add` only STAGES — nothing is live until `git commit` + `git push`. A "Done" after staging is not a deploy.

**Verify live:**
```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://www.clearlegacy.co.uk/<path>"
```

---

## 6. Discovery (search + AI)

- **sitemap.xml** — all 62 Phase 6A URLs added (total ~220 `<loc>` entries). Uses `www`.
- **llms.txt** — sections added: "## Knowledge Base (Q&A)", "## Scenarios", "## Decision Trees", "## Data & Statistics". Uses non-`www` (matches the rest of the file).
- **Google Search Console** (domain property `sc-domain:clearlegacy.co.uk`): sitemap **resubmitted**; **Request Indexing** done for the four section hubs (`/knowledge-base/`, `/scenarios/`, `/decision-trees/`, `/data/`). Indexing naturally takes days–weeks.
- **Scheduled task** "clearlegacy-indexation-monitor" runs every 3 days at 09:00, checks indexation via `site:` searches, and flags pages still missing after the crawl window so they can be re-requested in GSC. (Managed in the Cowork "Scheduled" sidebar.)

GSC can't be forced to index; re-requesting daily does nothing. Use the monitor, then re-request only stragglers after ~10 days.

---

## 7. Source generators (regenerate / extend the content)

These Python scripts produced the pages and live in the Cowork **outputs** scratchpad (not yet in the repo — consider committing them to a `/_build/` folder for reuse):
- `build_scenarios.py` — generates `/scenarios/`
- `build_trees.py` — generates `/decision-trees/`
- `build_data.py` — generates `/data/` (charts + Dataset schema)
- `build_pdfs.py` — generates the 11 PDFs (imports build_trees + build_data; uses reportlab)

The 28 knowledge-base pages were authored individually (not generated). All generators and KB pages already use "ClearLegacy editorial team" + Organization schema.

To bulk-edit existing deployed pages, a regex pass over the HTML is the pattern used (e.g. the reviewer swap). Always re-validate JSON-LD after.

---

## 8. Verified facts/figures used (keep accurate on future edits)

- **IHT:** nil-rate band £325,000; residence nil-rate band £175,000; both frozen to **April 2031**. 40% rate (36% if 10%+ to charity). Up to £500k individual / £1m couple when home passes to direct descendants. Receipts 2024/25 ≈ **£8.2bn**; ~4% of estates pay.
- **Pensions:** most unused pension funds enter the estate for IHT from **6 April 2027** (Finance Act 2026, Royal Assent 18 March 2026).
- **Intestacy:** spouse statutory legacy **£322,000** (since 26 July 2023) + chattels + half remainder when there are children.
- **Probate:** application fee **£300** (estates over £5,000; £16 per extra copy). ~239,000 grants issued in 2025; avg time to grant fell to ~5 weeks.
- **Wills/Marriage:** marriage still revokes a will (s18 Wills Act 1837); Law Commission 2025 reform recommended but NOT enacted. Electronic/video-witnessed wills not yet valid.
- **Cohabitation (ONS, Families & households 2024):** 3.5m cohabiting-couple families (17.7%), fastest-growing family type; no automatic inheritance rights.
- **Will ownership:** ~59% of UK adults have no will (41% do, 2025).

---

## 9. Outstanding items (from the original Tracking & Conversion MD)

These are tracking/conversion tasks, separate from the content build:
- **5a — `AW_PURCHASE_LABEL`** (Google Ads): still empty in `cl-thankyou-tracking.js`. Needs a "Purchase — Will Order" conversion action created in Google Ads account `658-429-9393`, then the label pasted in + deployed. Until then purchase conversions only flow via GA4→Ads import (≤24h latency). **Needs the site owner to create the conversion action.**
- **5b — GA4 admin:** mark Key Events (`purchase`, `click_start_will`, `email_captured`, `will_form_submit_attempt`, `will_form_submit_success`, `payment_failed`) and add Stripe referral exclusions (`buy.stripe.com`, `checkout.stripe.com`, `pay.stripe.com`). Can be driven in-browser via Claude-in-Chrome (GA4 admin), with confirmation per change. **Not yet done.**
- **5c — `account/index.html` GA4 patch:** insert the GA4/AW gtag snippet (`G-J3GPRFYR2Q` + `AW-17990502106`) into `<head>`. A self-contained idempotent script was provided; **confirm whether it was committed/pushed** (check `git log` for "Patch account/index.html with GA4").

Optional content follow-ups: PDF versions already done for trees+data (could extend to KB); a real named reviewer if/when credentials are supplied.

---

## 10. How to continue in a new Claude session (e.g. on the MacBook)

1. Open this repo, read this file first.
2. Confirm the local clone is up to date: `cd /Users/marge/clearlegacy-site && git pull`.
3. To extend content, reuse the generators (commit them to the repo if not already) and follow the deploy pattern in §5.
4. Keep the reviewer attribution as "ClearLegacy editorial team" (§2) and the brand palette (§3).
5. Re-validate JSON-LD and check internal links before pushing.
6. After pushing, allow the Cloudflare build lag, then `curl` the new URLs.

Note: chat memory does not transfer between Cowork sessions/devices. This document is the handover; keep it in the repo and update it as the project evolves.

---

# Phase 7 — Revenue Scaling Sprint (added 7 June 2026)

Phase 7 shifted from "can we get traffic?" to "scale winning traffic + convert". Built as **root-level extensionless pages** (e.g. `/probate-costs`), styled by a single shared `/cl-cluster.css`, all carrying the same brand, full schema (FAQPage+Article+Organization+BreadcrumbList), a 50–80w quick answer, a **"What happens next" conversion bridge**, and a **sticky CTA**.

## 7.1 What was built (84 pages total via the generator)
- **Probate cluster (5):** probate-costs, probate-timeline, probate-checklist, probate-without-a-solicitor, probate-for-executors
- **Calculator support (3):** probate-fees-calculator-explained, how-much-does-probate-cost, probate-fees-uk-2026 (fee tables to push the calculator to Top‑5)
- **Executor cluster (3):** what-does-an-executor-do, executor-checklist, executor-liability
- **Brand/entity (3):** about-clearlegacy, why-clearlegacy, how-clearlegacy-works
- **Executor 'after death' (5):** what-happens-after-someone-dies, how-to-close-bank-accounts-after-death, how-to-find-assets-after-death, what-documents-does-an-executor-need, digital-assets-after-death
- **Urgent will cluster (14) + hub (1):** can-i-make-a-will-online-today, how-quickly-can-i-write-a-will-online, fastest-way-to-make-a-valid-will, can-i-write-a-will-before-surgery, can-i-write-a-will-before-travelling, i-need-a-will-urgently, can-i-make-a-will-in-24-hours, how-do-i-sign-a-will-correctly, who-can-witness-a-will, what-happens-if-my-will-is-witnessed-incorrectly, cheapest-way-to-make-a-will, best-online-will-writing-service-uk, same-day-will-writing-service-uk, emergency-will-writing-service-uk, **need-a-will-today (hub)**
- **Commercial AEO Q&A (50 new total):** the 12 in the first batch plus IHT cluster, probate/admin, and wills/trusts/LPA/family questions.

JSON-LD: **336 blocks across 84 files, 0 invalid.** No duplicate slugs. Every page has the reviewer block + conversion bridge.

## 7.2 Generator (Cowork outputs `/phase7/`)
- `build_phase7.py` — template engine + schema + bridge + sticky CTA; `OUT = ./dist`; has a `derive_faq()` fallback.
- `content_phase7.py` — `aeo(...)` helper + first 26 pages.
- `content_aeo2.py` (IHT + probate/admin), `content_aeo3.py` (wills/trusts/LPA/family), `content_urgent.py` (urgent cluster + hub + executor after‑death).
- `run.py` — imports build + all content modules, calls `build()`. **Run this, not build_phase7.py directly** (avoids the `__main__` double‑import that yields 0 pages).
- `cl-cluster.css` — shared stylesheet, deployed to repo root.
- **To add pages:** append `aeo(...)` calls to a content module (or new one imported in run.py) and re‑run `python3 run.py`.

## 7.3 Deploy (idempotent)
`deploy-phase7.sh` (in `/phase7/`): pulls main, copies `dist/*.html` + `cl-cluster.css` to repo root, inserts new `<url>`s into sitemap.xml (skips existing), appends Phase 7 block to llms.txt once, shows git status, asks y/N, commits+pushes. Re‑running only adds what's new. First push (26 pages) is **already LIVE** (commit 128c5bc). Remaining 58 (to reach 84) are staged in `/phase7/dist` — re‑run the script to push them.

## 7.4 INTEGRITY rules added in Phase 7 (important)
- **Urgent‑will "service" claims:** pages state the true legal position (a will is valid the moment it's correctly signed and witnessed → same‑day validity is real) but do **NOT** assert a specific ClearLegacy "24‑hour turnaround", "same‑day delivery", "fastest in the UK", or any price — those are unverified. **Do not add them until the owner confirms the actual offer** (ASA/CAP + E‑E‑A‑T risk).
- **Comparison pages (P4):** never state competitor price/feature/quality unless verified from the competitor's own current materials (date‑stamped). Tier‑1 category comparisons safe now; named‑competitor pages wait for data. See `CLEARLEGACY-P3-P4-STRATEGY.md`.

## 7.5 Still open (need owner input or a live working session)
- **Will‑form CRO (Finding 5):** needs the live form + GA4 step data. Spec: progress indicator, trust messaging, help tooltips, exit‑intent capture, per‑step event instrumentation; measure mobile vs desktop completion, step abandonment, time‑to‑complete, error rates.
- **Attribution + assisted‑conversion dashboards (Findings 7 & 10):** **GA4 connector NOT connected** for ClearLegacy (connected ad accounts are a different entity, "ByErim" — do not use). Spec: funnel Landing → form_start → form_complete → purchase → revenue by landing page, plus assisted‑conversion view. Best as a Cowork artifact wired to GA4.
- **P3 trust signals:** `/pricing`, `/terms`, `/privacy`, `/refund-policy`, `/complaints`, company details + schema, real reviews/reviewer, founder story — all need real owner facts. See strategy doc.
- **Tracking 5a/5b/5c** (from §9) still open.
- **CTA URLs:** new pages link CTAs to `/start` and `/estate-risk-assessment/`. Confirm `/start` is the real will‑flow entry; if not, edit `URGENT_CTA`/`WILL_CTA` href and re‑run.

## 7.6 Companion docs (in `/phase7/`)
- `CLEARLEGACY-P3-P4-STRATEGY.md` — trust‑signal audit + comparison‑page plan (build‑ready; owner populates facts).
- `cl-will-form-cro.html` — drop‑in will‑form CRO kit (see §8.3).

---

# Phase 8 — GA4 attribution + will‑form CRO (added 7 June 2026)

## 8.1 GA4 is now connected (via Supermetrics MCP)
- Connector: **Supermetrics** (MCP), data source **GAWA** (Google Analytics 4). Authorized by **sat@installsmart.ai**. (adspirer's `google_analytics` tool still needs separate auth — we used Supermetrics instead.)
- **ClearLegacy GA4 property = `528577470`** (name "Clearlegacy", group "Clear Legacy"). The other two properties on the login (HonestHours `529307254`, InstallSmart.ai `529314888`) are different sites — do not use.
- Query pattern: `data_query(ds_id="GAWA", ds_accounts="528577470", date_range_type=..., fields="dim,metric,...")` returns a `schedule_id`; then poll `get_async_query_results(schedule_id)` until `completed`. Useful GA4 field IDs: dimensions `landingPage`, `sessionDefaultChannelGrouping`, `eventName`, `pagePath`; metrics `sessions`, `totalUsers`, `conversions`, `eventCount`, `ecommercePurchases`, `transactions`, `purchaseRevenue`, `totalRevenue`, `sessionConversionRate`, `bounceRate`. Revenue is GBP.

## 8.2 Live attribution dashboard (built)
- Cowork artifact id **`clearlegacy-attribution-dashboard`** (re‑openable in the sidebar). Dated snapshot, last 30 days as of 7 Jun 2026. Ask Claude to refresh to pull a newer window.
- **Key real findings (last 30 days):**
  - **Organic Search is the engine:** 1,035 sessions (47%), 48/67 conversions (72%), £474/£642 revenue (74%), 6/8 purchases. Confirms Finding 1.
  - **Will‑form funnel leak (the #1 lever):** **126 form_start users → 72 qualify_complete → 10 will_form_submit_success → 7 purchase.** ~86% drop at the submission step. `/forms/will.html` converts 8 of 56 sessions (14%).
  - **Guides assist, don't last‑click convert:** trust‑fund (149 sessions), executor‑of‑will (91), iht‑threshold (73), will‑cost (67) — high traffic, 0 direct conversions as landing pages. Confirms Findings 4 & 10; measure assisted conversions before judging guide ROI.
  - **Homepage `/`** = top converting entry (544 sessions, 31 conv, 3 purchases, £237).
  - **Caveat:** tracked revenue (£642/8 purchases) is a **FLOOR** (historic tracking gaps). Read page performance relatively, not by absolute £.
  - Phase 7's 84 new pages have ~0 sessions (deployed 7 Jun) — re‑check in 1–2 weeks.
- The form already emits rich GA4 events: `form_start, form_step_1..5, form_step_complete, qualify_answer/complete, will_form_submit_attempt/success, begin_checkout, checkout_redirect_success, payment_started/completed/failed, purchase, ads_conversion_purchase, email_captured, return_to_form, form_abandon_recoverable, form_abandoned`. Use these for the CRO measurement.

## 8.3 Will‑form CRO kit (DRAFT v1 — `/phase7/cl-will-form-cro.html`)
Drop‑in, framework‑agnostic vanilla HTML/CSS/JS targeting `/forms/will.html`. Implements all four Finding‑5 items: **(1) step progress indicator, (2) trust strip, (3) help tooltips for jargon fields, (4) exit‑intent save/email capture**. It hooks into the existing GA4 events (fires `email_captured`, `form_abandon_recoverable`, `form_abandoned`, plus `cl_cro_step_view`). Search the file for `[WIRE]` comments — these mark where to connect to the real form's step container, field IDs, step‑change calls (`clSetStep(n)`, `clFormStarted()`, `clFormDone()`), and the save‑progress endpoint. **It is a starting point — adapt to the real form markup and test on staging before deploy.**
**Next session (from Dubai):** get the real `/forms/will.html` markup (or screenshots/DOM via Claude‑in‑Chrome), wire the `[WIRE]` hooks to the actual steps/fields, A/B or staged‑deploy, then watch `form_start → will_form_submit_success` in the dashboard to confirm lift.

## 8.4 How to continue from a new device (e.g. Dubai)
1. `cd /Users/marge/clearlegacy-site && git pull` — brings this MD + `cl-will-form-cro.html` + `CLEARLEGACY-P3-P4-STRATEGY.md` if they were committed (deploy script copies them).
2. Read this MD first. GA4 = Supermetrics GAWA, property `528577470`.
3. To refresh the dashboard: re‑run the three queries in §8.2 and ask Claude to update artifact `clearlegacy-attribution-dashboard`.
4. CRO: open `cl-will-form-cro.html`, wire the `[WIRE]` hooks to the live form, test, deploy.

## 8.5 Still open after Phase 8
- Wire + deploy the will‑form CRO kit to the live form (needs real form markup).
- Build the four Tier‑1 comparison pages (safe; note `/farewill-vs-online-will` already exists on the live site — audit/refresh it).
- P3 trust pages (`/pricing`, policies, company details, real reviews/reviewer) — owner facts.
- Link the 84 new Phase 7 pages from the existing site nav/homepage/indexes (fixes Ahrefs "canonical has no incoming internal links" + aids indexing).
- Tracking 5a/5b/5c.
- Confirm `/start` real will‑flow URL (CTAs currently point to `/estate-risk-assessment/`).

---

# Phase 9 — GEO Score Recovery sprint (planned 7 June 2026)

Source: BabyLoveGrowth GEO audit (score dropped). Owner's correct framing: commercial data is strong (organic = 47% traffic, 72% conversions, 74% revenue), so this is a **coverage/completeness** issue on newly added pages, not strategy. Plan = recover GEO score by completing schema/reviewer/source/linking/FAQ coverage, then double down on the probate calculator.

## 9.1 ⚠️ INTEGRITY GUARDRAIL — named reviewer (Priority 2)
The plan recommends a named "Estate Planning Specialist" reviewer + `/reviewers/<name>` Person‑schema page, because AI prefers identifiable experts. **This is the same fabricated "Michael Smith, Estate Planning Specialist" removed in Phase 6A.** DO NOT invent a named reviewer. Only roll out named‑reviewer + Person schema when the owner supplies a **real, verifiable person** (themselves, or a named solicitor / STEP member who genuinely reviews). Until then keep "ClearLegacy editorial team" (Organization). This is a recurring, non‑negotiable guardrail.

## 9.2 Priority 1 audit — DONE for the 84 new pages (`/phase7/CLEARLEGACY-GEO-AUDIT.xlsx`)
3 sheets: Summary, Phase7 new pages (84, fully audited from source), Existing pages (crawl needed). **Key finding:** all 84 new pages already have FAQ+Article+Breadcrumb+Organization schema, quick answer, sources, last‑reviewed date, CTA, internal links, correct canonical. **Two real gaps:**
  1. **No VISIBLE FAQ section** — pages carry FAQ *schema* (2–3 Qs) but render only quick‑answer+body+example, no on‑page "FAQs" block. GEO/AEO best practice (and Priority 8) wants visible FAQs matching the schema. **This is the #1 quick win.**
  2. **No Person/named reviewer** — by design (see 9.1).
**Conclusion:** the GEO drop is most likely the **older existing pages** (guides, visual‑guides, tools, homepage, pricing, statistics) that predate the Phase 7 schema standard — audit those next via live crawl (Claude‑in‑Chrome) to fill sheet 3.

## 9.3 #1 quick win — add visible FAQ sections (ready to build)
Add a `render_faq()` to `build_phase7.py` that outputs the existing FAQ schema Q&As as a visible `<h2>FAQs</h2>` block (≥3–4 Qs), regenerate all 84 pages, redeploy via `deploy-phase7.sh`. Purely additive, low risk, directly addresses Priorities 8 + 3. Do this first next session.

## 9.4 Rest of the GEO plan (next‑session backlog, in priority order)
- **P3 schema completion** on existing pages: add SoftwareApplication/WebApplication schema to `/tools/probate-calculator` + `/tools/estate-risk-assessment`; Article+FAQ+Breadcrumb to guides/visual‑guides; Service/Offer to pricing.
- **P4 source attribution**: ensure every legal page has a Sources block (GOV.UK, HMRC, OPG, Citizens Advice, ONS, MoJ). New pages already do; older ones may not.
- **P5 AI‑crawler access**: audit `robots.txt` — confirm GPTBot, ChatGPT‑User, ClaudeBot, PerplexityBot, Google‑Extended, Googlebot, Bingbot are NOT blocked; check meta robots / X‑Robots / canonicals / sitemap inclusion.
- **P6 probate calculator authority**: expand `/tools/probate-calculator` (fee table, worked examples, solicitor‑vs‑online, FAQs, downloadable checklist) + internal links in from executor/timeline/risk‑tool/will‑cost/homepage. (Note: Phase 7 already shipped `/probate-fees-calculator-explained`, `/how-much-does-probate-cost`, `/probate-fees-uk-2026`, `/probate-costs` — link the live calculator to these.)
- **P7 internal linking repair**: link the 84 Phase 7 pages FROM the existing site (nav/homepage/indexes) and to `/tools/*`, `/forms/will.html`, `/pricing`, `/visual-guides/*`. Also fixes the Ahrefs "no incoming internal links" bucket.
- **P8 quick‑answer + visible FAQ** everywhere (see 9.3).
- **P9 re‑run BabyLoveGrowth GEO audit**; **P10 monthly AI‑visibility checks** (ChatGPT/Gemini/Perplexity/AI Overviews) on the listed queries — record mention/citation/URL/competitor.

## 9.5 Companion file
- `CLEARLEGACY-GEO-AUDIT.xlsx` (in `/phase7/`) — Priority 1 audit spreadsheet.

### Post‑GEO live fixes (10 Jun 2026, deployed)
- **Visible FAQ sections** added to all 84 Phase 7 pages (matching FAQPage schema) via `add_visible_faqs.py` — applied surgically to LIVE files (NOT regenerated), to preserve the parallel workstream's claims/CTA edits. Committed.
- **Calculator internal links** added to 24 probate/executor + 10 IHT pages via `add_tool_links.py` (→ `/tools/probate-calculator`, `/tools/uk-inheritance-tax-calculator/`, verified 200). Committed.
- **GENERATOR IS NOW STALE vs LIVE.** The parallel workstream (`claude/xenodochial-einstein` branch) re‑pointed CTAs (`/estate-risk-assessment/` → `/wills`), ran claims sweeps (removed "human‑review" + credential claims), deduped pages, and removed ops docs from the public root. **Never regenerate‑and‑deploy the 84 from `build_phase7.py` — it would revert their work.** Only deploy NEW pages, or patch LIVE files surgically (like the two scripts above). The handover MD now lives in `/_build/`, not the repo root.

---

# Phase 10 — Sales acceleration / conversion sprint (10 Jun 2026)

Owner reframed the goal: **monthly will sales**, not traffic/rankings/GEO. Briefs claimed "sales stalled 7+ days." GA4 says otherwise.

## 10.1 Revenue diagnostic — DONE (artifact `clearlegacy-revenue-diagnostic`)
GA4 via Supermetrics GAWA, property **528577470**. Findings:
- **No stall.** Last 7d beat prior 7d on every metric: form starts +59% (17→27), checkout/submit/purchase +100%, revenue +73% (£297→£513), traffic +13%. Real Stripe `cs_live` thank‑you pages through 10 Jun. Owner confirmed June sales are **real but inconsistent** (low‑volume variance).
- **Paid collapsed ~28 May** = the **intentional PMax pause** (£198 spend, 0 conversions — correct call). Organic held/grew (≈53% of sessions).
- **The real lever = MOBILE will‑form completion.** Mobile starts like desktop (52 vs 57) but completes at **1.9% vs 28%**; mobile = 34% of traffic, ~12% of purchases.
- Landing pages: homepage + `/forms/will.html` + `/guides/will-cost.html` convert; high‑traffic guides (trust‑fund 184 sess, probate‑timeline, executor, IHT) convert ~0 → add CTAs/assisted‑conversion tracking; `/tools/probate-calculator` gets traffic, 0 conversions → monetise.

## 10.2 Mobile will‑form fix (`forms/will.html`, owned by parallel workstream)
Diagnosis (see `/_build/will-form-mobile-fix.md`): mobile users reach step 1 then can't advance. Causes: **(a)** step 1 is overloaded — 8 required fields incl. DOB, full address, strict‑regex postcode; **(b)** the bottom "Continue" button gets obscured on mobile by the fixed `#cl-cookie` consent bar (only 72px reserved; it wraps taller) and/or the keyboard.
- **Patch A — DEPLOYED:** replaced the cookie script so the bar reserves its TRUE height (recalc on resize/keyboard) → can't cover Continue. Safe, isolated. (`apply_will_form_cookie_fix.py`). Renders clean on owner's iPhone.
- **Patch B — HELD:** sticky mobile nav conflicts with the fixed cookie bar (both `bottom:0`) — needs a real mobile test/Clarity before deploy, or rework to sit above the bar.
- **Structural (form owner):** split the 8‑field step 1 into two lighter steps — the proven mobile CRO fix.
- **Confirm via:** scheduled task **`clearlegacy-mobile-form-recheck`** fires **19 Jun 09:00** — re‑pulls GA4 mobile completion vs baseline (mobile 1.9% / desktop 28%) and verdicts whether Patch A worked; else → Microsoft Clarity mobile session recordings (Phase 3 of brief; needs Clarity/Hotjar).

## 10.3 Life‑event conversion pages (sprint P1) — 8 LIVE
Built with the generator (template nav fixed to Wills/Pricing/Guides; CTA `/wills/`; NO human‑review claims; visible FAQ + schema). Deployed via `deploy_lifeevent.sh` (copies ONLY the named slugs, never the 84). Content in `content_lifeevent.py`.
- **Tier 1 (→ /wills/):** wills-after-buying-a-house, wills-after-having-a-baby, recently-married-update-your-will, recently-divorced-update-your-will.
- **Tier 2:** going-on-holiday-estate-planning-checklist (→/wills/), i-own-a-house-with-my-partner (→/wills/), my-parent-has-died-what-next (→/probate-for-executors), i-have-been-named-executor (→/probate-for-executors).
- Did NOT rebuild `/wills-for-unmarried-couples` (already exists as `/wills-for-unmarried-couples-uk` + visual guide).

## 10.4 ⚠️ Claims guardrail (recurring — held firm 4+ times)
Every sales brief tries to add **"Human‑reviewed wills" / "Human review"** trust/process copy. This violates the live claims policy (commits `c630c11`/`a9054c5`). Do NOT add it. NOTE: my own `DEFAULT_BRIDGE` had a "Human review" step — **now fixed** to "Review and confirm". The live `/wills/` page still shows "Human‑reviewed wills" in its trust strip (parallel workstream re‑added it) — flag to owner, don't propagate.

## 10.5 Still open (sales sprint backlog — need owner/systems, NOT more pages)
- **Confirm the mobile‑form lift on 19 Jun** (scheduled). This is the #1 item.
- If unconfirmed → Patch B (reworked) and/or split step 1; get Clarity/Hotjar for mobile recordings.
- Email capture / exit‑intent / nurture sequence (P2/P3), review‑collection engine (P7), testimonial library (P8), professional‑referral pack (P9), controlled Google Search relaunch (P12 — keep PMax paused) — all need backend/systems or owner content, not page builds.
- Add CTAs/conversion bridges to the high‑traffic non‑converting guides (trust‑fund, probate‑timeline, executor, IHT) — parallel‑workstream pages, coordinate.
- Monetise `/tools/probate-calculator` (CTA + lead magnet).

## 10.6 Companion files (in `/phase7/` and `/_build/`)
- `will-form-mobile-fix.md` — mobile diagnosis + Patches A/B + structural fix.
- `apply_will_form_cookie_fix.py` — Patch A (exact‑match, idempotent).
- `add_visible_faqs.py`, `add_tool_links.py` — surgical LIVE‑file patchers (FAQ, calculator links).
- `content_lifeevent.py`, `deploy_lifeevent.sh` — life‑event pages + their scoped deploy.
- `CLEARLEGACY-REVENUE-DIAGNOSTIC-SPRINT.md` — the 10‑phase sales brief, filed.
- Artifacts (Cowork sidebar): `clearlegacy-attribution-dashboard`, `clearlegacy-revenue-diagnostic`.

## 10.7 Connector / data notes
- **GA4 = Supermetrics MCP**, data source `GAWA`, property `528577470` ("Clearlegacy"; authorized by sat@installsmart.ai). Async pattern: `data_query` → `get_async_query_results`. The adspirer connector's `google_analytics` tool is NOT authorized (its ad accounts are "ByErim", a different entity — don't use). The other two GA4 properties on the login (HonestHours `529307254`, InstallSmart.ai `529314888`) are different sites.
