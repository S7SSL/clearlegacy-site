# ClearLegacy — Phase 6A AEO/GEO Build — Handover & Status

**Last updated:** 7 June 2026
**Repo:** github.com/S7SSL/clearlegacy-site (**GitHub Pages** static site served from `main`, behind the Cloudflare proxy — corrected 10 June 2026; it was never Cloudflare Pages)
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


---

# PHASE 6B ADDENDUM — 10 June 2026 session (read this; it corrects parts of the doc above)

## A. Infrastructure corrections (important)
- **Origin is GitHub Pages, NOT Cloudflare Pages.** The `/_redirects` file is therefore DEAD — GitHub Pages ignores it. Do not add rules there.
- Until 10 June 2026 the www + apex DNS records were **DNS only** (grey cloud): Cloudflare did literally nothing for the live site. Fixed: 4 apex A records + www CNAME flipped to **Proxied**; SSL mode is Full. Verified serving via Cloudflare (cf-ray present).
- **Redirects now live in Cloudflare → Bulk Redirects**: list `legacy_url_redirects` (37 entries), rule `legacy_url_redirects_rule` (enabled). Add future redirects THERE (CSV upload: source_url,target_url,301), never in `/_redirects`.

## B. Trust & claims policy (supersedes any older copy guidance)
- Site-wide attribution is **"ClearLegacy editorial team"** (Organization in schema). The "SL, Estate Planning Specialist" reviewer credit was removed from ~134 pages + 96 JSON-LD blocks (owner confirmed no formal qualification). Reviewer profile now reads "Founder · Lead Editorial Reviewer".
- All "qualified estate planner review" / "solicitor-verified" / "Guided by qualified legal professionals" product claims were replaced with truthful wording: **automated review / quality-checked / "Built around the Wills Act 1837"**. Keep it that way unless a real credentialed reviewer (STEP member/solicitor) is engaged — that remains the single biggest E-E-A-T upgrade available.
- Customer count claim: **"100+ UK families"** everywhere (llms.txt previously said 1,000+ — false). Contact email is **hello@clearlegacy.co.uk** (not support@).

## C. Fixes shipped 10 June (4 deploy batches, all live + verified)
1. llms.txt: all dead links fixed (4/7 key pages and 9/10 guide links were 404s), claims aligned with site, phantom products (Property Trust £149.99 / LPA / Storage) removed, HTML entities cleaned, /tools/ + /visual-guides/ added.
2. Template rot: mangled bylines ("Last updated:middot;") on 110 pages; `&amp;middot;` literals on 48 pages; "Regulated by Kaizen Finance Ltd" → "A trading name of…" on 157 pages; 34 stale `.bak` files (incl. old checkout pages) deleted from the public branch.
3. Internal links: 52 broken internal links across 21 phantom targets remapped to real pages; **new index pages created at /tools/ and /visual-guides/**; duplicated lede copy on /wills/ fixed. Site now crawls with 0 broken internal links (6,200+ checked).
4. Duplicate titles: 12 old "Redirecting…/Moved" stub pages + duplicate /terms.html deleted (their meta-refresh redirects never worked); replaced with proper 301s in the Bulk Redirects list; title clash resolved (standalone page retitled "Are Online Wills Legal in England & Wales? 2026 Guide"); sitemap cleaned.
- All 1,047 JSON-LD blocks re-validated after every batch (0 invalid).

## D. Google Ads (account 658-429-9393) — paused by design
Owner decision: ads burned money (May: ~£305 → 2-3 conversions); organic/AEO drives sales. All campaigns PAUSED and stay paused. Cleanup applied: 24-keyword negative list linked to both Search campaigns; non-converting RSA paused (the converting one: "Wills From Just £69"). Outstanding (manual, UI-only): set GA4 "ads_conversion_purchase" to Secondary to stop double counting.

## E. Bing Webmaster Tools (account active, site verified)
- Sitemap resubmitted 10 June (was stale since 8 May; Bing had only 89 URLs). 40 priority URLs pushed via URL Submission (quota 100/day).
- Bing's three recommendations: duplicate titles/descriptions → fixed at source (see C4), will clear on recrawl; inbound links → see pitch kit (F).
- Consider wiring **IndexNow** for instant Bing indexing on future deploys.

## F. Off-site / backlinks
Pitch kit at `_ops-docs/clearlegacy-backlink-pitch-kit.md`: 18 targets in 3 tiers, 3 email templates, 3-week sequence. Key facts: Wuhld already lists ClearLegacy (verify + thank); strongest news hook is the 6 April 2027 pension-IHT change. Ground rule: outreach claims must match the truthful on-site claims (B).

## G. Monitoring
- **Weekly scheduled audit** "clearlegacy-seo-aeo-weekly-audit" (Mondays 09:00, Cowork Scheduled sidebar): dead links in llms.txt/sitemap, JSON-LD validity, template-rot regression patterns, claim drift, indexation spot-checks.
- Existing 3-day indexation monitor still runs.

## H. Deploy pattern (corrected)
Same git flow as §5 above, but: build lag is GitHub Pages (~1 min). After deploys that change long-cached files, purge cache in Cloudflare (now effective, since the site is actually proxied). Redirects: Cloudflare Bulk Redirects UI, not files.

## I. Known open items
1. GA4 conversion action double-count fix (D) — 2 clicks in Google Ads UI. (ONLY remaining technical item.)
2. ~~"UK qualified · specialists" badge~~ — FIXED 10 June (now "Wills Act 1837 compliant"; "Estate Planning Team" → "editorial team").
3. ~~twitter:title on is-an-online-will-legal-uk/~~ — FIXED 10 June.
4. ~~"human estate-planner review" contradiction~~ — FIXED 10 June (neutral "documented review step" wording).
5. NOTE: this repo is PUBLIC and GitHub Pages serves every committed file — internal docs (audits, this handover, the pitch kit) are world-readable. Consider moving ops docs to a private repo.


## J. GSC baseline — 10 June 2026 (last 3 months, Google Web search, sc-domain property)
Totals: 145 clicks · 38.5K impressions · 0.4% CTR · avg position 56.8. Impressions inflecting upward since early May (Phase 6A).

| Query | Pos | Impr | Clicks |
|---|---|---|---|
| clear legacy (brand) | 1.3 | 68 | 42 |
| probate fees 2026 | 8.5 | 54 | 1 |
| probate cost calculator | 8.9 | 36 | 1 |
| probate costs calculator uk | 9.3 | 12 | 1 |
| probate fees calculator uk gov | 9.8 | 15 | 1 |
| best will writing service uk | 13.5 | 6 | 1 |
| probate fees calculator uk | 16.0 | 146 | 2 |
| probate fees calculator | 19.7 | 628 | 4 |
| wills cost uk | 40.6 | 7 | 1 |
| how much does a will cost uk | 42.8 | 52 | 1 |

Strategy: probate-calculator cluster is already page 1 — biggest near-term win is pushing "probate fees calculator" (628 impressions, pos 19.7) onto page 1 via backlinks (pitch kit, F). Will-writing money terms are the medium-term targets. 90-day targets: probate calculator terms top 5; "best will writing service uk" page 1. Measure all progress against this table.


## K. Session close-out — 10 June 2026 (final state)
- **Claims sweep COMPLETE**: exhaustive grep confirms zero unverifiable credential claims remain in any of the 300+ pages ("qualified estate planner", "qualified-planner", "Estate Planning Specialist", "UK qualified", "Qualified review", "estate-planner review" — all removed or rewritten to automated/structured-review wording; commit a9054c5). Allowed exceptions (true generic advice): "consult a qualified estate planner or solicitor", "A qualified estate planner can talk you through", "straightforward for any qualified estate planner", "review is by a qualified estate planner, a paralegal, or automated".
- **Bulk Redirects list**: now 37 entries (16 legacy llms.txt URLs + 21 deleted-stub URLs). All verified live with 200 at destination.
- **GSC (10 June)**: sitemap resubmitted; /tools/ and /visual-guides/ submitted via Request Indexing (both were "unknown to Google"). Do NOT re-request repeatedly.
- **Bing (10 June)**: sitemap resubmitted (was stale since 8 May; Bing knew only 89 URLs); 40 priority URLs pushed via URL Submission. Bing's duplicate-title/description warnings fixed at source — will clear on recrawl.
- **Weekly audit updated**: now also greps for recurrence of every removed claim pattern (template regression guard), checks live llms.txt freshness via Cloudflare, and verifies 3 redirects.
- All four 10-June deploy batches + handover updates pushed; final commit a9054c5.

## L. 11 June 2026 — GBP, DKIM, GA4 conversion hygiene
- **Google Business Profile CREATED (unverified)** under sat@clearlegacy.co.uk: name "ClearLegacy"; category **Legal services** (deliberately NOT "Estate planning attorney" — no credentials, misrepresentation risk); **no visitable location** (Paul Street is a virtual office — honest answer, lower suspension risk); service areas England, UK + Wales, UK; phone 07707 071984; website https://www.clearlegacy.co.uk; services "Online will writing" + "Mirror wills for couples"; description added (£69/£99, Wills Act 1837 check, 24h delivery, 100+ families, Kaizen Finance Ltd 12092327 — GBP descriptions reject URLs/emails); hours skipped; £400 ads credit skipped. **NOT publicly visible until video verification** (only method offered). Video must show: live site + Stripe dashboard with business name, Paul Street certification letter / Companies House entry, work setting. Manage at business.google.com.
- **DKIM ENABLED**: 2048-bit key, selector "google"; TXT `google._domainkey` added in Cloudflare DNS (verified resolving via dns.google); Start authentication clicked in Workspace Admin. Outbound email auth now SPF + DKIM + DMARC complete.
- **Google Ads conversion hygiene**: GA4 import "Purchase (Google Analytics event ads_conversion_purchase)" switched **Primary → Secondary** in Ads UI (account 658-429-9393). "Purchase (Google Analytics event purchase)" remains the sole Primary — no double-counting if ads are ever re-enabled.
- Still open: GBP video verification (Sat, ~5-day Google review); Trustpilot + Reviews.co.uk claims → then worker review-ask patch; LinkedIn URL → sameAs on /founder/; pitch kit execution (F).

### L1. 11 June — second claims sweep (human-review / specialist residue)
120 files: removed all "Human review"/"Human-reviewed" product claims (~115 instances — site FAQ itself states the service is fully automated) and a missed claim family "qualified UK estate planner" / "estate planning specialist" (the word "UK"/"planning" in the middle dodged the 10-June regexes). Replaced with "structured automated review" / "checked against the Wills Act 1837" wording. Also fixed: /proposal/ "our solicitor team" (false), how-clearlegacy-works HowTo schema step "Qualified estate planner review", why-clearlegacy FAQ/schema, comparison-table Review rows (farewill-alternative, online-will-vs-solicitor, cheap-vs-solicitor-wills, top-online-will-providers-uk), _offsite-drafts + Reddit playbook. Weekly audit must add patterns: "human.review", "human-reviewed", "qualified UK estate planner", "estate planning specialist", "solicitor team". Allowed exceptions unchanged + editorial-policy "human review was completed" (true, refers to SL reviewing content) and /reviewers/ pages (honest).
