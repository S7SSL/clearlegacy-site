/*
 * ClearLegacy trust panel — cl-trust-panel.js
 * Injects a 3-row reassurance strip above the form, before Step 1.
 * Addresses the conversion-audit gap: "users need stronger reassurance before
 * handing over private legal/family details."
 * Drop-in: <script src="/cl-trust-panel.js" defer></script>
 * Only runs on the form page.
 */
(function () {
  'use strict';
  if (window.__clTrustPanelLoaded) return;
  window.__clTrustPanelLoaded = true;
  if (!/\/forms\/will/i.test(window.location.pathname)) return;

  function inject() {
    if (document.getElementById('cl-trust-panel')) return;
    var step1 = document.getElementById('step-1');
    if (!step1) return;

    var panel = document.createElement('div');
    panel.id = 'cl-trust-panel';
    panel.innerHTML = ''
      + '<style>'
      + '#cl-trust-panel{margin:0 0 18px;border:1px solid #dbeafe;background:#eff6ff;'
      + 'border-radius:12px;padding:14px 18px;font-family:Inter,system-ui,sans-serif;color:#0f172a}'
      + '#cl-trust-panel .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));'
      + 'gap:6px 18px;font-size:13.5px;line-height:1.45}'
      + '#cl-trust-panel .row span{display:flex;align-items:flex-start;gap:8px;color:#334155}'
      + '#cl-trust-panel .row strong{color:#0f172a}'
      + '#cl-trust-panel .row i{font-style:normal;color:#2563eb;font-weight:700;flex-shrink:0;width:18px}'
      + '#cl-trust-panel .help{margin-top:10px;padding-top:10px;border-top:1px solid #dbeafe;'
      + 'font-size:13px;color:#475569}'
      + '#cl-trust-panel .help a{color:#2563eb;font-weight:600;text-decoration:none}'
      + '#cl-trust-panel .help a:hover{text-decoration:underline}'
      + '</style>'
      + '<div class="row">'
      + '<span><i>✓</i><div><strong>Human-reviewed wills</strong> — checked before release</div></span>'
      + '<span><i>✓</i><div><strong>Fixed transparent pricing</strong> — no hourly billing</div></span>'
      + '<span><i>✓</i><div><strong>UK-focused service</strong> — England &amp; Wales</div></span>'
      + '<span><i>✓</i><div><strong>Secure online process</strong> — Stripe checkout</div></span>'
      + '<span><i>✓</i><div><strong>No hidden upsells</strong> — one fixed price</div></span>'
      + '</div>'
      + '<div class="help">Not sure if an online will is right for you? '
      + '<a href="mailto:hello@clearlegacy.co.uk?subject=Pre-will%20question" '
      + 'data-cta="trust_panel_help">Email us first</a> '
      + '— we’ll tell you before you start if your situation needs a solicitor.</div>';

    step1.parentNode.insertBefore(panel, step1);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    inject();
  } else {
    document.addEventListener('DOMContentLoaded', inject);
  }
})();
