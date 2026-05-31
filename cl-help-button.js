/*
 * ClearLegacy sticky Need Help button — cl-help-button.js  (patch 0027)
 * Floating bubble in the bottom-right of /forms/will.html only.
 * Click to expand a panel with WhatsApp + email options.
 * Drop-in: <script src="/cl-help-button.js" defer></script>
 * Tracked via gtag click_contact when user actually clicks WhatsApp/email.
 */
(function () {
  'use strict';
  if (window.__clHelpButtonLoaded) return;
  window.__clHelpButtonLoaded = true;
  if (!/\/forms\/will/i.test(window.location.pathname)) return;

  var WHATSAPP_NUM = '447707071984';  // +44 7707 071984 — ClearLegacy WhatsApp Business
  var EMAIL = 'hello@clearlegacy.co.uk';

  function inject() {
    if (document.getElementById('cl-help-button')) return;

    var wrap = document.createElement('div');
    wrap.id = 'cl-help-button';
    wrap.innerHTML = ''
      + '<style>'
      + '#cl-help-button{position:fixed;right:18px;bottom:80px;z-index:9998;font-family:Inter,system-ui,sans-serif}'
      + '@media(max-width:720px){#cl-help-button{display:none}}'
      + '#cl-help-bubble{background:#2563eb;color:#fff;border:none;border-radius:999px;padding:13px 18px;'
      + 'font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 10px 24px -8px rgba(15,23,42,.35);'
      + 'display:flex;align-items:center;gap:8px;transition:transform .15s,box-shadow .15s}'
      + '#cl-help-bubble:hover{transform:translateY(-1px);box-shadow:0 14px 30px -10px rgba(15,23,42,.45)}'
      + '#cl-help-bubble svg{width:18px;height:18px;flex-shrink:0}'
      + '#cl-help-panel{display:none;position:absolute;bottom:54px;right:0;width:280px;background:#fff;'
      + 'border-radius:14px;padding:18px;box-shadow:0 20px 50px -10px rgba(15,23,42,.4);'
      + 'border:1px solid #e2e8f0}'
      + '#cl-help-panel.open{display:block}'
      + '#cl-help-panel h4{margin:0 0 4px;color:#0f172a;font-size:15.5px;font-weight:700;line-height:1.3}'
      + '#cl-help-panel p{margin:0 0 14px;color:#475569;font-size:13px;line-height:1.5}'
      + '#cl-help-panel a{display:flex;align-items:center;gap:10px;padding:11px 12px;margin:0 0 8px;'
      + 'background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;color:#0f172a;font-size:14px;'
      + 'font-weight:600;text-decoration:none}'
      + '#cl-help-panel a:hover{border-color:#2563eb;background:#eff6ff;text-decoration:none}'
      + '#cl-help-panel a.wa{color:#16a34a}'
      + '#cl-help-panel a svg{width:18px;height:18px;flex-shrink:0}'
      + '#cl-help-panel small{display:block;color:#94a3b8;font-size:11.5px;font-weight:400;margin-top:1px}'
      + '#cl-help-close{position:absolute;top:8px;right:10px;background:none;border:none;font-size:18px;'
      + 'color:#94a3b8;cursor:pointer;line-height:1}'
      + '#cl-help-close:hover{color:#0f172a}'
      + '</style>'
      + '<div id="cl-help-panel">'
      +   '<button id="cl-help-close" type="button" aria-label="Close">×</button>'
      +   '<h4>Need help before you start?</h4>'
      +   '<p>If your situation looks complex, we will tell you before you pay.</p>'
      +   '<a class="wa" href="https://wa.me/' + WHATSAPP_NUM + '?text=Hi%2C%20I%20have%20a%20question%20about%20my%20will" target="_blank" rel="noopener" data-cta="form_help_whatsapp">'
      +     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4 0 1.4 1.1 2.8 1.2 3 .1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.2-.3-.3-.5-.3z"/></svg>'
      +     '<div>WhatsApp us<small>Fastest response · UK hours</small></div>'
      +   '</a>'
      +   '<a href="mailto:' + EMAIL + '?subject=Question%20about%20my%20will" data-cta="form_help_email">'
      +     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>'
      +     '<div>Email us<small>' + EMAIL + '</small></div>'
      +   '</a>'
      + '</div>'
      + '<button id="cl-help-bubble" type="button" aria-label="Need help?">'
      +   '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>'
      +   'Need help?'
      + '</button>';
    document.body.appendChild(wrap);

    var bubble = document.getElementById('cl-help-bubble');
    var panel = document.getElementById('cl-help-panel');
    var closeBtn = document.getElementById('cl-help-close');
    bubble.addEventListener('click', function () {
      panel.classList.toggle('open');
      try {
        if (panel.classList.contains('open') && typeof gtag === 'function') {
          gtag('event', 'help_button_open', { source_page: 'forms_will' });
        }
      } catch (e) {}
    });
    closeBtn.addEventListener('click', function () { panel.classList.remove('open'); });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) panel.classList.remove('open');
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    inject();
  } else {
    document.addEventListener('DOMContentLoaded', inject);
  }
})();
