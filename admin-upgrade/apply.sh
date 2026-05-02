#!/usr/bin/env bash
#
# admin-upgrade/apply.sh — apply the admin dashboard upgrade as one atomic change.
#
# What it does:
#   1. Backs up worker/src/handlers/admin.ts and worker/src/kv.ts to .bak
#   2. Replaces admin.ts with admin.ts.new
#   3. Appends deleteLead() to kv.ts
#   4. Prints next steps (typecheck + deploy)
#
# Reversible via restore.sh (rolls back from .bak files).

set -euo pipefail
cd "$(dirname "$0")/.."   # -> clearlegacy-site/

SRC="worker/src"
ADMIN="$SRC/handlers/admin.ts"
KV="$SRC/kv.ts"

if [[ ! -f "$ADMIN" || ! -f "$KV" ]]; then
  echo "ERROR: Expected $ADMIN and $KV to exist. Run this from within clearlegacy-site/admin-upgrade/." >&2
  exit 1
fi

if [[ -f "$ADMIN.bak" || -f "$KV.bak" ]]; then
  echo "ERROR: Backup files already exist ($ADMIN.bak / $KV.bak). Either restore or remove them before re-applying." >&2
  exit 1
fi

# Safety check: make sure we haven't already applied (deleteLead should not yet exist in kv.ts)
if grep -q 'export async function deleteLead' "$KV"; then
  echo "ERROR: kv.ts already contains deleteLead(). Looks like the upgrade has already been applied." >&2
  exit 1
fi

echo "→ Backing up originals..."
cp "$ADMIN" "$ADMIN.bak"
cp "$KV" "$KV.bak"

echo "→ Replacing $ADMIN..."
cp admin-upgrade/admin.ts.new "$ADMIN"

echo "→ Appending deleteLead() to $KV..."
cat admin-upgrade/kv.ts.patch >> "$KV"

echo
echo "✓ Applied."
echo
echo "Next steps:"
echo "  1. Eyeball the diff:"
echo "       git diff worker/src/handlers/admin.ts worker/src/kv.ts"
echo "  2. (Optional) typecheck:"
echo "       cd worker && npx tsc --noEmit"
echo "  3. Deploy:"
echo "       cd worker && npx wrangler deploy"
echo "  4. Visit https://api.clearlegacy.co.uk/admin and poke the new Amend/Delete buttons."
echo
echo "To roll back:  bash admin-upgrade/restore.sh"
