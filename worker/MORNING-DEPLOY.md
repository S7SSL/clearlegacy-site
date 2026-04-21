# Clear Legacy — Morning Deploy Playbook

**Goal:** finish the Clear Legacy auto-PDF pipeline deploy from where we left off last night. Budget ~20 minutes if nothing snags.

**Where we left off:** the `wrangler login` OAuth tab is open in your browser; you haven't clicked Allow yet. Your existing Cloudflare account `Sat@byerim.com's Account` will become the Clear Legacy Cloudflare home (ITSA isn't on Cloudflare so there's no conflict). No secrets have been set on Cloudflare, no KV namespace, no R2 bucket, no Worker deployed.

**What Claude cannot do for you (why this is all in your hands):**
- Click Allow on OAuth — browsers are tier "read" for Claude's tools.
- Pay Cloudflare $5 for Workers Paid — financial transactions are prohibited.
- Type into your Terminal — Terminal is tier "click" for safety.
- Create Stripe webhooks — no Stripe MCP connected in this session.
- DNS / Resend domain setup — your registrar + your mailbox.

**What Claude WILL do when you're back:**
- Update `worker/wrangler.toml` with your KV namespace id and, if needed, account_id.
- Update `forms/will.html` and `thank-you.html` with your actual workers.dev URL if different from the hardcoded one.
- Sanity-check the end-to-end smoke test output and diagnose any errors.
- Prepare a live-mode switchover plan once the test run is green.

---

## Checklist (tick as you go)

- [ ] 1. Rename Cloudflare account to "Clear Legacy"
- [ ] 2. Click Allow in the OAuth tab (or re-run `npx wrangler login` if the tab closed)
- [ ] 3. Upgrade to Workers Paid ($5/mo)
- [ ] 4. Enable Browser Rendering
- [ ] 5. Run `npx wrangler whoami` — paste output to Claude
- [ ] 6. Create KV namespace — paste id to Claude
- [ ] 7. Create R2 bucket `clearlegacy-pdfs`
- [ ] 8. Set 6 wrangler secrets
- [ ] 9. `npx wrangler deploy` — paste workers.dev URL to Claude
- [ ] 10. Curl healthz to confirm Worker is alive
- [ ] 11. Create Stripe test-mode webhook — push its `whsec_...` secret, redeploy
- [ ] 12. Configure Stripe Payment Link redirect URLs
- [ ] 13. Smoke test with card `4242 4242 4242 4242`

---

## Step 1 — Rename Cloudflare account

Cloudflare dashboard → bottom-left "Manage account" → find the account name field → rename from `Sat@byerim.com's Account` to **`Clear Legacy`**. Save.

Purely cosmetic, but when you later look at billing/logs you'll know which project you're in.

## Step 2 — Finish the OAuth

If your `wrangler login` tab is still open, click **Allow** / **Authorize**. Terminal prints `Successfully logged in`.

If the tab timed out / you closed it, in Terminal from `~/path-to-clearlegacy-site/worker`:

```
npx wrangler login
```

A fresh tab opens — click Allow.

## Step 3 — Workers Paid

Cloudflare dashboard → make sure the top-left shows the Clear Legacy account → **Workers & Pages** (Compute section in sidebar) → **Plans** (top of Workers & Pages page) → **Workers Paid** → **Subscribe** → card details → confirm. $5/mo.

If the dashboard offers the Workers Free tier by default, ignore it — Browser Rendering needs Paid.

## Step 4 — Enable Browser Rendering

Still in Workers & Pages → left sidebar look for **Browser Rendering** (might be under "Compute" submenu). Click into it. If it says "Get started" or "Enable", click that. No card needed (it's part of Workers Paid).

If you can't find it: the direct URL template is `https://dash.cloudflare.com/<ACCOUNT_ID>/workers-and-pages/browser-rendering` — you'll get the ACCOUNT_ID from step 5 below.

## Step 5 — Capture account ID

In Terminal:

```
npx wrangler whoami
```

Output will look like:

```
 ⛅️ wrangler 4.x.x
 -------------------
Getting User settings...
👋 You are logged in with an OAuth Token...
Associated email: Sat@byerim.com

Account Name                              Account ID
Clear Legacy                              a1b2c3d4e5f6...
...
```

**Paste that whole table to Claude.** If there's only one account, wrangler will use it automatically. If there's more than one, I'll add an explicit `account_id = "..."` to `wrangler.toml` to pin Clear Legacy.

## Step 6 — Create KV namespace

From `<your-repo>/worker` in Terminal:

```
npx wrangler kv namespace create "CLEARLEGACY_KV"
```

Output:

```
✨ Success!
Add the following to your configuration file:
[[kv_namespaces]]
binding = "CLEARLEGACY_KV"
id = "abc123def456..."
```

**Paste that block to Claude.** I'll write the `id` into `worker/wrangler.toml` (currently has the placeholder `REPLACE_WITH_KV_NAMESPACE_ID`).

## Step 7 — Create R2 bucket

```
npx wrangler r2 bucket create clearlegacy-pdfs
```

Should print `Creating bucket clearlegacy-pdfs... ✨ Success!`. If you get "bucket already exists", that's fine — means this was done previously.

## Step 8 — Set secrets

Six secrets, one `wrangler secret put` per secret. For each command, it prompts "Enter a secret value" and you paste the value and hit Enter.

```
npx wrangler secret put DOWNLOAD_TOKEN_SECRET
```
→ Paste output of `openssl rand -hex 32` (run that in a separate Terminal pane). This signs the PDF download links.

```
npx wrangler secret put RESEND_API_KEY
```
→ Paste your Resend `re_...` key. If you haven't signed up for Resend yet: go to resend.com, sign up free, **Domains → Add Domain → `clearlegacy.co.uk`**, add the SPF + DKIM DNS records it gives you to your registrar (wherever `clearlegacy.co.uk` is hosted), wait for the "Verified" green tick (~5-60 min depending on DNS TTL), then **API Keys → Create API Key → name: "Clear Legacy Worker" → full access → Create → copy once and paste into wrangler**. This is the biggest potential morning time-sink — if DNS propagation is slow, it may need to run while you do Stripe setup.

```
npx wrangler secret put ADMIN_NOTIFICATION_EMAIL
```
→ Paste `sat@clearlegacy.co.uk` (or wherever you want a BCC of every delivered Will).

```
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```
→ Paste `whsec_placeholder` for now. We'll overwrite this in Step 11 with the real one.

```
npx wrangler secret put STRIPE_SECRET_KEY
```
→ Paste your ITSA-account `sk_test_51T2nXhRrhaXroCLz...Du` (from the ITSA doc; same Stripe account per last night's conversation). The Worker barely uses this — Payment Links + webhook metadata carry the workload — but it needs a non-empty value.

```
npx wrangler secret put ADMIN_PASSWORD
```
→ Paste a long random string (e.g. output of `openssl rand -base64 24`). This guards the `/admin` dashboard. **Save it to 1Password** before you close the Terminal — you can't retrieve it from Cloudflare later.

## Step 9 — Deploy

```
npx wrangler deploy
```

You'll see something like:

```
Total Upload: ~100 KiB / gzip: ~40 KiB
Uploaded clearlegacy-api (2.3 sec)
Deployed clearlegacy-api triggers (0.3 sec)
  https://clearlegacy-api.<your-subdomain>.workers.dev
```

**Paste the `https://clearlegacy-api.<your-subdomain>.workers.dev` URL to Claude.** If the subdomain differs from `kaizengold.workers.dev` (which is hard-coded in `forms/will.html` and `thank-you.html`), I'll update those two files.

## Step 10 — Healthz

```
curl https://clearlegacy-api.<your-subdomain>.workers.dev/api/healthz
```

Should print `ok`. If you get 500 / 404 / nothing, paste the error to Claude and we'll diagnose.

## Step 11 — Stripe test-mode webhook

1. Stripe dashboard → top-right, toggle on **Test mode** (the URL should change to `https://dashboard.stripe.com/test/...`).
2. **Developers → Webhooks → Add endpoint**.
3. **Endpoint URL:** `https://clearlegacy-api.<your-subdomain>.workers.dev/api/stripe-webhook` (exact URL from step 9).
4. **Events to send:** `checkout.session.completed` (just that one).
5. **API version:** latest (same as the ITSA endpoint uses).
6. Click **Add endpoint**.
7. On the new endpoint's page, click **Signing secret** → **Reveal** → copy the `whsec_...` value.
8. Back in Terminal:

```
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# paste the real whsec_... when prompted

npx wrangler deploy
# redeploy so the new secret is live
```

## Step 12 — Stripe Payment Link redirect

You have three live Payment Links (Single Will, Mirror Will, LPA, Probate — four actually). For each:

1. Stripe dashboard → **Product catalogue** / **Payment Links** → click the link → **Edit**.
2. Scroll to **After payment** → **Don't show confirmation page** → **Redirect to your website**.
3. URL: `https://www.clearlegacy.co.uk/thank-you.html?ref={CHECKOUT_SESSION_CLIENT_REFERENCE_ID}`
4. **Save**.

Stripe substitutes `{CHECKOUT_SESSION_CLIENT_REFERENCE_ID}` with whatever `client_reference_id` our form passes. The Will forms pass one; LPA/Probate don't — they'll just see a blank `?ref=` on the thank-you page, which it handles (shows a generic thanks-we'll-be-in-touch).

**Important:** do the edit in both **Test mode** (for tonight's smoke test) and **Live mode** (before your first real sale). Test-mode Payment Links are separate entities from the live ones.

## Step 13 — Smoke test

1. Open your site's Will form: `https://www.clearlegacy.co.uk/forms/will.html` (or local copy if not yet pushed).
2. Fill it out with junk but real-looking data — use **your own email** for the testator email field so you receive the PDF.
3. Pick Single or Mirror. Submit.
4. You should redirect to a **test-mode** Stripe Checkout page. Pay with:
   - Card: `4242 4242 4242 4242`
   - Expiry: anything in the future (e.g. `12 / 30`)
   - CVC: any 3 digits (e.g. `123`)
   - Postcode: any
5. After "Pay", Stripe redirects to `https://www.clearlegacy.co.uk/thank-you.html?ref=<uuid>`.
6. The thank-you page polls `/api/status?ref=<uuid>` every 2s. You should see:
   - "Payment confirmed" within ~5 seconds.
   - "Generating your Will..." for ~20-30 seconds.
   - **Download** button appears.
7. Click Download — a PDF opens in a new tab. Open it, scroll through, confirm your testator name / executors / beneficiaries / attestation page are all populated.
8. Check your inbox — email from `Clear Legacy <no-reply@clearlegacy.co.uk>` with the PDF attached.
9. Check `sat@clearlegacy.co.uk` inbox — the BCC should also have arrived.

### If anything fails in the smoke test

Paste to Claude:
- Browser console errors from the thank-you page (F12 → Console).
- Output of `npx wrangler tail` (run this in a separate Terminal pane BEFORE the smoke test to stream Worker logs live).
- What step it broke on (paid but no status change? status ready but no email? PDF corrupt?).

Claude can then patch the code and you redeploy.

## After the smoke test

When the Single Will test run is 100% green:

- Run the same smoke test once more with **Mirror Will** selected — mirror renders a different template path and is the higher-revenue product.
- Visit `https://clearlegacy-api.<your-subdomain>.workers.dev/admin` → browser prompts for Basic Auth → username: anything, password: your `ADMIN_PASSWORD` from Step 8 → you should see your two test leads in the table.

Then the real-world switchover (can do this alongside normal workday):

1. **Rotate the exposed `sk_live_...JOqn` key** (from your ITSA doc) in Stripe → Developers → API keys → Roll. Push new value to ITSA Supabase AND Clear Legacy if it was populated.
2. In Stripe, flip to **Live mode**, repeat Step 11 (new webhook endpoint for live mode, different `whsec_...`).
3. Update the Worker's `STRIPE_WEBHOOK_SECRET` to the live one, `npx wrangler deploy`.
4. Repeat Step 12 on the live-mode Payment Links.
5. In R2 dashboard → `clearlegacy-pdfs` → Settings → **Object lifecycle rules** → Add rule "delete-old-wills", prefix `wills/`, delete after 90 days (matches our signed-download-token TTL).
6. One real-card purchase, refund yourself in Stripe after it works.

---

## If you're stuck on any step

Paste whatever Terminal output / error / screenshot you have to Claude. Don't skip a step or work around it — each step has a specific state it produces that later steps depend on.
