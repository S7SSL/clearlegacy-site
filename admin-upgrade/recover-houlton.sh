#!/bin/bash
# Recover Houlton's £99 Mirror Wills payment.
#
# Background: customer paid on Stripe (pi_3TSKPv2NFW59QiEi1NKeOD19, £99 GBP, 2026-05-01 16:59:56 UTC)
# but the webhook never linked the payment to either of their two questionnaire leads in KV.
# This script merges payment fields onto lead b5a14dc5 (the cleaner of the two questionnaires)
# and resets pdfStatus so the next /admin/regenerate kicks PDF generation.
#
# Run from anywhere — uses absolute paths.
# Requires: wrangler CLI authenticated as the clearlegacy account, python3.

set -euo pipefail

REF="b5a14dc5-3b88-4ef3-a9a1-8cfa2c462c25"
NSID="164df086360a43798d421bb1f26d654c"
WORK="$(mktemp -d)"
WORKER_DIR="$HOME/clearlegacy-site/worker"

cd "$WORKER_DIR"

echo "→ Fetching current KV record for ${REF}..."
npx wrangler kv key get "lead:${REF}" \
  --namespace-id "${NSID}" \
  --remote > "${WORK}/lead.json"

echo "→ Pre-merge content (first 200 chars):"
head -c 200 "${WORK}/lead.json"
echo ""
echo ""

echo "→ Merging payment info..."
python3 - "${WORK}/lead.json" "${WORK}/lead.merged.json" <<'PY'
import json, sys
src, dst = sys.argv[1], sys.argv[2]
with open(src) as f:
    rec = json.load(f)

# Stripe payment data (from charge ch_3TSKPv2NFW59QiEi10RpXoRg)
rec.update({
    "paidAt": "2026-05-01T16:59:56Z",
    "stripePaymentIntentId": "pi_3TSKPv2NFW59QiEi1NKeOD19",
    "stripeAmount": 9900,
    "stripeCurrency": "gbp",
    "stripeCustomerEmail": "houltonrichard@yahoo.com",
    "pdfStatus": "pending",
})

# Clear any prior error so /admin/regenerate runs cleanly
rec.pop("pdfError", None)
rec.pop("generatingStartedAt", None)

with open(dst, "w") as f:
    json.dump(rec, f, indent=2)

print("Merged keys present:",
      [k for k in ("paidAt","stripePaymentIntentId","stripeAmount",
                   "stripeCurrency","stripeCustomerEmail","pdfStatus")
       if k in rec])
PY

echo ""
echo "→ Writing merged record back to KV..."
npx wrangler kv key put "lead:${REF}" \
  --path "${WORK}/lead.merged.json" \
  --namespace-id "${NSID}" \
  --remote

echo ""
echo "✓ KV updated. Next step:"
echo ""
echo "  1) Open https://api.clearlegacy.co.uk/admin"
echo "  2) Click into the b5a14dc5 row"
echo "  3) Click 'Regenerate' (or POST /admin/regenerate?ref=${REF})"
echo ""
echo "  PDF will render, the customer will be emailed."
echo ""
echo "  Then optionally delete the duplicate 00cadc95 lead via the admin"
echo "  detail page → Delete lead button."
echo ""
echo "Cleanup: rm -rf ${WORK}"
