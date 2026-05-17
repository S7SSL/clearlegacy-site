# Stripe Payment Link cancel URL configuration

Patch 0039 adds automatic payment-recovery email handling via the
`checkout.session.expired` webhook event. This works **automatically** — no
Sat-side config required.

**Optional but recommended:** also set a custom cancel URL on each Stripe
Payment Link so users who manually click "back" or close Stripe see a friendly
ClearLegacy page (not just a closed tab).

## How to set it

For each of your two Payment Links (single + mirror):

1. Stripe Dashboard → **Payment Links** → click into the link
2. Look for **"Customise after-payment page"** or **"Confirmation page"** in
   the link settings
3. Find the section about cancelled / abandoned checkouts
4. Set the cancel URL to:
   ```
   https://www.clearlegacy.co.uk/payment-cancelled.html
   ```
5. Save

Once configured, the customer's experience when they cancel becomes:
1. They see the friendly `/payment-cancelled.html` page immediately
2. Stripe fires `checkout.session.expired` to our webhook ~24h later
3. The webhook handler sends the recovery email (via Resend) automatically

If you don't set the cancel URL in Stripe, only step 2 + 3 fire (which is
still better than nothing). The static page is purely a UX upgrade.

## Variables involved

Worker env vars (already configured):
- `STRIPE_URL_SINGLE` — base URL for the £69 Payment Link
- `STRIPE_URL_MIRROR` — base URL for the £99 Payment Link
- `STRIPE_WEBHOOK_SECRET` — used to verify event signatures
- `RESEND_API_KEY` — sends the recovery email
- `EMAIL_FROM` — sender address (typically hello@clearlegacy.co.uk)
- `ADMIN_NOTIFICATION_EMAIL` — optional BCC

## Tracking the impact

After the next paid cycle, check:
- GA4 → `payment_failed` event count (already tracked in cl-funnel-tracking.js)
- KV admin → look for leads with `cancelledAt` populated (and ideally
  `paidAt` populated AFTER `cancelledAt` — that's a recovered sale)

Patch 0039 — payment-cancelled recovery
