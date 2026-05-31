/*
 * ClearLegacy site-wide trust strip — cl-trust-strip.js
 * Auto-injects the 5-item Phase 3 trust strip on key conversion pages
 * (will service pages, comparison pages, checkout) without forcing each
 * page to embed the markup. Pages that already render the strip inline
 * (homepage hero-trust-bar, /pricing trust-inner) are skipped.
 *
 * Items: Human-reviewed wills · Fixed transparent pricing · UK-focused
 *        service · Secure online process · No hidden upsells.
 *
 * Drop-in: <script src="/cl-trust-strip.js" defer></script>
 */
(function () {
  'use strict';
  if (window.__clTrustStripLoaded) return;
  window.__clTrustStripLoaded = true;

  function inject() {
    // Skip pages that render their own strip
    if (document.querySelector('.hero-trust-bar, .cl-trust-strip, #cl-trust-strip')) return;

    var style = document.createElement('style');
    style.textContent = ''
      + '.cl-strip{background:#f0f9ff;border-top:1px solid #dbeafe;border-bottom:1px solid #dbeafe;'
      + 'padding:14px 5%;margin:0;font-family:Inter,system-ui,sans-serif}'
      + '.cl-strip-inner{max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;'
      + 'justify-content:center;align-items:center;gap:10px 22px;font-size:13.5px;'
      + 'font-weight:500;color:#0f172a}'
      + '.cl-strip-inner span{display:inline-flex;align-items:center;gap:6px;line-height:1.4}'
      + '.cl-strip-inner span::before{content:"✓";color:#2563eb;font-weight:700;font-size:14px}';
    document.head.appendChild(style);

    var strip = document.createElement('section');
    strip.id = 'cl-trust-strip';
    strip.className = 'cl-strip';
    strip.setAttribute('aria-label', 'Trust signals');
    strip.innerHTML = '<div class="cl-strip-inner">'
      + '<span>Human-reviewed wills</span>'
      + '<span>Fixed transparent pricing</span>'
      + '<span>UK-focused service</span>'
      + '<span>Secure online process</span>'
      + '<span>No hidden upsells</span>'
      + '</div>';

    // Prefer to insert just after the main nav so it sits above the fold.
    var nav = document.querySelector('nav');
    if (nav && nav.parentNode) {
      nav.parentNode.insertBefore(strip, nav.nextSibling);
    } else if (document.body) {
      document.body.insertBefore(strip, document.body.firstChild);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    inject();
  } else {
    document.addEventListener('DOMContentLoaded', inject);
  }
})();
