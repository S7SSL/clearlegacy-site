#!/bin/bash
# Install Microsoft UET tag (ti=187249506) + default-denied consent on every
# public HTML page in clearlegacy-site/. Excludes worker/, node_modules/,
# and .bak.* files. Backs up changed files (single .uetbak per file) and
# refuses to insert if UET is already present (idempotent).

set -euo pipefail
ROOT="$HOME/clearlegacy-site"

cd "$ROOT"

python3 - <<'PY'
import os, re, sys, datetime

ROOT = os.path.expanduser("~/clearlegacy-site")

UET_BLOCK = """\
<!-- Microsoft UET tag (Bing Ads / clearlegacy-prod, ti=187249506) -->
<script>(function(w, d, t, u, o) {w[u] = w[u] || [], o.ts = (new Date).getTime();var n = d.createElement(t);n.src = "https://bat.bing.net/bat.js?ti=" + o.ti + ("uetq" != u ? "&q=" + u : ""),n.async = 1, n.onload = n.onreadystatechange = function() {var s = this.readyState;s && "loaded" !== s && "complete" !== s ||(o.q = w[u], w[u] = new UET(o), w[u].push("pageLoad"),n.onload = n.onreadystatechange = null)};var i = d.getElementsByTagName(t)[0];i.parentNode.insertBefore(n, i);})(window, document, "script", "uetq", {ti: "187249506",enableAutoSpaTracking: true});</script>
<script>window.uetq = window.uetq || [];window.uetq.push('consent', 'default', {'ad_storage': 'denied'});</script>
<!-- End UET tag -->
"""

EXCLUDE_DIRS = {"worker", "node_modules", ".git", ".wrangler", "admin-upgrade"}
SKIP_BAK = re.compile(r"\.bak\.\d{8}T\d{6}$")
HEAD_CLOSE = re.compile(r"</head>", re.IGNORECASE)
ALREADY_PRESENT = re.compile(r'bat\.bing\.net/bat\.js|"187249506"', re.IGNORECASE)

updated = 0
skipped_already = 0
skipped_no_head = 0
errors = []

for dirpath, dirnames, filenames in os.walk(ROOT):
    # prune excluded dirs
    dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
    for fn in filenames:
        if not fn.endswith(".html"):
            continue
        if SKIP_BAK.search(fn):
            continue
        path = os.path.join(dirpath, fn)
        try:
            with open(path, "r", encoding="utf-8") as f:
                src = f.read()
        except Exception as e:
            errors.append((path, str(e)))
            continue

        if ALREADY_PRESENT.search(src):
            skipped_already += 1
            continue

        if not HEAD_CLOSE.search(src):
            skipped_no_head += 1
            continue

        new_src = HEAD_CLOSE.sub(UET_BLOCK + "</head>", src, count=1)

        # Backup once per file
        bak = path + ".uetbak"
        if not os.path.exists(bak):
            with open(bak, "w", encoding="utf-8") as f:
                f.write(src)

        with open(path, "w", encoding="utf-8") as f:
            f.write(new_src)

        updated += 1
        # quiet on big runs

print(f"\nDone:")
print(f"  Updated:        {updated}")
print(f"  Already had UET: {skipped_already}")
print(f"  No </head> tag:  {skipped_no_head}")
if errors:
    print(f"  Errors:          {len(errors)}")
    for p, msg in errors[:5]:
        print(f"    - {p}: {msg}")

print()
print("Backups: every modified file has a .uetbak sibling.")
print("To roll back: find . -name '*.html.uetbak' and rename to remove the suffix.")
PY
