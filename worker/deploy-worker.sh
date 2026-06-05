#!/usr/bin/env bash
# Clear Legacy worker deploy script.
#
# Why this exists: running `npx wrangler deploy` directly from worker/
# fails with "Asset too large" in wrangler 4.x. Wrangler walks up to the
# site repo root (which has .git and 49k+ static files) and tries to
# upload everything. The [assets] block in wrangler.toml is ignored.
#
# Workaround: rsync the worker to an isolated temp dir with no .git
# above it, patch wrangler.toml to use an absolute assets path, and
# deploy from there.
#
# Usage:
#   cd ~/clearlegacy-site/worker && ./deploy-worker.sh
#
# Idempotent — safe to re-run. Local wrangler.toml is never modified.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="/tmp/cl-deploy"
EMPTY_ASSETS_DIR="/tmp/cl-empty-assets"

echo "==> Source: $SCRIPT_DIR"
echo "==> Deploy from: $DEPLOY_DIR"

# 1. Sync worker source to isolated temp dir (excluding bulky/local-only items)
mkdir -p "$DEPLOY_DIR"
rsync -a --delete \
  --exclude=node_modules \
  --exclude='_empty_assets' \
  --exclude='*.bak.*' \
  --exclude='.wrangler' \
  --exclude='.claude' \
  "$SCRIPT_DIR/" "$DEPLOY_DIR/"

# 2. Create the empty-assets placeholder outside the deploy dir
mkdir -p "$EMPTY_ASSETS_DIR"
touch "$EMPTY_ASSETS_DIR/.placeholder"

# 3. Patch the copied wrangler.toml to use absolute paths wrangler can't ignore
python3 - <<'PY'
import re, os, sys
path = '/tmp/cl-deploy/wrangler.toml'
t = open(path).read()
# Ensure binding line exists
if 'binding = "ASSETS"' not in t:
    t = t.replace('[assets]', '[assets]\nbinding = "ASSETS"', 1)
# Force absolute directory
t = re.sub(r'directory = "\./_empty_assets"',
           'directory = "/tmp/cl-empty-assets"', t)
open(path, 'w').write(t)
print('  patched wrangler.toml -> absolute assets path')
PY

# 4. Install deps in the deploy dir
cd "$DEPLOY_DIR"
echo "==> npm install (this may take 10-30 seconds)..."
npm install --no-save --silent

# 5. Deploy
echo "==> Deploying worker..."
npx wrangler deploy "$@"

echo ""
echo "==> Done."
echo "    Source stays clean: $SCRIPT_DIR"
echo "    Deploy artefacts in: $DEPLOY_DIR"
