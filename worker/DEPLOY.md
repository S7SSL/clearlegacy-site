# Clear Legacy — Deployment Runbook

End-to-end auto-PDF pipeline. Follow these steps in order. Total time: ~30–45 minutes.

## Scope

- **Will products** (£69 Single, £99 Mirror): fully automated. Customer pays → PDF generated → emailed and available to download immediately.
- **LPA and Probate products**: not automated (LPAs require the OPG's statutory LP1 forms, Probate is a human-mediated fixed-fee quote service). They stay on the existing lead-capture + Stripe flow — the forms will still POST leads to Formspree and redirect to Stripe on submit. Only the three checkout bugs are fixed.

`worker/TEMPLATE-CLAUSES.md` exists as optional reference for anyone reviewing the Will template later. It is **not** a launch blocker.

## 0. Pre-flight

You need:

- A Cloudflare account with **Workers Paid** ($5/mo) — required for Browser Rendering.
- **Browser Rendering** enabled: Cloudflare Dashboard → Workers & Pages → Compute (Workers) → Browser Rendering. Click "Enable" if not already.
- A **Resend** account (free tier is fine) with `clearlegacy.co.uk` verified as a sending domain (SPF + DKIM DNS records applied).
- Your existing **Stripe** account with access to Developers → Webhooks.
- Node 18+ and npm installed locally.

## 1. Install Wrangler and log in

```bash
cd ~/clearlegacy-site/worker
npm install
npx wrangler login
```

Wrangler opens a browser tab — approve access to your Cloudflare account.

## 2. Create the KV namespace

```bash
npx wrangler kv namespace create "CLEARLEGACY_KV"
```

You'll see output like:

```
✨ Add the following to your configuration file:
[[kv_namespaces]]
binding = "CLEARLEGACY_KV"
id = "abc123def456..."
```

Copy the `id` value and paste it into `worker/wrangler.toml` replacing `REPLACE_WITH_KV_NAMESPACE_ID`.

## 3. Create the R2 bucket

```bash
npx wrangler r2 bucket create clearlegacy-pdfs
```

(The bucket name in `wrangler.toml` must match.)

## 4. Set the secrets

```bash
# Long random string — one-time
npx wrangler secret put DOWNLOAD_TOKEN_SECRET
# Paste: any output of `openssl rand -hex 32`

# Resend API key
npx wrangler secret put RESEND_API_KEY
# Paste: re_... from resend.com → API Keys

# Admin notification email (will receive a BCC of every delivered Will)
npx wrangler secret put ADMIN_NOTIFICATION_EMAIL
# Paste: sat@clearlegacy.co.uk

# Stripe webhook secret — we set this AFTER deploying the Worker, see step 6
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# (initially paste a placeholder like "whsec_placeholder", update after step 6)

# Stripe API key — only needed if you later switch from Payment Links to Checkout Sessions.
# For now, Payment Links + webhook metadata is enough. Set a placeholder:
npx wrangler secret put STRIPE_SECRET_KEY
# Paste: sk_live_placeholder (can replace later)

# Admin dashboard password — protects /admin. Use a long random string.
npx wrangler secret put ADMIN_PASSWORD
# Paste: any output of `openssl rand -base64 24`
```

## 5. Deploy the Worker

```bash
npx wrangler deploy
```

You'll get a URL like `https://clearlegacy-api.<your-subdomain>.workers.dev`.

**Copy that URL**. Two places need updating with it:

- `forms/will.html` — `const WORKER_ENDPOINT = '...';`
- `thank-you.html` — `var WORKER_STATUS = '...';`

They currently default to `https://clearlegacy-api.kaizengold.workers.dev/...`. If your actual subdomain differs, update them and commit.

Verify health:

```bash
curl https://clearlegacy-api.<your-subdomain>.workers.dev/api/healthz
# expect: ok
```

## 6. Set up the Stripe webhook

Go to https://dashboard.stripe.com/webhooks → **Add endpoint**.

- **URL:** `https://clearlegacy-api.<your-subdomain>.workers.dev/api/stripe-webhook`
- **Events to send:**
  - `checkout.session.completed`

Click **Add endpoint**, then on the endpoint page, reveal the **Signing secret** (`whsec_...`) and re-run:

```bash
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste the real whsec_... value
npx wrangler deploy  # redeploy so the new secret is picked up
```

## 7. Configure the Stripe Payment Links to redirect to the thank-you page

For each of your two Payment Links (Single £69, Mirror £99):

1. Stripe Dashboard → Payment Links → click the link → **Edit**.
2. Scroll to **After payment** → select "Don't show confirmation page" → **Redirect to your website** → paste:
   `https://www.clearlegacy.co.uk/thank-you.html?ref={CHECKOUT_SESSION_CLIENT_REFERENCE_ID}`
3. Save.

Stripe will substitute `{CHECKOUT_SESSION_CLIENT_REFERENCE_ID}` with the `client_reference_id` we pass, so the thank-you page gets `?ref=<uuid>` and can poll.

## 8. Commit and push the site changes

From the repo root:

```bash
cd ~/clearlegacy-site
git add forms/will.html thank-you.html worker
git commit -m "auto-PDF pipeline: Worker + thank-you page"
git push
```

GitHub Pages deploys in ~60s. The site is at https://www.clearlegacy.co.uk.

## 9. Smoke test

Use Stripe **test mode** first. Stripe Dashboard → toggle "Test mode" top-right.

1. Create a duplicate of each Payment Link in test mode (Dashboard does this automatically under "Test data").
2. Temporarily update `worker/wrangler.toml` `[vars]`:
   ```
   STRIPE_URL_SINGLE = "https://buy.stripe.com/test_..."
   STRIPE_URL_MIRROR = "https://buy.stripe.com/test_..."
   ```
   and redeploy (`npx wrangler deploy`).
3. Also add a test-mode webhook endpoint in Stripe (same URL, same event) and grab its signing secret — but note the Worker only has one `STRIPE_WEBHOOK_SECRET` slot, so use the test secret during testing, then swap to live when done.
4. Go through the form end-to-end with Stripe test card `4242 4242 4242 4242` / any future date / any CVC.
5. Confirm:
   - Form POSTs to Worker, receives `checkoutUrl` with `?client_reference_id=<uuid>` appended.
   - Stripe redirects to `/thank-you.html?ref=<uuid>`.
   - Thank-you page polls `/api/status?ref=<uuid>` every 2s.
   - Within ~30s the status goes `pending → generating → ready`.
   - The download button appears; clicking it serves a PDF.
   - You receive an email (at whatever address you used in test mode) with the PDF attached.
   - `sat@clearlegacy.co.uk` receives the BCC.
6. Open the PDF and verify the content is correct.

## 10. Go live

When test runs clean:

1. In Stripe Dashboard, toggle back to **Live mode**.
2. Update `worker/wrangler.toml` `[vars]` back to the live Payment Link URLs (the originals) and redeploy.
3. Update `STRIPE_WEBHOOK_SECRET` with the live-mode webhook signing secret and redeploy.
4. Do one final end-to-end buy with your own card (refund yourself after).

## Operational notes

- **Logs:** `npx wrangler tail` for live Worker logs. Errors during PDF generation are logged here.
- **Admin dashboard:** Visit `https://clearlegacy-api.<your-subdomain>.workers.dev/admin` (or `https://api.clearlegacy.co.uk/admin` once the custom domain is wired up). Log in with any username and the `ADMIN_PASSWORD` secret. You'll see the most recent 50 leads with payment and PDF status; failed PDFs have a **Regenerate** button that re-runs generation + email for that ref. Clicking the ref's `details` link gives you the raw JSON for troubleshooting.
- **Retries:** If a PDF generation fails, the `LeadRecord` in KV is marked `pdfStatus: 'failed'`. Use the admin dashboard's **Regenerate** button to retry a single failed lead. There is no automatic retry.
- **Data retention:**
  - PDFs in R2: PDFs are kept for 90 days so the signed download link in the customer's email keeps working. Set this up once via R2 lifecycle rules:
    1. Cloudflare Dashboard → R2 → `clearlegacy-pdfs` → **Settings** → **Object lifecycle rules** → **Add rule**.
    2. Name: `delete-old-wills`. Prefix: `wills/`. Action: **Delete objects** after **90 days** since upload.
    3. Save. This auto-purges the bucket once per day; no Worker cron needed.
    4. If you later change `PDF_RETENTION_DAYS` in `wrangler.toml`, update the R2 lifecycle rule to match (otherwise download links will 404 before the email says they expire, or PDFs will outlive their download tokens).
  - KV lead records: auto-expire after 365 days (set in `worker/src/kv.ts`).
  - Stripe event idempotency markers: auto-expire after 7 days (covers Stripe's ~3-day retry window).
- **Custom domain (optional, recommended for production):**
  - Cloudflare Dashboard → Workers → clearlegacy-api → Triggers → Add Custom Domain → `api.clearlegacy.co.uk`.
  - Cloudflare handles the DNS automatically if your nameservers are on Cloudflare, otherwise add a CNAME at your DNS provider.
  - After it resolves, update `WORKER_ENDPOINT` in `forms/will.html` and `WORKER_STATUS` in `thank-you.html` to `https://api.clearlegacy.co.uk/api/lead` and `.../api/status`, and redeploy the site.

## Rollback

If something goes wrong after launch:

1. `forms/will.html` still falls back to the static Stripe URLs if the Worker is unreachable (6s timeout).
2. Formspree backup still runs on every submission so you won't lose leads.
3. To fully revert the form: `git revert <commit>` and push — GitHub Pages redeploys in 60s.
4. The Worker can be paused with `npx wrangler deployments list` and rolling back to a previous version, or disabled in Cloudflare Dashboard.
