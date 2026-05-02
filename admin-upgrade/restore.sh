#!/usr/bin/env bash
#
# admin-upgrade/restore.sh — roll back the admin upgrade using the .bak files
# that apply.sh created.
#

set -euo pipefail
cd "$(dirname "$0")/.."   # -> clearlegacy-site/

SRC="worker/src"
ADMIN="$SRC/handlers/admin.ts"
KV="$SRC/kv.ts"

if [[ ! -f "$ADMIN.bak" || ! -f "$KV.bak" ]]; then
  echo "ERROR: Expected $ADMIN.bak and $KV.bak to exist. Nothing to restore." >&2
  exit 1
fi

echo "→ Restoring $ADMIN..."
mv "$ADMIN.bak" "$ADMIN"

echo "→ Restoring $KV..."
mv "$KV.bak" "$KV"

echo
echo "✓ Restored. Re-deploy with:  cd worker && npx wrangler deploy"
