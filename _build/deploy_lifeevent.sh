#!/usr/bin/env bash
# Deploy ONLY the 4 life-event landing pages (never the other 84).
# Checks for duplicates, copies the 4, wires them into sitemap.xml, shows the
# diff, asks y/N, commits + pushes. Run on the Mac.
set -euo pipefail

SRC="/Users/marge/Library/Application Support/Claude/local-agent-mode-sessions/0c065d88-ae38-4647-b602-532696957149/69ad82d5-b689-4524-bce6-c199f4ecc7c0/local_664dd2bb-341f-4519-a5a6-f17269964add/outputs/phase7/dist"
REPO="/Users/marge/clearlegacy-site"
BASE="https://www.clearlegacy.co.uk"
SLUGS=(going-on-holiday-estate-planning-checklist my-parent-has-died-what-next i-have-been-named-executor i-own-a-house-with-my-partner)

cd "$REPO"
git pull --rebase origin main || true

echo "=== duplicate check ==="
for s in "${SLUGS[@]}"; do
  if [ -f "$s.html" ]; then echo "  ALREADY EXISTS (will overwrite): $s.html"; else echo "  new: $s.html"; fi
done
echo "If any say ALREADY EXISTS and you did NOT expect it, Ctrl-C now and check with the other workstream."
read -r -p "Continue copying the 4 pages? [y/N] " ok1
[ "$ok1" = "y" ] || [ "$ok1" = "Y" ] || { echo "Aborted."; exit 0; }

for s in "${SLUGS[@]}"; do cp -f "$SRC/$s.html" "$REPO/$s.html"; done
echo "Copied 4 pages."

# wire sitemap.xml (idempotent)
python3 - "$REPO/sitemap.xml" "$BASE" "${SLUGS[@]}" <<'PY'
import sys,datetime
sm_path=sys.argv[1]; base=sys.argv[2]; slugs=sys.argv[3:]
sm=open(sm_path,encoding="utf-8").read()
today=datetime.date.today().isoformat()
add=[]
for s in slugs:
    loc=f"{base}/{s}"
    if loc not in sm:
        add.append(f"  <url><loc>{loc}</loc><lastmod>{today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>")
if add:
    sm=sm.replace("</urlset>", "\n".join(add)+"\n</urlset>")
    open(sm_path,"w",encoding="utf-8").write(sm)
    print(f"sitemap.xml: added {len(add)} URLs")
else:
    print("sitemap.xml: nothing to add")
PY

echo "----- git status -----"; git status --short
read -r -p "Commit and push these 4 pages + sitemap to main? [y/N] " ok2
if [ "$ok2" = "y" ] || [ "$ok2" = "Y" ]; then
  git add "${SLUGS[@]/%/.html}" sitemap.xml
  git commit -m "Sales sprint P1 Tier-2: 4 life-event pages (holiday, parent-died, named-executor, own-house-with-partner)"
  git push origin main
  echo "Pushed. Cloudflare build lag ~1-2 min."
else
  echo "Aborted before commit. Files copied + sitemap staged; nothing pushed."
fi
