# Clear Legacy — V2 Deploy Runbook

This runbook walks you through deploying the V2 backend (admin dashboard rewrite + customer portal at `/account` + magic-link auth) to Cloudflare Workers, plus the GitHub-Pages re-publish of the customer portal SPA.

**Time required:** ~10 minutes the first time, ~3 minutes thereafter.

---

## 0. Prerequisites

You only need to do these once.

- A working Cloudflare account with the `clearlegacy-worker` Worker already deployed and bound to:
  - `CLEARLEGACY_KV` (Workers KV namespace)
  - `CLEARLEGACY_PDFS` (R2 bucket)
  - Browser Rendering enabled
- These existing secrets in the Worker:
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `RESEND_API_KEY`
  - `EMAIL_FROM` (e.g. `Clear Legacy <hello@clearlegacy.co.uk>`)
  - `PDF_DOWNLOAD_SECRET` (HMAC secret for download tokens)
  - `STRIPE_PAYMENT_LINK_SINGLE`, `STRIPE_PAYMENT_LINK_MIRROR`
- Node 20+ and `npx` on your machine
- `git` and a clone of `S7SSL/clearlegacy-site`

If any of those are missing, set them up first — they aren't part of this V2 push.

---

## 1. Pull latest from GitHub

```bash
cd ~/clearlegacy-site            # wherever you keep the repo
git pull origin main
```

You should see four new/changed files:

- `worker/src/handlers/admin.ts` — admin dashboard rewrite v2
- `worker/src/email.ts` — adds `sendMagicLinkEmail`
- `worker/src/index.ts` — adds `/api/auth/*` and `/api/account/*` routing + credentialed CORS
- `account/index.html` — customer portal SPA (NEW)

---

## 2. Add the new V2 secrets

The V2 backend introduces three new bindings/secrets. Run these from inside the `worker/` directory.

```bash
cd worker
```

### 2a. ADMIN_PASSWORD (HTTP Basic Auth for the admin dashboard)

If you don't already have one, generate a fresh password and set it:

```bash
openssl rand -base64 24
# copy the output, then:
npx wrangler secret put ADMIN_PASSWORD
# paste the password when prompted
```

Username for the admin login is `admin`. Save the password somewhere safe (1Password etc.) — Wrangler does not let you read secrets back.

### 2b. SESSION_SECRET (HMAC for magic-link tokens + session cookies)

```bash
openssl rand -base64 32
npx wrangler secret put SESSION_SECRET
```

### 2c. SITE_ORIGIN (so credentialed CORS can echo the right Origin)

This is the public origin of your marketing site (where `/account/` is served from). For production it's:

```bash
npx wrangler secret put SITE_ORIGIN
# enter: https://clearlegacy.co.uk
```

---

## 3. Verify wrangler.toml routes (no edits expected)

Your `wrangler.toml` should already route both `api.clearlegacy.co.uk/*` and `clearlegacy.co.uk/admin*` to the worker. Double-check:

```bash
npx wrangler deployments list
```

If `/admin*` isn't routed, add it as a route in `wrangler.toml` and re-deploy.

---

## 4. Deploy the Worker

```bash
cd worker
npx wrangler login    # only the first time, opens a browser
npx wrangler deploy
```

Wait for `Published clearlegacy-worker` and copy the deployment URL. The Worker is now live with V2.

---

## 5. Re-publish the customer portal SPA

`account/index.html` is committed at the repo root, so GitHub Pages picks it up automatically — no manual step. Wait ~30 seconds after the commit lands on `main`, then visit:

```
https://clearlegacy.co.uk/account/
```

If you use a custom CI to push the static site, run that pipeline now.

---

## 6. Acceptance tests

Run these in order. Each one only takes a few seconds.

### 6a. Admin dashboard

1. Open `https://api.clearlegacy.co.uk/admin` in a private window.
2. Log in with username `admin` and the password you set in step 2a.
3. Confirm:
   - Summary cards at the top show counts (Leads / Wills / Customers / Last 7 days).
   - The lead table renders with filters and CSV export button.
   - Clicking a row opens the detail view with notes + activity timeline.
   - "Resend onboarding email" works on a real customer.

### 6b. Customer portal — magic-link login

1. Open `https://clearlegacy.co.uk/account/` in a private window.
2. Enter an email address that has at least one paid Will under it.
3. You should see "Check your email."
4. Open the email. Subject: `Clear Legacy — your sign-in link`.
5. Click the link. You should land on `/account/` logged in, with your orders listed.

### 6c. Customer portal — claim flow

1. Sign in with an email that has a paid order **placed before V2 went live** (i.e. before `customerId` was attached to it).
2. The dashboard should show a banner: "We found N existing orders under your email."
3. Click "Claim my existing orders." Refresh — they should now appear in the list.

### 6d. Customer portal — fresh order

1. While signed in, click "Order a Single Will."
2. You should be redirected to a Stripe Payment Link.
3. Use a Stripe test card if you're on test mode; the new order should appear in the dashboard within ~5 seconds of the webhook firing.

### 6e. PDF download

1. Find an order whose status is `Ready` in the customer dashboard.
2. Click "Download PDF" — a new tab should open with the signed R2 URL and the PDF should download.

If any of those fail, check `npx wrangler tail` for the error and roll back with `git revert` + redeploy.

---

## 7. Rollback

If something is badly wrong:

```bash
cd ~/clearlegacy-site
git revert <bad-commit-sha>...HEAD
git push origin main
cd worker
npx wrangler deploy
```

The Worker is fully stateless apart from KV/R2, so a code rollback is safe. KV keys created by the new auth flow (`session:*`, `magic:*`) are harmless if left behind — they expire on their own TTL.

---

## 8. What changed (one-paragraph diff summary)

`admin.ts` is a full rewrite: it now renders summary cards, supports filtering and notes, exposes a CSV export, and shows a per-customer view with an activity timeline. `email.ts` adds `sendMagicLinkEmail` and a UTF-8 safe `bytesToBase64` helper. `index.ts` gains two route prefixes — `/api/auth/*` (request, verify, logout, me) and `/api/account/*` (dashboard payload, profile, claim, single order, order-pdf URL) — plus credentialed CORS that echoes `SITE_ORIGIN`. `account/index.html` is a new single-page customer portal that talks to those endpoints with `credentials: 'include'`.

That's it. You're live.
