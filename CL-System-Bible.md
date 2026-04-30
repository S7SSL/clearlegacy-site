# Clear Legacy — System Bible (Operations & Architecture)

**Last updated:** 30 April 2026 (post-V2 recovery)
**Owner:** Sat (sat@installsmart.ai / sat@byerim.com)
**Purpose:** Single source of truth for the Clear Legacy automated estate-planning service. Read this BEFORE making any changes. Every gotcha that has ever broken production is documented below — do not learn them again.

---

## TL;DR — If you're an AI agent or new operator, read this first

Clear Legacy is a one-person UK will-writing business automated end-to-end:
- **Marketing:** SEO (GitHub Pages static site) + Google Ads PMax
- **Conversion:** Customer fills will questionnaire → Stripe Payment Link → PDF generated → emailed
- **Backend:** Cloudflare Worker + KV + R2 + Browser Rendering
- **Tracking:** GA4 → Google Ads conversion import

There are **TWO Cloudflare workers** (one dead, one live), **TWO GA4 properties** with the same name, and **TWO Stripe webhook endpoints** subscribed to the same events. Every confusion in this codebase stems from these duplicates. Always verify which one you're touching.

**The single most important rule:** for this project, ALWAYS use `--name clearlegacy-api-v2` on every wrangler command. Bare `wrangler deploy` will NOT work due to the project layout (see 2.4 / Fuck-up #9).

---

## Section 1 — Cloud accounts and identities

### 1.1 Google accounts in use
| Account | Purpose |
|---|---|
| `sat@installsmart.ai` | Google Ads (account ID **658-429-9393**), GA4 admin, Stripe owner |
| `sat@byerim.com` | Cloudflare account owner (account ID **f520d3a645627577b250957a7341a988**) |
| `sat@clearlegacy.co.uk` | Customer-facing email |

When using `wrangler` CLI, make sure you're logged in as `sat@byerim.com` (`npx wrangler whoami`).

### 1.2 Domains
| Domain | Hosted on | Notes |
|---|---|---|
| `www.clearlegacy.co.uk` | GitHub Pages (`S7SSL/clearlegacy-site` repo, `main` branch) | Static HTML site. Auto-deploys on merge. |
| `api.clearlegacy.co.uk` | Cloudflare Worker `clearlegacy-api-v2` | Custom domain binding. **Note: was `clearlegacy-api` before 30 Apr — see 2.x.** |

---

## Section 2 — Cloudflare Workers (CRITICAL)

### 2.1 The two workers — DO NOT CONFUSE
| Worker name | Routes | Status | Purpose |
|---|---|---|---|
| **`clearlegacy-api-v2`** | `api.clearlegacy.co.uk` (custom domain) + workers.dev URL | **LIVE — current production** | Active production worker since 30 Apr 2026 |
| `clearlegacy-api` | None (custom domain moved to v2) | **DEAD — leave or delete** | Old broken production worker. Static-assets-only mode (no bindings). DO NOT REVIVE. |
| `marge` | None | Dev/personal | Falls back here when wrangler.toml is misread. Serves no real traffic. |

### 2.2 Why we have V2 — incident summary (30 Apr 2026)
The original `clearlegacy-api` worker was inadvertently converted to "static-assets-only" mode by a series of `wrangler deploy --assets ./_empty_assets` commands. Once Cloudflare classifies a worker as assets-only, the dashboard refuses to add server-side bindings or variables ("Variables cannot be added to a Worker that only has static assets"). Recovery required creating a brand-new `clearlegacy-api-v2` worker, transferring the custom domain, and re-setting all secrets. The old `clearlegacy-api` worker still exists in the account but no longer serves any traffic. See Appendix A for the full incident.

### 2.3 Deploying — the ONE correct way
From the worker source directory:

```bash
cd /Users/marge/clearlegacy-site/worker
npx wrangler deploy --name clearlegacy-api-v2
```

**`--name clearlegacy-api-v2` is MANDATORY for every deploy.** Without it, wrangler may fall back to the "marge" worker (which serves nothing) or trip the assets auto-detection error.

**NEVER use the `--assets` flag for this worker.** It silently converts the worker to static-assets-only mode and strips all bindings. This is exactly how production broke on 30 Apr.

After every deploy, verify the output explicitly says `Uploaded clearlegacy-api-v2`. If it says anything else (`marge`, `clearlegacy-api`, or no upload), STOP and investigate before continuing.

### 2.4 The wrangler.toml curse — why bare commands don't work
**Symptom A:** Bare `wrangler deploy` errors with "Asset too large. We found a file ... workerd with a size of 104 MiB".
**Symptom B:** Bare `wrangler deploy --dry-run` reports "No bindings found" or scans the parent dir as assets.

**Root cause:** Two stacked issues:
1. The original wrangler.toml had literal markdown link syntax in the route pattern (`pattern = "[api.clearlegacy.co.uk](http://api.clearlegacy.co.uk)"`), which silently broke wrangler's parser and caused fallback to default-named worker.
2. Wrangler 4.x auto-discovers static assets in the parent dir when no explicit `[assets]` block is honored. Since the worker dir is a subdir of the static-site project, wrangler finds `node_modules/workerd/bin/workerd` (104 MiB) in the parent and errors.

**Why we don't fix it:** Multiple attempted fixes (clean toml replacement, absolute path in `[assets]`, `--assets ./_empty_assets`) all either (a) didn't override the auto-detection, or (b) silently converted the worker to assets-only mode (which is what killed production on 30 Apr).

**The pragmatic workaround:** Always use `--name clearlegacy-api-v2`. The error is defensive — it prevents broken deploys, doesn't cause them.

**Future proper fix (Path 3, ~30 min when convenient):** Move the worker dir to its own repository outside the static-site project. Wrangler will then have no parent-dir to auto-discover. After this, bare `wrangler deploy` will work cleanly.

### 2.5 wrangler.toml — current content
The file is intentionally left in its slightly-cursed state because every "clean" attempt either failed to deploy or broke production. Here is the current shape:

```toml
name = "clearlegacy-api-v2"
main = "src/index.ts"
compatibility_date = "2025-10-01"
compatibility_flags = ["nodejs_compat"]
account_id = "f520d3a645627577b250957a7341a988"

routes = [
  { pattern = "api.clearlegacy.co.uk", custom_domain = true }
]

rules = [
  { type = "Text", globs = ["**/*.html"], fallthrough = true }
]

[[kv_namespaces]]
binding = "CLEARLEGACY_KV"
id = "164df086360a43798d421bb1f26d654c"

[[r2_buckets]]
binding = "CLEARLEGACY_PDFS"
bucket_name = "clearlegacy-pdfs"

[browser]
binding = "BROWSER"

[vars]
SITE_ORIGIN = "https://www.clearlegacy.co.uk"
API_ORIGIN = "https://api.clearlegacy.co.uk"
STRIPE_URL_SINGLE = "https://buy.stripe.com/7sYcMYaQ84rZbb9d5v5ZC03"
STRIPE_URL_MIRROR = "https://buy.stripe.com/eVq3co2jC7Eb2EDaXn5ZC04"
THANK_YOU_URL = "https://www.clearlegacy.co.uk/thank-you.html"
PDF_RETENTION_DAYS = "90"
EMAIL_FROM = "Clear Legacy <no-reply@clearlegacy.co.uk>"

[triggers]
crons = ["*/2 * * * *"]
```

A clean copy lives at: `/Users/marge/Downloads/cl-prod-fix/wrangler.toml.clean` (do not deploy with this without first confirming it doesn't trigger the assets auto-detection).

### 2.6 Worker secrets on `clearlegacy-api-v2`
Run `npx wrangler secret list --name clearlegacy-api-v2` to see current secret names. Values cannot be retrieved (write-only by Cloudflare design). All 6 are set:

| Secret | Value pattern | Where to retrieve / regenerate |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe Dashboard → Developers → API keys → Standard keys → Reveal |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe Dashboard → Developers → Webhooks → click `https://api.clearlegacy.co.uk/api/stripe-webhook` → Signing secret → Reveal (or Roll for fresh) |
| `RESEND_API_KEY` | `re_...` | resend.com → API Keys → may need to create new (Resend doesn't reveal old values either) |
| `DOWNLOAD_TOKEN_SECRET` | random 64-char hex | Generate with `openssl rand -hex 32` |
| `ADMIN_NOTIFICATION_EMAIL` | email address | Lead notification recipient (e.g. sat@clearlegacy.co.uk) |
| `ADMIN_PASSWORD` | strong password | /admin Basic Auth password |

To set/rotate:
```bash
cd /Users/marge/clearlegacy-site/worker
npx wrangler secret put SECRET_NAME --name clearlegacy-api-v2
# paste value at prompt
```

**`--name clearlegacy-api-v2` is mandatory.** Without it secrets go to "marge" (which serves nothing).

### 2.7 KV namespace
- Binding name: `CLEARLEGACY_KV`
- Namespace ID: **`164df086360a43798d421bb1f26d654c`**
- Stores: lead records keyed as `lead:<UUID>`, sessions, magic-link tokens
- Read example:
  ```bash
  npx wrangler kv key get "lead:UUID" --namespace-id 164df086360a43798d421bb1f26d654c --remote | python3 -m json.tool
  ```
- List recent leads:
  ```bash
  npx wrangler kv key list --namespace-id 164df086360a43798d421bb1f26d654c --remote --prefix "lead:"
  ```

### 2.8 R2 bucket
- Binding name: `CLEARLEGACY_PDFS`
- Bucket name: `clearlegacy-pdfs`
- Stores generated will PDFs at `wills/<ref>.pdf`
- Retention: 90 days (per `PDF_RETENTION_DAYS` var)

### 2.9 Browser Rendering API
- Binding name: `BROWSER` (env.BROWSER)
- Used by `src/pdf.ts` to render HTML → PDF
- Free tier limit: 60 calls/day. Paid plan removes this.
- Known failure mode: Browser Rendering can hang silently — wrap calls with a 25-second timeout in `src/handlers/webhook.ts` (the `withTimeout` helper). Without this, hangs leave leads stuck at `pdfStatus: generating` indefinitely (caused Rachel's 5-hour outage on 28 Apr).

---

## Section 3 — The Lead Lifecycle (end-to-end)

### 3.1 Happy path
1. Customer visits `clearlegacy.co.uk/forms/will.html`
2. Fills questionnaire, clicks Submit
3. Browser POSTs to `https://api.clearlegacy.co.uk/api/lead` with the questionnaire payload
4. Worker generates a UUID (the lead `ref`), stores `lead:<UUID>` in KV with the questionnaire and `pdfStatus: pending`
5. Worker responds with the matching Stripe Payment Link URL (single or mirror) appended with `?client_reference_id=<UUID>`
6. Browser redirects to Stripe checkout
7. Customer pays
8. Stripe POSTs `checkout.session.completed` to `https://api.clearlegacy.co.uk/api/stripe-webhook`
9. Worker verifies signature using `STRIPE_WEBHOOK_SECRET`, updates KV with payment data, kicks off `generateAndDeliver`
10. `generateAndDeliver`:
    - Fetches `lead:<UUID>` from KV
    - Renders the will template (`templates/will.html`) with the questionnaire data
    - Calls `renderPdf(env.BROWSER, html)` (wrapped in 25s timeout)
    - Stores PDF in R2 at `wills/<ref>.pdf`
    - Sends customer email + admin notification (each wrapped in 15s timeout)
    - Updates KV: `pdfStatus: ready`, `emailedAt: <timestamp>`
11. Customer clicks magic-link in email → /api/auth → portal session

### 3.2 Failure modes and recovery
**A. Lead stuck at `pdfStatus: pending` (no payment data)**
- Cause: Stripe webhook didn't reach worker, or signature verification failed
- Diagnosis: Stripe Dashboard → Developers → Webhooks → CL endpoint → recent deliveries → look at response code
- Common: 400 + `{"error":"invalid_signature"}` → STRIPE_WEBHOOK_SECRET on worker doesn't match Stripe's. Rotate per 4.3.

**B. Lead stuck at `pdfStatus: generating`**
- Cause: `renderPdf` or `sendEmail` hung past their timeout
- The watchdog cron (every 2 min) auto-fails any lead stuck in `generating` for >5 min
- Result: lead transitions to `pdfStatus: failed` with `pdfError` populated
- Manual recovery: open admin → find lead → click Regenerate

**C. Worker not responding**
- Diagnosis: `curl -i https://api.clearlegacy.co.uk/api/healthz` should return 200
- If not, check Cloudflare dashboard worker status

---

## Section 4 — Stripe (CRITICAL)

### 4.1 Account
- ONE Stripe account (`acct_1T2nXN2NFW59QiEi`) shared between Clear Legacy and ITSA Decline.
- Owned by Sat. Live mode is the only mode that matters for production.

### 4.2 Webhook endpoints
| Endpoint URL | Owner | Subscribed events |
|---|---|---|
| `https://api.clearlegacy.co.uk/api/stripe-webhook` | Clear Legacy worker | `checkout.session.completed` |
| `https://uavjeywctezxcchoyboz.supabase.co/functions/v1/proposal-payment-complete` | ITSA Decline (Supabase) | `checkout.session.completed` |

Both endpoints fire on every payment. Each must inspect `client_reference_id` / `payment_link` ID to determine whether the payment is for its service. CL worker returns 400 (`invalid_signature`) if the Stripe-Signature HMAC doesn't match `STRIPE_WEBHOOK_SECRET` — this DOES NOT mean the event is for ITSA, it means our signing secret is wrong.

### 4.3 The signing secret rotation procedure
**When to rotate:** Whenever the secret has been exposed (e.g., pasted in chat), or annually.

1. Stripe Dashboard → Developers → Webhooks → click `https://api.clearlegacy.co.uk/api/stripe-webhook`
2. Find "Signing secret" → 3-dot menu → **Roll secret** → confirm
3. Click "Reveal" to copy the new `whsec_...` value
4. Triple-click to select cleanly (no whitespace), Cmd+C
5. In Terminal:
   ```bash
   cd /Users/marge/clearlegacy-site/worker
   npx wrangler secret put STRIPE_WEBHOOK_SECRET --name clearlegacy-api-v2
   ```
6. Paste at prompt, press Enter immediately
7. Verify: in Stripe, on the most recent failed delivery row, click **Resend** → should return 200

**`--name clearlegacy-api-v2` is mandatory.**

### 4.4 Payment Link IDs (current, live mode)
- Single Will (£69): `https://buy.stripe.com/7sYcMYaQ84rZbb9d5v5ZC03`
- Mirror Wills (£99): `https://buy.stripe.com/eVq3co2jC7Eb2EDaXn5ZC04`

After-payment redirect (set in Stripe per Payment Link): `https://www.clearlegacy.co.uk/thank-you.html?session_id={CHECKOUT_SESSION_ID}&product=single|mirror`.

---

## Section 5 — GA4 (TWO PROPERTIES — CRITICAL)

### 5.1 The two GA4 properties named "Clearlegacy"
| Property name | Property ID | Account | Measurement ID | Status | Linked to Google Ads |
|---|---|---|---|---|---|
| Clearlegacy | **528577470** | Clear Legacy (387734623) | **G-J3GPRFYR2Q** | Active, receiving site traffic | ✅ YES (primary) |
| Clearlegacy | 534153342 | Clearlegacy.co.uk (392215052) | G-05W6L6CSQL | DEAD — no data flows here | Was linked. Do NOT use. |

The site's gtag is configured with `G-J3GPRFYR2Q` (sitewide on all 52 pages, plus in `cl-thankyou-tracking.js`). All actual analytics + purchase events flow into property **528577470**.

### 5.2 GA4 → Google Ads link
Property 528577470 is linked to Google Ads account 658-429-9393 (linked 26 Apr 2026). Verify at: GA4 → Admin → Property settings → Product links → Google Ads links.

### 5.3 Key events in property 528577470
- `purchase` (auto-fired by `cl-thankyou-tracking.js` on /thank-you with valid `session_id` or `ref`) — marked as a key event so it imports to Google Ads.

### 5.4 The thank-you tracking script
File: `cl-thankyou-tracking.js` at root of `clearlegacy-site` repo. Loaded async from `/thank-you.html`.
- Reads URL params: `session_id`, `product`, `ref`
- Guard: if no `session_id` AND no `ref` → does nothing (prevents bot/test pollution)
- Fires `purchase` event with `value: 69|99`, `transaction_id`, ecommerce items
- Fires `ads_conversion_purchase` (legacy, redundant)
- De-dupe via sessionStorage

---

## Section 6 — Google Ads

### 6.1 Account
- Account ID: **658-429-9393**, owner sat@installsmart.ai, currency GBP

### 6.2 Active campaigns
| Campaign | Type | Bidding | Budget | Status (30 Apr 2026) |
|---|---|---|---|---|
| ClearLegacy PMax | Performance Max | Maximise Conversions | £10/day | Eligible (Limited) — 20 impressions, 0 clicks, in bid-strategy learning |

### 6.3 Conversion action (current)
- Name: **Purchase (Google Analytics event purchase)**
- Source: GA4 import from property 528577470 (the LIVE one)
- Event: `purchase`
- Action optimisation: Primary
- Value: From GA4 (£1 fallback — should be raised to £69/£99 via dynamic value)
- Click-through window: 30 days, View-through: 1 day, Attribution: Data-driven

### 6.4 Why "Conversion tracking setup is incomplete" persists
The diagnostic clears only when:
1. Someone clicks a Google Ad
2. Purchases within the 30-day attribution window
3. GA4 attributes to Google Ads channel (not Direct/Paid Other)
4. Conversion imports to Google Ads

PMax is serving impressions but no clicks yet (day 2). The pipeline IS verified working (Audrey's £99 mirror purchase tracked in GA4 on 29 Apr). Just waiting for first attributed click + purchase. To force-clear: self-test (search ad term, click own ad, complete purchase, refund).

---

## Section 7 — Common operational tasks

### 7.1 Deploying worker code changes
```bash
cd /Users/marge/clearlegacy-site/worker
npx wrangler deploy --name clearlegacy-api-v2
```

Should output `Uploaded clearlegacy-api-v2`. If it says anything else, STOP and investigate.

Verify:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://api.clearlegacy.co.uk/api/healthz   # expect 200
npx wrangler deployments list --name clearlegacy-api-v2 | head -10                   # expect new version at top
```

### 7.2 Recovering a stuck PDF lead
```bash
# 1. Find the lead
cd /Users/marge/clearlegacy-site/worker
npx wrangler kv key get "lead:UUID" --namespace-id 164df086360a43798d421bb1f26d654c --remote | python3 -m json.tool

# 2. If pdfStatus is "generating" for >5min, watchdog auto-fails it. Wait 5-7min.
# 3. If pdfStatus is "failed", open admin → find lead → Regenerate.
# 4. If pdfStatus is "pending", payment never registered. Check Stripe webhook deliveries.
```

### 7.3 Manually flipping a lead's status
```bash
# Pull current
npx wrangler kv key get "lead:UUID" --namespace-id 164df086360a43798d421bb1f26d654c --remote > /tmp/lead.json

# Edit /tmp/lead.json (set pdfStatus: "failed", add pdfError: "manual recovery")
# Then put it back
npx wrangler kv key put "lead:UUID" --namespace-id 164df086360a43798d421bb1f26d654c --remote --path /tmp/lead.json
```
Then trigger Regenerate via admin.

### 7.4 Live tail of worker logs
```bash
npx wrangler tail --name clearlegacy-api-v2 --format pretty
```
Leave running. Trigger traffic by hitting an endpoint. Idle silence = waiting for traffic, not broken.

### 7.5 Validating Stripe webhook delivery
1. Stripe Dashboard → Developers → Events → click an event → see deliveries section
2. Each delivery row shows endpoint response code
3. Click row to expand → Response body shows actual error
4. Use "Resend" to retry after fixing config

---

## Section 8 — Recurring fuck-ups (LEARN THESE)

### Fuck-up #1: AI assistant pastes wrangler.toml in chat, markdown-link-wraps URLs/emails
**Symptom:** Wrangler silently ignores the file → deploys to wrong worker, no bindings.
**Prevention:** After ANY AI-assisted edit to wrangler.toml, run `wrangler deploy --dry-run --name clearlegacy-api-v2` and check for binding mentions.
**Source:** 30 Apr 2026.

### Fuck-up #2: Wrangler secret put without --name flag
**Symptom:** Secret goes to wrong worker; production unchanged; webhook keeps failing.
**Prevention:** Always include `--name clearlegacy-api-v2` for any wrangler secret/deploy command.
**Source:** 30 Apr — multiple secret rotations went to "marge" before we caught it.

### Fuck-up #3: Picking the wrong GA4 property
**Symptom:** Google Ads conversion tracking warning persists; no conversions ever import.
**Prevention:** When creating any GA4-linked Google Ads conversion action, the data source MUST be property 528577470 (Clearlegacy in account "Clear Legacy"), NOT property 534153342.
**Source:** 29 Apr — wasted 24 hours of "waiting for propagation".

### Fuck-up #4: Stripe webhook signing secret rolled without updating worker
**Symptom:** Every webhook returns 400 `{"error":"invalid_signature"}`.
**Prevention:** Whenever you click "Roll secret" in Stripe, immediately update `STRIPE_WEBHOOK_SECRET` on `clearlegacy-api-v2` (not marge, not the old clearlegacy-api).
**Source:** 30 Apr.

### Fuck-up #5: Treating "marge" as production
**Symptom:** Yesterday's incident fixes (timeouts, watchdog, admin pdfError) thought to be deployed, but in fact only on "marge" — production still ran old buggy code.
**Prevention:** Verify deploys land on `clearlegacy-api-v2` via `wrangler deployments list --name clearlegacy-api-v2`, and confirm version IDs match.
**Source:** 30 Apr.

### Fuck-up #6: Browser Rendering hangs without throwing
**Symptom:** Lead stuck at `pdfStatus: generating` indefinitely. No error logged.
**Prevention:** ALL renderPdf calls wrapped in `withTimeout(..., 25_000, "renderPdf")`. ALL sendEmail calls wrapped in `withTimeout(..., 15_000, "sendEmail")`. Watchdog cron auto-rescues anything that slips through.
**Source:** 28 Apr — Rachel's 5-hour stuck PDF.

### Fuck-up #7: cat -A doesn't work on macOS
**Symptom:** `cat -A` gives "illegal option" error.
**Prevention:** macOS uses `cat -evt`. Or use `python3 -c "import tomllib; tomllib.loads(open('wrangler.toml').read())"` to validate TOML directly.
**Source:** 30 Apr.

### Fuck-up #8: wrangler 4.x default assets discovery
**Symptom:** `wrangler deploy` fails with "Asset too large" (104 MiB workerd binary).
**Prevention:** This is the SAFE failure. Always pass `--name clearlegacy-api-v2`. NEVER pass `--assets` flag.
**Source:** 30 Apr.

### Fuck-up #9: --assets flag converts worker to static-assets-only mode (CATASTROPHIC)
**Symptom:** Wrangler deploy with `--assets ./_empty_assets` succeeds and reports `Uploaded clearlegacy-api`, but the worker is now a static-assets-only worker. All bindings (KV, R2, Browser) are stripped. Cron triggers stripped. Dashboard shows "0 bindings". The worker code accepts `/api/healthz` (200 ok) but every other endpoint fails because `env.CLEARLEGACY_KV` is undefined. Once classified as static-assets-only by Cloudflare, the dashboard refuses to add bindings ("Variables cannot be added to a Worker that only has static assets").
**Detection:** Cloudflare dashboard says "Metrics is unavailable for Workers with only static assets". Bindings tab shows "No connected bindings" and won't accept new ones via UI.
**Recovery:** Cannot fix in place. Must create a new worker (e.g. `clearlegacy-api-v2`), redeploy code, re-set all 6 secrets, transfer the custom domain. ~30 min of work + re-entering secret values.
**Prevention:** NEVER use `--assets` flag for this worker. Always `npx wrangler deploy --name clearlegacy-api-v2` (no `--assets`).
**Source:** 30 Apr — caused several hours of broken production until V2 recovery.

### Fuck-up #10: Project layout (worker as subdir of static-site project)
**Symptom:** Wrangler 4.x's assets auto-discovery walks UP from the worker dir to the static-site project root, then tries to upload everything (including node_modules) as static assets, hitting "Asset too large".
**Workaround:** Move worker dir to `/tmp` before deploying, OR always use `--name clearlegacy-api-v2` (which combined with the cursed wrangler.toml prevents the auto-discovery).
**Proper fix (Path 3):** Move the worker dir to its own dedicated repo (e.g. `clearlegacy-worker`) outside the static-site project. Defer until convenient.
**Source:** 30 Apr.

---

## Section 9 — Repository layout

```
clearlegacy-site/                              # GitHub repo S7SSL/clearlegacy-site
├── index.html                                  # Homepage
├── thank-you.html                              # Post-payment polling page
├── cl-thankyou-tracking.js                     # GA4 purchase event firing (with guard)
├── forms/
│   └── will.html                               # Will questionnaire form
├── guides/                                     # SEO articles
├── nhs-will-writing/                           # NHS niche pages
├── sitemap.xml
├── robots.txt
└── worker/                                     # Cloudflare Worker source (PROJECT-LAYOUT TRAP — see #10)
    ├── wrangler.toml                           # Worker config (PROTECT FROM AI EDITS)
    ├── package.json
    ├── _empty_assets/                          # Old workaround attempt (now harmless)
    │   └── .gitkeep
    ├── src/
    │   ├── index.ts                            # Router + Env interface
    │   ├── stripe.ts                           # Webhook signature verification
    │   ├── pdf.ts                              # Browser Rendering wrapper
    │   ├── email.ts                            # Resend wrapper
    │   ├── kv.ts                               # KV read/write helpers
    │   ├── template.ts                         # Will template renderer
    │   ├── tokens.ts                           # Magic-link token signing
    │   ├── types.ts                            # Lead/Order types
    │   └── handlers/
    │       ├── lead.ts                         # POST /api/lead
    │       ├── webhook.ts                      # POST /api/stripe-webhook + watchdog
    │       ├── status.ts                       # GET /api/status
    │       ├── download.ts                     # GET /api/pdf/:token
    │       ├── auth.ts                         # /api/auth/*
    │       ├── account.ts                      # /api/account/*
    │       └── admin.ts                        # /admin/*
    └── templates/
        └── will.html                           # Handlebars-style will template
```

---

## Section 10 — Quick reference card

```
ACCOUNTS
  Cloudflare:    sat@byerim.com           (account: f520d3a645627577b250957a7341a988)
  Google Ads:    sat@installsmart.ai      (CID: 658-429-9393)
  GA4 admin:     sat@installsmart.ai      (use property 528577470, NOT 534153342)
  Stripe:        sat owns                 (acct_1T2nXN2NFW59QiEi)
  GitHub:        S7SSL                    (repo: clearlegacy-site)

CRITICAL IDS
  Worker name (PROD):     clearlegacy-api-v2     <-- USE THIS
  Worker name (DEAD):     clearlegacy-api        (static-assets-only mode, no bindings, no traffic)
  Worker name (DEV):      marge                  (deploy here = nothing happens)
  KV namespace:           164df086360a43798d421bb1f26d654c
  R2 bucket:              clearlegacy-pdfs
  GA4 property (LIVE):    528577470     (G-J3GPRFYR2Q)
  GA4 property (DEAD):    534153342     (do not use)
  Stripe acct:            acct_1T2nXN2NFW59QiEi
  CL webhook URL:         https://api.clearlegacy.co.uk/api/stripe-webhook

STANDARD COMMANDS (run from /Users/marge/clearlegacy-site/worker/, ALWAYS WITH --name)
  Deploy:           npx wrangler deploy --name clearlegacy-api-v2
  Set secret:       npx wrangler secret put NAME --name clearlegacy-api-v2
  List secrets:     npx wrangler secret list --name clearlegacy-api-v2
  Tail logs:        npx wrangler tail --name clearlegacy-api-v2 --format pretty
  Deployments:      npx wrangler deployments list --name clearlegacy-api-v2
  Read lead:        npx wrangler kv key get "lead:UUID" --namespace-id 164df086360a43798d421bb1f26d654c --remote
  Healthz:          curl -i https://api.clearlegacy.co.uk/api/healthz   (expect 200)

NEVER USE
  --assets flag           Will silently break production (Fuck-up #9)
  Bare wrangler deploy    Will fail with "Asset too large" or deploy to wrong worker (Fuck-up #10)

URLS
  Site:           https://www.clearlegacy.co.uk
  API:            https://api.clearlegacy.co.uk
  Admin:          https://api.clearlegacy.co.uk/admin   (Basic Auth with ADMIN_PASSWORD)
  Healthz:        https://api.clearlegacy.co.uk/api/healthz
  Webhook:        https://api.clearlegacy.co.uk/api/stripe-webhook
```

---

## Appendix A — Incident log

| Date | Customer / Topic | Symptom | Root cause | Fix |
|---|---|---|---|---|
| 28 Apr 2026 | Rachel Anne Royal | PDF stuck `generating` for 5+ hours | Browser Rendering hung; ctx.waitUntil killed worker before catch fired | Added withTimeout wrappers + watchdog cron |
| 28 Apr 2026 | Alexandra Thewlis | Mirror wills had wrong second executor | Template's swapForPartner swapped names too aggressively | partnerExecutors override field added |
| 29 Apr 2026 | Audrey Robinson | Lead stuck `pending`; £69 paid but PDF never generated | Stripe webhook signing secret on prod was stale | Rotated secret, recovered via Resend in Stripe |
| 30 Apr 2026 | Production worker `clearlegacy-api` | "Conversion tracking is incomplete" warning persisted; eventually 0 bindings on prod | Sequence: (1) wrangler.toml had markdown link contamination → wrangler silently ignored config; (2) bare deploys went to "marge" worker; (3) attempted fix used `--assets` flag which converted clearlegacy-api to static-assets-only mode, stripping all bindings | **V2 RECOVERY:** created `clearlegacy-api-v2` from scratch, transferred custom domain, re-set all 6 secrets. Old `clearlegacy-api` left in dead state. New rule: always `--name clearlegacy-api-v2`, never `--assets`. |

---

## Appendix B — When to call for human help

You should NOT self-fix and instead escalate to Sat when:
- A customer has paid and the resolution requires changes that affect billing
- A new GA4 property/account would need to be created
- Stripe API keys need to be rotated (vs the webhook signing secret which is safer)
- DNS / Cloudflare zone records are involved
- Customer data needs to be deleted under GDPR

You CAN safely self-fix:
- Stuck PDFs (use the watchdog or manual KV flip)
- Webhook signature mismatches (rotate secret + redeploy with `--name clearlegacy-api-v2`)
- Wrangler.toml corruption (do NOT replace blindly — see Section 2.4 for why the cursed version is left intact)
- Stripe webhook delivery retries (just click Resend in Stripe)

---

## Appendix C — Outstanding cleanups (low priority)

1. **Delete the dead `clearlegacy-api` worker** via Cloudflare dashboard once V2 has been stable for 24+ hours. (As of 30 Apr 2026, V2 has been live for ~90 minutes.) Cleanup only — it serves no traffic.

2. **Path 3 repo restructure** — Move the worker dir to its own dedicated repository outside `clearlegacy-site/`. This eliminates wrangler 4.x's parent-dir auto-discovery problem permanently. After this, bare `wrangler deploy` (no `--name` flag) would work cleanly. ~30 min when convenient.

3. **Rotate STRIPE_WEBHOOK_SECRET one more time** (was exposed in chat during 30 Apr troubleshooting). Was rotated mid-day already, but worth a final fresh roll once V2 is stable.

4. **Consider explicit dynamic value in GA4 conversion action** (currently fallback £1) — set per-conversion value to use £69/£99 from the script's payload.

5. **Set up Logpush or upgrade to Workers Paid plan** so historical worker logs are retained beyond `wrangler tail` real-time. Free tier loses logs immediately.

---

*This document is the result of multiple painful debugging sessions on 28-30 April 2026. Every section exists because something broke and we want to never break it the same way again. Update this doc whenever you discover a new failure mode.*
