# DO TONIGHT — Conversion Audit Checklist

Patch 0025 ships every funnel event the audit listed that can be added
client-side. The list below is everything ONLY YOU can do — config inside
GA4, Cloudflare, and Stripe dashboards. Total: ~30 minutes.

Order matters. Do them top-to-bottom.

---

## 1. GA4: mark the new events as Key Events (5 min)

Why: without this, GA4 will collect the events but won't show them in the
conversions report, and you'll have nothing to optimise on.

Steps:
1. Open https://analytics.google.com → ClearLegacy GA4 property
2. Admin (cog icon, bottom left) → Events
3. Wait until you see these events in the list (may take up to 24h to populate
   from real traffic — refresh after a real form click or use Tag Assistant):
   - `click_start_will`
   - `email_captured`
   - `will_form_submit_attempt`
   - `will_form_submit_success`
   - `payment_failed`
4. For each, toggle the "Mark as Key Event" switch on.
5. `purchase` should already be marked (you did this in task #39).

---

## 2. GA4: exclude Stripe from referral traffic (3 min)

Why: when users return from Stripe to /thank-you.html, GA4 attributes the
purchase to "buy.stripe.com" instead of the original landing page. You'll see
this as inflated "referral" traffic and you'll have no idea which page
actually drove the sale.

Steps:
1. Admin → Data Streams → Web → (your stream)
2. Configure tag settings → Show more → List unwanted referrals
3. Add: `buy.stripe.com`, `checkout.stripe.com`, `pay.stripe.com`
4. Save.

---

## 3. Stripe: confirm webhooks are landing (5 min)

Why: if the webhook fails, the worker never records the order, the PDF never
generates, and the customer pays without receiving anything. This is the
single most catastrophic conversion leak possible.

Steps:
1. Open https://dashboard.stripe.com → Developers → Webhooks
2. Find the endpoint pointing at `https://api.clearlegacy.co.uk/`
3. Click into it. Look at the "Recent attempts" panel.
4. For the last 7 days, every attempt should show as "Succeeded".
5. If any are failed: click into the failure, look at the response — most
   common is a 500 from the worker (a bug) or a 401 (signing secret mismatch
   between Stripe and worker env var).
6. Test endpoint live: click "Send test webhook" → pick `checkout.session.completed`.
   Should return 200 within 2 seconds.

---

## 4. Cloudflare: WAF security events on form/payment paths (8 min)

Why: if Cloudflare is challenging real customers when they POST the form, or
blocking Stripe webhooks, the sale dies silently.

Steps:
1. Open https://dash.cloudflare.com → clearlegacy.co.uk → Security → Events
2. Filter → Add filter: Path contains `/forms/will`. Last 7 days.
3. Look for: Managed Challenge, JS Challenge, Block, or Rate Limit events.
   - If zero: good.
   - If any: click one. Look at the IP, country, user agent. If it looks like
     a real UK mobile user, that's a conversion leak — relax the rule.
4. Repeat with: Path contains `/api/`. Same check.
5. Same with: Path contains `/api/webhook`. Stripe webhooks come from
   Stripe IP ranges — never block them. If you see blocks here, urgent fix.

While you're in Cloudflare:
6. Security → Bots → confirm "Bot Fight Mode" is OFF or "Super Bot Fight Mode"
   has `/forms/` and `/api/` exempted. The default rules over-challenge mobile.

---

## 5. Stripe: failed/cancelled payments in last 30 days (3 min)

Steps:
1. Stripe dashboard → Payments → filter Status = Failed OR Canceled
2. Last 30 days. Count them.
3. For each: click in, look at the decline reason and the customer email.
   Common reasons:
   - "Card declined" — bank rejected. Normal, no action.
   - "Insufficient funds" — normal.
   - "Authentication required" but customer didn't complete — 3D Secure was
     prompted but customer bailed. If this is >20% of failures, consider
     setting up Stripe Radar to relax 3DS triggering.
   - "Card not supported" — international card we don't accept. Normal.
4. For Cancelled: these are customers who reached Stripe but closed the tab.
   You can recover these with the `_distribution/REDDIT-FORUM-PLAYBOOK.md`
   warm email pattern.

---

## 6. GA4 DebugView: verify the new events actually fire (5 min)

Why: ship-validate the patch 0025 instrumentation.

Steps:
1. Install the **GA Debugger** Chrome extension (free, from the Chrome store)
2. Enable it (the icon turns green)
3. In a fresh Chrome incognito window, open: https://www.clearlegacy.co.uk
4. Click any "Start My Will" CTA → should fire `click_start_will`
5. On the form, type your name and email in step 1 then click away from email
   field → should fire `email_captured`
6. In GA4: Admin → DebugView (left sidebar) → you'll see the events stream
   in real-time. If you see them: instrumentation is live. If you don't: pull
   me back in, the script isn't loading.

---

## 7. The diagnostic questions from the audit brief

Once steps 1-6 are done, in 48 hours you'll have data to answer the brief's
section 13 questions in GA4 Funnel Exploration. Build the funnel with these
steps (Admin → Explore → Funnel Exploration):

  1. session_start
  2. click_start_will  (new)
  3. form_start
  4. form_step_complete (step_number = 1)
  5. form_step_complete (step_number = 4)
  6. form_step_complete (step_number = 7)
  7. will_form_submit_attempt  (new)
  8. will_form_submit_success  (new)
  9. begin_checkout
 10. purchase

Segment by device_category and source_medium. The biggest drop is the leak.

---

## What's been shipped automatically (patch 0025)

You don't need to do anything for these — they're in the patch:

| File | Purpose |
|---|---|
| `cl-funnel-tracking.js` | Fires click_start_will, email_captured, will_form_submit_attempt/success, payment_failed |
| `cl-sticky-mobile-cta.js` | Bottom-fixed mobile CTA on commercial pages |
| `cl-trust-panel.js` | Trust strip above Step 1 of the form |

All three are loaded by single `<script>` tags appended to the matching pages.
