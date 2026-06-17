# ClearLegacy — Revenue Recovery & Conversion Diagnostic Sprint
Prepared for Opus Inc. · filed 10 June 2026

## Executive summary
Recent positives: several sales, rising brand search, strong organic contribution, strong guide engagement, growing probate visibility, positive AEO/GEO traction.

**Problem:** sales have stalled for 7+ days.

**Priority is NOT more content.** It is to determine which of these is the cause:
- A traffic problem?
- A conversion problem?
- A tracking problem?
- A funnel problem?

No further major SEO/AEO work until these are answered.

---

## Phase 1 — Revenue diagnostic (Day 1)
Comparative report: **previous 28 days vs last 7 days**, for:
Users, Sessions, Organic Users, Homepage Visits, Guide Visits, Probate Calculator Visits, Estate Risk Tool Visits, Will Form Starts, Will Form Completions, Checkout Starts, Purchases, Revenue.

**Deliverable:** single dashboard showing Traffic → Intent → Form Starts → Purchases. Objective: identify where the drop occurred.

## Phase 2 — Funnel leak analysis (Day 1–2)
Track the full journey: Homepage → Pricing → Start Will → Step 1 → 2 → 3 → 4 → Payment Started → Payment Completed.
For every step record: users entering, users exiting, drop-off %, average completion time, mobile %, desktop %.
**Goal:** identify the exact leak.

## Phase 3 — Session recording audit (Day 2)
Review Microsoft Clarity or Hotjar recordings. Focus: top 20 organic visitors, top 20 form abandonments, top 20 checkout abandonments. Identify dead clicks, rage clicks, scroll issues, confusion, mobile problems, form errors. **Deliverable:** video-backed findings.

## Phase 4 — Top landing page audit (Day 3)
Review top 20 organic pages (probate calculator, executor guides, trust fund guide, will costs guide, homepage, probate pages). For each: sessions, engagement time, scroll depth, CTA clicks, form starts, purchases assisted, purchases direct. **Goal:** identify hidden revenue pages.

## Phase 5 — Conversion optimisation of winning pages (Day 4)
Every high-traffic guide gets a **Trust box** and **Process box** + CTAs (Start Your Will / View Pricing / How It Works).
Priority pages: probate calculator, executor pages, will costs, trust fund guides, homepage.

> ⚠️ **CLAIMS-COMPLIANCE FLAG:** the brief's Trust box lists "Human-reviewed wills" and the Process box step 2 is "Human review." This CONTRADICTS the site's existing claims policy (commits `c630c11` / `a9054c5` removed all human-review claims; "zero unverifiable credential claims remain"). Do NOT add human-review wording unless the review genuinely happens and is verifiable. Use compliant trust signals instead (fixed pricing, UK-focused, secure process, no hidden upsells).

## Phase 6 — Scenario conversion pages (Day 5)
Build first 10 conversion-first (not SEO-first) pages:
We just bought a house; we just had a baby; going abroad this summer; partner and I not married; children but no will; just got married; recently divorced; my parent has died; named executor; own property with my partner.
Structure: Situation → What happens without a will → Risk → Recommended action → CTA. **Goal:** capture trigger-event buyers.

## Phase 7 — Probate calculator monetisation (Day 5–6)
Strong impressions + engagement, weak monetisation. Add: probate cost examples, probate timeline, downloadable probate checklist, related executor guides, CTA modules, email capture, lead magnet "Probate Preparation Checklist" PDF. **Goal:** capture and convert calculator traffic.

## Phase 8 — Email capture system (Day 6)
Add to: probate calculator, estate risk tool, high-traffic guides, visual guides, statistics pages.
Lead magnets: Estate Planning Checklist, Probate Checklist, Executor Checklist, Family Protection Guide. **Goal:** prevent traffic leakage.

## Phase 9 — Assisted conversion reporting (Day 7)
Report: pages viewed before purchase. Track first touch / middle touch / last touch. **Goal:** identify true revenue contributors.

## Phase 10 — AEO expansion only AFTER diagnostic
- If traffic stable → focus on CRO.
- If traffic fallen → focus on probate, executors, knowledge base, scenario pages.
- If form starts stable but purchases down → focus entirely on checkout, trust, pricing, form UX.

---

## Deliverables required from Opus (within 7 days)
1. Traffic vs Conversion report
2. Funnel abandonment report
3. Session recording findings
4. Top landing page analysis
5. Assisted conversion report
6. CRO recommendations
7. Scenario page rollout plan

## Important
Do NOT spend the next week creating more generic guides, backlink campaigns, comparison articles, or statistics pages until the funnel is diagnosed. The site already has enough content to generate sales. Objective: determine why visitors are no longer converting. Fix the bottleneck first, then scale.

---

## Notes for execution (added by Opus)
- **Phase 1 is doable now** with the live GA4 connection (Supermetrics → GAWA, property `528577470`): pull last-7 vs prev-28 for the metric list. Some intent metrics map to GA4 events already firing: `form_start`, `form_step_1..5`, `begin_checkout` / `checkout_redirect_success`, `payment_started/completed`, `purchase`. Calculator/risk-tool visits = `pagePath` for `/tools/...`.
- **Phase 3 (session recordings)** needs Clarity or Hotjar — confirm which is installed; the connector/login is required.
- **Coordination:** a parallel workstream owns the homepage/guides/tools/forms pages. Phases 5–8 edit those — coordinate to avoid collisions.
- **Tie-in:** this supersedes further GEO/AEO build for now. The GA4 attribution dashboard already built (`clearlegacy-attribution-dashboard`) is the seed for the Phase 1 deliverable.
