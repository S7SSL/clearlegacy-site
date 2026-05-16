/*
 * ClearLegacy sticky mobile CTA — cl-sticky-mobile-cta.js
 * Injects a fixed-position bottom CTA bar on mobile screens (<720px).
 * Drop-in: <script src="/cl-sticky-mobile-cta.js" defer></script>
 * Only shows on commercial pages (not on the form itself or thank-you).
 */
(function () {
  'use strict';
  if (window.__clStickyCtaLoaded) return;
  window.__clStickyCtaLoaded = true;

  var SITE = window.location.pathname;
  // Skip on the form, thank-you, and admin pages
  if (/\/forms\/|\/thank-you|\/admin|\/account|\/legal/i.test(SITE)) return;

  function inject() {
    if (window.innerWidth >= 720) return;
    if (document.getElementById('cl-sticky-cta')) return;

    var bar = document.createElement('div');
    bar.id = 'cl-sticky-cta';
    bar.innerHTML = ''
      + '<style>'
      + '#cl-sticky-cta{position:fixed;left:0;right:0;bottom:0;z-index:9999;'
      + 'background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;'
      + 'padding:11px 14px;display:flex;align-items:center;justify-content:space-between;'
      + 'box-shadow:0 -6px 22px -8px rgba(15,23,42,.35);font-family:Inter,system-ui,sans-serif}'
      + '#cl-sticky-cta .px{font-size:13.5px;line-height:1.25;font-weight:600}'
      + '#cl-sticky-cta .px small{display:block;font-size:11px;font-weight:400;opacity:.85;margin-top:1px}'
      + '#cl-sticky-cta a{background:#fff;color:#2563eb;padding:9px 16px;border-radius:8px;'
      + 'font-weight:700;text-decoration:none;font-size:13.5px;white-space:nowrap}'
      + 'body{padding-bottom:64px !important}'
      + '@media(min-width:720px){#cl-sticky-cta{display:none}body{padding-bottom:0 !important}}'
      + '</style>'
      + '<div class="px">Start your will — £69<small>Reviewed within 24 hours</small></div>'
      + '<a href="/forms/will.html?product=single" data-cta="sticky_mobile_cta">Start →</a>';
    document.body.appendChild(bar);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    inject();
  } else {
    document.addEventListener('DOMContentLoaded', inject);
  }
})();
