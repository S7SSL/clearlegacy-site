/*
 * ClearLegacy pre-submit reassurance — cl-presubmit-trust.js
 * Injects a 3-line trust strip into Step 7 of /forms/will.html just before
 * the Submit button. Reinforces what users get right at the moment of payment.
 * Drop-in: <script src="/cl-presubmit-trust.js" defer></script>
 */
(function () {
  'use strict';
  if (window.__clPresubmitTrustLoaded) return;
  window.__clPresubmitTrustLoaded = true;
  if (!/\/forms\/will/i.test(window.location.pathname)) return;

  function inject() {
    if (document.getElementById('cl-presubmit-trust')) return;
    var submitBtn = document.getElementById('btn-submit') || document.querySelector('.btn-submit');
    if (!submitBtn) return false;

    var panel = document.createElement('div');
    panel.id = 'cl-presubmit-trust';
    panel.innerHTML = ''
      + '<style>'
      + '#cl-presubmit-trust{background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:14px 16px;'
      + 'margin:18px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px 18px;'
      + 'font-family:Inter,system-ui,sans-serif;font-size:13px;color:#0c4a6e}'
      + '#cl-presubmit-trust span{display:flex;align-items:center;gap:8px;line-height:1.4}'
      + '#cl-presubmit-trust strong{color:#0f172a;font-weight:600}'
      + '#cl-presubmit-trust i{font-style:normal;color:#2563eb;font-weight:700;flex-shrink:0;font-size:14px}'
      + '</style>'
      + '<span><i>🔒</i><div><strong>Secure Stripe checkout</strong> · UK data only</div></span>'
      + '<span><i>⚖️</i><div><strong>Wills Act 1837 compliant</strong> · England & Wales</div></span>'
      + '<span><i>📬</i><div><strong>Delivered in 24 hours</strong> · Editable before signing</div></span>';

    submitBtn.parentNode.insertBefore(panel, submitBtn);
    return true;
  }

  function tryInject() {
    if (inject()) return;
    // Submit button may render after qualifier — retry briefly
    var tries = 0;
    var iv = setInterval(function () {
      if (inject() || ++tries > 40) clearInterval(iv);
    }, 400);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    tryInject();
  } else {
    document.addEventListener('DOMContentLoaded', tryInject);
  }
})();
