#!/bin/bash
# Cosmetic + structural cleanup for the Houlton lead, then regenerate.
#
# Changes applied to the questionnaire in KV:
#   partner.fullName     "lesley houlton"                     → "Lesley Houlton"
#   residuary[0].name    "lesley houlton"                     → "Lesley Houlton"
#   testator.address     "manor House, the green priddy, ..." → "Manor House, The Green, Priddy, Wells, BA5 3BB"
#   partner.address      same address                          → same cleaned address
#
# Why: partner.fullName mismatch ("lesley houlton" vs executor "Lesley Houlton")
# was breaking swapForPartner's case-equality check, so Lesley was named as her
# own executor in her own mirror will. Aligning all references to "Lesley Houlton"
# fixes the swap and produces a clean PDF.
#
# Address change: matches typical UK Royal Mail format. If the customer's intent
# was different (e.g., "The Green Priddy" as a single road name), revert and
# regenerate.
#
# Diff is printed before write, and the script asks for confirmation.

set -euo pipefail

REF="b5a14dc5-3b88-4ef3-a9a1-8cfa2c462c25"
NSID="164df086360a43798d421bb1f26d654c"
WORK="$(mktemp -d)"
WORKER_DIR="$HOME/clearlegacy-site/worker"

cd "$WORKER_DIR"

echo "→ Fetching current KV record..."
npx wrangler kv key get "lead:${REF}" \
  --namespace-id "${NSID}" \
  --remote > "${WORK}/lead.json"

echo "→ Building cleaned record..."
python3 - "${WORK}/lead.json" "${WORK}/lead.cleaned.json" <<'PY'
import json, sys

src, dst = sys.argv[1], sys.argv[2]
with open(src) as f:
    rec = json.load(f)

CLEAN_NAME = "Lesley Houlton"
CLEAN_ADDRESS = "Manor House, The Green, Priddy, Wells, BA5 3BB"

q = rec["questionnaire"]

# Track what we change for the diff
changes = []

# Partner name
if q["partner"].get("fullName") != CLEAN_NAME:
    changes.append(("partner.fullName", q["partner"].get("fullName"), CLEAN_NAME))
    q["partner"]["fullName"] = CLEAN_NAME

# Addresses
if q["testator"].get("address") != CLEAN_ADDRESS:
    changes.append(("testator.address", q["testator"].get("address"), CLEAN_ADDRESS))
    q["testator"]["address"] = CLEAN_ADDRESS
if q["partner"].get("address") != CLEAN_ADDRESS:
    changes.append(("partner.address", q["partner"].get("address"), CLEAN_ADDRESS))
    q["partner"]["address"] = CLEAN_ADDRESS

# Residuary entries that reference the partner by lowercase name
for i, r in enumerate(q.get("residuary", [])):
    if r.get("name", "").lower() == "lesley houlton" and r.get("name") != CLEAN_NAME:
        changes.append((f"residuary[{i}].name", r.get("name"), CLEAN_NAME))
        r["name"] = CLEAN_NAME

# Reset PDF state so /admin/regenerate runs cleanly
rec["pdfStatus"] = "pending"
rec.pop("pdfError", None)
rec.pop("generatingStartedAt", None)

with open(dst, "w") as f:
    json.dump(rec, f, indent=2)

print("\nProposed changes:")
for path, old, new in changes:
    print(f"  {path}:")
    print(f"    -  {old}")
    print(f"    +  {new}")
print()
PY

echo "Continue and write to KV? [y/N]"
read -r CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted. No changes made. Files left in ${WORK} for inspection."
  exit 0
fi

echo "→ Writing cleaned record back to KV..."
npx wrangler kv key put "lead:${REF}" \
  --path "${WORK}/lead.cleaned.json" \
  --namespace-id "${NSID}" \
  --remote

echo ""
echo "✓ KV updated. Now triggering regenerate..."
echo ""
echo "  Click 'Regenerate PDF' in /admin/detail?ref=${REF}"
echo "  or POST /admin/regenerate?ref=${REF}"
echo ""
echo "  Then re-check the PDF before letting it email out. Note: the worker"
echo "  auto-emails on regenerate; if you want to inspect first WITHOUT emailing"
echo "  the customer, that's not possible with the current admin — you'd need"
echo "  to delete the lead and re-create, or accept the email goes out."
echo ""
echo "Cleanup: rm -rf ${WORK}"
