# ClearLegacy — Priority 3 (Trust Signals) & Priority 4 (Comparisons) Strategy

**Date:** 7 June 2026
**Why this is a doc, not auto-built pages:** P3 and P4 both depend on **facts only the owner can supply or confirm** (founder identity, credentials, real reviews, pricing, turnaround, and accurate competitor data). Auto-generating these would mean inventing claims — the same E‑E‑A‑T and advertising‑compliance risk that got the fake "Michael Smith" reviewer removed in Phase 6A. So this is a build-ready plan you populate with verified facts, then deploy with the existing generator.

---

## Priority 3 — Entity Trust Signals

### A. What Phase 6A/7 already gives you
- `/about-clearlegacy`, `/why-clearlegacy`, `/how-clearlegacy-works` (live).
- Consistent governance block on every page: "Reviewed by: ClearLegacy editorial team", last/next review dates, jurisdiction, disclaimer.
- Organization schema sitewide; FAQ/Article/Breadcrumb on every page.

### B. Gaps to close (owner input required) — priority order
1. **Pricing page (`/pricing`)** — the single biggest trust + conversion gap. State the actual price(s), what's included, and turnaround. AI engines and buyers both reward transparent pricing. *Needs: real prices.*
2. **Policy pages** — `/terms`, `/privacy`, `/refund-policy`, `/complaints`. Table-stakes trust signals; their absence is a red flag to both users and AI. *Needs: owner/legal sign-off. Templates widely available; do not copy a competitor's verbatim.*
3. **Company details in the footer + `/about`** — registered company name, company number, registered address, contact email/phone. Add `Organization` schema fields (`legalName`, `address`, `email`, `vatID` if applicable). *Needs: real company details.*
4. **Real reviewer / author credentials** — only if a genuine, verifiable person (solicitor / STEP member) is willing to be named. If yes: add a real `/about/<name>` profile with credentials, switch governance + schema `author`/`reviewedBy` to `Person`. **Do not invent one.** Until then, "ClearLegacy editorial team" (Organization) is the honest and correct choice.
5. **Reviews / testimonials block** — only real, attributable reviews (e.g. a verified Trustpilot/Google widget). Add `AggregateRating`/`Review` schema **only if backed by genuine, verifiable ratings** — fake review schema is a manual-action risk. *Needs: real reviews.*
6. **Founder story** — a short, true founder section on `/about-clearlegacy` strengthens entity trust and branded search. *Needs: the real story.*
7. **Turnaround explanation** — one clear, honest paragraph on how fast the process is and what "ready" means. Ties directly into the urgent-will cluster (P1/P2).

### C. Schema upgrades (safe to do once details exist)
- Expand `Organization` to include `legalName`, `address` (PostalAddress), `email`, `telephone`, `sameAs` (real social profiles), and `founder` (if named).
- Add `WebSite` + `SearchAction` schema on the homepage for branded entity recognition.
- Add `AggregateRating` **only** with real numbers.

---

## Priority 4 — Comparison & Alternative Pages

### Integrity rule (read first)
Comparison pages are high-converting but high-risk. **Do not state competitor prices, features, turnaround, or quality claims unless verified from the competitor's own current site/material**, and **do not claim ClearLegacy is "fastest/cheapest/best" without substantiation** (ASA/CAP rules apply to comparative claims). Frame fairly, cite the competitor's own stated facts, and date-stamp ("as at <date>").

### Tier 1 — SAFE to build now (category comparisons, no competitor names)
These need no competitor data and are genuinely useful AEO targets:
- **`/online-will-vs-solicitor-will`** — process, cost range, suitability, when each is right.
- **`/online-will-vs-diy-will-kit`** — validity risk, guidance, cost, who each suits.
- **`/best-online-will-services-uk`** — *as a buyer's checklist* (what to look for) rather than a ranked list of named brands; positions ClearLegacy against the criteria. (Note: a version targeting the query already exists at `/best-online-will-writing-service-uk` from P1.)
- **`/fastest-online-will-writing-services-uk`** — explain the legal reality (validity is same-day) + the criteria for speed; avoid an unverified brand ranking.

I can generate these four with the existing generator immediately on request — they carry no fabrication risk.

### Tier 2 — Named-competitor pages (build only with verified data)
`/clearlegacy-vs-farewill`, `/clearlegacy-vs-octopus-legacy`, `/clearlegacy-vs-co-op-legal-services`, `/clearlegacy-vs-solicitor-wills`.

For each, supply (from the competitor's **own** current public materials, with the date checked):
- price(s) and what's included
- turnaround / process
- review/witnessing support
- regulatory status / who writes the wills
- jurisdiction coverage

Then the page presents a neutral, sourced comparison table + "when each is the better fit", and a ClearLegacy CTA. **Until that data is provided and verified, these stay unbuilt** to protect the brand from inaccurate comparative claims.

### Recommended page structure (all comparison pages)
1. 40–60 word direct answer ("Which is right for you?").
2. Neutral comparison table (dated, sourced).
3. "When [option A] is the better choice" / "When [option B] is".
4. Where ClearLegacy fits — honest positioning.
5. FAQ + schema (FAQPage + Article + BreadcrumbList).
6. CTA + sticky CTA.

---

## Suggested execution order (next session)
1. Build Tier‑1 comparison pages (safe, immediate).
2. Owner supplies pricing, company details, policies → build `/pricing` + policy pages.
3. Owner supplies verified competitor data → build Tier‑2 comparison pages.
4. Owner confirms reviewer/reviews → upgrade schema to `Person`/`AggregateRating`.
5. Re-run generator, redeploy via `deploy-phase7.sh`, resubmit sitemap in GSC.
