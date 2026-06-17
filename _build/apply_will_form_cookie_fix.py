#!/usr/bin/env python3
"""
Will-form mobile fix — Patch A only (SAFE, isolated).
Makes the fixed cookie consent bar reserve its TRUE height (recalculated on every
resize / mobile-keyboard open / rotate) so it can never cover the step-1
"Continue" button — the strongest mobile-completion blocker.

Targeted exact-match replacement of ONE line. Touches nothing else in the form
(no form logic, no payment, no parallel-workstream edits). Idempotent. No commit.

RUN from repo root:  python3 apply_will_form_cookie_fix.py
Then:                git --no-pager diff forms/will.html   (review),  commit when happy.
"""
import os, sys

PATH = "forms/will.html"

OLD = ("<script>if(!localStorage.getItem('cl_ok')){document.getElementById('cl-cookie')"
       ".style.display='flex';document.body.classList.add('cl-cookie-visible');}</script>")

NEW = ("""<script>
(function(){
  var bar=document.getElementById('cl-cookie');
  if(!bar) return;
  if(!localStorage.getItem('cl_ok')){ bar.style.display='flex'; document.body.classList.add('cl-cookie-visible'); }
  function reserve(){
    document.body.style.paddingBottom = (getComputedStyle(bar).display==='none') ? '' : (bar.offsetHeight + 16) + 'px';
  }
  reserve();
  window.addEventListener('load', reserve);
  window.addEventListener('resize', reserve);   /* mobile keyboard open/close + rotate */
  setTimeout(reserve, 400);
})();
</script>""")

def main():
    if not os.path.exists(PATH):
        print("ERROR: run me from the repo root —", PATH, "not found"); sys.exit(1)
    html = open(PATH, encoding="utf-8").read()
    if "function reserve()" in html:
        print("Already patched (reserve() present) — nothing to do."); return
    if OLD not in html:
        print("WARNING: the expected cookie script line was not found verbatim —")
        print("the file may have changed. NOT modifying anything, to be safe.")
        print("Apply Patch A by hand from will-form-mobile-fix.md, or re-copy the file."); sys.exit(2)
    html = html.replace(OLD, NEW, 1)
    open(PATH, "w", encoding="utf-8").write(html)
    print("Patch A applied to", PATH, "(cookie bar now reserves its real height).")
    print("Review:  git --no-pager diff forms/will.html   then commit when happy.")

if __name__ == "__main__":
    main()
